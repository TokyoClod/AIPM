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
  const workbenchRouter = createWorkbenchRouter();
  const teamRouter = createTeamRouter();
  const stagesRouter = createStagesRouter();
  const knowledgeRouter = createKnowledgeRouter();
  const smartAssignRouter = createSmartAssignRouter();
  const permissionsRouter = createPermissionsRouter();
  
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/risks', risksRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/workbench', workbenchRouter);
  app.use('/api/team', teamRouter);
  app.use('/api/stages', stagesRouter);
  app.use('/api/knowledge', knowledgeRouter);
  app.use('/api/smart-assign', smartAssignRouter);
  app.use('/api/permissions', permissionsRouter);
  
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

function createWorkbenchRouter() {
  const router = express.Router();
  
  router.get('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userTasks = db.tasks.findByAssignee(userId);
    const pendingTasks = userTasks.filter((t: any) => t.status !== 'completed');
    const highPriorityTasks = pendingTasks.filter((t: any) => t.priority === 'high' || t.priority === 'urgent');

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const upcomingTasks = pendingTasks.filter((t: any) => {
      if (!t.end_date) return false;
      const endDate = new Date(t.end_date);
      return endDate >= today && endDate <= sevenDaysLater;
    });

    const overdueTasks = pendingTasks.filter((t: any) => {
      if (!t.end_date) return false;
      const endDate = new Date(t.end_date);
      endDate.setHours(23, 59, 59, 999);
      return endDate < today;
    });

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekCompleted = userTasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.updated_at) return false;
      const updatedDate = new Date(t.updated_at);
      return updatedDate >= weekStart && updatedDate <= weekEnd;
    });

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthCompleted = userTasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.updated_at) return false;
      const updatedDate = new Date(t.updated_at);
      return updatedDate >= monthStart && updatedDate <= monthEnd;
    });

    const completedWithDueDate = userTasks.filter((t: any) => t.status === 'completed' && t.end_date);
    const onTimeCompleted = completedWithDueDate.filter((t: any) => {
      const endDate = new Date(t.end_date);
      const updatedAt = new Date(t.updated_at);
      return updatedAt <= endDate;
    });

    const onTimeRate = completedWithDueDate.length > 0 
      ? Math.round((onTimeCompleted.length / completedWithDueDate.length) * 100) 
      : 0;

    const userProjects = db.project_members.getAll().filter((pm: any) => pm.user_id === userId);
    const projectIds = userProjects.map((pm: any) => pm.project_id);
    const projects = projectIds.map((id: string) => db.projects.findById(id)).filter(Boolean);

    const notifications = db.notifications.findByUser(userId);
    const unreadNotifications = notifications.filter((n: any) => n.read === 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalPending: pendingTasks.length,
          highPriority: highPriorityTasks.length,
          upcoming: upcomingTasks.length,
          overdue: overdueTasks.length,
          weekCompleted: weekCompleted.length,
          monthCompleted: monthCompleted.length,
          onTimeRate,
        },
        projects: projects.slice(0, 5),
        recentNotifications: unreadNotifications.slice(0, 5),
      },
    });
  });

  router.get('/todos', authenticateToken, (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userTasks = db.tasks.findByAssignee(userId);
    const pendingTasks = userTasks.filter((t: any) => t.status !== 'completed');

    const todos = pendingTasks.map((t: any) => {
      const project = db.projects.findById(t.project_id);
      let daysUntilDue = null;
      let isOverdue = false;

      if (t.end_date) {
        const endDate = new Date(t.end_date);
        endDate.setHours(23, 59, 59, 999);
        const diffTime = endDate.getTime() - today.getTime();
        daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isOverdue = daysUntilDue < 0;
      }

      return {
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        progress: t.progress,
        end_date: t.end_date,
        daysUntilDue,
        isOverdue,
        project_id: t.project_id,
        project_name: project?.name || '未知项目',
        assignee_name: (req as any).user.name,
      };
    });

    todos.sort((a: any, b: any) => {
      const priorityOrder: any = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;

      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      if (a.daysUntilDue !== null && b.daysUntilDue !== null) {
        return a.daysUntilDue - b.daysUntilDue;
      }
      if (a.daysUntilDue !== null) return -1;
      if (b.daysUntilDue !== null) return 1;

      return 0;
    });

    res.json({ success: true, data: todos });
  });

  router.get('/schedule', authenticateToken, (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userTasks = db.tasks.findByAssignee(userId);

    const schedule: any[] = [];
    const dateMap = new Map<string, any[]>();

    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, []);
    }

    userTasks.forEach((t: any) => {
      if (!t.end_date || t.status === 'completed') return;

      const endDate = new Date(t.end_date);
      endDate.setHours(0, 0, 0, 0);
      const dateStr = endDate.toISOString().split('T')[0];

      if (dateMap.has(dateStr)) {
        const project = db.projects.findById(t.project_id);
        dateMap.get(dateStr)!.push({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          progress: t.progress,
          project_id: t.project_id,
          project_name: project?.name || '未知项目',
        });
      }
    });

    dateMap.forEach((tasks, dateStr) => {
      const date = new Date(dateStr);
      const isToday = date.toDateString() === today.toDateString();
      const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];

      schedule.push({
        date: dateStr,
        dayOfWeek,
        isToday,
        taskCount: tasks.length,
        tasks: tasks.sort((a: any, b: any) => {
          const priorityOrder: any = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
        }),
      });
    });

    res.json({ success: true, data: schedule });
  });

  router.get('/stats', authenticateToken, (req: express.Request, res: express.Response) => {
    const userId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userTasks = db.tasks.findByAssignee(userId);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekCompleted = userTasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.updated_at) return false;
      const updatedDate = new Date(t.updated_at);
      return updatedDate >= weekStart && updatedDate <= weekEnd;
    });

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthCompleted = userTasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.updated_at) return false;
      const updatedDate = new Date(t.updated_at);
      return updatedDate >= monthStart && updatedDate <= monthEnd;
    });

    const completedWithDueDate = userTasks.filter((t: any) => t.status === 'completed' && t.end_date);
    const onTimeCompleted = completedWithDueDate.filter((t: any) => {
      const endDate = new Date(t.end_date);
      endDate.setHours(23, 59, 59, 999);
      const updatedAt = new Date(t.updated_at);
      return updatedAt <= endDate;
    });

    const onTimeRate = completedWithDueDate.length > 0 
      ? Math.round((onTimeCompleted.length / completedWithDueDate.length) * 100) 
      : 0;

    const pendingTasks = userTasks.filter((t: any) => t.status !== 'completed');
    const inProgressTasks = pendingTasks.filter((t: any) => t.status === 'in_progress');
    const pendingStatusTasks = pendingTasks.filter((t: any) => t.status === 'pending');

    const priorityDistribution = {
      urgent: pendingTasks.filter((t: any) => t.priority === 'urgent').length,
      high: pendingTasks.filter((t: any) => t.priority === 'high').length,
      medium: pendingTasks.filter((t: any) => t.priority === 'medium').length,
      low: pendingTasks.filter((t: any) => t.priority === 'low').length,
    };

    res.json({
      success: true,
      data: {
        weekly: {
          completed: weekCompleted.length,
          trend: 0,
        },
        monthly: {
          completed: monthCompleted.length,
          trend: 0,
        },
        onTimeRate,
        avgResponseTime: 0,
        taskDistribution: {
          completed: userTasks.filter((t: any) => t.status === 'completed').length,
          inProgress: inProgressTasks.length,
          pending: pendingStatusTasks.length,
        },
        priorityDistribution,
      },
    });
  });

  router.put('/todos/:id/complete', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const task = db.tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    if (task.assignee_id !== userId) {
      return res.status(403).json({ success: false, message: '无权操作此任务' });
    }

    const updated = db.tasks.update(id, {
      status: 'completed',
      progress: 100,
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, data: updated });
  });

  return router;
}

function createTeamRouter() {
  const router = express.Router();

  router.get('/status', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id } = req.query;
    
    let users = db.users.getAll();
    let projectMembers: any[] = [];
    
    if (project_id) {
      projectMembers = db.project_members.findByProject(project_id as string);
      const memberIds = projectMembers.map(pm => pm.user_id);
      users = users.filter(u => memberIds.includes(u.id));
    }
    
    const teamStatus = users.map(user => {
      const allTasks = db.tasks.findByProject(project_id as string).filter(t => project_id);
      const userTasks = project_id 
        ? allTasks.filter(t => t.assignee_id === user.id)
        : db.tasks.getAll().filter(t => t.assignee_id === user.id);
      
      const activeTasks = userTasks.filter(t => 
        t.status === 'in_progress' || t.status === 'pending'
      );
      const completedTasks = userTasks.filter(t => t.status === 'completed');
      
      const maxTasks = 10;
      const taskCount = activeTasks.length;
      const workloadPercentage = Math.min((taskCount / maxTasks) * 100, 100);
      
      const now = new Date();
      const lastActivity = new Date(user.updated_at);
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
      const isOnline = hoursSinceActivity < 1;
      
      const loadLevel = getLoadLevel(workloadPercentage);
      const warningStatus = workloadPercentage > 80;
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        taskCount: activeTasks.length,
        completedTaskCount: completedTasks.length,
        workloadPercentage: Math.round(workloadPercentage),
        loadLevel,
        isOnline,
        lastActivity: user.updated_at,
        warningStatus,
      };
    });
    
    res.json({ success: true, data: teamStatus });
  });

  router.get('/:userId/workload', authenticateToken, (req: express.Request, res: express.Response) => {
    const { userId } = req.params;
    const { project_id } = req.query;
    
    const user = db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    let tasks = db.tasks.getAll().filter(t => t.assignee_id === userId);
    if (project_id) {
      tasks = tasks.filter(t => t.project_id === project_id);
    }
    
    const activeTasks = tasks.filter(t => 
      t.status === 'in_progress' || t.status === 'pending'
    );
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pausedTasks = tasks.filter(t => t.status === 'paused');
    
    const highPriorityTasks = activeTasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
    const overdueTasks = activeTasks.filter(t => {
      if (!t.end_date) return false;
      return new Date(t.end_date) < new Date() && t.status !== 'completed';
    });
    
    const maxTasks = 10;
    const workloadPercentage = Math.min((activeTasks.length / maxTasks) * 100, 100);
    const loadLevel = getLoadLevel(workloadPercentage);
    
    const workload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      summary: {
        totalTasks: tasks.length,
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        pausedTasks: pausedTasks.length,
        highPriorityTasks: highPriorityTasks.length,
        overdueTasks: overdueTasks.length,
        workloadPercentage: Math.round(workloadPercentage),
        loadLevel,
        warningStatus: workloadPercentage > 80,
      },
      tasks: {
        active: activeTasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          progress: t.progress,
          start_date: t.start_date,
          end_date: t.end_date,
          project_id: t.project_id,
        })),
        completed: completedTasks.slice(-5).map(t => ({
          id: t.id,
          title: t.title,
          completed_at: t.updated_at,
          project_id: t.project_id,
        })),
      },
    };
    
    res.json({ success: true, data: workload });
  });

  router.get('/workload-summary', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id } = req.query;
    
    let users = db.users.getAll();
    let projectMembers: any[] = [];
    
    if (project_id) {
      projectMembers = db.project_members.findByProject(project_id as string);
      const memberIds = projectMembers.map(pm => pm.user_id);
      users = users.filter(u => memberIds.includes(u.id));
    }
    
    const memberWorkloads = users.map(user => {
      let tasks = db.tasks.getAll().filter(t => t.assignee_id === user.id);
      if (project_id) {
        tasks = tasks.filter(t => t.project_id === project_id);
      }
      
      const activeTasks = tasks.filter(t => 
        t.status === 'in_progress' || t.status === 'pending'
      );
      const completedTasks = tasks.filter(t => t.status === 'completed');
      
      const maxTasks = 10;
      const workloadPercentage = Math.min((activeTasks.length / maxTasks) * 100, 100);
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        workloadPercentage: Math.round(workloadPercentage),
        loadLevel: getLoadLevel(workloadPercentage),
      };
    });
    
    const totalActiveTasks = memberWorkloads.reduce((sum, m) => sum + m.activeTasks, 0);
    const totalCompletedTasks = memberWorkloads.reduce((sum, m) => sum + m.completedTasks, 0);
    const avgWorkload = memberWorkloads.length > 0 
      ? memberWorkloads.reduce((sum, m) => sum + m.workloadPercentage, 0) / memberWorkloads.length 
      : 0;
    
    const loadDistribution = {
      low: memberWorkloads.filter(m => m.loadLevel === 'low').length,
      normal: memberWorkloads.filter(m => m.loadLevel === 'normal').length,
      high: memberWorkloads.filter(m => m.loadLevel === 'high').length,
      overloaded: memberWorkloads.filter(m => m.loadLevel === 'overloaded').length,
    };
    
    const onlineMembers = memberWorkloads.filter(m => {
      const user = db.users.findById(m.user.id);
      if (!user) return false;
      const hoursSinceActivity = (Date.now() - new Date(user.updated_at).getTime()) / (1000 * 60 * 60);
      return hoursSinceActivity < 1;
    }).length;
    
    const summary = {
      totalMembers: memberWorkloads.length,
      onlineMembers,
      totalActiveTasks,
      totalCompletedTasks,
      averageWorkload: Math.round(avgWorkload),
      loadDistribution,
      members: memberWorkloads,
    };
    
    res.json({ success: true, data: summary });
  });

  router.post('/messages', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id, content, message_type, recipients } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: '消息内容不能为空' });
    }
    
    const id = uuidv4();
    const message = {
      id,
      project_id: project_id || null,
      sender_id: (req as any).user.id,
      content: content.trim(),
      message_type: message_type || 'general',
      recipients: recipients || [],
      created_at: new Date().toISOString(),
    };
    
    db.teamMessages.create(message);
    
    res.status(201).json({ 
      success: true, 
      data: {
        ...message,
        sender_name: (req as any).user.name,
        sender_email: (req as any).user.email,
      }
    });
  });

  router.get('/messages', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id, limit = 50, offset = 0 } = req.query;
    
    let messages = db.teamMessages.getAll();
    
    if (project_id) {
      messages = messages.filter((m: any) => m.project_id === project_id);
    }
    
    messages.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedMessages = messages.slice(startIndex, endIndex);
    
    const messagesWithSender = paginatedMessages.map((m: any) => {
      const sender = db.users.findById(m.sender_id);
      return {
        ...m,
        sender_name: sender?.name || 'Unknown',
        sender_email: sender?.email || '',
        sender_avatar: sender?.avatar || null,
      };
    });
    
    res.json({ 
      success: true, 
      data: messagesWithSender,
      pagination: {
        total: messages.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      }
    });
  });

  return router;
}

function getLoadLevel(percentage: number): 'low' | 'normal' | 'high' | 'overloaded' {
  if (percentage <= 40) return 'low';
  if (percentage <= 70) return 'normal';
  if (percentage <= 80) return 'high';
  return 'overloaded';
}

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'aipm_jwt_secret_key_2024');
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
    process.env.JWT_SECRET || 'aipm_jwt_secret_key_2024',
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

function createStagesRouter() {
  const router = express.Router();
  
  router.get('/project/:projectId', authenticateToken, (req: express.Request, res: express.Response) => {
    const { projectId } = req.params;
    const project = db.projects.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const stages = db.projectStages.findByProject(projectId);
    const stagesWithTasks = stages.map((stage: any) => ({
      ...stage,
      required_tasks: (stage.required_task_ids || []).map((id: string) => {
        const task = db.tasks.findById(id);
        return task ? { ...task, assignee_name: task.assignee_id ? db.users.findById(task.assignee_id)?.name : null } : null;
      }).filter(Boolean),
    }));
    
    res.json({ success: true, data: stagesWithTasks });
  });
  
  router.post('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id, name, required_task_ids, start_date, end_date } = req.body;
    
    if (!project_id || !name) {
      return res.status(400).json({ success: false, message: '项目ID和阶段名称不能为空' });
    }
    
    const project = db.projects.findById(project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const maxOrder = db.projectStages.getMaxOrder(project_id);
    const id = uuidv4();
    
    const stage = db.projectStages.create({
      id,
      project_id,
      name,
      order_index: maxOrder + 1,
      status: 'pending',
      required_task_ids: required_task_ids || [],
      start_date: start_date || null,
      end_date: end_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    res.status(201).json({ success: true, data: stage });
  });
  
  router.put('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { name, required_task_ids, start_date, end_date } = req.body;
    
    const stage = db.projectStages.findById(id);
    if (!stage) {
      return res.status(404).json({ success: false, message: '阶段不存在' });
    }
    
    const updated = db.projectStages.update(id, {
      ...(name && { name }),
      ...(required_task_ids !== undefined && { required_task_ids }),
      ...(start_date !== undefined && { start_date }),
      ...(end_date !== undefined && { end_date }),
      updated_at: new Date().toISOString(),
    });
    
    res.json({ success: true, data: updated });
  });
  
  router.delete('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const stage = db.projectStages.findById(id);
    
    if (!stage) {
      return res.status(404).json({ success: false, message: '阶段不存在' });
    }
    
    db.projectStages.delete(id);
    res.json({ success: true, message: '阶段已删除' });
  });
  
  router.put('/:id/status', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'active', 'completed', 'paused'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效的阶段状态' });
    }
    
    const stage = db.projectStages.findById(id);
    if (!stage) {
      return res.status(404).json({ success: false, message: '阶段不存在' });
    }
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    
    if (status === 'active' && !stage.start_date) {
      updateData.start_date = new Date().toISOString();
    }
    
    if (status === 'completed') {
      updateData.end_date = new Date().toISOString();
    }
    
    const updated = db.projectStages.update(id, updateData);
    res.json({ success: true, data: updated });
  });
  
  router.post('/reorder', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id, stage_ids } = req.body;
    
    if (!project_id || !Array.isArray(stage_ids)) {
      return res.status(400).json({ success: false, message: '项目ID和阶段ID列表不能为空' });
    }
    
    stage_ids.forEach((stageId: string, index: number) => {
      db.projectStages.update(stageId, {
        order_index: index + 1,
        updated_at: new Date().toISOString(),
      });
    });
    
    const stages = db.projectStages.findByProject(project_id);
    res.json({ success: true, data: stages });
  });
  
  return router;
}

function createKnowledgeRouter() {
  const router = express.Router();
  
  router.get('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const { page = 1, pageSize = 10, search, category, tag } = req.query;
    let knowledgeList = db.knowledgeBase.getAll();

    if (search) {
      const searchStr = (search as string).toLowerCase();
      knowledgeList = knowledgeList.filter(k => 
        k.title.toLowerCase().includes(searchStr) || 
        k.content.toLowerCase().includes(searchStr)
      );
    }

    if (category) {
      knowledgeList = knowledgeList.filter(k => k.category === category);
    }

    if (tag) {
      knowledgeList = knowledgeList.filter(k => k.tags && k.tags.includes(tag as string));
    }

    knowledgeList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const total = knowledgeList.length;
    const totalPages = Math.ceil(total / pageSizeNum);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedList = knowledgeList.slice(startIndex, startIndex + pageSizeNum);

    const listWithDetails = paginatedList.map(k => ({
      ...k,
      creator_name: db.users.findById(k.creator_id)?.name,
      project_names: db.knowledgeProjects.findByKnowledge(k.id).map(kp => {
        const project = db.projects.findById(kp.project_id);
        return project ? project.name : null;
      }).filter(Boolean),
    }));

    res.json({
      success: true,
      data: {
        list: listWithDetails,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages,
        },
      },
    });
  });
  
  router.post('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const { title, content, category, tags, project_ids } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }

    const id = uuidv4();
    const knowledge = db.knowledgeBase.create({
      id,
      title,
      content,
      category: category || null,
      tags: tags || [],
      creator_id: (req as any).user.id,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (project_ids && Array.isArray(project_ids)) {
      project_ids.forEach((projectId: string) => {
        if (db.projects.findById(projectId)) {
          db.knowledgeProjects.create({
            id: uuidv4(),
            knowledge_id: id,
            project_id: projectId,
            created_at: new Date().toISOString(),
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...knowledge,
        creator_name: (req as any).user.name,
      },
    });
  });
  
  router.get('/search', authenticateToken, (req: express.Request, res: express.Response) => {
    const { q, category, tag } = req.query;

    if (!q && !category && !tag) {
      return res.status(400).json({ success: false, message: '请提供搜索条件' });
    }

    let results = db.knowledgeBase.getAll();

    if (q) {
      const queryStr = (q as string).toLowerCase();
      results = results.filter(k => 
        k.title.toLowerCase().includes(queryStr) || 
        k.content.toLowerCase().includes(queryStr)
      );
    }

    if (category) {
      results = results.filter(k => k.category === category);
    }

    if (tag) {
      results = results.filter(k => k.tags && k.tags.includes(tag as string));
    }

    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const resultsWithDetails = results.map(k => ({
      ...k,
      creator_name: db.users.findById(k.creator_id)?.name,
    }));

    res.json({ success: true, data: resultsWithDetails });
  });
  
  router.get('/categories', authenticateToken, (req: express.Request, res: express.Response) => {
    const categories = db.knowledgeBase.getCategories();
    res.json({ success: true, data: categories });
  });
  
  router.get('/tags', authenticateToken, (req: express.Request, res: express.Response) => {
    const tags = db.knowledgeBase.getTags();
    res.json({ success: true, data: tags });
  });
  
  router.get('/project/:projectId', authenticateToken, (req: express.Request, res: express.Response) => {
    const { projectId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;

    const project = db.projects.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const relations = db.knowledgeProjects.findByProject(projectId);
    let knowledgeList = relations.map(r => db.knowledgeBase.findById(r.knowledge_id)).filter(Boolean);

    knowledgeList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const total = knowledgeList.length;
    const totalPages = Math.ceil(total / pageSizeNum);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedList = knowledgeList.slice(startIndex, startIndex + pageSizeNum);

    const listWithDetails = paginatedList.map(k => ({
      ...k,
      creator_name: db.users.findById(k.creator_id)?.name,
    }));

    res.json({
      success: true,
      data: {
        list: listWithDetails,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages,
        },
      },
    });
  });
  
  router.get('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const knowledge = db.knowledgeBase.findById(id);

    if (!knowledge) {
      return res.status(404).json({ success: false, message: '文档不存在' });
    }

    db.knowledgeBase.update(id, { view_count: (knowledge.view_count || 0) + 1 });

    const projectRelations = db.knowledgeProjects.findByKnowledge(id);
    const projects = projectRelations.map(r => {
      const project = db.projects.findById(r.project_id);
      return project ? { id: project.id, name: project.name } : null;
    }).filter(Boolean);

    res.json({
      success: true,
      data: {
        ...knowledge,
        view_count: (knowledge.view_count || 0) + 1,
        creator_name: db.users.findById(knowledge.creator_id)?.name,
        projects,
      },
    });
  });
  
  router.put('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;

    const knowledge = db.knowledgeBase.findById(id);
    if (!knowledge) {
      return res.status(404).json({ success: false, message: '文档不存在' });
    }

    if (knowledge.creator_id !== (req as any).user.id && (req as any).user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权修改此文档' });
    }

    const updated = db.knowledgeBase.update(id, {
      ...(title && { title }),
      ...(content && { content }),
      ...(category !== undefined && { category }),
      ...(tags && { tags }),
      updated_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        ...updated,
        creator_name: db.users.findById(updated!.creator_id)?.name,
      },
    });
  });
  
  router.delete('/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const knowledge = db.knowledgeBase.findById(id);

    if (!knowledge) {
      return res.status(404).json({ success: false, message: '文档不存在' });
    }

    if (knowledge.creator_id !== (req as any).user.id && (req as any).user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权删除此文档' });
    }

    db.knowledgeBase.delete(id);
    res.json({ success: true, message: '文档已删除' });
  });
  
  router.post('/:id/link-project', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({ success: false, message: '项目ID不能为空' });
    }

    const knowledge = db.knowledgeBase.findById(id);
    if (!knowledge) {
      return res.status(404).json({ success: false, message: '文档不存在' });
    }

    const project = db.projects.findById(project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const existingRelation = db.knowledgeProjects.findByKnowledge(id).find(r => r.project_id === project_id);
    if (existingRelation) {
      return res.status(400).json({ success: false, message: '文档已关联此项目' });
    }

    const relation = db.knowledgeProjects.create({
      id: uuidv4(),
      knowledge_id: id,
      project_id,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: {
        ...relation,
        project_name: project.name,
      },
    });
  });
  
  router.delete('/:id/link-project/:projectId', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id, projectId } = req.params;

    const deleted = db.knowledgeProjects.delete(id, projectId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '关联关系不存在' });
    }

    res.json({ success: true, message: '已取消关联' });
  });
  
  return router;
}

function createSmartAssignRouter() {
  const router = express.Router();
  
  router.get('/recommend', authenticateToken, (req: express.Request, res: express.Response) => {
    const { task_id, project_id } = req.query;

    if (!task_id && !project_id) {
      return res.status(400).json({ success: false, message: '任务ID或项目ID不能为空' });
    }

    let targetTasks: any[] = [];
    
    if (task_id) {
      const task = db.tasks.findById(task_id as string);
      if (!task) {
        return res.status(404).json({ success: false, message: '任务不存在' });
      }
      targetTasks = [task];
    } else if (project_id) {
      targetTasks = db.tasks.findByProject(project_id as string).filter(t => !t.assignee_id);
    }

    const projectMembers = project_id 
      ? db.project_members.findByProject(project_id as string)
      : (task_id ? db.project_members.findByProject(targetTasks[0].project_id) : []);

    if (projectMembers.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const recommendations = targetTasks.map(task => {
      const memberScores = projectMembers.map(member => {
        const user = db.users.findById(member.user_id);
        if (!user) return null;

        const userSkills = db.userSkills.findByUser(member.user_id);
        const skillMatchScore = calculateSkillMatchScore(task, userSkills);
        const workloadScore = calculateWorkloadScore(member.user_id);
        const performanceScore = calculatePerformanceScore(member.user_id);
        const totalScore = skillMatchScore * 0.4 + workloadScore * 0.35 + performanceScore * 0.25;

        return {
          user_id: member.user_id,
          user_name: user.name,
          user_email: user.email,
          skill_match_score: skillMatchScore,
          workload_score: workloadScore,
          performance_score: performanceScore,
          total_score: totalScore,
          current_tasks: db.tasks.findByAssignee(member.user_id).filter(t => t.status !== 'completed').length,
        };
      }).filter(Boolean).sort((a: any, b: any) => b.total_score - a.total_score);

      return {
        task_id: task.id,
        task_title: task.title,
        recommendations: memberScores.slice(0, 5),
      };
    });

    res.json({ success: true, data: recommendations });
  });
  
  router.get('/workload-balance', authenticateToken, (req: express.Request, res: express.Response) => {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ success: false, message: '项目ID不能为空' });
    }

    const projectMembers = db.project_members.findByProject(project_id as string);
    
    if (projectMembers.length === 0) {
      return res.json({ success: true, data: { is_balanced: true, suggestions: [] } });
    }

    const workloadData = projectMembers.map(member => {
      const user = db.users.findById(member.user_id);
      const userTasks = db.tasks.findByAssignee(member.user_id).filter(
        t => t.project_id === project_id && t.status !== 'completed'
      );

      return {
        user_id: member.user_id,
        user_name: user?.name || 'Unknown',
        active_tasks: userTasks.length,
        task_ids: userTasks.map(t => t.id),
      };
    });

    const taskCounts = workloadData.map(w => w.active_tasks);
    const avgWorkload = taskCounts.reduce((a, b) => a + b, 0) / taskCounts.length;
    const maxWorkload = Math.max(...taskCounts);
    const minWorkload = Math.min(...taskCounts);

    const isBalanced = maxWorkload - minWorkload <= 2;

    res.json({
      success: true,
      data: {
        is_balanced: isBalanced,
        average_workload: avgWorkload.toFixed(1),
        max_workload: maxWorkload,
        min_workload: minWorkload,
        workload_distribution: workloadData,
        suggestions: [],
      },
    });
  });
  
  router.post('/skills', authenticateToken, (req: express.Request, res: express.Response) => {
    const { user_id, skill_name, proficiency_level } = req.body;

    if (!user_id || !skill_name) {
      return res.status(400).json({ success: false, message: '用户ID和技能名称不能为空' });
    }

    const user = db.users.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const existingSkills = db.userSkills.findByUser(user_id);
    const existingSkill = existingSkills.find(
      s => s.skill_name.toLowerCase() === skill_name.toLowerCase()
    );

    if (existingSkill) {
      return res.status(400).json({ success: false, message: '该用户已拥有此技能' });
    }

    const id = uuidv4();
    const skill = db.userSkills.create({
      id,
      user_id,
      skill_name,
      proficiency_level: proficiency_level || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: skill });
  });
  
  router.get('/skills/:userId', authenticateToken, (req: express.Request, res: express.Response) => {
    const { userId } = req.params;
    
    const user = db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const skills = db.userSkills.findByUser(userId);
    
    res.json({ success: true, data: skills });
  });
  
  router.put('/skills/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { skill_name, proficiency_level } = req.body;

    const skill = db.userSkills.findById(id);
    if (!skill) {
      return res.status(404).json({ success: false, message: '技能不存在' });
    }

    const updated = db.userSkills.update(id, {
      ...(skill_name && { skill_name }),
      ...(proficiency_level !== undefined && { proficiency_level }),
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, data: updated });
  });
  
  router.delete('/skills/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;

    const skill = db.userSkills.findById(id);
    if (!skill) {
      return res.status(404).json({ success: false, message: '技能不存在' });
    }

    db.userSkills.delete(id);
    res.json({ success: true, message: '技能已删除' });
  });
  
  return router;
}

function calculateSkillMatchScore(task: any, userSkills: any[]): number {
  if (!userSkills || userSkills.length === 0) return 0;
  return 50;
}

function calculateWorkloadScore(userId: string): number {
  const userTasks = db.tasks.findByAssignee(userId);
  const activeTasks = userTasks.filter(t => 
    t.status === 'pending' || t.status === 'in_progress'
  );

  const taskCount = activeTasks.length;
  
  if (taskCount === 0) return 100;
  if (taskCount === 1) return 90;
  if (taskCount === 2) return 75;
  if (taskCount === 3) return 60;
  if (taskCount === 4) return 40;
  
  return Math.max(10, 40 - (taskCount - 4) * 10);
}

function calculatePerformanceScore(userId: string): number {
  const userTasks = db.tasks.findByAssignee(userId);
  
  if (userTasks.length === 0) return 70;

  const completedTasks = userTasks.filter(t => t.status === 'completed');
  
  if (completedTasks.length === 0) return 50;

  let onTimeCount = 0;
  completedTasks.forEach(task => {
    if (task.end_date && task.updated_at) {
      const endDate = new Date(task.end_date);
      const completedDate = new Date(task.updated_at);
      if (completedDate <= endDate) {
        onTimeCount++;
      }
    }
  });

  const onTimeRate = onTimeCount / completedTasks.length;
  
  return Math.round(onTimeRate * 100);
}

function createPermissionsRouter() {
  const router = express.Router();
  
  router.get('/', authenticateToken, (req: express.Request, res: express.Response) => {
    const permissions = db.permissions.getAll();
    res.json({ success: true, data: permissions });
  });
  
  router.get('/roles', authenticateToken, (req: express.Request, res: express.Response) => {
    const roles = [
      { id: 'admin', name: '管理员', permissions: [] },
      { id: 'manager', name: '项目经理', permissions: [] },
      { id: 'leader', name: '组长', permissions: [] },
      { id: 'member', name: '成员', permissions: [] },
    ];

    res.json({ success: true, data: roles });
  });
  
  router.put('/roles/:roleId', authenticateToken, requireAdmin, (req: express.Request, res: express.Response) => {
    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!['admin', 'manager', 'leader', 'member'].includes(roleId)) {
      return res.status(400).json({ success: false, message: '无效的角色' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: '权限列表格式错误' });
    }

    res.json({ success: true, message: '角色权限已更新' });
  });
  
  router.get('/users/:userId', authenticateToken, (req: express.Request, res: express.Response) => {
    const { userId } = req.params;

    if ((req as any).user.role !== 'admin' && (req as any).user.id !== userId) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const user = db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const userPermissions = db.userPermissions.findByUser(userId);

    res.json({ 
      success: true, 
      data: {
        user_id: userId,
        role: user.role,
        permissions: userPermissions.map(up => {
          const perm = db.permissions.findById(up.permission_id);
          return {
            code: perm?.code,
            name: perm?.name,
            resource_type: perm?.resource_type,
            operation: perm?.operation,
            is_custom: true,
            resource_id: up.resource_id,
          };
        }),
      }
    });
  });
  
  router.put('/users/:userId', authenticateToken, requireAdmin, (req: express.Request, res: express.Response) => {
    const { userId } = req.params;
    const { permissions } = req.body;

    const user = db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: '权限列表格式错误' });
    }

    res.json({ success: true, message: '用户权限已更新' });
  });
  
  router.get('/check', authenticateToken, (req: express.Request, res: express.Response) => {
    const { permission, resource_id } = req.query;

    if (!permission) {
      return res.status(400).json({ success: false, message: '缺少权限代码' });
    }

    const hasPermission = (req as any).user.role === 'admin';

    res.json({ 
      success: true, 
      data: { 
        has_permission: hasPermission,
        permission,
        resource_id: resource_id || null,
      }
    });
  });
  
  router.post('/grant', authenticateToken, requireAdmin, (req: express.Request, res: express.Response) => {
    const { user_id, permission_code, resource_id } = req.body;

    if (!user_id || !permission_code) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const user = db.users.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const perm = db.permissions.findByCode(permission_code);
    if (!perm) {
      return res.status(404).json({ success: false, message: '权限不存在' });
    }

    const userPerm = db.userPermissions.create({
      id: uuidv4(),
      user_id,
      permission_id: perm.id,
      resource_id: resource_id || null,
      granted: true,
      granted_by: (req as any).user.id,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: userPerm });
  });
  
  router.post('/revoke', authenticateToken, requireAdmin, (req: express.Request, res: express.Response) => {
    const { user_id, permission_code, resource_id } = req.body;

    if (!user_id || !permission_code) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const perm = db.permissions.findByCode(permission_code);
    if (!perm) {
      return res.status(404).json({ success: false, message: '权限不存在' });
    }

    res.json({ success: true, message: '权限已撤销' });
  });
  
  return router;
}
