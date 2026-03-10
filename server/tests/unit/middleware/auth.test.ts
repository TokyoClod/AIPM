import { describe, it, expect } from '@jest/globals';

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  LEADER: 'leader',
  MEMBER: 'member',
} as const;

const PERMISSIONS = {
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

function hasPermission(role: string, permission: string): boolean {
  const allowedRoles = PERMISSIONS[permission as keyof typeof PERMISSIONS];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role as any);
}

describe('Auth Middleware', () => {
  describe('hasPermission', () => {
    it('should return true when user has permission', () => {
      expect(hasPermission(ROLES.ADMIN, 'project:create')).toBe(true);
      expect(hasPermission(ROLES.MANAGER, 'project:create')).toBe(true);
      expect(hasPermission(ROLES.LEADER, 'task:update')).toBe(true);
      expect(hasPermission(ROLES.MEMBER, 'risk:create')).toBe(true);
    });

    it('should return false when user does not have permission', () => {
      expect(hasPermission(ROLES.MEMBER, 'user:manage')).toBe(false);
      expect(hasPermission(ROLES.MEMBER, 'task:assign')).toBe(false);
      expect(hasPermission(ROLES.LEADER, 'user:manage')).toBe(false);
    });

    it('should return false for invalid permission', () => {
      expect(hasPermission(ROLES.ADMIN, 'invalid:permission')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('invalid_role', 'project:create')).toBe(false);
    });
  });

  describe('ROLES', () => {
    it('should have correct role values', () => {
      expect(ROLES.ADMIN).toBe('admin');
      expect(ROLES.MANAGER).toBe('manager');
      expect(ROLES.LEADER).toBe('leader');
      expect(ROLES.MEMBER).toBe('member');
    });
  });

  describe('PERMISSIONS', () => {
    it('should have admin-only permissions', () => {
      expect(PERMISSIONS['user:manage']).toContain(ROLES.ADMIN);
      expect(PERMISSIONS['user:manage'].length).toBe(1);
    });

    it('should have leader+ permissions for task assignment', () => {
      expect(PERMISSIONS['task:assign']).toContain(ROLES.ADMIN);
      expect(PERMISSIONS['task:assign']).toContain(ROLES.MANAGER);
      expect(PERMISSIONS['task:assign']).toContain(ROLES.LEADER);
      expect(PERMISSIONS['task:assign']).not.toContain(ROLES.MEMBER);
    });

    it('should allow all roles for basic operations', () => {
      ['project:create', 'task:create', 'risk:create'].forEach(permission => {
        expect(PERMISSIONS[permission as keyof typeof PERMISSIONS]).toContain(ROLES.ADMIN);
        expect(PERMISSIONS[permission as keyof typeof PERMISSIONS]).toContain(ROLES.MANAGER);
        expect(PERMISSIONS[permission as keyof typeof PERMISSIONS]).toContain(ROLES.LEADER);
        expect(PERMISSIONS[permission as keyof typeof PERMISSIONS]).toContain(ROLES.MEMBER);
      });
    });
  });
});
