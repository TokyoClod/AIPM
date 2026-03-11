import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('project:view'), (req: AuthRequest, res: Response) => {
  try {
    const { project_id, status, assignee_id, parent_id } = req.query;

    let tasks = project_id ? db.tasks.findByProject(project_id as string) : [];

    if (status) tasks = tasks.filter(t => t.status === status);
    if (assignee_id) tasks = tasks.filter(t => t.assignee_id === assignee_id);
    if (parent_id) {
      tasks = tasks.filter(t => t.parent_id === parent_id);
    } else if (!project_id) {
      tasks = tasks.filter(t => !t.parent_id);
    }

    const tasksWithUser = tasks.map(t => ({
      ...t,
      assignee_name: t.assignee_id ? db.users.findById(t.assignee_id)?.name : null,
      assignee_email: t.assignee_id ? db.users.findById(t.assignee_id)?.email : null,
      creator_name: db.users.findById(t.creator_id)?.name,
    }));

    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };

    res.json({ success: true, data: buildTree(tasksWithUser) });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', checkPermission('task:create'), (req: AuthRequest, res: Response) => {
  try {
    const { project_id, parent_id, title, description, status, priority, progress, start_date, end_date, risk_level, risk_description, assignee_id } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ success: false, message: '项目ID和任务标题不能为空' });
    }

    const project = db.projects.findById(project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const maxOrder = db.tasks.getMaxOrder(project_id);
    const id = uuidv4();

    const task = db.tasks.create({
      id,
      project_id,
      parent_id: parent_id || null,
      title,
      description: description || null,
      status: status || 'pending',
      priority: priority || 'medium',
      progress: progress || 0,
      start_date: start_date || null,
      end_date: end_date || null,
      risk_level: risk_level || null,
      risk_description: risk_description || null,
      assignee_id: assignee_id || null,
      creator_id: req.user!.id,
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
        link: `/tasks/${id}`,
        read: 0,
        created_at: new Date().toISOString(),
      });
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = db.tasks.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    const children = db.tasks.findByProject(task.project_id).filter(t => t.parent_id === id);
    const taskWithUser = {
      ...task,
      assignee_name: task.assignee_id ? db.users.findById(task.assignee_id)?.name : null,
      assignee_email: task.assignee_id ? db.users.findById(task.assignee_id)?.email : null,
      creator_name: db.users.findById(task.creator_id)?.name,
      children,
    };

    res.json({ success: true, data: taskWithUser });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id', checkPermission('task:edit'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, progress, start_date, end_date, risk_level, risk_description, assignee_id, parent_id } = req.body;

    const task = db.tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    const updated = db.tasks.update(id, {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(progress !== undefined && { progress }),
      ...(start_date !== undefined && { start_date }),
      ...(end_date !== undefined && { end_date }),
      ...(risk_level !== undefined && { risk_level }),
      ...(risk_description !== undefined && { risk_description }),
      ...(assignee_id !== undefined && { assignee_id }),
      ...(parent_id !== undefined && { parent_id }),
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id/progress', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { progress, status, description } = req.body;

    const task = db.tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    let newStatus = task.status;
    if (status) {
      newStatus = status;
    } else if (progress !== undefined) {
      if (progress === 100) newStatus = 'completed';
      else if (progress > 0) newStatus = 'in_progress';
    }

    const updated = db.tasks.update(id, {
      progress: progress ?? task.progress,
      status: newStatus,
      ...(description !== undefined && { description }),
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id', checkPermission('task:delete'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = db.tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    db.tasks.delete(id);
    res.json({ success: true, message: '任务已删除' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/comments', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    const task = db.tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    res.status(201).json({ success: true, data: { id: uuidv4(), task_id: id, user_id: req.user!.id, content, created_at: new Date().toISOString() } });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/gantt/:projectId', (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tasks = db.tasks.findByProject(projectId)
      .filter(t => t.start_date && t.end_date)
      .map(t => ({ ...t, assignee_name: t.assignee_id ? db.users.findById(t.assignee_id)?.name : null }));

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get gantt tasks error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
