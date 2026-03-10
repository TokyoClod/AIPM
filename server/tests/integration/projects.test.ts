import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, createTestProject } from '../helpers/testApp.js';
import { db } from '../../src/models/database.js';

const app = createTestApp();

describe('Projects API', () => {
  let user: any;
  let token: string;

  beforeEach(async () => {
    user = await createTestUser({ email: 'project@example.com' });
    token = generateToken(user);
  });

  describe('GET /api/projects', () => {
    it('should return all projects for admin user', async () => {
      const admin = await createTestUser({ email: 'admin@example.com', role: 'admin' });
      const adminToken = generateToken(admin);

      // 创建一些项目
      createTestProject({ owner_id: admin.id });
      createTestProject({ owner_id: user.id });

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return only user projects for non-admin user', async () => {
      const project = createTestProject({ owner_id: user.id });
      
      // 添加用户为项目成员
      db.project_members.create({
        id: 'test-member-id',
        project_id: project.id,
        user_id: user.id,
        role: 'member',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Project',
          description: 'Project description',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Project');
      expect(response.body.data.description).toBe('Project description');
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.owner_id).toBe(user.id);
    });

    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Project without name',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('项目名称不能为空');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'Unauthorized Project',
        });

      expect(response.status).toBe(401);
    });

    it('should create project member as owner', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Project with Owner',
        });

      expect(response.status).toBe(201);

      // 验证项目成员已创建
      const members = db.project_members.findByProject(response.body.data.id);
      expect(members.length).toBe(1);
      expect(members[0].user_id).toBe(user.id);
      expect(members[0].role).toBe('owner');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project details', async () => {
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(project.id);
      expect(response.body.data.name).toBe(project.name);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('项目不存在');
    });

    it('should include project members', async () => {
      const project = createTestProject({ owner_id: user.id });
      
      // 添加成员
      db.project_members.create({
        id: 'member-1',
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.members).toBeDefined();
      expect(Array.isArray(response.body.data.members)).toBe(true);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project successfully', async () => {
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Project Name',
          description: 'Updated description',
          status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Project Name');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.status).toBe('completed');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .put('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });

    it('should fail without authentication', async () => {
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project successfully', async () => {
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('项目已删除');

      // 验证项目已删除
      const deletedProject = db.projects.findById(project.id);
      expect(deletedProject).toBeUndefined();
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });

    it('should delete associated tasks and risks', async () => {
      const project = createTestProject({ owner_id: user.id });
      
      // 创建任务和风险
      db.tasks.create({
        id: 'task-1',
        project_id: project.id,
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        progress: 0,
        creator_id: user.id,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.risks.create({
        id: 'risk-1',
        project_id: project.id,
        level: 'medium',
        type: 'technical',
        description: 'Test risk',
        status: 'identified',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await request(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      // 验证关联数据已删除
      const tasks = db.tasks.findByProject(project.id);
      const risks = db.risks.findByProject(project.id);
      expect(tasks.length).toBe(0);
      expect(risks.length).toBe(0);
    });
  });

  describe('POST /api/projects/:id/members', () => {
    it('should add member to project successfully', async () => {
      const project = createTestProject({ owner_id: user.id });
      const newUser = await createTestUser({ email: 'member@example.com' });

      const response = await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: newUser.id,
          role: 'member',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(newUser.id);
      expect(response.body.data.role).toBe('member');
    });

    it('should fail when user is already a member', async () => {
      const project = createTestProject({ owner_id: user.id });
      const newUser = await createTestUser({ email: 'existing-member@example.com' });

      // 先添加成员
      db.project_members.create({
        id: 'existing-member',
        project_id: project.id,
        user_id: newUser.id,
        role: 'member',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: newUser.id,
          role: 'member',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('用户已是项目成员');
    });

    it('should fail for non-existent user', async () => {
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: 'non-existent-user-id',
          role: 'member',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('用户不存在');
    });

    it('should fail for non-existent project', async () => {
      const newUser = await createTestUser({ email: 'new-member@example.com' });

      const response = await request(app)
        .post('/api/projects/non-existent-id/members')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: newUser.id,
          role: 'member',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });
  });

  describe('DELETE /api/projects/:id/members/:userId', () => {
    it('should remove member from project', async () => {
      const project = createTestProject({ owner_id: user.id });
      const member = await createTestUser({ email: 'remove-member@example.com' });

      // 添加成员
      db.project_members.create({
        id: 'remove-member-id',
        project_id: project.id,
        user_id: member.id,
        role: 'member',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/projects/${project.id}/members/${member.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('成员已移除');
    });
  });

  describe('GET /api/projects/:id/dashboard', () => {
    it('should return project dashboard data', async () => {
      const project = createTestProject({ owner_id: user.id });

      // 创建一些任务
      db.tasks.create({
        id: 'task-1',
        project_id: project.id,
        title: 'Task 1',
        status: 'completed',
        priority: 'high',
        progress: 100,
        creator_id: user.id,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.tasks.create({
        id: 'task-2',
        project_id: project.id,
        title: 'Task 2',
        status: 'in_progress',
        priority: 'medium',
        progress: 50,
        creator_id: user.id,
        order_index: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 创建一些风险
      db.risks.create({
        id: 'risk-1',
        project_id: project.id,
        level: 'high',
        type: 'technical',
        description: 'High risk',
        status: 'identified',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/projects/${project.id}/dashboard`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalTasks).toBe(2);
      expect(response.body.data.stats.completedTasks).toBe(1);
      expect(response.body.data.stats.inProgressTasks).toBe(1);
      expect(response.body.data.stats.totalRisks).toBe(1);
      expect(response.body.data.stats.criticalRisks).toBe(1);
      expect(response.body.data.taskDistribution).toBeDefined();
      expect(response.body.data.priorityDistribution).toBeDefined();
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/non-existent-id/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });
  });
});
