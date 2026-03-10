import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, ROLES } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const existingUser = db.users.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '邮箱已被注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const allUsers = db.users.getAll();
    const isFirstUser = allUsers.length === 0;
    const userRole = isFirstUser ? ROLES.ADMIN : ROLES.MEMBER;

    const user = db.users.create({
      id,
      email,
      password: hashedPassword,
      name,
      role: userRole,
      avatar: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'aipm_jwt_secret_key_2024',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ success: true, data: { token, user: userWithoutPassword } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: '请输入邮箱和密码' });
    }

    const user = db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'aipm_jwt_secret_key_2024',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: { token, user: userWithoutPassword } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/me', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    const user = db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    const { name, avatar, currentPassword, newPassword } = req.body;
    const user = db.users.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: '请输入当前密码' });
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: '当前密码错误' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    db.users.update(req.user.id, {
      name: user.name,
      avatar: user.avatar,
      password: user.password,
      updated_at: new Date().toISOString(),
    });

    const updatedUser = db.users.findById(req.user.id);
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/users', (req: AuthRequest, res: Response) => {
  try {
    const users = db.users.getAll();
    const usersWithoutPassword = users.map(({ password, ...rest }) => rest);
    res.json({ success: true, data: usersWithoutPassword });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/users/:id/role', (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ success: false, message: '无效的角色' });
    }

    db.users.update(id, { role, updated_at: new Date().toISOString() });

    const user = db.users.findById(id);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
