import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, createTestProject, createTestTask } from '../helpers/testApp.js';
import { db } from '../../src/models/database.js';

const app = createTestApp();

describe('Tasks API', () => {
  let user: any;
  let token: string;
  let project: any;

  beforeEach(async () => {
    user = await createTestUser({ email: 'task@example.com' });
    token = generateToken(user);
    project = createTestProject({ owner_id: user.id });
    
    // 添加用户为项目成员
    db.project_members.create({
      id: 'test-member-id',
      project_id: project.id,
      user_id: user.id,
      role: 'owner',
      created_at: new Date().toISOString(),
    });
  });

  describe('GET /api/tasks', () => {
    it('should return tasks for a project', async () => {
      // 创建任务
      createTestTask({ project_id: project.id, creator_id: user.id });
      createTestTask({ project_id: project.id, creator_id: user.id, status: 'completed' });

      const response = await request(app)
        .get('/api/tasks')
        .query({ project_id: project.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should filter tasks by status', async () => {
      createTestTask({ project_id: project.id, creator_id: user.id, status: 'pending' });
      createTestTask({ project_id: project.id, creator_id: user.id, status: 'completed' });

      const response = await request(app)
        .get('/api/tasks')
        .query({ project_id: project.id, status: 'completed' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('completed');
    });

    it('should filter tasks by assignee', async () => {
      const assignee = await createTestUser({ email: 'assignee@example.com' });
      
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: assignee.id });
      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: user.id });

      const response = await request(app)
        .get('/api/tasks')
        .query({ project_id: project.id, assignee_id: assignee.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].assignee_id).toBe(assignee.id);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ project_id: project.id });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
          title: 'New Task',
          description: 'Task description',
          priority: 'high',
          status: 'pending',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Task');
      expect(response.body.data.description).toBe('Task description');
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.progress).toBe(0);
      expect(response.body.data.creator_id).toBe(user.id);
    });

    it('should fail when project_id is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Task without project',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID和任务标题不能为空');
    });

    it('should fail when title is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID和任务标题不能为空');
    });

    it('should fail for non-existent project', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: 'non-existent-project',
          title: 'Task for non-existent project',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });

    it('should create notification when assignee is specified', async () => {
      const assignee = await createTestUser({ email: 'assignee2@example.com' });

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
          title: 'Assigned Task',
          assignee_id: assignee.id,
        });

      expect(response.status).toBe(201);
      
      // 验证通知已创建
      const notifications = db.notifications.findByUser(assignee.id);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].type).toBe('task');
      expect(notifications[0].title).toBe('新任务分配');
    });

    it('should create subtask with parent_id', async () => {
      const parentTask = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
          title: 'Subtask',
          parent_id: parentTask.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.parent_id).toBe(parentTask.id);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return task details', async () => {
      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(task.id);
      expect(response.body.data.title).toBe(task.title);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('任务不存在');
    });

    it('should include children for parent tasks', async () => {
      const parentTask = createTestTask({ project_id: project.id, creator_id: user.id });
      const childTask = createTestTask({ 
        project_id: project.id, 
        creator_id: user.id, 
        parent_id: parentTask.id 
      });

      const response = await request(app)
        .get(`/api/tasks/${parentTask.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.children).toBeDefined();
      expect(response.body.data.children.length).toBe(1);
      expect(response.body.data.children[0].id).toBe(childTask.id);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task successfully', async () => {
      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Task Title',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'urgent',
          progress: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Task Title');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.status).toBe('in_progress');
      expect(response.body.data.priority).toBe('urgent');
      expect(response.body.data.progress).toBe(50);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('任务不存在');
    });

    it('should update assignee', async () => {
      const task = createTestTask({ project_id: project.id, creator_id: user.id });
      const newAssignee = await createTestUser({ email: 'newassignee@example.com' });

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          assignee_id: newAssignee.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.assignee_id).toBe(newAssignee.id);
    });
  });

  describe('PUT /api/tasks/:id/progress', () => {
    it('should update task progress', async () => {
      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .put(`/api/tasks/${task.id}/progress`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          progress: 75,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.progress).toBe(75);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('should automatically set status to completed when progress is 100', async () => {
      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .put(`/api/tasks/${task.id}/progress`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          progress: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.progress).toBe(100);
      expect(response.body.data.status).toBe('completed');
    });

    it('should automatically set status to in_progress when progress > 0', async () => {
      const task = createTestTask({ 
        project_id: project.id, 
        creator_id: user.id, 
        status: 'pending' 
      });

      const response = await request(app)
        .put(`/api/tasks/${task.id}/progress`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          progress: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.progress).toBe(10);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('should allow explicit status update', async () => {
      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .put(`/api/tasks/${task.id}/progress`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          progress: 50,
          status: 'paused',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.progress).toBe(50);
      expect(response.body.data.status).toBe('paused');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/non-existent-id/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({
          progress: 50,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task successfully', async () => {
      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('任务已删除');

      // 验证任务已删除
      const deletedTask = db.tasks.findById(task.id);
      expect(deletedTask).toBeUndefined();
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('任务不存在');
    });
  });

  describe('POST /api/tasks/:id/comments', () => {
    it('should add comment to task', async () => {
      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'This is a comment',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('This is a comment');
      expect(response.body.data.user_id).toBe(user.id);
    });

    it('should fail when content is missing', async () => {
      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('评论内容不能为空');
    });

    it('should fail for non-existent task', async () => {
      const response = await request(app)
        .post('/api/tasks/non-existent-id/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Comment for non-existent task',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/tasks/gantt/:projectId', () => {
    it('should return tasks with dates for gantt chart', async () => {
      // 创建有日期的任务
      db.tasks.create({
        id: 'gantt-task-1',
        project_id: project.id,
        title: 'Gantt Task 1',
        status: 'in_progress',
        priority: 'high',
        progress: 50,
        start_date: '2024-01-01',
        end_date: '2024-01-15',
        creator_id: user.id,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 创建没有日期的任务（不应该返回）
      db.tasks.create({
        id: 'gantt-task-2',
        project_id: project.id,
        title: 'Gantt Task 2',
        status: 'pending',
        priority: 'medium',
        progress: 0,
        creator_id: user.id,
        order_index: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/tasks/gantt/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // 只返回有日期的任务
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].start_date).toBeDefined();
      expect(response.body.data[0].end_date).toBeDefined();
    });
  });
});
