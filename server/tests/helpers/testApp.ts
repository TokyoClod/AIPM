import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db, initializeDatabase } from './testDb';

export { db };

export function createTestApp() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  const authRouter = createAuthRouter();
  const projectsRouter = createProjectsRouter();
  const tasksRouter = createTasksRouter();
  const risksRouter = createRisksRouter();
  const aiRouter = createAIRouter();
  
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/risks', risksRouter);
  app.use('/api/ai', aiRouter);
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  });
  
  return app;
}

function createAuthRouter() {
  const router = express.Router();
  
  router.post('/register', async (req: express.Request, res: express.Response) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: '请填写完整信息' });
      }
      
      const existingUser = db.users.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: '邮箱已被注册' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const isFirstUser = db.users.getAll().length === 0;
      
      const user = db.users.create({
        id,
        email,
        password: hashedPassword,
        name,
        role: isFirstUser ? 'admin' : 'member',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET || 'test_jwt_secret_key',
        { expiresIn: '7d' }
      );
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ success: true, data: { token, user: userWithoutPassword } });
    } catch (error) {
      res.status(500).json({ success: false, message: '注册失败' });
    }
  });
  
  router.post('/login', async (req: express.Request, res: express.Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: '请输入邮箱和密码' });
      }
      
      const user = db.users.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: '邮箱或密码错误' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: '邮箱或密码错误' });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET || 'test_jwt_secret_key',
        { expiresIn: '7d' }
      );
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ success: true, data: { token, user: userWithoutPassword } });
    } catch (error) {
      res.status(500).json({ success: false, message: '登录失败' });
    }
  });
  
  router.get('/me', authenticateToken, (req: express.Request, res: express.Response) => {
    const user = db.users.findById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  });
  
  router.put('/profile', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
      const { name, avatar, currentPassword, newPassword } = req.body;
      const user = db.users.findById((req as any).user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      if (currentPassword && newPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: '当前密码错误' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updated = db.users.update(user.id, { password: hashedPassword });
        const { password: _, ...userWithoutPassword } = updated;
        return res.json({ success: true, data: userWithoutPassword });
      }
      
      const updated = db.users.update(user.id, { name, avatar, updated_at: new Date().toISOString() });
      const { password: _, ...userWithoutPassword } = updated;
      res.json({ success: true, data: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ success: false, message: '更新失败' });
    }
  });
  
  router.get('/users', authenticateToken, (req: express.Request, res: express.Response) => {
    const users = db.users.getAll().map(u => {
      const { password: _, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    res.json({ success: true, data: users });
  });
  
  router.put('/users/:id/role', authenticateToken, requireAdmin, (req: express.Request, res: express.Response) => {
    const { role } = req.body;
    const validRoles = ['admin', 'manager', 'leader', 'member'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: '无效的角色' });
    }
    
    const updated = db.users.update(req.params.id, { role, updated_at: new Date().toISOString() });
    if (!updated) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const { password: _, ...userWithoutPassword } = updated;
    res.json({ success: true, data: userWithoutPassword });
  });
  
  return router;
}

function createProjectsRouter() {
  const router = express.Router();
  
  router.get('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const user = db.users.findById((req as any).user.id);
    let projects = db.projects.getAll();
    
    if (user.role !== 'admin') {
      const memberProjects = db.project_members.getAll()
        .filter(pm => pm.user_id === user.id)
        .map(pm => pm.project_id);
      projects = projects.filter(p => memberProjects.includes(p.id));
    }
    
    res.json({ success: true, data: projects });
  });
  
  router.post('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const { name, description, start_date, end_date } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: '项目名称不能为空' });
    }
    
    const id = uuidv4();
    const project = db.projects.create({
      id,
      name,
      description,
      start_date,
      end_date,
      status: 'active',
      owner_id: (req as any).user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    db.project_members.create({
      id: uuidv4(),
      project_id: id,
      user_id: (req as any).user.id,
      role: 'owner',
      created_at: new Date().toISOString(),
    });
    
    res.status(201).json({ success: true, data: project });
  });
  
  router.get('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const project = db.projects.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const members = db.project_members.findByProject(req.params.id);
    res.json({ success: true, data: { ...project, members } });
  });
  
  router.put('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const project = db.projects.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const updated = db.projects.update(req.params.id, { ...req.body, updated_at: new Date().toISOString() });
    res.json({ success: true, data: updated });
  });
  
  router.delete('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const project = db.projects.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    db.projects.delete(req.params.id);
    res.json({ success: true, message: '项目已删除' });
  });
  
  router.post('/:id/members', authenticateToken, (req: express.Request, res: express.Response) => {
    const { user_id, role } = req.body;
    const project = db.projects.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const user = db.users.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const existingMember = db.project_members.getAll()
      .find(pm => pm.project_id === req.params.id && pm.user_id === user_id);
    if (existingMember) {
      return res.status(400).json({ success: false, message: '用户已是项目成员' });
    }
    
    const member = db.project_members.create({
      id: uuidv4(),
      project_id: req.params.id,
      user_id,
      role,
      created_at: new Date().toISOString(),
    });
    
    res.status(201).json({ success: true, data: member });
  });
  
  router.delete('/:id/members/:userId', authenticateToken, (req: express.Request, res: express.Response) => {
    db.project_members.delete(req.params.id, req.params.userId);
    res.json({ success: true, message: '成员已移除' });
  });
  
  router.get('/:id/dashboard', authenticateToken, (req: express.Request, res: express.Response) => {
    const project = db.projects.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const tasks = db.tasks.findByProject(req.params.id);
    const risks = db.risks.findByProject(req.params.id);
    
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      totalRisks: risks.length,
      criticalRisks: risks.filter(r => r.level === 'critical' || r.level === 'high').length,
    };
    
    const taskDistribution = {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      paused: tasks.filter(t => t.status === 'paused').length,
    };
    
    const priorityDistribution = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
    
    res.json({ success: true, data: { stats, taskDistribution, priorityDistribution } });
  });
  
  return router;
}

function createTasksRouter() {
  const router = express.Router();
  
  router.get('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id, status, assignee_id } = req.query;
    let tasks = db.tasks.findByProject(project_id as string);
    
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    if (assignee_id) {
      tasks = tasks.filter(t => t.assignee_id === assignee_id);
    }
    
    res.json({ success: true, data: tasks });
  });
  
  router.post('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id, title, description, priority, status, assignee_id, parent_id, start_date, end_date } = req.body;
    
    if (!project_id || !title) {
      return res.status(400).json({ success: false, message: '项目ID和任务标题不能为空' });
    }
    
    const project = db.projects.findById(project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const id = uuidv4();
    const maxOrder = db.tasks.getMaxOrder(project_id);
    
    const task = db.tasks.create({
      id,
      project_id,
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      progress: 0,
      assignee_id,
      parent_id,
      start_date,
      end_date,
      creator_id: (req as any).user.id,
      order_index: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    if (assignee_id) {
      db.notifications.create({
        id: uuidv4(),
        user_id: assignee_id,
        type: 'task',
        title: '新任务分配',
        content: `您被分配了新任务: ${title}`,
        read: 0,
        created_at: new Date().toISOString(),
      });
    }
    
    res.status(201).json({ success: true, data: task });
  });
  
  router.get('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const task = db.tasks.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    const children = db.tasks.findByProject(task.project_id).filter(t => t.parent_id === task.id);
    res.json({ success: true, data: { ...task, children } });
  });
  
  router.put('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const task = db.tasks.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    const updated = db.tasks.update(req.params.id, { ...req.body, updated_at: new Date().toISOString() });
    res.json({ success: true, data: updated });
  });
  
  router.put('/:id/progress', authenticateToken, (req: express.Request, res: express.Response) => {
    const { progress, status } = req.body;
    const task = db.tasks.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    let newStatus = status;
    if (!status) {
      if (progress === 100) newStatus = 'completed';
      else if (progress > 0) newStatus = 'in_progress';
    }
    
    const updated = db.tasks.update(req.params.id, { progress, status: newStatus, updated_at: new Date().toISOString() });
    res.json({ success: true, data: updated });
  });
  
  router.delete('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const task = db.tasks.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    db.tasks.delete(req.params.id);
    res.json({ success: true, message: '任务已删除' });
  });
  
  router.post('/:id/comments', authenticateToken, (req: express.Request, res: express.Response) => {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }
    
    const task = db.tasks.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    const comment = {
      id: uuidv4(),
      task_id: req.params.id,
      user_id: (req as any).user.id,
      content,
      created_at: new Date().toISOString(),
    };
    
    res.status(201).json({ success: true, data: comment });
  });
  
  router.get('/gantt/:projectId', authenticateToken, (req: express.Request, res: express.Response) => {
    const tasks = db.tasks.findByProject(req.params.projectId)
      .filter(t => t.start_date && t.end_date);
    res.json({ success: true, data: tasks });
  });
  
  return router;
}

function createRisksRouter() {
  const router = express.Router();
  
  router.get('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id, level, status } = req.query;
    let risks = project_id ? db.risks.findByProject(project_id as string) : db.risks.getAll();
    
    if (level) risks = risks.filter(r => r.level === level);
    if (status) risks = risks.filter(r => r.status === status);
    
    res.json({ success: true, data: risks });
  });
  
  router.post('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id, level, type, description, mitigation, task_id } = req.body;
    
    if (!project_id || !description) {
      return res.status(400).json({ success: false, message: '项目ID和风险描述不能为空' });
    }
    
    const project = db.projects.findById(project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const risk = db.risks.create({
      id: uuidv4(),
      project_id,
      level: level || 'medium',
      type: type || 'other',
      description,
      mitigation,
      task_id,
      status: 'identified',
      created_by: (req as any).user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    res.status(201).json({ success: true, data: risk });
  });
  
  router.put('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const risk = db.risks.findById(req.params.id);
    if (!risk) {
      return res.status(404).json({ success: false, message: '风险记录不存在' });
    }
    
    const updated = db.risks.update(req.params.id, { ...req.body, updated_at: new Date().toISOString() });
    res.json({ success: true, data: updated });
  });
  
  router.delete('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    db.risks.delete(req.params.id);
    res.json({ success: true, message: '风险记录已删除' });
  });
  
  router.get('/alerts', authenticateToken, (req: express.Request, res: express.Response) => {
    const alerts = db.riskAlerts.getAll();
    res.json({ success: true, data: alerts });
  });
  
  router.post('/analyze', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id } = req.body;
    if (!project_id) {
      return res.status(400).json({ success: false, message: '项目ID不能为空' });
    }
    res.json({ success: true, data: { analysis: 'Risk analysis completed' } });
  });
  
  router.post('/scan', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id } = req.body;
    if (!project_id) {
      return res.status(400).json({ success: false, message: '项目ID不能为空' });
    }
    res.json({ success: true, data: [] });
  });
  
  router.put('/alerts/:id/resolve', authenticateToken, (req: express.Request, res: express.Response) => {
    const { action, resolution_note } = req.body;
    
    if (!['acknowledge', 'resolve'].includes(action)) {
      return res.status(400).json({ success: false, message: '无效的操作类型' });
    }
    
    if (action === 'resolve' && !resolution_note) {
      return res.status(400).json({ success: false, message: '解决方案不能为空' });
    }
    
    res.json({ success: true, message: '操作成功' });
  });
  
  return router;
}

function createAIRouter() {
  const router = express.Router();
  
  router.post('/chat', authenticateToken, (req: express.Request, res: express.Response) => {
    const { message, conversation_id, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: '消息内容不能为空' });
    }
    
    const convId = conversation_id || uuidv4();
    
    if (!conversation_id) {
      db.conversations.create({
        id: convId,
        user_id: (req as any).user.id,
        title: message.substring(0, 30),
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    
    res.json({ success: true, data: { conversation_id: convId, response: 'AI response' } });
  });
  
  router.post('/parse', authenticateToken, (req: express.Request, res: express.Response) => {
    const { content, type } = req.body;
    
    if (!content || !type) {
      return res.status(400).json({ success: false, message: '内容和类型不能为空' });
    }
    
    res.json({ success: true, data: { parsed: true } });
  });
  
  router.post('/analyze', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id, data } = req.body;
    
    if (!project_id && !data) {
      return res.status(400).json({ success: false, message: '请提供项目ID或分析数据' });
    }
    
    if (project_id) {
      const project = db.projects.findById(project_id);
      if (!project) {
        return res.status(404).json({ success: false, message: '项目不存在' });
      }
    }
    
    res.json({ success: true, data: { analysis: 'Analysis completed' } });
  });
  
  router.get('/conversations', authenticateToken, (req: express.Request, res: express.Response) => {
    const conversations = db.conversations.findByUser((req as any).user.id)
      .map(c => ({
        id: c.id,
        title: c.title,
        message_count: c.messages?.length || 0,
        created_at: c.created_at,
      }));
    res.json({ success: true, data: conversations });
  });
  
  router.get('/conversations/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const conversation = db.conversations.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: '对话不存在' });
    }
    
    if (conversation.user_id !== (req as any).user.id) {
      return res.status(403).json({ success: false, message: '无权访问此对话' });
    }
    
    res.json({ success: true, data: conversation });
  });
  
  router.delete('/conversations/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const conversation = db.conversations.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: '对话不存在' });
    }
    
    if (conversation.user_id !== (req as any).user.id) {
      return res.status(403).json({ success: false, message: '无权删除此对话' });
    }
    
    db.conversations.delete(req.params.id);
    res.json({ success: true, message: '对话已删除' });
  });
  
  router.post('/tools/execute', authenticateToken, (req: express.Request, res: express.Response) => {
    const { tool_name, parameters } = req.body;
    
    if (!tool_name) {
      return res.status(400).json({ success: false, message: '工具名称不能为空' });
    }
    
    if (!parameters || typeof parameters !== 'object') {
      return res.status(400).json({ success: false, message: '参数格式不正确' });
    }
    
    res.json({ success: true, data: { result: 'Tool executed' } });
  });
  
  router.get('/tools/logs', authenticateToken, (req: express.Request, res: express.Response) => {
    res.json({ success: true, data: [] });
  });
  
  router.get('/tools/logs/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    res.status(404).json({ success: false, message: '日志不存在' });
  });
  
  router.get('/tools', authenticateToken, (req: express.Request, res: express.Response) => {
    res.json({ success: true, data: [] });
  });
  
  return router;
}

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'test_jwt_secret_key');
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效或已过期' });
  }
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '权限不足' });
  }
  next();
}

export async function createTestUser(overrides: any = {}) {
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

export async function createAdminUser(overrides: any = {}) {
  return createTestUser({ ...overrides, role: 'admin' });
}

export function generateToken(user: any) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'test_jwt_secret_key',
    { expiresIn: '7d' }
  );
}

export function createTestProject(overrides: any = {}) {
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

export function createTestTask(overrides: any = {}) {
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

export function createTestRisk(overrides: any = {}) {
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

export async function clearDatabase() {
  const { clearTestDatabase } = await import('./testDb');
  clearTestDatabase();
}
