import { Router, Response } from 'express';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware, ROLES } from '../middleware/auth.js';
import { reportService } from '../services/report.service.js';

const router = Router();

router.use(authMiddleware);

// 获取仪表盘数据
router.get('/dashboard', (req: AuthRequest, res: Response) => {
  try {
    const projects = db.projects.getAll();
    const allTasks = projects.flatMap(p => db.tasks.findByProject(p.id));
    
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      inProgressTasks: allTasks.filter(t => t.status === 'in_progress').length,
      pendingTasks: allTasks.filter(t => t.status === 'pending').length,
      completionRate: allTasks.length > 0 ? Math.round((allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100) : 0,
      criticalRisks: db.risks.getAll().filter(r => r.level === 'critical' || r.level === 'high').length,
    };

    const upcomingTasks = allTasks
      .filter(t => t.status !== 'completed' && t.end_date)
      .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
      .slice(0, 10)
      .map(t => ({
        ...t,
        project_name: db.projects.findById(t.project_id)?.name,
        assignee_name: t.assignee_id ? db.users.findById(t.assignee_id)?.name : null,
      }));

    res.json({ success: true, data: { ...stats, upcomingTasks, risks: db.risks.getAll().slice(0, 10) } });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 生成日报（保留原有功能）
router.post('/daily-report', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: '仅管理员可生成报告' });
    }

    const { project_id } = req.body;
    const projects = project_id ? [db.projects.findById(project_id)] : db.projects.getAll().filter(p => p.status === 'active');

    const reportData = {
      date: new Date().toISOString().split('T')[0],
      projects: [] as any[],
    };

    for (const project of projects) {
      if (!project) continue;
      const tasks = db.tasks.findByProject(project.id);
      const risks = db.risks.findByProject(project.id);

      reportData.projects.push({
        id: project.id,
        name: project.name,
        status: project.status,
        totalTasks: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
        criticalRisks: risks.filter(r => r.level === 'critical' || r.level === 'high').length,
        endDate: project.end_date,
      });
    }

    res.json({ success: true, message: '报告已生成', data: reportData });
  } catch (error) {
    console.error('Generate daily report error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 生成项目报告（新增）
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    const { project_id, type, period_start, period_end, format } = req.body;

    if (!project_id || !type || !period_start || !period_end) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数：project_id, type, period_start, period_end' 
      });
    }

    if (!['weekly', 'monthly', 'custom'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: '报告类型必须是 weekly, monthly 或 custom' 
      });
    }

    // 检查用户是否有权限访问该项目
    const project = db.projects.findById(project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    // 检查权限：管理员、项目管理者和项目成员可以生成报告
    const isOwner = project.owner_id === req.user!.id;
    const isMember = db.project_members.findByProject(project_id).some(m => m.user_id === req.user!.id);
    const isAdmin = req.user!.role === ROLES.ADMIN;

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权限生成该项目报告' });
    }

    const report = await reportService.generateReport({
      projectId: project_id,
      type,
      periodStart: period_start,
      periodEnd: period_end,
      generatedBy: req.user.id,
      format: format || 'json',
    });

    res.json({ 
      success: true, 
      message: '报告生成成功', 
      data: report 
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : '服务器错误' 
    });
  }
});

// 获取历史报告列表（新增）
router.get('/history', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    const { project_id, type } = req.query;

    let reports = reportService.getReportHistory(
      project_id as string,
      type as string
    );

    // 过滤用户有权限查看的报告
    if (req.user.role !== ROLES.ADMIN) {
      const userProjectIds = new Set([
        ...db.projects.getAll()
          .filter(p => p.owner_id === req.user!.id)
          .map(p => p.id),
        ...db.project_members.getAll()
          .filter(m => m.user_id === req.user!.id)
          .map(m => m.project_id),
      ]);

      reports = reports.filter(r => userProjectIds.has(r.project_id));
    }

    // 添加项目名称
    const reportsWithProjectName = reports.map(r => ({
      ...r,
      project_name: db.projects.findById(r.project_id)?.name || '未知项目',
      generated_by_name: db.users.findById(r.generated_by)?.name || '未知用户',
    }));

    res.json({ 
      success: true, 
      data: reportsWithProjectName 
    });
  } catch (error) {
    console.error('Get report history error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取报告详情（新增）
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    const { id } = req.params;
    const report = reportService.getReportById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' });
    }

    // 检查权限
    const project = db.projects.findById(report.project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const isOwner = project.owner_id === req.user!.id;
    const isMember = db.project_members.findByProject(report.project_id).some(m => m.user_id === req.user!.id);
    const isAdmin = req.user!.role === ROLES.ADMIN;

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权限查看该报告' });
    }

    // 添加项目名称和生成者名称
    const reportWithDetails = {
      ...report,
      project_name: project.name,
      generated_by_name: db.users.findById(report.generated_by)?.name || '未知用户',
    };

    res.json({ 
      success: true, 
      data: reportWithDetails 
    });
  } catch (error) {
    console.error('Get report detail error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 导出报告为 HTML（新增）
router.get('/:id/export/html', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    const { id } = req.params;
    const report = reportService.getReportById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' });
    }

    // 检查权限
    const project = db.projects.findById(report.project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const isOwner = project.owner_id === req.user!.id;
    const isMember = db.project_members.findByProject(report.project_id).some(m => m.user_id === req.user!.id);
    const isAdmin = req.user!.role === ROLES.ADMIN;

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权限导出该报告' });
    }

    const html = reportService.exportToHtml(report);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${report.title}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 导出报告为 PDF（新增）
router.get('/:id/export/pdf', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    const { id } = req.params;
    const report = reportService.getReportById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' });
    }

    // 检查权限
    const project = db.projects.findById(report.project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const isOwner = project.owner_id === req.user!.id;
    const isMember = db.project_members.findByProject(report.project_id).some(m => m.user_id === req.user!.id);
    const isAdmin = req.user!.role === ROLES.ADMIN;

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权限导出该报告' });
    }

    const pdfBuffer = await reportService.exportToPdf(report);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.title}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除报告（新增）
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    const { id } = req.params;
    const report = reportService.getReportById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' });
    }

    // 检查权限：只有管理员和报告生成者可以删除
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isGenerator = report.generated_by === req.user.id;

    if (!isAdmin && !isGenerator) {
      return res.status(403).json({ success: false, message: '无权限删除该报告' });
    }

    const deleted = reportService.deleteReport(id);

    if (deleted) {
      res.json({ success: true, message: '报告已删除' });
    } else {
      res.status(500).json({ success: false, message: '删除报告失败' });
    }
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 风险分析（保留原有功能）
router.get('/analytics/risks', (req: AuthRequest, res: Response) => {
  try {
    const { project_id } = req.query;
    const risks = project_id ? db.risks.findByProject(project_id as string) : db.risks.getAll();

    const byLevel: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    risks.forEach(r => {
      byLevel[r.level] = (byLevel[r.level] || 0) + 1;
      byType[r.type] = (byType[r.type] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    const recommendations: string[] = [];
    if ((byLevel.critical || 0) > 0 || (byLevel.high || 0) > 0) {
      recommendations.push('存在高风险项目，建议优先处理关键路径任务');
    }
    if ((byType.schedule || 0) > 3) {
      recommendations.push('进度风险较多，建议检查项目时间线并调整资源分配');
    }

    res.json({ success: true, data: { byLevel, byType, byStatus, recommendations } });
  } catch (error) {
    console.error('Get risk analytics error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
