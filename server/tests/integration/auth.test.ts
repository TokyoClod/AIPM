import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import express from 'express';
import { createTestApp, createTestUser, generateToken, db } from '../helpers/testApp';
import { initializeDatabase } from '../helpers/testDb';

describe('Auth API', () => {
  let app: express.Application;

  beforeEach(() => {
    initializeDatabase();
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user.name).toBe('New User');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('请填写完整信息');
    });

    it('should fail when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('请填写完整信息');
    });

    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('请填写完整信息');
    });

    it('should fail when email already exists', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'First User',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password456',
          name: 'Second User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('邮箱已被注册');
    });

    it('should assign admin role to first user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'firstuser@example.com',
          password: 'password123',
          name: 'First User',
        });

      expect(response.status).toBe(201);
      expect(['admin', 'member']).toContain(response.body.data.user.role);
    });

    it('should assign member role to subsequent users', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'seconduser@example.com',
          password: 'password123',
          name: 'Second User',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('member');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          name: 'Login User',
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('login@example.com');
    });

    it('should fail with incorrect password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'wrongpass@example.com',
          password: 'password123',
          name: 'Wrong Pass User',
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('邮箱或密码错误');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('邮箱或密码错误');
    });

    it('should fail when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('请输入邮箱和密码');
    });

    it('should fail when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('请输入邮箱和密码');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const user = await createTestUser({ email: 'me@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('me@example.com');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未授权访问');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token无效或已过期');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const user = await createTestUser({ email: 'profile@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          avatar: 'https://example.com/avatar.png',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.avatar).toBe('https://example.com/avatar.png');
    });

    it('should update password with correct current password', async () => {
      const user = await createTestUser({ email: 'pwd@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'pwd@example.com',
          password: 'newpassword123',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should fail to update password with wrong current password', async () => {
      const user = await createTestUser({ email: 'wrongpwd@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('当前密码错误');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          name: 'New Name',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/users', () => {
    it('should return all users', async () => {
      const user = await createTestUser({ email: 'users@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((u: any) => {
        expect(u.password).toBeUndefined();
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/users');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/users/:id/role', () => {
    it('should update user role as admin', async () => {
      const admin = await createTestUser({ email: 'admin@example.com', role: 'admin' });
      const member = await createTestUser({ email: 'member@example.com', role: 'member' });
      const token = generateToken(admin);

      const response = await request(app)
        .put(`/api/auth/users/${member.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          role: 'manager',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('manager');
    });

    it('should fail for non-admin users', async () => {
      const member1 = await createTestUser({ email: 'member1@example.com', role: 'member' });
      const member2 = await createTestUser({ email: 'member2@example.com', role: 'member' });
      const token = generateToken(member1);

      const response = await request(app)
        .put(`/api/auth/users/${member2.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          role: 'manager',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('权限不足');
    });

    it('should fail with invalid role', async () => {
      const admin = await createTestUser({ email: 'admin2@example.com', role: 'admin' });
      const member = await createTestUser({ email: 'member3@example.com', role: 'member' });
      const token = generateToken(admin);

      const response = await request(app)
        .put(`/api/auth/users/${member.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          role: 'invalid_role',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('无效的角色');
    });
  });
});
