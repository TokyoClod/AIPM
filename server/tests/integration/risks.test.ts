import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, createTestProject, createTestRisk, db } from '../helpers/testApp';
import { initializeDatabase } from '../helpers/testDb';

const app = createTestApp();

describe('Risks API', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  describe('GET /api/risks', () => {
    it('should return risks for a project', async () => {
      const user = await createTestUser({ email: 'risk@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });
      
      createTestRisk({ project_id: project.id, created_by: user.id });
      createTestRisk({ project_id: project.id, created_by: user.id, level: 'high' });

      const response = await request(app)
        .get('/api/risks')
        .query({ project_id: project.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should filter risks by level', async () => {
      const user = await createTestUser({ email: 'risk2@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });
      
      createTestRisk({ project_id: project.id, created_by: user.id, level: 'low' });
      createTestRisk({ project_id: project.id, created_by: user.id, level: 'critical' });

      const response = await request(app)
        .get('/api/risks')
        .query({ project_id: project.id, level: 'critical' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].level).toBe('critical');
    });

    it('should filter risks by status', async () => {
      const user = await createTestUser({ email: 'risk3@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });
      
      createTestRisk({ project_id: project.id, created_by: user.id, status: 'identified' });
      createTestRisk({ project_id: project.id, created_by: user.id, status: 'resolved' });

      const response = await request(app)
        .get('/api/risks')
        .query({ project_id: project.id, status: 'resolved' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('resolved');
    });

    it('should fail without authentication', async () => {
      const project = createTestProject({ owner_id: 'test-user' });
      
      const response = await request(app)
        .get('/api/risks')
        .query({ project_id: project.id });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/risks', () => {
    it('should create a new risk successfully', async () => {
      const user = await createTestUser({ email: 'createrisk@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
          level: 'high',
          type: 'technical',
          description: 'Technical risk description',
          mitigation: 'Mitigation plan',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.project_id).toBe(project.id);
      expect(response.body.data.level).toBe('high');
      expect(response.body.data.type).toBe('technical');
      expect(response.body.data.description).toBe('Technical risk description');
      expect(response.body.data.mitigation).toBe('Mitigation plan');
      expect(response.body.data.status).toBe('identified');
      expect(response.body.data.created_by).toBe(user.id);
    });

    it('should fail when project_id is missing', async () => {
      const user = await createTestUser({ email: 'createrisk2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Risk without project',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID和风险描述不能为空');
    });

    it('should fail when description is missing', async () => {
      const user = await createTestUser({ email: 'createrisk3@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID和风险描述不能为空');
    });

    it('should fail for non-existent project', async () => {
      const user = await createTestUser({ email: 'createrisk4@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: 'non-existent-project',
          description: 'Risk for non-existent project',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });

    it('should use default values for optional fields', async () => {
      const user = await createTestUser({ email: 'createrisk5@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
          description: 'Minimal risk',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.level).toBe('medium');
      expect(response.body.data.type).toBe('other');
      expect(response.body.data.status).toBe('identified');
    });
  });

  describe('PUT /api/risks/:id', () => {
    it('should update risk successfully', async () => {
      const user = await createTestUser({ email: 'updaterisk@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });
      const risk = createTestRisk({ project_id: project.id, created_by: user.id });

      const response = await request(app)
        .put(`/api/risks/${risk.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          level: 'critical',
          type: 'resource',
          description: 'Updated risk description',
          mitigation: 'Updated mitigation plan',
          status: 'mitigating',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.level).toBe('critical');
      expect(response.body.data.type).toBe('resource');
      expect(response.body.data.description).toBe('Updated risk description');
      expect(response.body.data.mitigation).toBe('Updated mitigation plan');
      expect(response.body.data.status).toBe('mitigating');
    });

    it('should return 404 for non-existent risk', async () => {
      const user = await createTestUser({ email: 'updaterisk2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/risks/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          level: 'high',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('风险记录不存在');
    });

    it('should update partial fields', async () => {
      const user = await createTestUser({ email: 'updaterisk3@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });
      const risk = createTestRisk({ 
        project_id: project.id, 
        created_by: user.id, 
        level: 'low',
        description: 'Original description'
      });

      const response = await request(app)
        .put(`/api/risks/${risk.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          level: 'high',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.level).toBe('high');
      expect(response.body.data.description).toBe('Original description');
    });
  });

  describe('DELETE /api/risks/:id', () => {
    it('should delete risk successfully', async () => {
      const user = await createTestUser({ email: 'deleterisk@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });
      const risk = createTestRisk({ project_id: project.id, created_by: user.id });

      const response = await request(app)
        .delete(`/api/risks/${risk.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('风险记录已删除');

      const deletedRisk = db.risks.findById(risk.id);
      expect(deletedRisk).toBeUndefined();
    });
  });

  describe('GET /api/risks/alerts', () => {
    it('should return risk alerts', async () => {
      const user = await createTestUser({ email: 'riskalerts@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/risks/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/risks/alerts');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/risks/analyze', () => {
    it('should analyze project risks', async () => {
      const user = await createTestUser({ email: 'riskanalyze@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/risks/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail when project_id is missing', async () => {
      const user = await createTestUser({ email: 'riskanalyze2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/risks/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID不能为空');
    });
  });

  describe('POST /api/risks/scan', () => {
    it('should scan project for risks', async () => {
      const user = await createTestUser({ email: 'riskscan@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/risks/scan')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail when project_id is missing', async () => {
      const user = await createTestUser({ email: 'riskscan2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/risks/scan')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID不能为空');
    });
  });

  describe('PUT /api/risks/alerts/:id/resolve', () => {
    it('should acknowledge alert', async () => {
      const user = await createTestUser({ email: 'riskresolve@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/risks/alerts/test-alert-id/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'acknowledge',
        });

      expect(response.status).toBe(200);
    });

    it('should resolve alert with resolution note', async () => {
      const user = await createTestUser({ email: 'riskresolve2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/risks/alerts/test-alert-id/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'resolve',
          resolution_note: 'Issue has been resolved',
        });

      expect(response.status).toBe(200);
    });

    it('should fail when action is invalid', async () => {
      const user = await createTestUser({ email: 'riskresolve3@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/risks/alerts/test-alert-id/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'invalid_action',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('无效的操作类型');
    });

    it('should fail when resolution_note is missing for resolve action', async () => {
      const user = await createTestUser({ email: 'riskresolve4@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/risks/alerts/test-alert-id/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'resolve',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('解决方案不能为空');
    });
  });
});
