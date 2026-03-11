import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';
import { riskAlertService } from '../services/risk-alert.service.js';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('project:view'), (req: AuthRequest, res: Response) => {
  try {
    const { project_id, level, status } = req.query;

    let risks = project_id ? db.risks.findByProject(project_id as string) : db.risks.getAll();

    if (level) risks = risks.filter(r => r.level === level);
    if (status) risks = risks.filter(r => r.status === status);

    const risksWithCreator = risks.map(r => ({
      ...r,
      creator_name: db.users.findById(r.created_by)?.name,
    }));

    res.json({ success: true, data: risksWithCreator });
  } catch (error) {
    console.error('Get risks error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', checkPermission('risk:create'), (req: AuthRequest, res: Response) => {
  try {
    const { project_id, task_id, level, type, description, mitigation } = req.body;

    if (!project_id || !description) {
      return res.status(400).json({ success: false, message: '项目ID和风险描述不能为空' });
    }

    const project = db.projects.findById(project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const id = uuidv4();
    const risk = db.risks.create({
      id,
      project_id,
      task_id: task_id || null,
      level: level || 'medium',
      type: type || 'other',
      description,
      mitigation: mitigation || null,
      status: 'identified',
      created_by: req.user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: risk });
  } catch (error) {
    console.error('Create risk error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id', checkPermission('risk:edit'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { level, type, description, mitigation, status } = req.body;

    const risk = db.risks.findById(id);
    if (!risk) {
      return res.status(404).json({ success: false, message: '风险记录不存在' });
    }

    const updated = db.risks.update(id, {
      ...(level && { level }),
      ...(type && { type }),
      ...(description && { description }),
      ...(mitigation !== undefined && { mitigation }),
      ...(status && { status }),
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update risk error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id', checkPermission('risk:delete'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.risks.delete(id);
    res.json({ success: true, message: '风险记录已删除' });
  } catch (error) {
    console.error('Delete risk error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ==================== 风险预警接口 ====================

// GET /api/risks/alerts - 获取风险预警列表
router.get('/alerts', async (req: AuthRequest, res: Response) => {
  try {
    const { project_id, severity, status } = req.query;
    
    const alerts = riskAlertService.getAlerts(
      project_id as string,
      severity as string,
      status as string
    );

    // 补充项目名称和任务信息
    const alertsWithDetails = alerts.map(alert => ({
      ...alert,
      project_name: db.projects.findById(alert.project_id)?.name,
      task_title: alert.task_id ? db.tasks.findById(alert.task_id)?.title : null,
    }));

    res.json({ success: true, data: alertsWithDetails });
  } catch (error) {
    console.error('Get risk alerts error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /api/risks/analyze - AI分析项目风险
router.post('/analyze', async (req: AuthRequest, res: Response) => {
  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({ success: false, message: '项目ID不能为空' });
    }

    const result = await riskAlertService.analyzeProjectRisks(project_id);
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Analyze project risks error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// PUT /api/risks/alerts/:id/resolve - 处理预警
router.put('/alerts/:id/resolve', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, resolution_note } = req.body;

    if (!action || !['acknowledge', 'resolve', 'ignore'].includes(action)) {
      return res.status(400).json({ success: false, message: '无效的操作类型' });
    }

    let updatedAlert;
    switch (action) {
      case 'acknowledge':
        updatedAlert = riskAlertService.acknowledgeAlert(id, req.user!.id);
        break;
      case 'resolve':
        if (!resolution_note) {
          return res.status(400).json({ success: false, message: '解决方案不能为空' });
        }
        updatedAlert = riskAlertService.resolveAlert(id, req.user!.id, resolution_note);
        break;
      case 'ignore':
        updatedAlert = riskAlertService.ignoreAlert(id, req.user!.id);
        break;
    }

    res.json({ success: true, data: updatedAlert });
  } catch (error: any) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ success: false, message: error.message || '服务器错误' });
  }
});

// POST /api/risks/scan - 手动扫描项目风险
router.post('/scan', async (req: AuthRequest, res: Response) => {
  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({ success: false, message: '项目ID不能为空' });
    }

    const alerts = await riskAlertService.scanProjectRisks(project_id);
    
    res.json({ success: true, data: alerts, message: `扫描完成,发现${alerts.length}个风险预警` });
  } catch (error: any) {
    console.error('Scan project risks error:', error);
    res.status(500).json({ success: false, message: error.message || '服务器错误' });
  }
});

export default router;
