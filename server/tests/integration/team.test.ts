import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, createTestProject, createTestTask, db } from '../helpers/testApp';
import { initializeDatabase } from '../helpers/testDb';

const app = createTestApp();

describe('Team API', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  describe('GET /api/team/status', () => {
    it('should return team status for authenticated user', async () => {
      const user = await createTestUser({ email: 'team-status@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'test-member-id',
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id });

      const response = await request(app)
        .get('/api/team/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/team/status');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未授权访问');
    });

    it('should filter by project_id', async () => {
      const user = await createTestUser({ email: 'team-filter@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'test-member-id',
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/team/status?project_id=${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return correct team member data', async () => {
      const user = await createTestUser({ email: 'team-member@example.com', name: 'Team Member User' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'test-member-id',
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'pending' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'completed' });

      const response = await request(app)
        .get('/api/team/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      const member = response.body.data.find((m: any) => m.user.id === user.id);
      expect(member).toHaveProperty('user');
      expect(member).toHaveProperty('taskCount');
      expect(member).toHaveProperty('workloadPercentage');
      expect(member).toHaveProperty('loadLevel');
      expect(member).toHaveProperty('isOnline');
      expect(member).toHaveProperty('warningStatus');
      expect(member.user.name).toBe('Team Member User');
    });

    it('should calculate workload percentage correctly', async () => {
      const user = await createTestUser({ email: 'team-workload@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'test-member-id',
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      for (let i = 0; i < 5; i++) {
        createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'pending' });
      }

      const response = await request(app)
        .get('/api/team/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const member = response.body.data.find((m: any) => m.user.id === user.id);
      expect(member.taskCount).toBe(5);
      expect(member.workloadPercentage).toBe(50);
    });
  });

  describe('GET /api/team/:userId/workload', () => {
    it('should return user workload details', async () => {
      const user = await createTestUser({ email: 'workload@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'pending' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'completed' });

      const response = await request(app)
        .get(`/api/team/${user.id}/workload`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('tasks');
    });

    it('should fail without authentication', async () => {
      const user = await createTestUser({ email: 'workload-auth@example.com' });

      const response = await request(app)
        .get(`/api/team/${user.id}/workload`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent user', async () => {
      const user = await createTestUser({ email: 'workload-404@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/team/non-existent-user/workload')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('用户不存在');
    });

    it('should filter by project_id', async () => {
      const user = await createTestUser({ email: 'workload-project@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id });

      const response = await request(app)
        .get(`/api/team/${user.id}/workload?project_id=${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should calculate summary correctly', async () => {
      const user = await createTestUser({ email: 'workload-summary@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'pending', priority: 'high' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'in_progress' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'completed' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'paused' });

      const response = await request(app)
        .get(`/api/team/${user.id}/workload`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.summary.totalTasks).toBe(4);
      expect(response.body.data.summary.activeTasks).toBe(2);
      expect(response.body.data.summary.completedTasks).toBe(1);
      expect(response.body.data.summary.pausedTasks).toBe(1);
      expect(response.body.data.summary.highPriorityTasks).toBe(1);
    });

    it('should return active and completed tasks', async () => {
      const user = await createTestUser({ email: 'workload-tasks@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, title: 'Active Task', status: 'pending' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, title: 'Completed Task', status: 'completed' });

      const response = await request(app)
        .get(`/api/team/${user.id}/workload`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.tasks.active.length).toBe(1);
      expect(response.body.data.tasks.completed.length).toBe(1);
      expect(response.body.data.tasks.active[0].title).toBe('Active Task');
    });
  });

  describe('GET /api/team/workload-summary', () => {
    it('should return team workload summary', async () => {
      const user = await createTestUser({ email: 'summary@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'test-member-id',
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id });

      const response = await request(app)
        .get('/api/team/workload-summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalMembers');
      expect(response.body.data).toHaveProperty('onlineMembers');
      expect(response.body.data).toHaveProperty('totalActiveTasks');
      expect(response.body.data).toHaveProperty('totalCompletedTasks');
      expect(response.body.data).toHaveProperty('averageWorkload');
      expect(response.body.data).toHaveProperty('loadDistribution');
      expect(response.body.data).toHaveProperty('members');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/team/workload-summary');

      expect(response.status).toBe(401);
    });

    it('should filter by project_id', async () => {
      const user = await createTestUser({ email: 'summary-filter@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'test-member-id',
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/team/workload-summary?project_id=${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should calculate load distribution correctly', async () => {
      const user = await createTestUser({ email: 'summary-load@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'test-member-id',
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      for (let i = 0; i < 3; i++) {
        createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'pending' });
      }

      const response = await request(app)
        .get('/api/team/workload-summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.loadDistribution).toHaveProperty('low');
      expect(response.body.data.loadDistribution).toHaveProperty('normal');
      expect(response.body.data.loadDistribution).toHaveProperty('high');
      expect(response.body.data.loadDistribution).toHaveProperty('overloaded');
    });

    it('should calculate average workload', async () => {
      const user1 = await createTestUser({ email: 'avg1@example.com' });
      const user2 = await createTestUser({ email: 'avg2@example.com' });
      const token = generateToken(user1);
      const project = createTestProject({ owner_id: user1.id });

      db.project_members.create({
        id: 'member-1',
        project_id: project.id,
        user_id: user1.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      createTestTask({ project_id: project.id, creator_id: user1.id, assignee_id: user1.id, status: 'pending' });

      const response = await request(app)
        .get('/api/team/workload-summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.averageWorkload).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/team/messages', () => {
    it('should send a team message successfully', async () => {
      const user = await createTestUser({ email: 'message@example.com', name: 'Sender' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test message content',
          message_type: 'general'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('Test message content');
      expect(response.body.data.sender_id).toBe(user.id);
      expect(response.body.data.sender_name).toBe('Sender');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/team/messages')
        .send({
          content: 'Test message'
        });

      expect(response.status).toBe(401);
    });

    it('should reject empty message content', async () => {
      const user = await createTestUser({ email: 'message-empty@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('消息内容不能为空');
    });

    it('should reject whitespace-only content', async () => {
      const user = await createTestUser({ email: 'message-whitespace@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '   '
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('消息内容不能为空');
    });

    it('should trim message content', async () => {
      const user = await createTestUser({ email: 'message-trim@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '  Trimmed message  '
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).toBe('Trimmed message');
    });

    it('should include project_id if provided', async () => {
      const user = await createTestUser({ email: 'message-project@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Project message',
          project_id: project.id
        });

      expect(response.status).toBe(201);
      expect(response.body.data.project_id).toBe(project.id);
    });
  });

  describe('GET /api/team/messages', () => {
    it('should return team messages list', async () => {
      const user = await createTestUser({ email: 'messages-list@example.com' });
      const token = generateToken(user);

      const response1 = await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Message 1' });

      const response2 = await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Message 2' });

      const response = await request(app)
        .get('/api/team/messages')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      const contents = response.body.data.map((m: any) => m.content);
      expect(contents).toContain('Message 1');
      expect(contents).toContain('Message 2');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/team/messages');

      expect(response.status).toBe(401);
    });

    it('should support pagination', async () => {
      const user = await createTestUser({ email: 'messages-pagination@example.com' });
      const token = generateToken(user);

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/team/messages')
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `Pagination Message ${i}` });
      }

      const response = await request(app)
        .get('/api/team/messages?limit=2&offset=0')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('should filter by project_id', async () => {
      const user = await createTestUser({ email: 'messages-filter@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Project message', project_id: project.id });

      await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'General message' });

      const response = await request(app)
        .get(`/api/team/messages?project_id=${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].content).toBe('Project message');
    });

    it('should include sender information', async () => {
      const user = await createTestUser({ email: 'messages-sender@example.com', name: 'Test Sender' });
      const token = generateToken(user);

      await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Test message' });

      const response = await request(app)
        .get('/api/team/messages')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].sender_name).toBe('Test Sender');
      expect(response.body.data[0]).toHaveProperty('sender_email');
      expect(response.body.data[0]).toHaveProperty('sender_avatar');
    });

    it('should return messages in descending order by date', async () => {
      const user = await createTestUser({ email: 'messages-order@example.com' });
      const token = generateToken(user);

      await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'First message' });

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/api/team/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Second message' });

      const response = await request(app)
        .get('/api/team/messages')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].content).toBe('Second message');
      expect(response.body.data[1].content).toBe('First message');
    });
  });
});
