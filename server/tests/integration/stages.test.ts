import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, createTestProject, createTestTask, db } from '../helpers/testApp';
import { initializeDatabase } from '../helpers/testDb';

const app = createTestApp();

describe('Stages API', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  describe('GET /api/stages/project/:projectId', () => {
    it('should return stages for a project', async () => {
      const user = await createTestUser({ email: 'stage@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.projectStages.create({
        id: 'stage-1',
        project_id: project.id,
        name: 'Planning',
        order_index: 1,
        status: 'active',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/stages/project/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Planning');
    });

    it('should return 404 for non-existent project', async () => {
      const user = await createTestUser({ email: 'stage2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/stages/project/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });

    it('should fail without authentication', async () => {
      const project = createTestProject({ owner_id: 'test-user' });

      const response = await request(app)
        .get(`/api/stages/project/${project.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/stages', () => {
    it('should create a new stage successfully', async () => {
      const user = await createTestUser({ email: 'createstage@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/stages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
          name: 'Development',
          required_task_ids: [],
          start_date: '2024-01-01',
          end_date: '2024-03-31',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Development');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.order_index).toBe(1);
    });

    it('should fail when project_id is missing', async () => {
      const user = await createTestUser({ email: 'createstage2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/stages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Stage',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID和阶段名称不能为空');
    });

    it('should fail when name is missing', async () => {
      const user = await createTestUser({ email: 'createstage3@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/stages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID和阶段名称不能为空');
    });

    it('should fail for non-existent project', async () => {
      const user = await createTestUser({ email: 'createstage4@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/stages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: 'non-existent-project',
          name: 'Test Stage',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });

    it('should fail without authentication', async () => {
      const project = createTestProject({ owner_id: 'test-user' });

      const response = await request(app)
        .post('/api/stages')
        .send({
          project_id: project.id,
          name: 'Test Stage',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/stages/:id', () => {
    it('should update stage successfully', async () => {
      const user = await createTestUser({ email: 'updatestage@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const stage = db.projectStages.create({
        id: 'stage-update-1',
        project_id: project.id,
        name: 'Original Name',
        order_index: 1,
        status: 'pending',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/stages/${stage.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          start_date: '2024-02-01',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent stage', async () => {
      const user = await createTestUser({ email: 'updatestage2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/stages/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('阶段不存在');
    });

    it('should fail without authentication', async () => {
      const user = await createTestUser({ email: 'updatestage3@example.com' });
      const project = createTestProject({ owner_id: user.id });

      const stage = db.projectStages.create({
        id: 'stage-update-2',
        project_id: project.id,
        name: 'Test Stage',
        order_index: 1,
        status: 'pending',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/stages/${stage.id}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/stages/:id', () => {
    it('should delete stage successfully', async () => {
      const user = await createTestUser({ email: 'deletestage@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const stage = db.projectStages.create({
        id: 'stage-delete-1',
        project_id: project.id,
        name: 'Stage to Delete',
        order_index: 1,
        status: 'pending',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/stages/${stage.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('阶段已删除');
    });

    it('should return 404 for non-existent stage', async () => {
      const user = await createTestUser({ email: 'deletestage2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .delete('/api/stages/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('阶段不存在');
    });

    it('should fail without authentication', async () => {
      const user = await createTestUser({ email: 'deletestage3@example.com' });
      const project = createTestProject({ owner_id: user.id });

      const stage = db.projectStages.create({
        id: 'stage-delete-2',
        project_id: project.id,
        name: 'Stage to Delete',
        order_index: 1,
        status: 'pending',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/stages/${stage.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/stages/:id/status', () => {
    it('should update stage status successfully', async () => {
      const user = await createTestUser({ email: 'statusstage@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const stage = db.projectStages.create({
        id: 'stage-status-1',
        project_id: project.id,
        name: 'Test Stage',
        order_index: 1,
        status: 'pending',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/stages/${stage.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'active',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should set start_date when status becomes active', async () => {
      const user = await createTestUser({ email: 'statusstage2@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const stage = db.projectStages.create({
        id: 'stage-status-2',
        project_id: project.id,
        name: 'Test Stage',
        order_index: 1,
        status: 'pending',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/stages/${stage.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'active',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.start_date).toBeDefined();
    });

    it('should set end_date when status becomes completed', async () => {
      const user = await createTestUser({ email: 'statusstage3@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const stage = db.projectStages.create({
        id: 'stage-status-3',
        project_id: project.id,
        name: 'Test Stage',
        order_index: 1,
        status: 'active',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/stages/${stage.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.end_date).toBeDefined();
    });

    it('should fail with invalid status', async () => {
      const user = await createTestUser({ email: 'statusstage4@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const stage = db.projectStages.create({
        id: 'stage-status-4',
        project_id: project.id,
        name: 'Test Stage',
        order_index: 1,
        status: 'pending',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/stages/${stage.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('无效的阶段状态');
    });

    it('should return 404 for non-existent stage', async () => {
      const user = await createTestUser({ email: 'statusstage5@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/stages/non-existent-id/status')
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'active',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/stages/reorder', () => {
    it('should reorder stages successfully', async () => {
      const user = await createTestUser({ email: 'reorderstage@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const stage1 = db.projectStages.create({
        id: 'stage-reorder-1',
        project_id: project.id,
        name: 'Stage 1',
        order_index: 1,
        status: 'pending',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const stage2 = db.projectStages.create({
        id: 'stage-reorder-2',
        project_id: project.id,
        name: 'Stage 2',
        order_index: 2,
        status: 'pending',
        required_task_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/stages/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
          stage_ids: [stage2.id, stage1.id],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].id).toBe(stage2.id);
      expect(response.body.data[0].order_index).toBe(1);
      expect(response.body.data[1].id).toBe(stage1.id);
      expect(response.body.data[1].order_index).toBe(2);
    });

    it('should fail when project_id is missing', async () => {
      const user = await createTestUser({ email: 'reorderstage2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/stages/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          stage_ids: ['id1', 'id2'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID和阶段ID列表不能为空');
    });

    it('should fail when stage_ids is not an array', async () => {
      const user = await createTestUser({ email: 'reorderstage3@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/stages/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
          stage_ids: 'not-an-array',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID和阶段ID列表不能为空');
    });

    it('should fail without authentication', async () => {
      const project = createTestProject({ owner_id: 'test-user' });

      const response = await request(app)
        .post('/api/stages/reorder')
        .send({
          project_id: project.id,
          stage_ids: ['id1', 'id2'],
        });

      expect(response.status).toBe(401);
    });
  });
});
