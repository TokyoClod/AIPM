import { Request, Response, NextFunction } from 'express';
import { db } from '../models/database.js';
import { AuthRequest, ROLES } from './auth.js';

export const PERMISSION_DEFINITIONS = [
  { id: 'perm_001', name: '查看项目', code: 'project:view', resource_type: 'project', operation: 'view' },
  { id: 'perm_002', name: '编辑项目', code: 'project:edit', resource_type: 'project', operation: 'edit' },
  { id: 'perm_003', name: '删除项目', code: 'project:delete', resource_type: 'project', operation: 'delete' },
  { id: 'perm_004', name: '归档项目', code: 'project:archive', resource_type: 'project', operation: 'archive' },
  { id: 'perm_005', name: '创建任务', code: 'task:create', resource_type: 'task', operation: 'create' },
  { id: 'perm_006', name: '编辑任务', code: 'task:edit', resource_type: 'task', operation: 'edit' },
  { id: 'perm_007', name: '删除任务', code: 'task:delete', resource_type: 'task', operation: 'delete' },
  { id: 'perm_008', name: '分配任务', code: 'task:assign', resource_type: 'task', operation: 'assign' },
  { id: 'perm_009', name: '评论任务', code: 'task:comment', resource_type: 'task', operation: 'comment' },
  { id: 'perm_010', name: '创建风险', code: 'risk:create', resource_type: 'risk', operation: 'create' },
  { id: 'perm_011', name: '编辑风险', code: 'risk:edit', resource_type: 'risk', operation: 'edit' },
  { id: 'perm_012', name: '删除风险', code: 'risk:delete', resource_type: 'risk', operation: 'delete' },
  { id: 'perm_013', name: '评估风险', code: 'risk:assess', resource_type: 'risk', operation: 'assess' },
  { id: 'perm_014', name: '管理成员', code: 'member:manage', resource_type: 'member', operation: 'manage' },
  { id: 'perm_015', name: '管理权限', code: 'permission:manage', resource_type: 'permission', operation: 'manage' },
  { id: 'perm_016', name: '系统设置', code: 'system:settings', resource_type: 'system', operation: 'settings' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: [
    'project:view', 'project:edit', 'project:delete', 'project:archive',
    'task:create', 'task:edit', 'task:delete', 'task:assign', 'task:comment',
    'risk:create', 'risk:edit', 'risk:delete', 'risk:assess',
    'member:manage', 'permission:manage', 'system:settings',
  ],
  [ROLES.MANAGER]: [
    'project:view', 'project:edit', 'project:archive',
    'task:create', 'task:edit', 'task:delete', 'task:assign', 'task:comment',
    'risk:create', 'risk:edit', 'risk:delete', 'risk:assess',
    'member:manage',
  ],
  [ROLES.LEADER]: [
    'project:view', 'project:edit',
    'task:create', 'task:edit', 'task:delete', 'task:assign', 'task:comment',
    'risk:create', 'risk:edit', 'risk:assess',
  ],
  [ROLES.MEMBER]: [
    'project:view',
    'task:create', 'task:edit', 'task:comment',
    'risk:create', 'risk:edit',
  ],
};

export function getUserPermissions(userId: string): string[] {
  const user = db.users.findById(userId);
  if (!user) return [];

  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  
  const userSpecificPermissions = db.userPermissions.findByUser(userId);
  const additionalPermissions = userSpecificPermissions
    .filter(up => up.granted === true)
    .map(up => {
      const perm = db.permissions.findById(up.permission_id);
      return perm?.code;
    })
    .filter(Boolean) as string[];

  const revokedPermissions = userSpecificPermissions
    .filter(up => up.granted === false)
    .map(up => {
      const perm = db.permissions.findById(up.permission_id);
      return perm?.code;
    })
    .filter(Boolean) as string[];

  const allPermissions = [...new Set([...rolePermissions, ...additionalPermissions])];
  
  return allPermissions.filter(p => !revokedPermissions.includes(p));
}

export function hasUserPermission(userId: string, permissionCode: string, resourceId?: string): boolean {
  const user = db.users.findById(userId);
  if (!user) return false;

  if (user.role === ROLES.ADMIN) return true;

  const permissions = getUserPermissions(userId);
  
  if (!permissions.includes(permissionCode)) return false;

  if (resourceId) {
    const userPerm = db.userPermissions.findByUser(userId).find(
      up => {
        const perm = db.permissions.findById(up.permission_id);
        return perm?.code === permissionCode && up.resource_id === resourceId;
      }
    );
    
    if (userPerm) {
      return userPerm.granted === true;
    }
  }

  return true;
}

export function checkPermission(permissionCode: string, resourceType?: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    const resourceId = req.params.id || req.params.projectId || req.params.taskId || req.params.riskId;

    if (!hasUserPermission(req.user.id, permissionCode, resourceId)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    next();
  };
}

export function initializePermissions() {
  const existingPermissions = db.permissions.getAll();
  
  if (existingPermissions.length === 0) {
    PERMISSION_DEFINITIONS.forEach(perm => {
      db.permissions.create({
        ...perm,
        created_at: new Date().toISOString(),
      });
    });
    console.log('Permissions initialized');
  }

  const existingRolePerms = db.rolePermissions.getAll();
  if (existingRolePerms.length === 0) {
    Object.entries(DEFAULT_ROLE_PERMISSIONS).forEach(([role, permissions]) => {
      permissions.forEach(permCode => {
        const perm = db.permissions.findByCode(permCode);
        if (perm) {
          db.rolePermissions.create({
            id: `rp_${role}_${perm.id}`,
            role_id: role,
            permission_id: perm.id,
            created_at: new Date().toISOString(),
          });
        }
      });
    });
    console.log('Role permissions initialized');
  }
}
