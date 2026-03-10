import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { aiService } from './ai.service.js';

// 风险预警类型定义
export interface RiskAlert {
  id: string;
  project_id: string;
  task_id?: string;
  alert_type: 'task_delay' | 'resource_conflict' | 'progress_anomaly' | 'deadline_approaching' | 'budget_overrun' | 'quality_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  suggestion: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'ignored';
  triggered_by: string; // 触发规则的ID
  triggered_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
}

// 风险识别规则定义
export interface RiskRule {
  id: string;
  name: string;
  description: string;
  type: 'task_delay' | 'resource_conflict' | 'progress_anomaly' | 'deadline_approaching' | 'budget_overrun' | 'quality_issue';
  conditions: {
    threshold?: number;
    timeWindow?: number; // 时间窗口(天)
    comparison?: 'greater' | 'less' | 'equal';
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  created_at: string;
}

// 风险分析结果
export interface RiskAnalysisResult {
  projectId: string;
  projectName: string;
  overallRiskScore: number;
  alerts: RiskAlert[];
  recommendations: string[];
  riskTrend: {
    date: string;
    score: number;
  }[];
}

// 风险预警服务类
export class RiskAlertService {
  private defaultRules: RiskRule[] = [
    {
      id: 'rule-task-delay-1',
      name: '任务延期预警',
      description: '任务超过截止日期未完成',
      type: 'task_delay',
      conditions: {
        timeWindow: 0, // 已过期
      },
      severity: 'high',
      enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'rule-task-delay-2',
      name: '任务即将到期预警',
      description: '任务距离截止日期不足3天',
      type: 'deadline_approaching',
      conditions: {
        timeWindow: 3,
      },
      severity: 'medium',
      enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'rule-progress-anomaly-1',
      name: '进度异常预警',
      description: '任务进度低于预期进度50%以上',
      type: 'progress_anomaly',
      conditions: {
        threshold: 50,
        comparison: 'greater',
      },
      severity: 'high',
      enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'rule-resource-conflict-1',
      name: '资源冲突预警',
      description: '同一人员同时负责多个高优先级任务',
      type: 'resource_conflict',
      conditions: {
        threshold: 3,
        comparison: 'greater',
      },
      severity: 'medium',
      enabled: true,
      created_at: new Date().toISOString(),
    },
  ];

  constructor() {
    // 初始化默认规则
    this.initializeRules();
  }

  // 初始化规则
  private initializeRules() {
    const existingRules = db.riskRules?.getAll?.() || [];
    if (existingRules.length === 0) {
      this.defaultRules.forEach(rule => {
        db.riskRules?.create?.(rule);
      });
    }
  }

  // 扫描项目风险
  async scanProjectRisks(projectId: string): Promise<RiskAlert[]> {
    const project = db.projects.findById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const alerts: RiskAlert[] = [];
    const tasks = db.tasks.findByProject(projectId);
    const now = new Date();

    // 1. 检查任务延期
    const delayAlerts = this.checkTaskDelays(tasks, now);
    alerts.push(...delayAlerts);

    // 2. 检查即将到期的任务
    const deadlineAlerts = this.checkDeadlines(tasks, now);
    alerts.push(...deadlineAlerts);

    // 3. 检查进度异常
    const progressAlerts = this.checkProgressAnomaly(tasks, now);
    alerts.push(...progressAlerts);

    // 4. 检查资源冲突
    const resourceAlerts = this.checkResourceConflicts(tasks);
    alerts.push(...resourceAlerts);

    // 保存新预警
    for (const alert of alerts) {
      const existing = db.riskAlerts?.findActiveAlert?.(
        alert.project_id,
        alert.alert_type,
        alert.task_id
      );
      
      if (!existing) {
        db.riskAlerts?.create?.(alert);
      }
    }

    return alerts;
  }

  // 检查任务延期
  private checkTaskDelays(tasks: any[], now: Date): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    
    tasks.forEach(task => {
      if (task.status !== 'completed' && task.end_date) {
        const endDate = new Date(task.end_date);
        if (endDate < now) {
          const delayDays = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
          
          alerts.push({
            id: uuidv4(),
            project_id: task.project_id,
            task_id: task.id,
            alert_type: 'task_delay',
            severity: delayDays > 7 ? 'critical' : delayDays > 3 ? 'high' : 'medium',
            title: `任务延期: ${task.title}`,
            description: `任务"${task.title}"已延期${delayDays}天未完成`,
            impact: '可能影响项目整体进度和交付时间',
            suggestion: '建议立即跟进任务进度,必要时调整资源分配或重新评估截止日期',
            status: 'active',
            triggered_by: 'rule-task-delay-1',
            triggered_at: now.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          });
        }
      }
    });

    return alerts;
  }

  // 检查即将到期的任务
  private checkDeadlines(tasks: any[], now: Date): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    
    tasks.forEach(task => {
      if (task.status !== 'completed' && task.end_date) {
        const endDate = new Date(task.end_date);
        const daysUntilDeadline = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeadline >= 0 && daysUntilDeadline <= 3) {
          alerts.push({
            id: uuidv4(),
            project_id: task.project_id,
            task_id: task.id,
            alert_type: 'deadline_approaching',
            severity: daysUntilDeadline === 0 ? 'high' : 'medium',
            title: `任务即将到期: ${task.title}`,
            description: `任务"${task.title}"将在${daysUntilDeadline}天后到期,当前进度${task.progress}%`,
            impact: '需要及时完成任务以避免延期',
            suggestion: '建议优先处理该任务,确保按时完成',
            status: 'active',
            triggered_by: 'rule-task-delay-2',
            triggered_at: now.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          });
        }
      }
    });

    return alerts;
  }

  // 检查进度异常
  private checkProgressAnomaly(tasks: any[], now: Date): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    
    tasks.forEach(task => {
      if (task.status !== 'completed' && task.start_date && task.end_date) {
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);
        
        if (now >= startDate && now <= endDate) {
          const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
          const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
          const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
          
          const progressGap = expectedProgress - task.progress;
          
          if (progressGap > 50) {
            alerts.push({
              id: uuidv4(),
              project_id: task.project_id,
              task_id: task.id,
              alert_type: 'progress_anomaly',
              severity: progressGap > 70 ? 'critical' : 'high',
              title: `进度异常: ${task.title}`,
              description: `任务"${task.title}"进度严重滞后,实际进度${task.progress}%,预期进度${expectedProgress}%`,
              impact: '进度偏差较大,可能导致任务延期',
              suggestion: '建议分析进度滞后原因,调整资源或重新规划任务',
              status: 'active',
              triggered_by: 'rule-progress-anomaly-1',
              triggered_at: now.toISOString(),
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            });
          }
        }
      }
    });

    return alerts;
  }

  // 检查资源冲突
  private checkResourceConflicts(tasks: any[]): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    const assigneeTasks: Record<string, any[]> = {};
    
    // 按负责人分组
    tasks.forEach(task => {
      if (task.assignee_id && task.status !== 'completed') {
        if (!assigneeTasks[task.assignee_id]) {
          assigneeTasks[task.assignee_id] = [];
        }
        assigneeTasks[task.assignee_id].push(task);
      }
    });

    // 检查每个人的任务负载
    Object.entries(assigneeTasks).forEach(([assigneeId, assigneeTaskList]) => {
      const highPriorityTasks = assigneeTaskList.filter(t => 
        t.priority === 'high' || t.priority === 'urgent'
      );
      
      if (highPriorityTasks.length > 3) {
        const assignee = db.users.findById(assigneeId);
        alerts.push({
          id: uuidv4(),
          project_id: assigneeTaskList[0].project_id,
          alert_type: 'resource_conflict',
          severity: 'medium',
          title: `资源冲突: ${assignee?.name || assigneeId}`,
          description: `${assignee?.name || assigneeId}同时负责${highPriorityTasks.length}个高优先级任务,可能存在资源冲突`,
          impact: '资源过度集中可能影响任务质量和进度',
          suggestion: '建议重新分配任务,平衡团队成员工作量',
          status: 'active',
          triggered_by: 'rule-resource-conflict-1',
          triggered_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });

    return alerts;
  }

  // AI分析项目风险
  async analyzeProjectRisks(projectId: string): Promise<RiskAnalysisResult> {
    const project = db.projects.findById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const tasks = db.tasks.findByProject(projectId);
    const risks = db.risks.findByProject(projectId);
    const members = db.project_members.findByProject(projectId);

    // 准备分析数据
    const analysisData = {
      project: {
        name: project.name,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
      },
      tasks: tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        progress: t.progress,
        start_date: t.start_date,
        end_date: t.end_date,
        assignee_id: t.assignee_id,
      })),
      risks: risks.map(r => ({
        level: r.level,
        type: r.type,
        description: r.description,
        status: r.status,
      })),
      teamSize: members.length,
    };

    // 使用AI分析
    const aiAnalysis = await aiService.analyzeRisk(analysisData);

    // 扫描现有风险
    const alerts = await this.scanProjectRisks(projectId);

    // 计算风险评分 (0-100)
    const riskScore = this.calculateRiskScore(tasks, risks, alerts);

    return {
      projectId,
      projectName: project.name,
      overallRiskScore: riskScore,
      alerts,
      recommendations: aiAnalysis.recommendations || [],
      riskTrend: this.generateRiskTrend(projectId),
    };
  }

  // 计算风险评分
  private calculateRiskScore(tasks: any[], risks: any[], alerts: RiskAlert[]): number {
    let score = 0;
    
    // 基于任务状态
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    if (totalTasks > 0) {
      score += (1 - completedTasks / totalTasks) * 30;
    }

    // 基于风险等级
    risks.forEach(risk => {
      if (risk.status !== 'resolved') {
        const weight: Record<string, number> = { low: 5, medium: 10, high: 20, critical: 30 };
        score += weight[risk.level as string] || 0;
      }
    });

    // 基于预警数量和严重程度
    alerts.forEach(alert => {
      if (alert.status === 'active') {
        const weight: Record<string, number> = { low: 2, medium: 5, high: 10, critical: 15 };
        score += weight[alert.severity as string] || 0;
      }
    });

    return Math.min(100, Math.round(score));
  }

  // 生成风险趋势
  private generateRiskTrend(projectId: string): { date: string; score: number }[] {
    const trend: { date: string; score: number }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // 模拟历史风险评分(实际应该从历史记录中获取)
      const baseScore = 30 + Math.random() * 40;
      trend.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(baseScore),
      });
    }
    
    return trend;
  }

  // 获取预警列表
  getAlerts(projectId?: string, severity?: string, status?: string): RiskAlert[] {
    let alerts = db.riskAlerts?.getAll?.() || [];
    
    if (projectId) {
      alerts = alerts.filter(a => a.project_id === projectId);
    }
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }

    // 按严重程度和创建时间排序
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity as string] - severityOrder[b.severity as string];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return alerts;
  }

  // 确认预警
  acknowledgeAlert(alertId: string, userId: string): RiskAlert {
    const alert = db.riskAlerts?.findById?.(alertId);
    if (!alert) {
      throw new Error('预警不存在');
    }

    const updated = db.riskAlerts?.update?.(alertId, {
      status: 'acknowledged',
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return updated;
  }

  // 解决预警
  resolveAlert(alertId: string, userId: string, resolutionNote: string): RiskAlert {
    const alert = db.riskAlerts?.findById?.(alertId);
    if (!alert) {
      throw new Error('预警不存在');
    }

    const updated = db.riskAlerts?.update?.(alertId, {
      status: 'resolved',
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote,
      updated_at: new Date().toISOString(),
    });

    return updated;
  }

  // 忽略预警
  ignoreAlert(alertId: string, userId: string): RiskAlert {
    const alert = db.riskAlerts?.findById?.(alertId);
    if (!alert) {
      throw new Error('预警不存在');
    }

    const updated = db.riskAlerts?.update?.(alertId, {
      status: 'ignored',
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return updated;
  }

  // 发送预警通知
  async sendAlertNotifications(alert: RiskAlert): Promise<void> {
    const project = db.projects.findById(alert.project_id);
    if (!project) return;

    // 获取项目所有成员
    const members = db.project_members.findByProject(alert.project_id);
    
    // 为每个成员创建通知
    for (const member of members) {
      const notification = {
        id: uuidv4(),
        user_id: member.user_id,
        type: 'risk' as const,
        title: `风险预警: ${alert.title}`,
        content: alert.description,
        link: `/risk-alerts?id=${alert.id}`,
        read: false,
        created_at: new Date().toISOString(),
      };
      
      db.notifications.create(notification);
    }
  }
}

// 导出单例实例
export const riskAlertService = new RiskAlertService();
