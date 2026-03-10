import { db } from '../models/database.js';
import { reportService } from './report.service.js';

/**
 * 定时任务调度器
 * 用于自动生成周报和月报
 */
export class SchedulerService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  /**
   * 启动定时任务
   */
  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Scheduler started');

    // 每小时检查一次是否需要生成报告
    const hourlyCheck = setInterval(() => {
      this.checkAndGenerateReports();
    }, 60 * 60 * 1000); // 1小时

    this.intervals.set('hourlyCheck', hourlyCheck);

    // 启动时立即检查一次
    this.checkAndGenerateReports();
  }

  /**
   * 停止定时任务
   */
  stop() {
    this.intervals.forEach((interval, key) => {
      clearInterval(interval);
      console.log(`Stopped interval: ${key}`);
    });
    this.intervals.clear();
    this.isRunning = false;
    console.log('Scheduler stopped');
  }

  /**
   * 检查并生成报告
   */
  private async checkAndGenerateReports() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const dayOfMonth = now.getDate();
    const hour = now.getHours();

    console.log(`Checking reports at ${now.toISOString()}`);

    // 每周一早上 9 点生成周报
    if (dayOfWeek === 1 && hour === 9) {
      await this.generateWeeklyReports();
    }

    // 每月 1 号早上 9 点生成月报
    if (dayOfMonth === 1 && hour === 9) {
      await this.generateMonthlyReports();
    }
  }

  /**
   * 为所有活跃项目生成周报
   */
  private async generateWeeklyReports() {
    console.log('Generating weekly reports...');
    
    try {
      const projects = db.projects.getAll().filter(p => p.status === 'active');
      const now = new Date();
      
      // 计算本周的起止日期
      const weekEnd = new Date(now);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);

      const periodStart = weekStart.toISOString().split('T')[0];
      const periodEnd = weekEnd.toISOString().split('T')[0];

      for (const project of projects) {
        try {
          // 检查本周是否已经生成过周报
          const existingReports = db.reports.findByProject(project.id);
          const thisWeekReport = existingReports.find(r => 
            r.type === 'weekly' && 
            r.period_start === periodStart && 
            r.period_end === periodEnd
          );

          if (thisWeekReport) {
            console.log(`Weekly report already exists for project ${project.name}`);
            continue;
          }

          // 使用项目所有者作为报告生成者
          const report = await reportService.generateReport({
            projectId: project.id,
            type: 'weekly',
            periodStart,
            periodEnd,
            generatedBy: project.owner_id,
          });

          console.log(`Generated weekly report for project ${project.name}: ${report.id}`);
        } catch (error) {
          console.error(`Failed to generate weekly report for project ${project.name}:`, error);
        }
      }

      console.log('Weekly reports generation completed');
    } catch (error) {
      console.error('Error generating weekly reports:', error);
    }
  }

  /**
   * 为所有活跃项目生成月报
   */
  private async generateMonthlyReports() {
    console.log('Generating monthly reports...');
    
    try {
      const projects = db.projects.getAll().filter(p => p.status === 'active');
      const now = new Date();
      
      // 计算本月的起止日期
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // 上个月最后一天
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 上个月第一天

      const periodStart = monthStart.toISOString().split('T')[0];
      const periodEnd = monthEnd.toISOString().split('T')[0];

      for (const project of projects) {
        try {
          // 检查本月是否已经生成过月报
          const existingReports = db.reports.findByProject(project.id);
          const thisMonthReport = existingReports.find(r => 
            r.type === 'monthly' && 
            r.period_start === periodStart && 
            r.period_end === periodEnd
          );

          if (thisMonthReport) {
            console.log(`Monthly report already exists for project ${project.name}`);
            continue;
          }

          // 使用项目所有者作为报告生成者
          const report = await reportService.generateReport({
            projectId: project.id,
            type: 'monthly',
            periodStart,
            periodEnd,
            generatedBy: project.owner_id,
          });

          console.log(`Generated monthly report for project ${project.name}: ${report.id}`);
        } catch (error) {
          console.error(`Failed to generate monthly report for project ${project.name}:`, error);
        }
      }

      console.log('Monthly reports generation completed');
    } catch (error) {
      console.error('Error generating monthly reports:', error);
    }
  }

  /**
   * 手动触发生成报告
   */
  async triggerReportGeneration(type: 'weekly' | 'monthly') {
    if (type === 'weekly') {
      await this.generateWeeklyReports();
    } else if (type === 'monthly') {
      await this.generateMonthlyReports();
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeIntervals: Array.from(this.intervals.keys()),
    };
  }
}

// 导出单例实例
export const schedulerService = new SchedulerService();
