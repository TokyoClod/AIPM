import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './models/database.js';
import { initializePermissions } from './middleware/permission.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import riskRoutes from './routes/risks.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import aiRoutes from './routes/ai.js';
import teamRoutes from './routes/team.js';
import stageRoutes from './routes/stages.js';
import templateRoutes from './routes/templates.js';
import smartAssignRoutes from './routes/smart-assign.js';
import knowledgeRoutes from './routes/knowledge.js';
import permissionRoutes from './routes/permissions.js';
import { schedulerService } from './services/scheduler.service.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

initializeDatabase();
initializePermissions();

// 启动定时任务调度器
schedulerService.start();

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/smart-assign', smartAssignRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/permissions', permissionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
