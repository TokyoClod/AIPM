import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, createTestProject, createTestTask, db } from '../helpers/testApp';
import { initializeDatabase } from '../helpers/testDb';

const app = createTestApp();

describe('Workbench API', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  describe('GET /api/workbench', () => {
    it('should return workbench overview for authenticated user', async () => {
      const user = await createTestUser({ email: 'workbench@example.com' });
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
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'completed' });

      const response = await request(app)
        .get('/api/workbench')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('projects');
      expect(response.body.data).toHaveProperty('recentNotifications');
      expect(response.body.data.summary).toHaveProperty('totalPending');
      expect(response.body.data.summary).toHaveProperty('highPriority');
      expect(response.body.data.summary).toHaveProperty('upcoming');
      expect(response.body.data.summary).toHaveProperty('overdue');
      expect(response.body.data.summary).toHaveProperty('weekCompleted');
      expect(response.body.data.summary).toHaveProperty('monthCompleted');
      expect(response.body.data.summary).toHaveProperty('onTimeRate');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/workbench');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未授权访问');
    });

    it('should calculate correct statistics', async () => {
      const user = await createTestUser({ email: 'workbench-stats@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'test-member-id',
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'pending', priority: 'high' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'in_progress', priority: 'urgent' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'completed' });

      const response = await request(app)
        .get('/api/workbench')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.summary.totalPending).toBe(2);
      expect(response.body.data.summary.highPriority).toBe(2);
    });
  });

  describe('GET /api/workbench/todos', () => {
    it('should return todos for authenticated user', async () => {
      const user = await createTestUser({ email: 'todos@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, title: 'Task 1' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, title: 'Task 2', status: 'completed' });

      const response = await request(app)
        .get('/api/workbench/todos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Task 1');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/workbench/todos');

      expect(response.status).toBe(401);
    });

    it('should sort todos by priority and due date', async () => {
      const user = await createTestUser({ email: 'todos-sort@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const taskLow = createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, title: 'Low Priority', priority: 'low' });
      const taskHigh = createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, title: 'High Priority', priority: 'high' });
      const taskUrgent = createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, title: 'Urgent', priority: 'urgent' });

      const response = await request(app)
        .get('/api/workbench/todos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const priorities = response.body.data.map((t: any) => t.priority);
      expect(priorities).toContain('urgent');
      expect(priorities).toContain('high');
      expect(priorities).toContain('low');
    });

    it('should mark overdue tasks correctly', async () => {
      const user = await createTestUser({ email: 'todos-overdue@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const yesterdayStr = yesterday.toISOString();

      createTestTask({ 
        project_id: project.id, 
        creator_id: user.id, 
        assignee_id: user.id, 
        title: 'Overdue Task',
        end_date: yesterdayStr
      });

      const response = await request(app)
        .get('/api/workbench/todos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].isOverdue).toBe(true);
    });
  });

  describe('GET /api/workbench/schedule', () => {
    it('should return schedule for next 8 days', async () => {
      const user = await createTestUser({ email: 'schedule@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      createTestTask({ 
        project_id: project.id, 
        creator_id: user.id, 
        assignee_id: user.id, 
        title: 'Scheduled Task',
        end_date: tomorrowStr
      });

      const response = await request(app)
        .get('/api/workbench/schedule')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(8);
      expect(response.body.data[0]).toHaveProperty('date');
      expect(response.body.data[0]).toHaveProperty('dayOfWeek');
      expect(response.body.data[0]).toHaveProperty('isToday');
      expect(response.body.data[0]).toHaveProperty('taskCount');
      expect(response.body.data[0]).toHaveProperty('tasks');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/workbench/schedule');

      expect(response.status).toBe(401);
    });

    it('should include tasks with matching end dates', async () => {
      const user = await createTestUser({ email: 'schedule-tasks@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const today = new Date();
      const todayStr = today.toISOString();

      createTestTask({ 
        project_id: project.id, 
        creator_id: user.id, 
        assignee_id: user.id, 
        title: 'Today Task',
        end_date: todayStr
      });

      const response = await request(app)
        .get('/api/workbench/schedule')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const totalTasks = response.body.data.reduce((sum: number, s: any) => sum + s.taskCount, 0);
      expect(totalTasks).toBe(1);
    });

    it('should exclude completed tasks from schedule', async () => {
      const user = await createTestUser({ email: 'schedule-completed@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      createTestTask({ 
        project_id: project.id, 
        creator_id: user.id, 
        assignee_id: user.id, 
        title: 'Completed Task',
        end_date: todayStr,
        status: 'completed'
      });

      const response = await request(app)
        .get('/api/workbench/schedule')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const todaySchedule = response.body.data.find((s: any) => s.isToday);
      expect(todaySchedule.taskCount).toBe(0);
    });
  });

  describe('GET /api/workbench/stats', () => {
    it('should return efficiency statistics', async () => {
      const user = await createTestUser({ email: 'stats@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'pending' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'in_progress' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'completed' });

      const response = await request(app)
        .get('/api/workbench/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('weekly');
      expect(response.body.data).toHaveProperty('monthly');
      expect(response.body.data).toHaveProperty('onTimeRate');
      expect(response.body.data).toHaveProperty('avgResponseTime');
      expect(response.body.data).toHaveProperty('taskDistribution');
      expect(response.body.data).toHaveProperty('priorityDistribution');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/workbench/stats');

      expect(response.status).toBe(401);
    });

    it('should calculate task distribution correctly', async () => {
      const user = await createTestUser({ email: 'stats-dist@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'pending' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'in_progress' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'completed' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, status: 'completed' });

      const response = await request(app)
        .get('/api/workbench/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.taskDistribution.pending).toBe(1);
      expect(response.body.data.taskDistribution.inProgress).toBe(1);
      expect(response.body.data.taskDistribution.completed).toBe(2);
    });

    it('should calculate priority distribution correctly', async () => {
      const user = await createTestUser({ email: 'stats-priority@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, priority: 'urgent' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, priority: 'high' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, priority: 'medium' });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id, priority: 'low' });

      const response = await request(app)
        .get('/api/workbench/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.priorityDistribution.urgent).toBe(1);
      expect(response.body.data.priorityDistribution.high).toBe(1);
      expect(response.body.data.priorityDistribution.medium).toBe(1);
      expect(response.body.data.priorityDistribution.low).toBe(1);
    });
  });

  describe('PUT /api/workbench/todos/:id/complete', () => {
    it('should complete a todo successfully', async () => {
      const user = await createTestUser({ email: 'complete@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });
      const task = createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id });

      const response = await request(app)
        .put(`/api/workbench/todos/${task.id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.progress).toBe(100);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/workbench/todos/some-id/complete');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent task', async () => {
      const user = await createTestUser({ email: 'complete-404@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/workbench/todos/non-existent-id/complete')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('任务不存在');
    });

    it('should return 403 when completing other user task', async () => {
      const user1 = await createTestUser({ email: 'user1-complete@example.com' });
      const user2 = await createTestUser({ email: 'user2-complete@example.com' });
      const token = generateToken(user2);
      const project = createTestProject({ owner_id: user1.id });
      const task = createTestTask({ project_id: project.id, creator_id: user1.id, assignee_id: user1.id });

      const response = await request(app)
        .put(`/api/workbench/todos/${task.id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('无权操作此任务');
    });
  });
});
