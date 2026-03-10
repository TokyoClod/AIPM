import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/status', (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Get team status error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:userId/workload', (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Get user workload error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/workload-summary', (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Get workload summary error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/messages', (req: AuthRequest, res: Response) => {
  try {
    const { project_id, content, message_type, recipients } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: '消息内容不能为空' });
    }
    
    const id = uuidv4();
    const message = {
      id,
      project_id: project_id || null,
      sender_id: req.user!.id,
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
        sender_name: req.user!.name,
        sender_email: req.user!.email,
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/messages', (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

function getLoadLevel(percentage: number): 'low' | 'normal' | 'high' | 'overloaded' {
  if (percentage <= 40) return 'low';
  if (percentage <= 70) return 'normal';
  if (percentage <= 80) return 'high';
  return 'overloaded';
}

export default router;
