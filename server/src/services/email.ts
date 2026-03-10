import nodemailer from 'nodemailer';
import { db } from '../models/database.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured, skipping email send:', { to, subject });
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@aipm.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Send email error:', error);
    return false;
  }
}

export async function sendDailyReport(user: any, reportData: any, userTasks: any[]) {
  const completedRate = reportData.projects.reduce((acc: number, p: any) => acc + p.completionRate, 0) / (reportData.projects.length || 1);
  
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #1890ff;">📊 项目日报 - ${reportData.date}</h2>
      <p>您好，${user.name}，以下是今日项目进展报告：</p>
      
      <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">📈 整体概览</h3>
        <p><strong>活跃项目数：</strong>${reportData.projects.length}</p>
        <p><strong>平均完成率：</strong>${Math.round(completedRate)}%</p>
        <p><strong>关键风险数：</strong>${reportData.projects.reduce((acc: number, p: any) => acc + p.criticalRisks, 0)}</p>
      </div>
      
      <h3>📁 项目状态</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #1890ff; color: white;">
          <th style="padding: 10px; text-align: left;">项目名称</th>
          <th style="padding: 10px; text-align: center;">总任务</th>
          <th style="padding: 10px; text-align: center;">已完成</th>
          <th style="padding: 10px; text-align: center;">进行中</th>
          <th style="padding: 10px; text-align: center;">完成率</th>
        </tr>
        ${reportData.projects.map((p: any) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">${p.name}</td>
            <td style="padding: 10px; text-align: center;">${p.totalTasks}</td>
            <td style="padding: 10px; text-align: center; color: #52c41a;">${p.completed}</td>
            <td style="padding: 10px; text-align: center; color: #1890ff;">${p.inProgress}</td>
            <td style="padding: 10px; text-align: center;">${p.completionRate}%</td>
          </tr>
        `).join('')}
      </table>
      
      ${userTasks.length > 0 ? `
        <h3>🎯 您的待办任务</h3>
        <ul style="padding-left: 20px;">
          ${userTasks.map((t: any) => `
            <li style="margin: 10px 0;">
              <strong>${t.title}</strong> - ${t.project_name}
              ${t.end_date ? `<span style="color: #faad14;"> (截止: ${t.end_date})</span>` : ''}
            </li>
          `).join('')}
        </ul>
      ` : ''}
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        <p>此邮件由AIPM项目管理平台自动发送</p>
      </div>
    </div>
  `;

  return sendEmail(user.email, `📊 项目日报 - ${reportData.date}`, html);
}

export async function sendTaskNotification(user: any, task: any, action: string) {
  const actionText: Record<string, string> = {
    assigned: '被分配了新任务',
    updated: '任务状态已更新',
    completed: '任务已完成',
    commented: '有新评论',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">🔔 任务通知</h2>
      <p>您好，${user.name}，您${actionText[action] || '有新的任务动态'}</p>
      
      <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        <p><strong>项目：</strong>${task.project_name || '未指定'}</p>
        <p><strong>状态：</strong>${task.status}</p>
        ${task.end_date ? `<p><strong>截止日期：</strong>${task.end_date}</p>` : ''}
      </div>
      
      <p style="color: #1890ff;"><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/tasks/${task.id}">查看详情 →</a></p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        <p>此邮件由AIPM项目管理平台自动发送</p>
      </div>
    </div>
  `;

  return sendEmail(user.email, `🔔 任务通知 - ${task.title}`, html);
}
