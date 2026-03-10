import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { Task, Risk } from '../models/types.js';

// 工具调用参数接口
export interface ToolParameters {
  [key: string]: any;
}

// 工具执行结果接口
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// 工具调用日志接口
export interface ToolCallLog {
  id: string;
  tool_name: string;
  parameters: ToolParameters;
  user_id: string;
  result: ToolResult;
  executed_at: string;
  duration_ms: number;
}

// 工具调用日志存储
const toolCallLogs: ToolCallLog[] = [];

/**
 * AI工具执行服务
 * 负责执行Function Calling工具调用
 */
export class AIToolsService {
  /**
   * 执行工具调用
   */
  async executeTool(
    toolName: string,
    parameters: ToolParameters,
    userId: string
  ): Promise<ToolResult> {
    const startTime = Date.now();
    let result: ToolResult;

    try {
      // 根据工具名称执行相应的处理逻辑
      switch (toolName) {
        case 'create_task':
          result = await this.createTask(parameters, userId);
          break;

        case 'update_task':
          result = await this.updateTask(parameters, userId);
          break;

        case 'create_risk':
          result = await this.createRisk(parameters, userId);
          break;

        case 'query_project':
          result = await this.queryProject(parameters, userId);
          break;

        case 'list_tasks':
          result = await this.listTasks(parameters, userId);
          break;

        case 'assign_task':
          result = await this.assignTask(parameters, userId);
          break;

        default:
          result = {
            success: false,
            error: `未知的工具: ${toolName}`,
          };
      }
    } catch (error: any) {
      result = {
        success: false,
        error: error.message || '工具执行失败',
      };
    }

    // 记录工具调用日志
    const duration = Date.now() - startTime;
    const log: ToolCallLog = {
      id: uuidv4(),
      tool_name: toolName,
      parameters,
      user_id: userId,
      result,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
    };
    toolCallLogs.push(log);

    return result;
  }

  /**
   * 创建任务
   */
  private async createTask(
    parameters: ToolParameters,
    userId: string
  ): Promise<ToolResult> {
    // 参数验证
    if (!parameters.title || !parameters.project_id) {
      return {
        success: false,
        error: '缺少必需参数: title 或 project_id',
      };
    }

    // 验证项目是否存在
    const project = db.projects.findById(parameters.project_id);
    if (!project) {
      return {
        success: false,
        error: '项目不存在',
      };
    }

    // 验证用户是否有权限操作该项目
    const hasPermission = await this.checkProjectPermission(
      parameters.project_id,
      userId
    );
    if (!hasPermission) {
      return {
        success: false,
        error: '无权限操作此项目',
      };
    }

    // 创建任务
    const task: Task = {
      id: uuidv4(),
      project_id: parameters.project_id,
      title: parameters.title,
      description: parameters.description || '',
      status: 'pending',
      priority: parameters.priority || 'medium',
      progress: 0,
      start_date: parameters.start_date,
      end_date: parameters.end_date,
      assignee_id: parameters.assignee,
      creator_id: userId,
      order_index: db.tasks.getMaxOrder(parameters.project_id) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const createdTask = db.tasks.create(task);

    return {
      success: true,
      data: createdTask,
      message: `任务 "${task.title}" 创建成功`,
    };
  }

  /**
   * 更新任务
   */
  private async updateTask(
    parameters: ToolParameters,
    userId: string
  ): Promise<ToolResult> {
    // 参数验证
    if (!parameters.task_id) {
      return {
        success: false,
        error: '缺少必需参数: task_id',
      };
    }

    // 查找任务
    const task = db.tasks.findById(parameters.task_id);
    if (!task) {
      return {
        success: false,
        error: '任务不存在',
      };
    }

    // 验证用户是否有权限操作该任务
    const hasPermission = await this.checkProjectPermission(
      task.project_id,
      userId
    );
    if (!hasPermission) {
      return {
        success: false,
        error: '无权限操作此任务',
      };
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (parameters.status !== undefined) {
      updateData.status = parameters.status;
    }
    if (parameters.progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, parameters.progress));
    }
    if (parameters.title !== undefined) {
      updateData.title = parameters.title;
    }
    if (parameters.description !== undefined) {
      updateData.description = parameters.description;
    }
    if (parameters.priority !== undefined) {
      updateData.priority = parameters.priority;
    }

    const updatedTask = db.tasks.update(parameters.task_id, updateData);

    return {
      success: true,
      data: updatedTask,
      message: `任务 "${task.title}" 更新成功`,
    };
  }

  /**
   * 创建风险
   */
  private async createRisk(
    parameters: ToolParameters,
    userId: string
  ): Promise<ToolResult> {
    // 参数验证
    if (!parameters.description || !parameters.level || !parameters.project_id) {
      return {
        success: false,
        error: '缺少必需参数: description, level 或 project_id',
      };
    }

    // 验证项目是否存在
    const project = db.projects.findById(parameters.project_id);
    if (!project) {
      return {
        success: false,
        error: '项目不存在',
      };
    }

    // 验证用户是否有权限操作该项目
    const hasPermission = await this.checkProjectPermission(
      parameters.project_id,
      userId
    );
    if (!hasPermission) {
      return {
        success: false,
        error: '无权限操作此项目',
      };
    }

    // 创建风险
    const risk: Risk = {
      id: uuidv4(),
      project_id: parameters.project_id,
      level: parameters.level,
      type: parameters.type || 'other',
      description: parameters.description,
      mitigation: parameters.mitigation || '',
      status: 'identified',
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const createdRisk = db.risks.create(risk);

    return {
      success: true,
      data: createdRisk,
      message: `风险记录创建成功`,
    };
  }

  /**
   * 查询项目状态
   */
  private async queryProject(
    parameters: ToolParameters,
    userId: string
  ): Promise<ToolResult> {
    // 参数验证
    if (!parameters.project_id) {
      return {
        success: false,
        error: '缺少必需参数: project_id',
      };
    }

    // 查找项目
    const project = db.projects.findById(parameters.project_id);
    if (!project) {
      return {
        success: false,
        error: '项目不存在',
      };
    }

    // 验证用户是否有权限查看该项目
    const hasPermission = await this.checkProjectPermission(
      parameters.project_id,
      userId
    );
    if (!hasPermission) {
      return {
        success: false,
        error: '无权限查看此项目',
      };
    }

    // 获取项目相关数据
    const tasks = db.tasks.findByProject(parameters.project_id);
    const risks = db.risks.findByProject(parameters.project_id);
    const members = db.project_members.findByProject(parameters.project_id);

    // 计算统计数据
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t: Task) => t.status === 'completed').length,
      inProgressTasks: tasks.filter((t: Task) => t.status === 'in_progress').length,
      pendingTasks: tasks.filter((t: Task) => t.status === 'pending').length,
      pausedTasks: tasks.filter((t: Task) => t.status === 'paused').length,
      totalRisks: risks.length,
      criticalRisks: risks.filter((r: Risk) => r.level === 'critical').length,
      highRisks: risks.filter((r: Risk) => r.level === 'high').length,
      memberCount: members.length,
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter((t: Task) => t.status === 'completed').length / tasks.length) * 100)
        : 0,
    };

    return {
      success: true,
      data: {
        project,
        stats,
        tasks: tasks.slice(0, 10), // 返回前10个任务
        risks: risks.slice(0, 10), // 返回前10个风险
      },
    };
  }

  /**
   * 列出任务
   */
  private async listTasks(
    parameters: ToolParameters,
    userId: string
  ): Promise<ToolResult> {
    // 参数验证
    if (!parameters.project_id) {
      return {
        success: false,
        error: '缺少必需参数: project_id',
      };
    }

    // 验证项目是否存在
    const project = db.projects.findById(parameters.project_id);
    if (!project) {
      return {
        success: false,
        error: '项目不存在',
      };
    }

    // 验证用户是否有权限查看该项目
    const hasPermission = await this.checkProjectPermission(
      parameters.project_id,
      userId
    );
    if (!hasPermission) {
      return {
        success: false,
        error: '无权限查看此项目任务',
      };
    }

    // 获取任务列表
    let tasks = db.tasks.findByProject(parameters.project_id);

    // 按状态筛选
    if (parameters.status) {
      tasks = tasks.filter((t: Task) => t.status === parameters.status);
    }

    return {
      success: true,
      data: {
        total: tasks.length,
        tasks,
      },
    };
  }

  /**
   * 分配任务
   */
  private async assignTask(
    parameters: ToolParameters,
    userId: string
  ): Promise<ToolResult> {
    // 参数验证
    if (!parameters.task_id || !parameters.user_id) {
      return {
        success: false,
        error: '缺少必需参数: task_id 或 user_id',
      };
    }

    // 查找任务
    const task = db.tasks.findById(parameters.task_id);
    if (!task) {
      return {
        success: false,
        error: '任务不存在',
      };
    }

    // 验证用户是否有权限操作该任务
    const hasPermission = await this.checkProjectPermission(
      task.project_id,
      userId
    );
    if (!hasPermission) {
      return {
        success: false,
        error: '无权限操作此任务',
      };
    }

    // 验证被分配的用户是否存在
    const assignee = db.users.findById(parameters.user_id);
    if (!assignee) {
      return {
        success: false,
        error: '被分配的用户不存在',
      };
    }

    // 更新任务
    const updatedTask = db.tasks.update(parameters.task_id, {
      assignee_id: parameters.user_id,
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      data: updatedTask,
      message: `任务 "${task.title}" 已成功分配给 ${assignee.name}`,
    };
  }

  /**
   * 检查用户是否有项目操作权限
   */
  private async checkProjectPermission(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    // 查找项目
    const project = db.projects.findById(projectId);
    if (!project) {
      return false;
    }

    // 项目所有者有权限
    if (project.owner_id === userId) {
      return true;
    }

    // 检查是否是项目成员
    const members = db.project_members.findByProject(projectId);
    const isMember = members.some((m: any) => m.user_id === userId);

    return isMember;
  }

  /**
   * 获取工具调用日志
   */
  getToolCallLogs(userId?: string, limit: number = 100): ToolCallLog[] {
    let logs = toolCallLogs;
    
    if (userId) {
      logs = logs.filter(log => log.user_id === userId);
    }

    return logs
      .sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime())
      .slice(0, limit);
  }

  /**
   * 获取单个工具调用日志
   */
  getToolCallLog(logId: string): ToolCallLog | undefined {
    return toolCallLogs.find(log => log.id === logId);
  }
}

// 导出单例实例
export const aiToolsService = new AIToolsService();
