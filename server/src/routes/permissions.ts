import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware, ROLES } from '../middleware/auth.js';
import { checkPermission, getUserPermissions, DEFAULT_ROLE_PERMISSIONS, PERMISSION_DEFINITIONS } from '../middleware/permission.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const permissions = db.permissions.getAll();
    res.json({ success: true, data: permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/roles', (req: AuthRequest, res: Response) => {
  try {
    const roles = [
      { id: ROLES.ADMIN, name: '管理员', permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.ADMIN] || [] },
      { id: ROLES.MANAGER, name: '项目经理', permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.MANAGER] || [] },
      { id: ROLES.LEADER, name: '组长', permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.LEADER] || [] },
      { id: ROLES.MEMBER, name: '成员', permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.MEMBER] || [] },
    ];

    res.json({ success: true, data: roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/roles/:roleId', checkPermission('permission:manage'), (req: AuthRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!Object.values(ROLES).includes(roleId as any)) {
      return res.status(400).json({ success: false, message: '无效的角色' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: '权限列表格式错误' });
    }

    db.rolePermissions.deleteByRole(roleId);

    permissions.forEach(permCode => {
      const perm = db.permissions.findByCode(permCode);
      if (perm) {
        db.rolePermissions.create({
          id: uuidv4(),
          role_id: roleId,
          permission_id: perm.id,
          created_at: new Date().toISOString(),
        });
      }
    });

    res.json({ success: true, message: '角色权限已更新' });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/users/:userId', (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (req.user?.role !== ROLES.ADMIN && req.user?.id !== userId) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const user = db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const permissions = getUserPermissions(userId);
    const userPermissions = db.userPermissions.findByUser(userId);

    const detailedPermissions = permissions.map(permCode => {
      const perm = db.permissions.findByCode(permCode);
      const userPerm = userPermissions.find(up => {
        const p = db.permissions.findById(up.permission_id);
        return p?.code === permCode;
      });

      return {
        code: permCode,
        name: perm?.name,
        resource_type: perm?.resource_type,
        operation: perm?.operation,
        is_custom: !!userPerm,
        resource_id: userPerm?.resource_id,
      };
    });

    res.json({ 
      success: true, 
      data: {
        user_id: userId,
        role: user.role,
        permissions: detailedPermissions,
      }
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/users/:userId', checkPermission('permission:manage'), (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    const user = db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: '权限列表格式错误' });
    }

    db.userPermissions.deleteByUser(userId);

    permissions.forEach((perm: any) => {
      const permRecord = db.permissions.findByCode(perm.code);
      if (permRecord) {
        db.userPermissions.create({
          id: uuidv4(),
          user_id: userId,
          permission_id: permRecord.id,
          resource_id: perm.resource_id || null,
          granted: perm.granted !== false,
          granted_by: req.user!.id,
          created_at: new Date().toISOString(),
        });
      }
    });

    res.json({ success: true, message: '用户权限已更新' });
  } catch (error) {
    console.error('Update user permissions error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/check', (req: AuthRequest, res: Response) => {
  try {
    const { permission, resource_id } = req.query;

    if (!permission) {
      return res.status(400).json({ success: false, message: '缺少权限代码' });
    }

    const hasPermission = getUserPermissions(req.user!.id).includes(permission as string);

    res.json({ 
      success: true, 
      data: { 
        has_permission: hasPermission,
        permission,
        resource_id: resource_id || null,
      }
    });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/grant', checkPermission('permission:manage'), (req: AuthRequest, res: Response) => {
  try {
    const { user_id, permission_code, resource_id } = req.body;

    if (!user_id || !permission_code) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const user = db.users.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const perm = db.permissions.findByCode(permission_code);
    if (!perm) {
      return res.status(404).json({ success: false, message: '权限不存在' });
    }

    const existing = db.userPermissions.findByUser(user_id).find(
      up => up.permission_id === perm.id && up.resource_id === resource_id
    );

    if (existing) {
      return res.status(400).json({ success: false, message: '权限已存在' });
    }

    const userPerm = db.userPermissions.create({
      id: uuidv4(),
      user_id,
      permission_id: perm.id,
      resource_id: resource_id || null,
      granted: true,
      granted_by: req.user!.id,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: userPerm });
  } catch (error) {
    console.error('Grant permission error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/revoke', checkPermission('permission:manage'), (req: AuthRequest, res: Response) => {
  try {
    const { user_id, permission_code, resource_id } = req.body;

    if (!user_id || !permission_code) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const perm = db.permissions.findByCode(permission_code);
    if (!perm) {
      return res.status(404).json({ success: false, message: '权限不存在' });
    }

    const deleted = db.userPermissions.delete(user_id, perm.id, resource_id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: '权限记录不存在' });
    }

    res.json({ success: true, message: '权限已撤销' });
  } catch (error) {
    console.error('Revoke permission error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
