import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, createTestProject, db } from '../helpers/testApp';
import { initializeDatabase } from '../helpers/testDb';

const app = createTestApp();

describe('AI API', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  describe('POST /api/ai/chat', () => {
    it('should fail when message is missing', async () => {
      const user = await createTestUser({ email: 'ai@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('消息内容不能为空');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Hello AI',
        });

      expect(response.status).toBe(401);
    });

    it('should create new conversation when conversation_id is not provided', async () => {
      const user = await createTestUser({ email: 'ai2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Test message',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.conversation_id).toBeDefined();
    });

    it('should include project context when provided', async () => {
      const user = await createTestUser({ email: 'ai3@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Analyze this project',
          context: {
            project_id: project.id,
          },
        });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/ai/parse', () => {
    it('should fail when content is missing', async () => {
      const user = await createTestUser({ email: 'ai4@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'task',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('内容和类型不能为空');
    });

    it('should fail when type is missing', async () => {
      const user = await createTestUser({ email: 'ai5@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Create a new task',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('内容和类型不能为空');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/ai/parse')
        .send({
          content: 'Test content',
          type: 'task',
        });

      expect(response.status).toBe(401);
    });

    it('should parse task content', async () => {
      const user = await createTestUser({ email: 'ai6@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Create a task: Implement user authentication by next Friday',
          type: 'task',
        });

      expect(response.status).toBe(200);
    });

    it('should parse risk content', async () => {
      const user = await createTestUser({ email: 'ai7@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Risk: Database performance issue with high severity',
          type: 'risk',
        });

      expect(response.status).toBe(200);
    });

    it('should parse project content', async () => {
      const user = await createTestUser({ email: 'ai8@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Project: Build a new web application with React and Node.js',
          type: 'project',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/ai/analyze', () => {
    it('should fail when neither project_id nor data is provided', async () => {
      const user = await createTestUser({ email: 'ai9@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('请提供项目ID或分析数据');
    });

    it('should fail for non-existent project', async () => {
      const user = await createTestUser({ email: 'ai10@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: 'non-existent-project',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('项目不存在');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .send({
          project_id: 'test-project',
        });

      expect(response.status).toBe(401);
    });

    it('should analyze project risks with project_id', async () => {
      const user = await createTestUser({ email: 'ai11@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project_id: project.id,
        });

      expect(response.status).toBe(200);
    });

    it('should analyze with custom data', async () => {
      const user = await createTestUser({ email: 'ai12@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: {
            project: { name: 'Test Project' },
            tasks: [],
            risks: [],
          },
        });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/ai/conversations', () => {
    it('should return user conversations', async () => {
      const user = await createTestUser({ email: 'ai13@example.com' });
      const token = generateToken(user);

      db.conversations.create({
        id: 'conv-1',
        user_id: user.id,
        title: 'Conversation 1',
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.conversations.create({
        id: 'conv-2',
        user_id: user.id,
        title: 'Conversation 2',
        messages: [{ role: 'user', content: 'Test' }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach((conv: any) => {
        expect(conv.id).toBeDefined();
        expect(conv.title).toBeDefined();
        expect(conv.message_count).toBeDefined();
        expect(conv.messages).toBeUndefined();
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/ai/conversations');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/ai/conversations/:id', () => {
    it('should return conversation details', async () => {
      const user = await createTestUser({ email: 'ai14@example.com' });
      const token = generateToken(user);

      const conversation = db.conversations.create({
        id: 'detail-conv',
        user_id: user.id,
        title: 'Detail Conversation',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/ai/conversations/${conversation.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(conversation.id);
      expect(response.body.data.messages).toBeDefined();
      expect(response.body.data.messages.length).toBe(2);
    });

    it('should return 404 for non-existent conversation', async () => {
      const user = await createTestUser({ email: 'ai15@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/ai/conversations/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('对话不存在');
    });

    it('should deny access to other user conversation', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const user = await createTestUser({ email: 'ai16@example.com' });
      const token = generateToken(user);

      const conversation = db.conversations.create({
        id: 'other-conv',
        user_id: otherUser.id,
        title: 'Other User Conversation',
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/api/ai/conversations/${conversation.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('无权访问此对话');
    });
  });

  describe('DELETE /api/ai/conversations/:id', () => {
    it('should delete conversation successfully', async () => {
      const user = await createTestUser({ email: 'ai17@example.com' });
      const token = generateToken(user);

      const conversation = db.conversations.create({
        id: 'delete-conv',
        user_id: user.id,
        title: 'To Delete',
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/ai/conversations/${conversation.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('对话已删除');

      const deletedConv = db.conversations.findById(conversation.id);
      expect(deletedConv).toBeUndefined();
    });

    it('should return 404 for non-existent conversation', async () => {
      const user = await createTestUser({ email: 'ai18@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .delete('/api/ai/conversations/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('对话不存在');
    });

    it('should deny deleting other user conversation', async () => {
      const otherUser = await createTestUser({ email: 'other2@example.com' });
      const user = await createTestUser({ email: 'ai19@example.com' });
      const token = generateToken(user);

      const conversation = db.conversations.create({
        id: 'other-delete-conv',
        user_id: otherUser.id,
        title: 'Other User Conversation',
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .delete(`/api/ai/conversations/${conversation.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('无权删除此对话');
    });
  });

  describe('POST /api/ai/tools/execute', () => {
    it('should fail when tool_name is missing', async () => {
      const user = await createTestUser({ email: 'ai20@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/tools/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({
          parameters: {},
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('工具名称不能为空');
    });

    it('should fail when parameters is missing', async () => {
      const user = await createTestUser({ email: 'ai21@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/tools/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tool_name: 'create_task',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('参数格式不正确');
    });

    it('should fail when parameters is not an object', async () => {
      const user = await createTestUser({ email: 'ai22@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/ai/tools/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tool_name: 'create_task',
          parameters: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('参数格式不正确');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/ai/tools/execute')
        .send({
          tool_name: 'create_task',
          parameters: {},
        });

      expect(response.status).toBe(401);
    });

    it('should execute tool successfully', async () => {
      const user = await createTestUser({ email: 'ai23@example.com' });
      const token = generateToken(user);
      const project = createTestProject({ owner_id: user.id });

      const response = await request(app)
        .post('/api/ai/tools/execute')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tool_name: 'get_project_stats',
          parameters: { project_id: project.id },
        });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/ai/tools/logs', () => {
    it('should return tool call logs', async () => {
      const user = await createTestUser({ email: 'ai24@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/ai/tools/logs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const user = await createTestUser({ email: 'ai25@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/ai/tools/logs')
        .query({ limit: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/ai/tools/logs');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/ai/tools/logs/:id', () => {
    it('should return 404 for non-existent log', async () => {
      const user = await createTestUser({ email: 'ai26@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/ai/tools/logs/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('日志不存在');
    });
  });

  describe('GET /api/ai/tools', () => {
    it('should return available tools', async () => {
      const user = await createTestUser({ email: 'ai27@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/ai/tools')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/ai/tools');

      expect(response.status).toBe(401);
    });
  });
});
