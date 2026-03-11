import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware, ROLES } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('project:view'), (req: AuthRequest, res: Response) => {
  try {
    let projects = db.projects.getAll();
    
    if (req.user?.role !== ROLES.ADMIN) {
      const allMembers = db.project_members.getAll();
      const userProjectIds = allMembers.filter(pm => pm.user_id === req.user?.id).map(pm => pm.project_id);
      projects = projects.filter(p => userProjectIds.includes(p.id));
    }

    const projectsWithOwner = projects.map(p => ({
      ...p,
      owner_name: db.users.findById(p.owner_id)?.name,
      owner_email: db.users.findById(p.owner_id)?.email,
    }));

    res.json({ success: true, data: projectsWithOwner });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', checkPermission('project:view'), (req: AuthRequest, res: Response) => {
  try {
    const { name, description, start_date, end_date } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '项目名称不能为空' });
    }

    const id = uuidv4();
    const ownerId = req.user!.id;

    const project = db.projects.create({
      id,
      name,
      description: description || null,
      start_date: start_date || null,
      end_date: end_date || null,
      status: 'active',
      owner_id: ownerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.project_members.create({
      id: uuidv4(),
      project_id: id,
      user_id: ownerId,
      role: 'owner',
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: { ...project, owner_name: req.user!.name } });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = db.projects.findById(id);

    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const members = db.project_members.findByProject(id).map(pm => ({
      ...pm,
      name: db.users.findById(pm.user_id)?.name,
      email: db.users.findById(pm.user_id)?.email,
      avatar: db.users.findById(pm.user_id)?.avatar,
    }));

    res.json({ 
      success: true, 
      data: { 
        ...project, 
        owner_name: db.users.findById(project.owner_id)?.name,
        owner_email: db.users.findById(project.owner_id)?.email,
        members 
      } 
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id', checkPermission('project:edit'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date, status } = req.body;

    const project = db.projects.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const updated = db.projects.update(id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(start_date !== undefined && { start_date }),
      ...(end_date !== undefined && { end_date }),
      ...(status && { status }),
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id', checkPermission('project:delete'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = db.projects.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    db.projects.delete(id);
    res.json({ success: true, message: '项目已删除' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/members', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;

    const project = db.projects.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const user = db.users.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const existingMember = db.project_members.findByProject(id).find(pm => pm.user_id === user_id);
    if (existingMember) {
      return res.status(400).json({ success: false, message: '用户已是项目成员' });
    }

    const member = db.project_members.create({
      id: uuidv4(),
      project_id: id,
      user_id,
      role: role || 'member',
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: { ...member, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id/members/:userId', (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params;
    db.project_members.delete(id, userId);
    res.json({ success: true, message: '成员已移除' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/dashboard', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = db.projects.findById(id);

    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const tasks = db.tasks.findByProject(id);
    const risks = db.risks.findByProject(id);
    
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      overdueTasks: tasks.filter(t => t.end_date && new Date(t.end_date) < new Date() && t.status !== 'completed').length,
      totalRisks: risks.length,
      criticalRisks: risks.filter(r => r.level === 'critical' || r.level === 'high').length,
      completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
    };

    const statusDistribution = [
      { status: 'pending', count: tasks.filter(t => t.status === 'pending').length },
      { status: 'in_progress', count: tasks.filter(t => t.status === 'in_progress').length },
      { status: 'completed', count: tasks.filter(t => t.status === 'completed').length },
    ];

    const priorityDistribution = [
      { priority: 'low', count: tasks.filter(t => t.priority === 'low').length },
      { priority: 'medium', count: tasks.filter(t => t.priority === 'medium').length },
      { priority: 'high', count: tasks.filter(t => t.priority === 'high').length },
      { priority: 'urgent', count: tasks.filter(t => t.priority === 'urgent').length },
    ];

    const upcomingTasks = tasks
      .filter(t => t.status !== 'completed' && t.end_date)
      .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
      .slice(0, 10)
      .map(t => ({ ...t, assignee_name: t.assignee_id ? db.users.findById(t.assignee_id)?.name : null }));

    const members = db.project_members.findByProject(id).map(pm => ({
      id: pm.user_id,
      name: db.users.findById(pm.user_id)?.name,
      email: db.users.findById(pm.user_id)?.email,
      avatar: db.users.findById(pm.user_id)?.avatar,
      taskCount: tasks.filter(t => t.assignee_id === pm.user_id).length,
      completedCount: tasks.filter(t => t.assignee_id === pm.user_id && t.status === 'completed').length,
    }));

    res.json({
      success: true,
      data: {
        project: { ...project, owner_name: db.users.findById(project.owner_id)?.name },
        stats,
        taskDistribution: statusDistribution,
        priorityDistribution,
        riskItems: risks.slice(0, 10),
        upcomingTasks,
        memberWorkload: members,
      },
    });
  } catch (error) {
    console.error('Get project dashboard error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
