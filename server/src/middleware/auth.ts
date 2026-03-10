import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../models/database.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  LEADER: 'leader',
  MEMBER: 'member',
} as const;

export const PERMISSIONS = {
  'project:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'project:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'project:update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'project:delete': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'task:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'task:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'task:update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'task:delete': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'task:assign': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER],
  'risk:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'risk:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'risk:update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER, ROLES.MEMBER],
  'user:manage': [ROLES.ADMIN],
  'system:manage': [ROLES.ADMIN],
} as const;

export function hasPermission(role: string, permission: string): boolean {
  const allowedRoles = PERMISSIONS[permission as keyof typeof PERMISSIONS];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role as any);
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aipm_jwt_secret_key_2024') as {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    
    const user = db.users.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效或已过期' });
  }
}

export function permissionMiddleware(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    next();
  };
}

export function projectAccessMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  const projectId = req.params.projectId || req.params.id;
  
  if (!projectId) {
    return next();
  }

  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  const members = db.project_members.findByProject(projectId);
  const membership = members.find(m => m.user_id === req.user!.id);

  if (!membership) {
    return res.status(403).json({ success: false, message: '无权访问此项目' });
  }

  next();
}
