import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { Report, ReportContent, Task, Risk } from '../models/types.js';
import { aiService } from './ai.service.js';

export interface GenerateReportOptions {
  projectId: string;
  type: 'weekly' | 'monthly' | 'custom';
  periodStart: string;
  periodEnd: string;
  generatedBy: string;
  format?: 'json' | 'pdf' | 'html';
}

export class ReportService {
  /**
   * 生成项目报告
   */
  async generateReport(options: GenerateReportOptions): Promise<Report> {
    const { projectId, type, periodStart, periodEnd, generatedBy, format = 'json' } = options;

    const project = db.projects.findById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 获取项目任务
    const allTasks = db.tasks.findByProject(projectId);
    
    // 获取项目风险
    const allRisks = db.risks.findByProject(projectId);

    // 计算报告内容
    const content = await this.buildReportContent(
      allTasks,
      allRisks,
      periodStart,
      periodEnd
    );

    // 生成报告标题
    const title = this.generateReportTitle(project.name, type, periodStart, periodEnd);

    // 创建报告记录
    const report: Report = {
      id: uuidv4(),
      project_id: projectId,
      type,
      title,
      period_start: periodStart,
      period_end: periodEnd,
      content,
      generated_by: generatedBy,
      format,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 保存报告
    db.reports.create(report);

    return report;
  }

  /**
   * 构建报告内容
   */
  private async buildReportContent(
    tasks: Task[],
    risks: Risk[],
    periodStart: string,
    periodEnd: string
  ): Promise<ReportContent> {
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    const now = new Date();

    // 任务统计
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    // 计算完成率
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks.length / totalTasks) * 100) 
      : 0;

    // 计算延期任务（已过期但未完成的任务）
    const delayedTasks = tasks.filter(t => {
      if (t.status === 'completed' || !t.end_date) return false;
      return new Date(t.end_date) < now;
    });

    // 高风险项
    const criticalRisks = risks.filter(r => 
      r.level === 'critical' || r.level === 'high'
    );

    // 本周/本月完成的任务
    const periodCompletedTasks = completedTasks.filter(t => {
      if (!t.updated_at) return false;
      const updatedDate = new Date(t.updated_at);
      return updatedDate >= startDate && updatedDate <= endDate;
    });

    // 下周/下月计划任务（未开始或进行中的任务）
    const plannedTasks = [...inProgressTasks, ...pendingTasks]
      .filter(t => t.end_date && new Date(t.end_date) > now)
      .sort((a, b) => {
        if (!a.end_date || !b.end_date) return 0;
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      })
      .slice(0, 10);

    // 生成趋势数据（模拟最近4周的数据）
    const trends = this.calculateTrends(tasks, risks);

    // AI 分析
    const aiAnalysis = await this.generateAIAnalysis({
      totalTasks,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      pendingTasks: pendingTasks.length,
      completionRate,
      delayedTasks: delayedTasks.length,
      criticalRisks: criticalRisks.length,
      recentCompleted: periodCompletedTasks.length,
      upcomingTasks: plannedTasks.length,
    });

    return {
      overview: {
        totalTasks,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        pendingTasks: pendingTasks.length,
        completionRate,
        delayedTasks: delayedTasks.length,
        criticalRisks: criticalRisks.length,
      },
      completedTasks: periodCompletedTasks.slice(0, 20),
      plannedTasks: plannedTasks.slice(0, 10),
      risks: criticalRisks.slice(0, 10),
      aiSummary: aiAnalysis.summary,
      aiRecommendations: aiAnalysis.recommendations,
      trends,
    };
  }

  /**
   * 计算趋势数据
   */
  private calculateTrends(tasks: Task[], risks: Risk[]) {
    const completionTrend: number[] = [];
    const riskTrend: number[] = [];
    
    // 模拟最近4周的趋势数据
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      // 该周完成的任务数
      const weekCompleted = tasks.filter(t => {
        if (t.status !== 'completed' || !t.updated_at) return false;
        const updatedDate = new Date(t.updated_at);
        return updatedDate >= weekStart && updatedDate <= weekEnd;
      }).length;

      completionTrend.push(weekCompleted);

      // 该周新增的风险数（简化计算）
      const weekRisks = risks.filter(r => {
        if (!r.created_at) return false;
        const createdDate = new Date(r.created_at);
        return createdDate >= weekStart && createdDate <= weekEnd;
      }).length;

      riskTrend.push(weekRisks);
    }

    return { completionTrend, riskTrend };
  }

  /**
   * 使用 AI 生成分析和建议
   */
  private async generateAIAnalysis(stats: any): Promise<{
    summary: string;
    recommendations: string[];
  }> {
    try {
      const prompt = `作为项目管理专家，请分析以下项目数据并生成报告摘要和建议：

项目统计数据：
- 总任务数：${stats.totalTasks}
- 已完成：${stats.completedTasks}
- 进行中：${stats.inProgressTasks}
- 待开始：${stats.pendingTasks}
- 完成率：${stats.completionRate}%
- 延期任务：${stats.delayedTasks}
- 高风险项：${stats.criticalRisks}
- 近期完成：${stats.recentCompleted}
- 即将到期：${stats.upcomingTasks}

请以JSON格式返回：
{
  "summary": "项目状态摘要（2-3句话）",
  "recommendations": ["建议1", "建议2", "建议3"]
}`;

      const response = await aiService.chat([
        { role: 'system', content: '你是一个专业的项目管理分析师，擅长分析项目数据并提供改进建议。' },
        { role: 'user', content: prompt },
      ], { model: 'openai', temperature: 0.7 });

      try {
        const result = JSON.parse(response.content);
        return {
          summary: result.summary || '项目进展正常',
          recommendations: result.recommendations || [],
        };
      } catch {
        // 如果解析失败，返回默认值
        return {
          summary: '项目整体进展正常，建议持续关注延期任务和高风险项。',
          recommendations: [
            '优先处理延期任务，确保项目进度',
            '定期评估和缓解高风险项',
            '合理分配资源，避免任务积压',
          ],
        };
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        summary: '项目整体进展正常，建议持续关注延期任务和高风险项。',
        recommendations: [
          '优先处理延期任务，确保项目进度',
          '定期评估和缓解高风险项',
          '合理分配资源，避免任务积压',
        ],
      };
    }
  }

  /**
   * 生成报告标题
   */
  private generateReportTitle(
    projectName: string,
    type: 'weekly' | 'monthly' | 'custom',
    periodStart: string,
    periodEnd: string
  ): string {
    const typeMap = {
      weekly: '周报',
      monthly: '月报',
      custom: '自定义报告',
    };

    const formatDate = (date: string) => {
      const d = new Date(date);
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    };

    return `${projectName}${typeMap[type]} (${formatDate(periodStart)} - ${formatDate(periodEnd)})`;
  }

  /**
   * 获取历史报告
   */
  getReportHistory(projectId?: string, type?: string): Report[] {
    let reports = db.reports.getAll();
    
    if (projectId) {
      reports = reports.filter(r => r.project_id === projectId);
    }
    
    if (type) {
      reports = reports.filter(r => r.type === type);
    }

    // 按创建时间倒序排列
    return reports.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * 获取报告详情
   */
  getReportById(id: string): Report | null {
    return db.reports.findById(id);
  }

  /**
   * 删除报告
   */
  deleteReport(id: string): boolean {
    return db.reports.delete(id);
  }

  /**
   * 导出报告为 HTML
   */
  exportToHtml(report: Report): string {
    const { content, title } = report;
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1890ff;
      border-bottom: 2px solid #1890ff;
      padding-bottom: 10px;
    }
    h2 {
      color: #333;
      margin-top: 30px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #1890ff;
    }
    .stat-label {
      color: #666;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #f8f9fa;
      font-weight: bold;
    }
    .risk-critical { color: #ff4d4f; }
    .risk-high { color: #fa8c16; }
    .risk-medium { color: #faad14; }
    .risk-low { color: #52c41a; }
    .ai-section {
      background: #e6f7ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #1890ff;
    }
    .recommendations {
      list-style: none;
      padding: 0;
    }
    .recommendations li {
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .recommendations li:before {
      content: "✓ ";
      color: #52c41a;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      color: #999;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    
    <h2>项目概览</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${content.overview.totalTasks}</div>
        <div class="stat-label">总任务数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${content.overview.completedTasks}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${content.overview.completionRate}%</div>
        <div class="stat-label">完成率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${content.overview.delayedTasks}</div>
        <div class="stat-label">延期任务</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${content.overview.criticalRisks}</div>
        <div class="stat-label">高风险项</div>
      </div>
    </div>

    ${content.aiSummary ? `
    <div class="ai-section">
      <h2>AI 分析摘要</h2>
      <p>${content.aiSummary}</p>
    </div>
    ` : ''}

    <h2>本周完成任务 (${content.completedTasks.length})</h2>
    ${content.completedTasks.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>任务名称</th>
          <th>优先级</th>
          <th>负责人</th>
          <th>完成时间</th>
        </tr>
      </thead>
      <tbody>
        ${content.completedTasks.map(task => `
          <tr>
            <td>${task.title}</td>
            <td>${task.priority}</td>
            <td>${task.assignee_id ? db.users.findById(task.assignee_id)?.name || '-' : '-'}</td>
            <td>${task.updated_at ? new Date(task.updated_at).toLocaleDateString('zh-CN') : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p>本周无完成任务</p>'}

    <h2>下周计划任务 (${content.plannedTasks.length})</h2>
    ${content.plannedTasks.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>任务名称</th>
          <th>状态</th>
          <th>优先级</th>
          <th>截止日期</th>
        </tr>
      </thead>
      <tbody>
        ${content.plannedTasks.map(task => `
          <tr>
            <td>${task.title}</td>
            <td>${task.status}</td>
            <td>${task.priority}</td>
            <td>${task.end_date ? new Date(task.end_date).toLocaleDateString('zh-CN') : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p>暂无计划任务</p>'}

    <h2>风险列表 (${content.risks.length})</h2>
    ${content.risks.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>风险描述</th>
          <th>等级</th>
          <th>类型</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        ${content.risks.map(risk => `
          <tr>
            <td>${risk.description}</td>
            <td class="risk-${risk.level}">${risk.level.toUpperCase()}</td>
            <td>${risk.type}</td>
            <td>${risk.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p>暂无风险</p>'}

    ${content.aiRecommendations && content.aiRecommendations.length > 0 ? `
    <h2>AI 建议</h2>
    <ul class="recommendations">
      ${content.aiRecommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
    ` : ''}

    <div class="footer">
      <p>报告生成时间：${new Date(report.created_at).toLocaleString('zh-CN')}</p>
      <p>由 AIPM 项目管理系统生成</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * 导出报告为 PDF（需要额外的 PDF 生成库）
   * 注意：这里返回 HTML 内容，实际 PDF 生成需要安装 puppeteer 或类似库
   */
  async exportToPdf(report: Report): Promise<Buffer> {
    // 这里简化实现，返回 HTML 内容
    // 实际项目中可以集成 puppeteer 或其他 PDF 生成库
    const html = this.exportToHtml(report);
    return Buffer.from(html, 'utf-8');
  }
}

// 导出单例实例
export const reportService = new ReportService();
