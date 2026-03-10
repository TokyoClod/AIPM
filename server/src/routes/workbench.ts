import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { db } from '../models/database.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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
  } catch (error) {
    console.error('Get workbench error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/todos', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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
        assignee_name: req.user!.name,
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
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/schedule', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/stats', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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

    const tasksWithStartEnd = userTasks.filter((t: any) => t.start_date && t.end_date && t.status === 'completed');
    let totalDuration = 0;
    let taskCount = 0;

    tasksWithStartEnd.forEach((t: any) => {
      const startDate = new Date(t.start_date);
      const endDate = new Date(t.updated_at);
      const duration = endDate.getTime() - startDate.getTime();
      if (duration > 0) {
        totalDuration += duration;
        taskCount++;
      }
    });

    const avgResponseTime = taskCount > 0 
      ? Math.round(totalDuration / taskCount / (1000 * 60 * 60 * 24))
      : 0;

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekEnd);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const lastWeekCompleted = userTasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.updated_at) return false;
      const updatedDate = new Date(t.updated_at);
      return updatedDate >= lastWeekStart && updatedDate <= lastWeekEnd;
    });

    const weekTrend = lastWeekCompleted.length > 0
      ? Math.round(((weekCompleted.length - lastWeekCompleted.length) / lastWeekCompleted.length) * 100)
      : weekCompleted.length > 0 ? 100 : 0;

    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const lastMonthCompleted = userTasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.updated_at) return false;
      const updatedDate = new Date(t.updated_at);
      return updatedDate >= lastMonthStart && updatedDate <= lastMonthEnd;
    });

    const monthTrend = lastMonthCompleted.length > 0
      ? Math.round(((monthCompleted.length - lastMonthCompleted.length) / lastMonthCompleted.length) * 100)
      : monthCompleted.length > 0 ? 100 : 0;

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
          trend: weekTrend,
        },
        monthly: {
          completed: monthCompleted.length,
          trend: monthTrend,
        },
        onTimeRate,
        avgResponseTime,
        taskDistribution: {
          completed: userTasks.filter((t: any) => t.status === 'completed').length,
          inProgress: inProgressTasks.length,
          pending: pendingStatusTasks.length,
        },
        priorityDistribution,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/todos/:id/complete', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

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
  } catch (error) {
    console.error('Complete todo error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
