import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

function checkStageCompletion(stage: any): boolean {
  if (!stage.required_task_ids || stage.required_task_ids.length === 0) {
    return true;
  }
  
  const tasks = stage.required_task_ids.map((id: string) => db.tasks.findById(id)).filter(Boolean);
  return tasks.every((task: any) => task.status === 'completed');
}

function notifyStageProgress(projectId: string, stageName: string, nextStageName?: string) {
  const members = db.project_members.findByProject(projectId);
  const project = db.projects.findById(projectId);
  
  members.forEach((member: any) => {
    if (nextStageName) {
      db.notifications.create({
        id: uuidv4(),
        user_id: member.user_id,
        type: 'project',
        title: '项目阶段推进',
        content: `项目"${project?.name}"已完成阶段"${stageName}"，进入"${nextStageName}"阶段`,
        link: `/projects/${projectId}`,
        read: 0,
        created_at: new Date().toISOString(),
      });
    } else {
      db.notifications.create({
        id: uuidv4(),
        user_id: member.user_id,
        type: 'project',
        title: '项目阶段完成',
        content: `项目"${project?.name}"的阶段"${stageName}"已完成`,
        link: `/projects/${projectId}`,
        read: 0,
        created_at: new Date().toISOString(),
      });
    }
  });
}

function advanceToNextStage(projectId: string, currentStageId: string) {
  const stages = db.projectStages.findByProject(projectId);
  const currentIndex = stages.findIndex((s: any) => s.id === currentStageId);
  
  if (currentIndex >= 0 && currentIndex < stages.length - 1) {
    const nextStage = stages[currentIndex + 1];
    db.projectStages.update(nextStage.id, {
      status: 'active',
      start_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    notifyStageProgress(projectId, stages[currentIndex].name, nextStage.name);
    return nextStage;
  } else {
    notifyStageProgress(projectId, stages[currentIndex].name);
    return null;
  }
}

router.get('/project/:projectId', (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = db.projects.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const stages = db.projectStages.findByProject(projectId);
    const stagesWithTasks = stages.map((stage: any) => ({
      ...stage,
      required_tasks: stage.required_task_ids.map((id: string) => {
        const task = db.tasks.findById(id);
        return task ? { ...task, assignee_name: task.assignee_id ? db.users.findById(task.assignee_id)?.name : null } : null;
      }).filter(Boolean),
    }));
    
    res.json({ success: true, data: stagesWithTasks });
  } catch (error) {
    console.error('Get stages error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', permissionMiddleware('project:update'), (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Create stage error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id', permissionMiddleware('project:update'), (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id', permissionMiddleware('project:update'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const stage = db.projectStages.findById(id);
    
    if (!stage) {
      return res.status(404).json({ success: false, message: '阶段不存在' });
    }
    
    db.projectStages.delete(id);
    res.json({ success: true, message: '阶段已删除' });
  } catch (error) {
    console.error('Delete stage error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id/status', permissionMiddleware('project:update'), (req: AuthRequest, res: Response) => {
  try {
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
      advanceToNextStage(stage.project_id, id);
    }
    
    const updated = db.projectStages.update(id, updateData);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update stage status error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/reorder', permissionMiddleware('project:update'), (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Reorder stages error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/check-completion/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const stage = db.projectStages.findById(id);
    
    if (!stage) {
      return res.status(404).json({ success: false, message: '阶段不存在' });
    }
    
    const isComplete = checkStageCompletion(stage);
    
    if (isComplete && stage.status === 'active') {
      const updated = db.projectStages.update(id, {
        status: 'completed',
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      const nextStage = advanceToNextStage(stage.project_id, id);
      
      res.json({ 
        success: true, 
        data: { 
          stage: updated, 
          completed: true,
          nextStage 
        } 
      });
    } else {
      res.json({ success: true, data: { stage, completed: isComplete } });
    }
  } catch (error) {
    console.error('Check stage completion error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
