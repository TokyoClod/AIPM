import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, createTestProject, db } from '../helpers/testApp';
import { initializeDatabase } from '../helpers/testDb';

const app = createTestApp();

describe('Knowledge API', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  describe('GET /api/knowledge', () => {
    it('should return knowledge list with pagination', async () => {
      const user = await createTestUser({ email: 'knowledge@example.com' });
      const token = generateToken(user);

      db.knowledgeBase.create({
        id: 'kb-1',
        title: 'Test Knowledge 1',
        content: 'Content 1',
        category: 'technical',
        tags: ['test'],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/knowledge')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.list).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(Array.isArray(response.body.data.list)).toBe(true);
    });

    it('should filter by search query', async () => {
      const user = await createTestUser({ email: 'knowledge2@example.com' });
      const token = generateToken(user);

      db.knowledgeBase.create({
        id: 'kb-2',
        title: 'React Guide',
        content: 'React content',
        category: 'technical',
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.knowledgeBase.create({
        id: 'kb-3',
        title: 'Vue Guide',
        content: 'Vue content',
        category: 'technical',
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/knowledge')
        .query({ search: 'React' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.list.length).toBe(1);
      expect(response.body.data.list[0].title).toBe('React Guide');
    });

    it('should filter by category', async () => {
      const user = await createTestUser({ email: 'knowledge3@example.com' });
      const token = generateToken(user);

      db.knowledgeBase.create({
        id: 'kb-4',
        title: 'Technical Doc',
        content: 'Content',
        category: 'technical',
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.knowledgeBase.create({
        id: 'kb-5',
        title: 'Business Doc',
        content: 'Content',
        category: 'business',
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/knowledge')
        .query({ category: 'technical' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.list.length).toBe(1);
      expect(response.body.data.list[0].category).toBe('technical');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/knowledge');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/knowledge', () => {
    it('should create knowledge document successfully', async () => {
      const user = await createTestUser({ email: 'createknowledge@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Knowledge',
          content: 'This is the content',
          category: 'technical',
          tags: ['api', 'test'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Knowledge');
      expect(response.body.data.content).toBe('This is the content');
      expect(response.body.data.creator_name).toBe(user.name);
    });

    it('should create knowledge with project association', async () => {
      const user = await createTestUser({ email: 'createknowledge2@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Knowledge with Project',
          content: 'Content',
          project_ids: [project.id],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const relations = db.knowledgeProjects.findByKnowledge(response.body.data.id);
      expect(relations.length).toBe(1);
    });

    it('should fail when title is missing', async () => {
      const user = await createTestUser({ email: 'createknowledge3@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Content without title',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('标题和内容不能为空');
    });

    it('should fail when content is missing', async () => {
      const user = await createTestUser({ email: 'createknowledge4@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Title without content',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('标题和内容不能为空');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/knowledge')
        .send({
          title: 'Test',
          content: 'Test',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/knowledge/:id', () => {
    it('should return knowledge detail', async () => {
      const user = await createTestUser({ email: 'getknowledge@example.com' });
      const token = generateToken(user);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-detail-1',
        title: 'Detail Knowledge',
        content: 'Detailed content here',
        category: 'technical',
        tags: ['detail'],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/knowledge/${knowledge.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(knowledge.id);
      expect(response.body.data.title).toBe('Detail Knowledge');
    });

    it('should increment view count', async () => {
      const user = await createTestUser({ email: 'getknowledge2@example.com' });
      const token = generateToken(user);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-detail-2',
        title: 'View Count Test',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/knowledge/${knowledge.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.view_count).toBe(6);
    });

    it('should return 404 for non-existent knowledge', async () => {
      const user = await createTestUser({ email: 'getknowledge3@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/knowledge/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('文档不存在');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/knowledge/some-id');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/knowledge/:id', () => {
    it('should update knowledge successfully by creator', async () => {
      const user = await createTestUser({ email: 'updateknowledge@example.com' });
      const token = generateToken(user);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-update-1',
        title: 'Original Title',
        content: 'Original content',
        category: 'technical',
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/knowledge/${knowledge.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.content).toBe('Updated content');
    });

    it('should allow admin to update any knowledge', async () => {
      const admin = await createTestUser({ email: 'adminknowledge@example.com', role: 'admin' });
      const user = await createTestUser({ email: 'userknowledge@example.com' });
      const token = generateToken(admin);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-update-2',
        title: 'User Document',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/knowledge/${knowledge.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Admin Updated',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Admin Updated');
    });

    it('should fail when non-creator tries to update', async () => {
      const user1 = await createTestUser({ email: 'user1knowledge@example.com' });
      const user2 = await createTestUser({ email: 'user2knowledge@example.com' });
      const token = generateToken(user2);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-update-3',
        title: 'User1 Document',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user1.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .put(`/api/knowledge/${knowledge.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Unauthorized Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('无权修改此文档');
    });

    it('should return 404 for non-existent knowledge', async () => {
      const user = await createTestUser({ email: 'updateknowledge4@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/knowledge/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/knowledge/:id', () => {
    it('should delete knowledge successfully by creator', async () => {
      const user = await createTestUser({ email: 'deleteknowledge@example.com' });
      const token = generateToken(user);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-delete-1',
        title: 'To Delete',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/knowledge/${knowledge.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('文档已删除');
    });

    it('should allow admin to delete any knowledge', async () => {
      const admin = await createTestUser({ email: 'admindelete@example.com', role: 'admin' });
      const user = await createTestUser({ email: 'userdelete@example.com' });
      const token = generateToken(admin);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-delete-2',
        title: 'User Document',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/knowledge/${knowledge.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should fail when non-creator tries to delete', async () => {
      const user1 = await createTestUser({ email: 'user1delete@example.com' });
      const user2 = await createTestUser({ email: 'user2delete@example.com' });
      const token = generateToken(user2);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-delete-3',
        title: 'User1 Document',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user1.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/knowledge/${knowledge.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('无权删除此文档');
    });

    it('should return 404 for non-existent knowledge', async () => {
      const user = await createTestUser({ email: 'deleteknowledge4@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .delete('/api/knowledge/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/knowledge/search', () => {
    it('should search knowledge by query', async () => {
      const user = await createTestUser({ email: 'searchknowledge@example.com' });
      const token = generateToken(user);

      db.knowledgeBase.create({
        id: 'kb-search-1',
        title: 'JavaScript Basics',
        content: 'Learn JavaScript fundamentals',
        category: 'technical',
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.knowledgeBase.create({
        id: 'kb-search-2',
        title: 'Python Guide',
        content: 'Python programming guide',
        category: 'technical',
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/knowledge/search')
        .query({ q: 'JavaScript' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('JavaScript Basics');
    });

    it('should fail when no search criteria provided', async () => {
      const user = await createTestUser({ email: 'searchknowledge2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/knowledge/search')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('请提供搜索条件');
    });
  });

  describe('GET /api/knowledge/project/:projectId', () => {
    it('should return knowledge for a project', async () => {
      const user = await createTestUser({ email: 'projectknowledge@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const knowledge = db.knowledgeBase.create({
        id: 'kb-project-1',
        title: 'Project Knowledge',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.knowledgeProjects.create({
        id: 'kp-1',
        knowledge_id: knowledge.id,
        project_id: project.id,
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/knowledge/project/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.list.length).toBe(1);
    });

    it('should return 404 for non-existent project', async () => {
      const user = await createTestUser({ email: 'projectknowledge2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/knowledge/project/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });
  });

  describe('POST /api/knowledge/:id/link-project', () => {
    it('should link knowledge to project', async () => {
      const user = await createTestUser({ email: 'linkknowledge@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const knowledge = db.knowledgeBase.create({
        id: 'kb-link-1',
        title: 'To Link',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post(`/api/knowledge/${knowledge.id}/link-project`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.project_name).toBe(project.name);
    });

    it('should fail when project_id is missing', async () => {
      const user = await createTestUser({ email: 'linkknowledge2@example.com' });
      const token = generateToken(user);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-link-2',
        title: 'To Link',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post(`/api/knowledge/${knowledge.id}/link-project`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('项目ID不能为空');
    });

    it('should fail for non-existent knowledge', async () => {
      const user = await createTestUser({ email: 'linkknowledge3@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/knowledge/non-existent-id/link-project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('文档不存在');
    });

    it('should fail for non-existent project', async () => {
      const user = await createTestUser({ email: 'linkknowledge4@example.com' });
      const token = generateToken(user);

      const knowledge = db.knowledgeBase.create({
        id: 'kb-link-3',
        title: 'To Link',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post(`/api/knowledge/${knowledge.id}/link-project`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: 'non-existent-project',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });

    it('should fail when already linked', async () => {
      const user = await createTestUser({ email: 'linkknowledge5@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const knowledge = db.knowledgeBase.create({
        id: 'kb-link-4',
        title: 'To Link',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.knowledgeProjects.create({
        id: 'kp-link-1',
        knowledge_id: knowledge.id,
        project_id: project.id,
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post(`/api/knowledge/${knowledge.id}/link-project`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('文档已关联此项目');
    });
  });

  describe('DELETE /api/knowledge/:id/link-project/:projectId', () => {
    it('should unlink knowledge from project', async () => {
      const user = await createTestUser({ email: 'unlinkknowledge@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const knowledge = db.knowledgeBase.create({
        id: 'kb-unlink-1',
        title: 'To Unlink',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.knowledgeProjects.create({
        id: 'kp-unlink-1',
        knowledge_id: knowledge.id,
        project_id: project.id,
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/knowledge/${knowledge.id}/link-project/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('已取消关联');
    });

    it('should return 404 for non-existent relation', async () => {
      const user = await createTestUser({ email: 'unlinkknowledge2@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const knowledge = db.knowledgeBase.create({
        id: 'kb-unlink-2',
        title: 'To Unlink',
        content: 'Content',
        category: null,
        tags: [],
        creator_id: user.id,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/knowledge/${knowledge.id}/link-project/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('关联关系不存在');
    });
  });
});
