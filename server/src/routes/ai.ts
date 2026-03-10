import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { aiService, ChatMessage, AIServiceConfig, AIModelType } from '../services/ai.service.js';
import { aiToolsService } from '../services/ai-tools.service.js';
import { db } from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 对话历史系统提示
const SYSTEM_PROMPT = `你是一个专业的AI项目管理助手，帮助用户管理项目、任务和风险。
你可以：
1. 创建和管理任务
2. 识别和分析项目风险
3. 提供项目建议和洞察
4. 解析用户输入并转换为结构化数据

请用中文回复，保持专业和友好的语气。`;

// 对话请求接口
interface ChatRequest {
  message: string;
  conversation_id?: string;
  model?: AIModelType;
  stream?: boolean;
  context?: {
    project_id?: string;
    task_id?: string;
  };
}

// 内容解析请求接口
interface ParseRequest {
  content: string;
  type: 'task' | 'risk' | 'project' | 'requirement';
  model?: AIModelType;
}

// 风险分析请求接口
interface AnalyzeRequest {
  project_id?: string;
  data?: any;
  model?: AIModelType;
}

// POST /api/ai/chat - AI对话接口
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { message, conversation_id, model, stream, context } = req.body as ChatRequest;
    const userId = (req as any).user?.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空',
      });
    }

    // 获取或创建对话
    let conversation = conversation_id ? db.conversations.findById(conversation_id) : null;
    
    if (!conversation) {
      conversation = db.conversations.create({
        id: uuidv4(),
        user_id: userId,
        title: message.substring(0, 50),
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // 构建消息历史
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // 添加历史消息
    const historyMessages = conversation.messages || [];
    for (const msg of historyMessages.slice(-10)) { // 保留最近10条消息
      messages.push({ role: msg.role, content: msg.content });
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: message });

    // 如果有上下文，添加到消息中
    if (context?.project_id) {
      const project = db.projects.findById(context.project_id);
      if (project) {
        messages.push({
          role: 'system',
          content: `当前项目上下文：${JSON.stringify(project, null, 2)}`,
        });
      }
    }

    const config: AIServiceConfig = {
      model: model || 'openai',
      temperature: 0.7,
      maxTokens: 2000,
    };

    // 流式响应
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';
      
      await aiService.chatStream(messages, (chunk, done) => {
        if (!done) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        } else {
          // 保存对话历史
          const updatedMessages = [
            ...conversation.messages,
            { role: 'user', content: message },
            { role: 'assistant', content: fullResponse },
          ];
          
          db.conversations.update(conversation.id, {
            messages: updatedMessages,
            updated_at: new Date().toISOString(),
          });

          res.write(`data: ${JSON.stringify({ done: true, conversation_id: conversation.id })}\n\n`);
          res.end();
        }
      }, config);

      return;
    }

    // 非流式响应
    const response = await aiService.chat(messages, config);

    // 保存对话历史
    const updatedMessages = [
      ...conversation.messages,
      { role: 'user', content: message },
      { role: 'assistant', content: response.content },
    ];

    db.conversations.update(conversation.id, {
      messages: updatedMessages,
      updated_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        conversation_id: conversation.id,
        message: response.content,
        model: response.model,
        usage: response.usage,
      },
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI服务错误',
    });
  }
});

// POST /api/ai/parse - 内容解析接口
router.post('/parse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, type, model } = req.body as ParseRequest;

    if (!content || !type) {
      return res.status(400).json({
        success: false,
        message: '内容和类型不能为空',
      });
    }

    const config: AIServiceConfig = {
      model: model || 'openai',
      temperature: 0.3,
    };

    const result = await aiService.parseContent(content, type, config);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI parse error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '内容解析错误',
    });
  }
});

// POST /api/ai/analyze - 风险分析接口
router.post('/analyze', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { project_id, data, model } = req.body as AnalyzeRequest;

    let analysisData = data;

    // 如果提供了项目ID，获取项目数据进行分析
    if (project_id) {
      const project = db.projects.findById(project_id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在',
        });
      }

      const tasks = db.tasks.findByProject(project_id);
      const risks = db.risks.findByProject(project_id);
      const members = db.project_members.findByProject(project_id);

      analysisData = {
        project,
        tasks,
        risks,
        members,
        taskStats: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'completed').length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          pending: tasks.filter(t => t.status === 'pending').length,
          overdue: tasks.filter(t => {
            return t.end_date && new Date(t.end_date) < new Date() && t.status !== 'completed';
          }).length,
        },
        riskStats: {
          total: risks.length,
          critical: risks.filter(r => r.level === 'critical').length,
          high: risks.filter(r => r.level === 'high').length,
        },
      };
    }

    if (!analysisData) {
      return res.status(400).json({
        success: false,
        message: '请提供项目ID或分析数据',
      });
    }

    const config: AIServiceConfig = {
      model: model || 'openai',
      temperature: 0.5,
    };

    const result = await aiService.analyzeRisk(analysisData, config);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI analyze error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '风险分析错误',
    });
  }
});

// GET /api/ai/conversations - 获取对话历史列表
router.get('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const conversations = db.conversations.findByUser(userId);

    res.json({
      success: true,
      data: conversations.map((c: any) => ({
        id: c.id,
        title: c.title,
        created_at: c.created_at,
        updated_at: c.updated_at,
        message_count: c.messages?.length || 0,
      })),
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取对话历史失败',
    });
  }
});

// GET /api/ai/conversations/:id - 获取单个对话详情
router.get('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const conversation = db.conversations.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: '对话不存在',
      });
    }

    // 验证权限
    if (conversation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权访问此对话',
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取对话详情失败',
    });
  }
});

// DELETE /api/ai/conversations/:id - 删除对话
router.delete('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const conversation = db.conversations.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: '对话不存在',
      });
    }

    // 验证权限
    if (conversation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权删除此对话',
      });
    }

    db.conversations.delete(id);

    res.json({
      success: true,
      message: '对话已删除',
    });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '删除对话失败',
    });
  }
});

// POST /api/ai/tools/execute - 执行Function Calling工具
router.post('/tools/execute', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tool_name, parameters } = req.body;
    const userId = (req as any).user?.id;

    if (!tool_name) {
      return res.status(400).json({
        success: false,
        message: '工具名称不能为空',
      });
    }

    if (!parameters || typeof parameters !== 'object') {
      return res.status(400).json({
        success: false,
        message: '参数格式不正确',
      });
    }

    // 执行工具调用
    const result = await aiToolsService.executeTool(tool_name, parameters, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || '工具执行失败',
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Tool execute error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '工具执行失败',
    });
  }
});

// GET /api/ai/tools/logs - 获取工具调用日志
router.get('/tools/logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 100;

    const logs = aiToolsService.getToolCallLogs(userId, limit);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error('Get tool logs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取工具调用日志失败',
    });
  }
});

// GET /api/ai/tools/logs/:id - 获取单个工具调用日志
router.get('/tools/logs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const log = aiToolsService.getToolCallLog(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: '日志不存在',
      });
    }

    // 验证权限 - 只能查看自己的日志
    if (log.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此日志',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error('Get tool log error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取工具调用日志失败',
    });
  }
});

// GET /api/ai/tools - 获取可用工具列表
router.get('/tools', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tools = aiService.getProjectManagementTools();

    res.json({
      success: true,
      data: tools,
    });
  } catch (error: any) {
    console.error('Get tools error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取工具列表失败',
    });
  }
});

export default router;
