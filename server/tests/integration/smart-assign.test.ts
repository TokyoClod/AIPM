import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, createTestProject, createTestTask, db } from '../helpers/testApp';
import { initializeDatabase } from '../helpers/testDb';

const app = createTestApp();

describe('Smart Assign API', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  describe('GET /api/smart-assign/recommend', () => {
    it('should return recommendations for a task', async () => {
      const user = await createTestUser({ email: 'recommend@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'member-1',
        project_id: project.id,
        user_id: user.id,
        role: 'member',
        created_at: new Date().toISOString(),
      });

      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .get('/api/smart-assign/recommend')
        .query({ task_id: task.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return recommendations for a project', async () => {
      const user = await createTestUser({ email: 'recommend2@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'member-2',
        project_id: project.id,
        user_id: user.id,
        role: 'member',
        created_at: new Date().toISOString(),
      });

      createTestTask({ project_id: project.id, creator_id: user.id, assignee_id: null });

      const response = await request(app)
        .get('/api/smart-assign/recommend')
        .query({ project_id: project.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return empty array when no project members', async () => {
      const user = await createTestUser({ email: 'recommend3@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });
      const task = createTestTask({ project_id: project.id, creator_id: user.id });

      const response = await request(app)
        .get('/api/smart-assign/recommend')
        .query({ task_id: task.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should fail when task_id and project_id are both missing', async () => {
      const user = await createTestUser({ email: 'recommend4@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/smart-assign/recommend')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('任务ID或项目ID不能为空');
    });

    it('should return 404 for non-existent task', async () => {
      const user = await createTestUser({ email: 'recommend5@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/smart-assign/recommend')
        .query({ task_id: 'non-existent-task' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('任务不存在');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/smart-assign/recommend')
        .query({ task_id: 'some-task' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/smart-assign/workload-balance', () => {
    it('should return workload balance data', async () => {
      const user = await createTestUser({ email: 'workload@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      db.project_members.create({
        id: 'member-wl-1',
        project_id: project.id,
        user_id: user.id,
        role: 'member',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/smart-assign/workload-balance')
        .query({ project_id: project.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_balanced).toBeDefined();
      expect(response.body.data.workload_distribution).toBeDefined();
    });

    it('should return balanced when no project members', async () => {
      const user = await createTestUser({ email: 'workload2@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .get('/api/smart-assign/workload-balance')
        .query({ project_id: project.id })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.is_balanced).toBe(true);
      expect(response.body.data.suggestions).toEqual([]);
    });

    it('should fail when project_id is missing', async () => {
      const user = await createTestUser({ email: 'workload3@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/smart-assign/workload-balance')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID不能为空');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/smart-assign/workload-balance')
        .query({ project_id: 'some-project' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/smart-assign/skills', () => {
    it('should add skill to user successfully', async () => {
      const user = await createTestUser({ email: 'skill@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/smart-assign/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
          skill_name: 'JavaScript',
          proficiency_level: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.skill_name).toBe('JavaScript');
      expect(response.body.data.proficiency_level).toBe(5);
    });

    it('should use default proficiency level', async () => {
      const user = await createTestUser({ email: 'skill2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/smart-assign/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
          skill_name: 'Python',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.proficiency_level).toBe(1);
    });

    it('should fail when user_id is missing', async () => {
      const user = await createTestUser({ email: 'skill3@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/smart-assign/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_name: 'React',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('用户ID和技能名称不能为空');
    });

    it('should fail when skill_name is missing', async () => {
      const user = await createTestUser({ email: 'skill4@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/smart-assign/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('用户ID和技能名称不能为空');
    });

    it('should fail for non-existent user', async () => {
      const user = await createTestUser({ email: 'skill5@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/smart-assign/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: 'non-existent-user',
          skill_name: 'TypeScript',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('用户不存在');
    });

    it('should fail when skill already exists', async () => {
      const user = await createTestUser({ email: 'skill6@example.com' });
      const token = generateToken(user);

      db.userSkills.create({
        id: 'skill-existing',
        user_id: user.id,
        skill_name: 'React',
        proficiency_level: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/smart-assign/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
          skill_name: 'React',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('该用户已拥有此技能');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/smart-assign/skills')
        .send({
          user_id: 'some-user',
          skill_name: 'Test',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/smart-assign/skills/:userId', () => {
    it('should return user skills', async () => {
      const user = await createTestUser({ email: 'getskill@example.com' });
      const token = generateToken(user);

      db.userSkills.create({
        id: 'skill-get-1',
        user_id: user.id,
        skill_name: 'Node.js',
        proficiency_level: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.userSkills.create({
        id: 'skill-get-2',
        user_id: user.id,
        skill_name: 'Express',
        proficiency_level: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/smart-assign/skills/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should return empty array for user without skills', async () => {
      const user = await createTestUser({ email: 'getskill2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get(`/api/smart-assign/skills/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should return 404 for non-existent user', async () => {
      const user = await createTestUser({ email: 'getskill3@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/smart-assign/skills/non-existent-user')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('用户不存在');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/smart-assign/skills/some-user');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/smart-assign/skills/:id', () => {
    it('should update skill successfully', async () => {
      const user = await createTestUser({ email: 'updateskill@example.com' });
      const token = generateToken(user);

      const skill = db.userSkills.create({
        id: 'skill-update-1',
        user_id: user.id,
        skill_name: 'Vue.js',
        proficiency_level: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/smart-assign/skills/${skill.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_name: 'Vue.js 3',
          proficiency_level: 4,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.skill_name).toBe('Vue.js 3');
      expect(response.body.data.proficiency_level).toBe(4);
    });

    it('should return 404 for non-existent skill', async () => {
      const user = await createTestUser({ email: 'updateskill2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/smart-assign/skills/non-existent-skill')
        .set('Authorization', `Bearer ${token}`)
        .send({
          proficiency_level: 5,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('技能不存在');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/smart-assign/skills/some-skill')
        .send({
          proficiency_level: 5,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/smart-assign/skills/:id', () => {
    it('should delete skill successfully', async () => {
      const user = await createTestUser({ email: 'deleteskill@example.com' });
      const token = generateToken(user);

      const skill = db.userSkills.create({
        id: 'skill-delete-1',
        user_id: user.id,
        skill_name: 'Angular',
        proficiency_level: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/smart-assign/skills/${skill.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('技能已删除');
    });

    it('should return 404 for non-existent skill', async () => {
      const user = await createTestUser({ email: 'deleteskill2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .delete('/api/smart-assign/skills/non-existent-skill')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('技能不存在');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/smart-assign/skills/some-skill');

      expect(response.status).toBe(401);
    });
  });
});
