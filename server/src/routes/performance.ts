import { Router, Response } from 'express';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware, ROLES } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/team', (req: AuthRequest, res: Response) => {
  try {
    const { project_id, start_date, end_date } = req.query;

    let tasks = db.tasks.getAll();
    let risks = db.risks.getAll();

    if (project_id) {
      tasks = tasks.filter(t => t.project_id === project_id);
      risks = risks.filter(r => r.project_id === project_id);
    }

    if (start_date && end_date) {
      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);
      tasks = tasks.filter(t => {
        const taskDate = new Date(t.created_at);
        return taskDate >= startDate && taskDate <= endDate;
      });
    }

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    const users = db.users.getAll();
    const activeUsers = users.filter(u => u.role !== 'admin');
    const avgTasksPerUser = activeUsers.length > 0 ? tasks.length / activeUsers.length : 0;

    const onTimeTasks = completedTasks.filter(t => {
      if (!t.end_date) return true;
      return new Date(t.updated_at) <= new Date(t.end_date);
    });
    const onTimeDeliveryRate = completedTasks.length > 0 ? (onTimeTasks.length / completedTasks.length) * 100 : 0;

    const tasksWithEndDate = tasks.filter(t => t.end_date);
    const avgResponseTime = tasksWithEndDate.length > 0
      ? tasksWithEndDate.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const deadline = new Date(t.end_date!);
          const diffDays = (deadline.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          return sum + diffDays;
        }, 0) / tasksWithEndDate.length
      : 0;

    const resolvedRisks = risks.filter(r => r.status === 'resolved');
    const riskResolutionRate = risks.length > 0 ? (resolvedRisks.length / risks.length) * 100 : 0;

    const teamPerformance = {
      completionRate: Math.round(completionRate * 100) / 100,
      avgTasksPerUser: Math.round(avgTasksPerUser * 100) / 100,
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      riskResolutionRate: Math.round(riskResolutionRate * 100) / 100,
      summary: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        totalRisks: risks.length,
        resolvedRisks: resolvedRisks.length,
        criticalRisks: risks.filter(r => r.level === 'critical' || r.level === 'high').length,
      },
    };

    res.json({ success: true, data: teamPerformance });
  } catch (error) {
    console.error('Get team performance error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/team/trends', (req: AuthRequest, res: Response) => {
  try {
    const { project_id, period = 'week', start_date, end_date } = req.query;

    let tasks = db.tasks.getAll();
    if (project_id) {
      tasks = tasks.filter(t => t.project_id === project_id);
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (start_date && end_date) {
      startDate = new Date(start_date as string);
      endDate = new Date(end_date as string);
    } else {
      if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = now;
      } else {
        startDate = new Date(now.getTime() - 7 * 7 * 24 * 60 * 60 * 1000);
        endDate = now;
      }
    }

    const trends: any[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      let periodEnd: Date;
      if (period === 'month') {
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      } else {
        periodEnd = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      const periodTasks = tasks.filter(t => {
        const taskDate = new Date(t.created_at);
        return taskDate >= current && taskDate <= periodEnd;
      });

      const completedTasks = periodTasks.filter(t => t.status === 'completed');
      const completionRate = periodTasks.length > 0 ? (completedTasks.length / periodTasks.length) * 100 : 0;

      trends.push({
        period: period === 'month'
          ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
          : `${current.toISOString().split('T')[0]}`,
        totalTasks: periodTasks.length,
        completedTasks: completedTasks.length,
        completionRate: Math.round(completionRate * 100) / 100,
        inProgressTasks: periodTasks.filter(t => t.status === 'in_progress').length,
      });

      if (period === 'month') {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setDate(current.getDate() + 7);
      }
    }

    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Get team trends error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/members', (req: AuthRequest, res: Response) => {
  try {
    const { project_id, start_date, end_date } = req.query;

    let users = db.users.getAll().filter(u => u.role !== 'admin');

    if (project_id) {
      const projectMembers = db.project_members.findByProject(project_id as string);
      const memberIds = projectMembers.map(pm => pm.user_id);
      users = users.filter(u => memberIds.includes(u.id));
    }

    const memberPerformance = users.map(user => {
      let tasks = db.tasks.getAll().filter(t => t.assignee_id === user.id);

      if (project_id) {
        tasks = tasks.filter(t => t.project_id === project_id);
      }

      if (start_date && end_date) {
        const startDate = new Date(start_date as string);
        const endDate = new Date(end_date as string);
        tasks = tasks.filter(t => {
          const taskDate = new Date(t.created_at);
          return taskDate >= startDate && taskDate <= endDate;
        });
      }

      const completedTasks = tasks.filter(t => t.status === 'completed');
      const onTimeTasks = completedTasks.filter(t => {
        if (!t.end_date) return true;
        return new Date(t.updated_at) <= new Date(t.end_date);
      });

      const tasksWithEndDate = tasks.filter(t => t.end_date);
      const avgResponseTime = tasksWithEndDate.length > 0
        ? tasksWithEndDate.reduce((sum, t) => {
            const created = new Date(t.created_at);
            const deadline = new Date(t.end_date!);
            const diffDays = (deadline.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + diffDays;
          }, 0) / tasksWithEndDate.length
        : 0;

      const userRisks = db.risks.getAll().filter(r => r.created_by === user.id);
      const resolvedRisks = userRisks.filter(r => r.status === 'resolved');

      const collaborationScore = calculateCollaborationScore(user.id);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        taskCompletionCount: completedTasks.length,
        totalTasks: tasks.length,
        onTimeCompletionRate: completedTasks.length > 0
          ? Math.round((onTimeTasks.length / completedTasks.length) * 10000) / 100
          : 0,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        riskHandlingCount: userRisks.length,
        riskResolutionRate: userRisks.length > 0
          ? Math.round((resolvedRisks.length / userRisks.length) * 10000) / 100
          : 0,
        collaborationScore,
        performanceScore: calculatePerformanceScore({
          completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
          onTimeRate: completedTasks.length > 0 ? (onTimeTasks.length / completedTasks.length) * 100 : 0,
          avgResponseTime,
          collaborationScore,
        }),
      };
    });

    memberPerformance.sort((a, b) => b.performanceScore - a.performanceScore);

    res.json({ success: true, data: memberPerformance });
  } catch (error) {
    console.error('Get members performance error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/members/:userId', (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { project_id, start_date, end_date } = req.query;

    const user = db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    let tasks = db.tasks.getAll().filter(t => t.assignee_id === userId);

    if (project_id) {
      tasks = tasks.filter(t => t.project_id === project_id);
    }

    if (start_date && end_date) {
      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);
      tasks = tasks.filter(t => {
        const taskDate = new Date(t.created_at);
        return taskDate >= startDate && taskDate <= endDate;
      });
    }

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const onTimeTasks = completedTasks.filter(t => {
      if (!t.end_date) return true;
      return new Date(t.updated_at) <= new Date(t.end_date);
    });

    const overdueTasks = tasks.filter(t => {
      if (!t.end_date || t.status === 'completed') return false;
      return new Date(t.end_date) < new Date();
    });

    const tasksWithEndDate = tasks.filter(t => t.end_date);
    const avgResponseTime = tasksWithEndDate.length > 0
      ? tasksWithEndDate.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const deadline = new Date(t.end_date!);
          const diffDays = (deadline.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          return sum + diffDays;
        }, 0) / tasksWithEndDate.length
      : 0;

    const userRisks = db.risks.getAll().filter(r => r.created_by === userId);
    const resolvedRisks = userRisks.filter(r => r.status === 'resolved');

    const collaborationScore = calculateCollaborationScore(userId);

    const priorityDistribution = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
    };

    const statusDistribution = {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: completedTasks.length,
      paused: tasks.filter(t => t.status === 'paused').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    };

    const recentCompletedTasks = completedTasks
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        completed_at: t.updated_at,
        project_id: t.project_id,
        project_name: db.projects.findById(t.project_id)?.name,
      }));

    const activeTasks = tasks
      .filter(t => t.status === 'in_progress' || t.status === 'pending')
      .sort((a, b) => {
        if (!a.end_date) return 1;
        if (!b.end_date) return -1;
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      })
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        progress: t.progress,
        end_date: t.end_date,
        project_id: t.project_id,
        project_name: db.projects.findById(t.project_id)?.name,
      }));

    const memberDetail = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      summary: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        onTimeTasks: onTimeTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate: tasks.length > 0
          ? Math.round((completedTasks.length / tasks.length) * 10000) / 100
          : 0,
        onTimeCompletionRate: completedTasks.length > 0
          ? Math.round((onTimeTasks.length / completedTasks.length) * 10000) / 100
          : 0,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        riskHandlingCount: userRisks.length,
        riskResolutionRate: userRisks.length > 0
          ? Math.round((resolvedRisks.length / userRisks.length) * 10000) / 100
          : 0,
        collaborationScore,
        performanceScore: calculatePerformanceScore({
          completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
          onTimeRate: completedTasks.length > 0 ? (onTimeTasks.length / completedTasks.length) * 100 : 0,
          avgResponseTime,
          collaborationScore,
        }),
      },
      distributions: {
        priority: priorityDistribution,
        status: statusDistribution,
      },
      recentCompletedTasks,
      activeTasks,
    };

    res.json({ success: true, data: memberDetail });
  } catch (error) {
    console.error('Get member performance detail error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/compare', (req: AuthRequest, res: Response) => {
  try {
    const { project_id, user_ids, start_date, end_date } = req.query;

    if (!user_ids) {
      return res.status(400).json({ success: false, message: '请提供要对比的用户ID' });
    }

    const userIdArray = (user_ids as string).split(',');
    const users = userIdArray.map(id => db.users.findById(id)).filter(u => u);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '未找到有效用户' });
    }

    const comparisonData = users.map(user => {
      let tasks = db.tasks.getAll().filter(t => t.assignee_id === user!.id);

      if (project_id) {
        tasks = tasks.filter(t => t.project_id === project_id);
      }

      if (start_date && end_date) {
        const startDate = new Date(start_date as string);
        const endDate = new Date(end_date as string);
        tasks = tasks.filter(t => {
          const taskDate = new Date(t.created_at);
          return taskDate >= startDate && taskDate <= endDate;
        });
      }

      const completedTasks = tasks.filter(t => t.status === 'completed');
      const onTimeTasks = completedTasks.filter(t => {
        if (!t.end_date) return true;
        return new Date(t.updated_at) <= new Date(t.end_date);
      });

      const tasksWithEndDate = tasks.filter(t => t.end_date);
      const avgResponseTime = tasksWithEndDate.length > 0
        ? tasksWithEndDate.reduce((sum, t) => {
            const created = new Date(t.created_at);
            const deadline = new Date(t.end_date!);
            const diffDays = (deadline.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + diffDays;
          }, 0) / tasksWithEndDate.length
        : 0;

      const collaborationScore = calculateCollaborationScore(user!.id);

      return {
        user: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          avatar: user!.avatar,
        },
        metrics: {
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          completionRate: tasks.length > 0
            ? Math.round((completedTasks.length / tasks.length) * 10000) / 100
            : 0,
          onTimeCompletionRate: completedTasks.length > 0
            ? Math.round((onTimeTasks.length / completedTasks.length) * 10000) / 100
            : 0,
          avgResponseTime: Math.round(avgResponseTime * 100) / 100,
          collaborationScore,
        },
      };
    });

    const avgMetrics = {
      avgCompletionRate: comparisonData.reduce((sum, d) => sum + d.metrics.completionRate, 0) / comparisonData.length,
      avgOnTimeRate: comparisonData.reduce((sum, d) => sum + d.metrics.onTimeCompletionRate, 0) / comparisonData.length,
      avgResponseTime: comparisonData.reduce((sum, d) => sum + d.metrics.avgResponseTime, 0) / comparisonData.length,
      avgCollaborationScore: comparisonData.reduce((sum, d) => sum + d.metrics.collaborationScore, 0) / comparisonData.length,
    };

    res.json({
      success: true,
      data: {
        comparison: comparisonData,
        average: {
          completionRate: Math.round(avgMetrics.avgCompletionRate * 100) / 100,
          onTimeRate: Math.round(avgMetrics.avgOnTimeRate * 100) / 100,
          responseTime: Math.round(avgMetrics.avgResponseTime * 100) / 100,
          collaborationScore: Math.round(avgMetrics.avgCollaborationScore * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error('Get performance comparison error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/export', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.MANAGER)) {
      return res.status(403).json({ success: false, message: '仅管理员和项目经理可导出报告' });
    }

    const { project_id, start_date, end_date, format = 'json' } = req.query;

    let tasks = db.tasks.getAll();
    let risks = db.risks.getAll();
    let users = db.users.getAll().filter(u => u.role !== 'admin');

    if (project_id) {
      tasks = tasks.filter(t => t.project_id === project_id);
      risks = risks.filter(r => r.project_id === project_id);
      const projectMembers = db.project_members.findByProject(project_id as string);
      const memberIds = projectMembers.map(pm => pm.user_id);
      users = users.filter(u => memberIds.includes(u.id));
    }

    if (start_date && end_date) {
      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);
      tasks = tasks.filter(t => {
        const taskDate = new Date(t.created_at);
        return taskDate >= startDate && taskDate <= endDate;
      });
    }

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const onTimeTasks = completedTasks.filter(t => {
      if (!t.end_date) return true;
      return new Date(t.updated_at) <= new Date(t.end_date);
    });

    const teamPerformance = {
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 10000) / 100 : 0,
      onTimeDeliveryRate: completedTasks.length > 0 ? Math.round((onTimeTasks.length / completedTasks.length) * 10000) / 100 : 0,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      totalRisks: risks.length,
      resolvedRisks: risks.filter(r => r.status === 'resolved').length,
    };

    const memberPerformance = users.map(user => {
      const userTasks = tasks.filter(t => t.assignee_id === user.id);
      const userCompletedTasks = userTasks.filter(t => t.status === 'completed');
      const userOnTimeTasks = userCompletedTasks.filter(t => {
        if (!t.end_date) return true;
        return new Date(t.updated_at) <= new Date(t.end_date);
      });

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        totalTasks: userTasks.length,
        completedTasks: userCompletedTasks.length,
        completionRate: userTasks.length > 0 ? Math.round((userCompletedTasks.length / userTasks.length) * 10000) / 100 : 0,
        onTimeRate: userCompletedTasks.length > 0 ? Math.round((userOnTimeTasks.length / userCompletedTasks.length) * 10000) / 100 : 0,
      };
    });

    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name,
      period: {
        start: start_date || 'all',
        end: end_date || 'all',
      },
      project: project_id ? db.projects.findById(project_id as string)?.name : 'all',
      teamPerformance,
      memberPerformance,
    };

    if (format === 'csv') {
      const csvLines: string[] = [];
      csvLines.push('团队成员绩效报告');
      csvLines.push(`生成时间,${report.generatedAt}`);
      csvLines.push(`生成人,${report.generatedBy}`);
      csvLines.push('');
      csvLines.push('团队整体绩效');
      csvLines.push(`完成率,${teamPerformance.completionRate}%`);
      csvLines.push(`按时交付率,${teamPerformance.onTimeDeliveryRate}%`);
      csvLines.push(`总任务数,${teamPerformance.totalTasks}`);
      csvLines.push(`已完成任务,${teamPerformance.completedTasks}`);
      csvLines.push('');
      csvLines.push('成员绩效详情');
      csvLines.push('姓名,邮箱,角色,总任务数,已完成,完成率,按时完成率');

      memberPerformance.forEach(m => {
        csvLines.push(`${m.userName},${m.userEmail},${m.userRole},${m.totalTasks},${m.completedTasks},${m.completionRate}%,${m.onTimeRate}%`);
      });

      const csvContent = csvLines.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="performance_report_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\ufeff' + csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="performance_report_${new Date().toISOString().split('T')[0]}.json"`);
      res.json({ success: true, data: report });
    }
  } catch (error) {
    console.error('Export performance report error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

function calculateCollaborationScore(userId: string): number {
  const userTasks = db.tasks.getAll().filter(t => t.assignee_id === userId);
  const userProjects = db.project_members.getAll().filter(pm => pm.user_id === userId);

  const projectCount = userProjects.length;
  const taskCount = userTasks.length;

  const teamMessages = db.teamMessages.getAll().filter(m => m.sender_id === userId);
  const messageCount = teamMessages.length;

  let score = 0;
  score += Math.min(projectCount * 10, 30);
  score += Math.min(taskCount * 2, 40);
  score += Math.min(messageCount * 5, 30);

  return Math.min(score, 100);
}

function calculatePerformanceScore(metrics: {
  completionRate: number;
  onTimeRate: number;
  avgResponseTime: number;
  collaborationScore: number;
}): number {
  const completionWeight = 0.3;
  const onTimeWeight = 0.3;
  const responseTimeWeight = 0.2;
  const collaborationWeight = 0.2;

  const responseTimeScore = Math.max(0, 100 - metrics.avgResponseTime * 5);

  const score =
    metrics.completionRate * completionWeight +
    metrics.onTimeRate * onTimeWeight +
    responseTimeScore * responseTimeWeight +
    metrics.collaborationScore * collaborationWeight;

  return Math.round(score * 100) / 100;
}

export default router;
