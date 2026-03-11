import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const templates = db.workflowTemplates.getAll();
    const templatesWithCreator = templates.map((t: any) => ({
      ...t,
      creator_name: db.users.findById(t.created_by)?.name,
    }));
    
    res.json({ success: true, data: templatesWithCreator });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', permissionMiddleware('project:create'), (req: AuthRequest, res: Response) => {
  try {
    const { name, description, stages } = req.body;
    
    if (!name || !stages || !Array.isArray(stages)) {
      return res.status(400).json({ success: false, message: '模板名称和阶段配置不能为空' });
    }
    
    const id = uuidv4();
    
    const template = db.workflowTemplates.create({
      id,
      name,
      description: description || null,
      stages: stages.map((stage: any, index: number) => ({
        name: stage.name,
        order_index: index + 1,
        required_task_ids: stage.required_task_ids || [],
      })),
      created_by: req.user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const template = db.workflowTemplates.findById(id);
    
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }
    
    const templateWithCreator = {
      ...template,
      creator_name: db.users.findById(template.created_by)?.name,
    };
    
    res.json({ success: true, data: templateWithCreator });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id', permissionMiddleware('project:update'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const template = db.workflowTemplates.findById(id);
    
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }
    
    db.workflowTemplates.delete(id);
    res.json({ success: true, message: '模板已删除' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/apply/:id', permissionMiddleware('project:update'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { project_id } = req.body;
    
    if (!project_id) {
      return res.status(400).json({ success: false, message: '项目ID不能为空' });
    }
    
    const template = db.workflowTemplates.findById(id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }
    
    const project = db.projects.findById(project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const existingStages = db.projectStages.findByProject(project_id);
    if (existingStages.length > 0) {
      return res.status(400).json({ success: false, message: '项目已有阶段，请先删除现有阶段' });
    }
    
    const createdStages = template.stages.map((stage: any) => {
      const stageId = uuidv4();
      return db.projectStages.create({
        id: stageId,
        project_id,
        name: stage.name,
        order_index: stage.order_index,
        status: stage.order_index === 1 ? 'active' : 'pending',
        required_task_ids: stage.required_task_ids || [],
        start_date: stage.order_index === 1 ? new Date().toISOString() : null,
        end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
    
    res.json({ success: true, data: createdStages });
  } catch (error) {
    console.error('Apply template error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
