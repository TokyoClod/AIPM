// Test helper utilities
import express from 'express';
import cors from 'cors';
import { db, initializeDatabase } from '../src/models/database.js';
import authRoutes from '../src/routes/auth.js';
import projectRoutes from '../src/routes/projects.js';
import taskRoutes from '../src/routes/tasks.js';
import riskRoutes from '../src/routes/risks.js';
import aiRoutes from '../src/routes/ai.js';

// 创建测试应用实例
export function createTestApp() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // 初始化数据库
  initializeDatabase();
  
  // 注册路由
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/risks', riskRoutes);
  app.use('/api/ai', aiRoutes);
  
  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // 错误处理
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  });
  
  return app;
}

// 清空数据库
export function clearDatabase() {
  // 直接访问内部存储并清空
  const dbPath = './data/test_aipm.json';
  const fs = await import('fs');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

// 创建测试用户
export async function createTestUser(overrides: any = {}) {
  const bcrypt = await import('bcryptjs');
  const { v4: uuidv4 } = await import('uuid');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  const id = uuidv4();
  
  const user = db.users.create({
    id,
    email: `test${Date.now()}@example.com`,
    password: hashedPassword,
    name: 'Test User',
    role: 'member',
    avatar: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });
  
  return user;
}

// 创建管理员用户
export async function createAdminUser(overrides: any = {}) {
  return createTestUser({ ...overrides, role: 'admin' });
}

// 生成JWT Token
export function generateToken(user: any) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'test_jwt_secret_key',
    { expiresIn: '7d' }
  );
}

// 创建测试项目
export function createTestProject(overrides: any = {}) {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  
  const project = db.projects.create({
    id,
    name: `Test Project ${Date.now()}`,
    description: 'Test project description',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    owner_id: overrides.owner_id || 'test-owner-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });
  
  return project;
}

// 创建测试任务
export function createTestTask(overrides: any = {}) {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  
  const task = db.tasks.create({
    id,
    project_id: overrides.project_id || 'test-project-id',
    title: `Test Task ${Date.now()}`,
    description: 'Test task description',
    status: 'pending',
    priority: 'medium',
    progress: 0,
    creator_id: overrides.creator_id || 'test-user-id',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });
  
  return task;
}

// 创建测试风险
export function createTestRisk(overrides: any = {}) {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  
  const risk = db.risks.create({
    id,
    project_id: overrides.project_id || 'test-project-id',
    level: 'medium',
    type: 'technical',
    description: 'Test risk description',
    status: 'identified',
    created_by: overrides.created_by || 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });
  
  return risk;
}
