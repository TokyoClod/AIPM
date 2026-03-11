import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, createTestUser, generateToken, db } from '../helpers/testApp';
import { initializeDatabase } from '../helpers/testDb';

const app = createTestApp();

describe('Permissions API', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  describe('GET /api/permissions', () => {
    it('should return all permissions', async () => {
      const user = await createTestUser({ email: 'perm@example.com' });
      const token = generateToken(user);

      db.permissions.create({
        id: 'perm-1',
        name: 'View Projects',
        code: 'project:view',
        resource_type: 'project',
        operation: 'view',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/permissions');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/permissions/roles', () => {
    it('should return all roles', async () => {
      const user = await createTestUser({ email: 'roles@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/permissions/roles')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(4);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/permissions/roles');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/permissions/roles/:roleId', () => {
    it('should update role permissions as admin', async () => {
      const admin = await createTestUser({ email: 'admin@example.com', role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .put('/api/permissions/roles/member')
        .set('Authorization', `Bearer ${token}`)
        .send({
          permissions: ['project:view', 'task:create'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('角色权限已更新');
    });

    it('should fail for invalid role', async () => {
      const admin = await createTestUser({ email: 'admin2@example.com', role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .put('/api/permissions/roles/invalid-role')
        .set('Authorization', `Bearer ${token}`)
        .send({
          permissions: ['project:view'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('无效的角色');
    });

    it('should fail when permissions is not an array', async () => {
      const admin = await createTestUser({ email: 'admin3@example.com', role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .put('/api/permissions/roles/member')
        .set('Authorization', `Bearer ${token}`)
        .send({
          permissions: 'not-an-array',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('权限列表格式错误');
    });

    it('should fail for non-admin user', async () => {
      const user = await createTestUser({ email: 'nonadmin@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/permissions/roles/member')
        .set('Authorization', `Bearer ${token}`)
        .send({
          permissions: ['project:view'],
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('权限不足');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/permissions/roles/member')
        .send({
          permissions: ['project:view'],
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/permissions/users/:userId', () => {
    it('should return user permissions for admin', async () => {
      const admin = await createTestUser({ email: 'adminuser@example.com', role: 'admin' });
      const token = generateToken(admin);
      const user = await createTestUser({ email: 'targetuser@example.com' });

      const response = await request(app)
        .get(`/api/permissions/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(user.id);
      expect(response.body.data.role).toBe('member');
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
    });

    it('should return own permissions', async () => {
      const user = await createTestUser({ email: 'ownperm@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get(`/api/permissions/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user_id).toBe(user.id);
    });

    it('should fail for non-admin accessing other user', async () => {
      const user1 = await createTestUser({ email: 'user1perm@example.com' });
      const user2 = await createTestUser({ email: 'user2perm@example.com' });
      const token = generateToken(user2);

      const response = await request(app)
        .get(`/api/permissions/users/${user1.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('权限不足');
    });

    it('should return 404 for non-existent user', async () => {
      const admin = await createTestUser({ email: 'adminuser2@example.com', role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .get('/api/permissions/users/non-existent-user')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('用户不存在');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/permissions/users/some-user');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/permissions/users/:userId', () => {
    it('should update user permissions as admin', async () => {
      const admin = await createTestUser({ email: 'adminupdate@example.com', role: 'admin' });
      const token = generateToken(admin);
      const user = await createTestUser({ email: 'userupdate@example.com' });

      const response = await request(app)
        .put(`/api/permissions/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          permissions: [
            { code: 'project:view', granted: true },
            { code: 'task:create', granted: true },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('用户权限已更新');
    });

    it('should return 404 for non-existent user', async () => {
      const admin = await createTestUser({ email: 'adminupdate2@example.com', role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .put('/api/permissions/users/non-existent-user')
        .set('Authorization', `Bearer ${token}`)
        .send({
          permissions: [],
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('用户不存在');
    });

    it('should fail when permissions is not an array', async () => {
      const admin = await createTestUser({ email: 'adminupdate3@example.com', role: 'admin' });
      const token = generateToken(admin);
      const user = await createTestUser({ email: 'userupdate3@example.com' });

      const response = await request(app)
        .put(`/api/permissions/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          permissions: 'not-an-array',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('权限列表格式错误');
    });

    it('should fail for non-admin user', async () => {
      const user1 = await createTestUser({ email: 'nonadminupdate@example.com' });
      const user2 = await createTestUser({ email: 'targetuser2@example.com' });
      const token = generateToken(user1);

      const response = await request(app)
        .put(`/api/permissions/users/${user2.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          permissions: [],
        });

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/permissions/users/some-user')
        .send({
          permissions: [],
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/permissions/check', () => {
    it('should check permission successfully', async () => {
      const user = await createTestUser({ email: 'checkperm@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/permissions/check')
        .query({ permission: 'project:view' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.permission).toBe('project:view');
      expect(response.body.data.has_permission).toBeDefined();
    });

    it('should return true for admin user', async () => {
      const admin = await createTestUser({ email: 'admincheck@example.com', role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .get('/api/permissions/check')
        .query({ permission: 'any:permission' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.has_permission).toBe(true);
    });

    it('should fail when permission is missing', async () => {
      const user = await createTestUser({ email: 'checkperm2@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/permissions/check')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('缺少权限代码');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/permissions/check')
        .query({ permission: 'project:view' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/permissions/grant', () => {
    it('should grant permission to user as admin', async () => {
      const admin = await createTestUser({ email: 'admingrant@example.com', role: 'admin' });
      const token = generateToken(admin);
      const user = await createTestUser({ email: 'usergrant@example.com' });

      const perm = db.permissions.create({
        id: 'perm-grant-1',
        name: 'Test Permission',
        code: 'test:permission',
        resource_type: 'test',
        operation: 'test',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
          permission_code: 'test:permission',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(user.id);
    });

    it('should fail when user_id is missing', async () => {
      const admin = await createTestUser({ email: 'admingrant2@example.com', role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${token}`)
        .send({
          permission_code: 'test:permission',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('缺少必要参数');
    });

    it('should fail when permission_code is missing', async () => {
      const admin = await createTestUser({ email: 'admingrant3@example.com', role: 'admin' });
      const token = generateToken(admin);
      const user = await createTestUser({ email: 'usergrant3@example.com' });

      const response = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('缺少必要参数');
    });

    it('should return 404 for non-existent user', async () => {
      const admin = await createTestUser({ email: 'admingrant4@example.com', role: 'admin' });
      const token = generateToken(admin);

      db.permissions.create({
        id: 'perm-grant-2',
        name: 'Test Permission',
        code: 'test:permission2',
        resource_type: 'test',
        operation: 'test',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: 'non-existent-user',
          permission_code: 'test:permission2',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('用户不存在');
    });

    it('should return 404 for non-existent permission', async () => {
      const admin = await createTestUser({ email: 'admingrant5@example.com', role: 'admin' });
      const token = generateToken(admin);
      const user = await createTestUser({ email: 'usergrant5@example.com' });

      const response = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
          permission_code: 'non:existent',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('权限不存在');
    });

    it('should fail for non-admin user', async () => {
      const user = await createTestUser({ email: 'nonadmingrant@example.com' });
      const token = generateToken(user);
      const targetUser = await createTestUser({ email: 'targetgrant@example.com' });

      const response = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: targetUser.id,
          permission_code: 'test:permission',
        });

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/permissions/grant')
        .send({
          user_id: 'some-user',
          permission_code: 'some:permission',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/permissions/revoke', () => {
    it('should revoke permission from user as admin', async () => {
      const admin = await createTestUser({ email: 'adminrevoke@example.com', role: 'admin' });
      const token = generateToken(admin);
      const user = await createTestUser({ email: 'userrevoke@example.com' });

      db.permissions.create({
        id: 'perm-revoke-1',
        name: 'Test Revoke',
        code: 'test:revoke',
        resource_type: 'test',
        operation: 'test',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/permissions/revoke')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
          permission_code: 'test:revoke',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('权限已撤销');
    });

    it('should fail when user_id is missing', async () => {
      const admin = await createTestUser({ email: 'adminrevoke2@example.com', role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .post('/api/permissions/revoke')
        .set('Authorization', `Bearer ${token}`)
        .send({
          permission_code: 'test:revoke',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('缺少必要参数');
    });

    it('should fail when permission_code is missing', async () => {
      const admin = await createTestUser({ email: 'adminrevoke3@example.com', role: 'admin' });
      const token = generateToken(admin);
      const user = await createTestUser({ email: 'userrevoke3@example.com' });

      const response = await request(app)
        .post('/api/permissions/revoke')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('缺少必要参数');
    });

    it('should return 404 for non-existent permission', async () => {
      const admin = await createTestUser({ email: 'adminrevoke4@example.com', role: 'admin' });
      const token = generateToken(admin);
      const user = await createTestUser({ email: 'userrevoke4@example.com' });

      const response = await request(app)
        .post('/api/permissions/revoke')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: user.id,
          permission_code: 'non:existent',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('权限不存在');
    });

    it('should fail for non-admin user', async () => {
      const user = await createTestUser({ email: 'nonadminrevoke@example.com' });
      const token = generateToken(user);
      const targetUser = await createTestUser({ email: 'targetrevoke@example.com' });

      const response = await request(app)
        .post('/api/permissions/revoke')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: targetUser.id,
          permission_code: 'test:revoke',
        });

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/permissions/revoke')
        .send({
          user_id: 'some-user',
          permission_code: 'some:permission',
        });

      expect(response.status).toBe(401);
    });
  });
});
