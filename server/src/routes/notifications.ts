import { Router, Response } from 'express';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const notifications = db.notifications.findByUser(req.user!.id);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/unread-count', (req: AuthRequest, res: Response) => {
  try {
    const notifications = db.notifications.findByUser(req.user!.id);
    const count = notifications.filter(n => !n.read).length;
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id/read', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.notifications.markRead(id);
    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/read-all', (req: AuthRequest, res: Response) => {
  try {
    db.notifications.markAllRead(req.user!.id);
    res.json({ success: true, message: '已标记全部为已读' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.notifications.delete(id);
    res.json({ success: true, message: '通知已删除' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
