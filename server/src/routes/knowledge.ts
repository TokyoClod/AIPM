import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Get knowledge list error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', (req: AuthRequest, res: Response) => {
  try {
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
      creator_id: req.user!.id,
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
        creator_name: req.user!.name,
      },
    });
  } catch (error) {
    console.error('Create knowledge error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/search', (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Search knowledge error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/categories', (req: AuthRequest, res: Response) => {
  try {
    const categories = db.knowledgeBase.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/tags', (req: AuthRequest, res: Response) => {
  try {
    const tags = db.knowledgeBase.getTags();
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/project/:projectId', (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Get project knowledge error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Get knowledge detail error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;

    const knowledge = db.knowledgeBase.findById(id);
    if (!knowledge) {
      return res.status(404).json({ success: false, message: '文档不存在' });
    }

    if (knowledge.creator_id !== req.user!.id && req.user!.role !== 'admin') {
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
  } catch (error) {
    console.error('Update knowledge error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const knowledge = db.knowledgeBase.findById(id);

    if (!knowledge) {
      return res.status(404).json({ success: false, message: '文档不存在' });
    }

    if (knowledge.creator_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权删除此文档' });
    }

    db.knowledgeBase.delete(id);
    res.json({ success: true, message: '文档已删除' });
  } catch (error) {
    console.error('Delete knowledge error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/link-project', (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Link project error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id/link-project/:projectId', (req: AuthRequest, res: Response) => {
  try {
    const { id, projectId } = req.params;

    const deleted = db.knowledgeProjects.delete(id, projectId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '关联关系不存在' });
    }

    res.json({ success: true, message: '已取消关联' });
  } catch (error) {
    console.error('Unlink project error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
