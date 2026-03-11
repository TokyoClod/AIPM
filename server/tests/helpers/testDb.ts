import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const testDbPath = path.join(dataDir, 'test_aipm.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

interface DataStore {
  users: any[];
  projects: any[];
  project_members: any[];
  tasks: any[];
  task_comments: any[];
  risks: any[];
  notifications: any[];
  environments: any[];
  conversations: any[];
  reports: any[];
  risk_alerts: any[];
  risk_rules: any[];
  team_messages: any[];
  knowledge_base: any[];
  knowledge_projects: any[];
  user_skills: any[];
  permissions: any[];
  role_permissions: any[];
  user_permissions: any[];
  project_stages: any[];
  workflow_templates: any[];
}

const emptyStore: DataStore = {
  users: [],
  projects: [],
  project_members: [],
  tasks: [],
  task_comments: [],
  risks: [],
  notifications: [],
  environments: [],
  conversations: [],
  reports: [],
  risk_alerts: [],
  risk_rules: [],
  team_messages: [],
  knowledge_base: [],
  knowledge_projects: [],
  user_skills: [],
  permissions: [],
  role_permissions: [],
  user_permissions: [],
  project_stages: [],
  workflow_templates: [],
};

let store: DataStore = { ...emptyStore };

function saveStore() {
  fs.writeFileSync(testDbPath, JSON.stringify(store, null, 2));
}

export const db = {
  users: {
    findById: (id: string) => store.users.find(u => u.id === id),
    findByEmail: (email: string) => store.users.find(u => u.email === email),
    create: (user: any) => {
      store.users.push(user);
      saveStore();
      return user;
    },
    update: (id: string, data: any) => {
      const idx = store.users.findIndex(u => u.id === id);
      if (idx >= 0) {
        store.users[idx] = { ...store.users[idx], ...data };
        saveStore();
        return store.users[idx];
      }
      return null;
    },
    getAll: () => store.users,
  },
  projects: {
    findById: (id: string) => store.projects.find(p => p.id === id),
    create: (project: any) => {
      store.projects.push(project);
      saveStore();
      return project;
    },
    update: (id: string, data: any) => {
      const idx = store.projects.findIndex(p => p.id === id);
      if (idx >= 0) {
        store.projects[idx] = { ...store.projects[idx], ...data };
        saveStore();
        return store.projects[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.projects.findIndex(p => p.id === id);
      if (idx >= 0) {
        store.projects.splice(idx, 1);
        store.tasks = store.tasks.filter(t => t.project_id !== id);
        store.risks = store.risks.filter(r => r.project_id !== id);
        store.project_members = store.project_members.filter(pm => pm.project_id !== id);
        saveStore();
        return true;
      }
      return false;
    },
    getAll: () => store.projects,
  },
  project_members: {
    findByProject: (projectId: string) => store.project_members.filter(pm => pm.project_id === projectId),
    getAll: () => store.project_members,
    create: (member: any) => {
      store.project_members.push(member);
      saveStore();
      return member;
    },
    delete: (projectId: string, userId: string) => {
      const idx = store.project_members.findIndex(pm => pm.project_id === projectId && pm.user_id === userId);
      if (idx >= 0) {
        store.project_members.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
  },
  tasks: {
    findById: (id: string) => store.tasks.find(t => t.id === id),
    findByProject: (projectId: string) => store.tasks.filter(t => t.project_id === projectId),
    findByAssignee: (assigneeId: string) => store.tasks.filter(t => t.assignee_id === assigneeId),
    getAll: () => store.tasks,
    create: (task: any) => {
      store.tasks.push(task);
      saveStore();
      return task;
    },
    update: (id: string, data: any) => {
      const idx = store.tasks.findIndex(t => t.id === id);
      if (idx >= 0) {
        store.tasks[idx] = { ...store.tasks[idx], ...data };
        saveStore();
        return store.tasks[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.tasks.findIndex(t => t.id === id);
      if (idx >= 0) {
        store.tasks.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
    getMaxOrder: (projectId: string) => {
      const tasks = store.tasks.filter(t => t.project_id === projectId && !t.parent_id);
      return tasks.length > 0 ? Math.max(...tasks.map(t => t.order_index)) : 0;
    },
  },
  risks: {
    findByProject: (projectId: string) => store.risks.filter(r => r.project_id === projectId),
    findById: (id: string) => store.risks.find(r => r.id === id),
    create: (risk: any) => {
      store.risks.push(risk);
      saveStore();
      return risk;
    },
    update: (id: string, data: any) => {
      const idx = store.risks.findIndex(r => r.id === id);
      if (idx >= 0) {
        store.risks[idx] = { ...store.risks[idx], ...data };
        saveStore();
        return store.risks[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.risks.findIndex(r => r.id === id);
      if (idx >= 0) {
        store.risks.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
    getAll: () => store.risks,
  },
  notifications: {
    findByUser: (userId: string) => store.notifications.filter(n => n.user_id === userId),
    create: (notification: any) => {
      store.notifications.push(notification);
      saveStore();
      return notification;
    },
    markRead: (id: string) => {
      const idx = store.notifications.findIndex(n => n.id === id);
      if (idx >= 0) {
        store.notifications[idx].read = 1;
        saveStore();
        return true;
      }
      return false;
    },
    markAllRead: (userId: string) => {
      store.notifications.forEach(n => {
        if (n.user_id === userId) n.read = 1;
      });
      saveStore();
    },
    delete: (id: string) => {
      const idx = store.notifications.findIndex(n => n.id === id);
      if (idx >= 0) {
        store.notifications.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
  },
  conversations: {
    findById: (id: string) => store.conversations.find(c => c.id === id),
    findByUser: (userId: string) => store.conversations.filter(c => c.user_id === userId),
    create: (conversation: any) => {
      store.conversations.push(conversation);
      saveStore();
      return conversation;
    },
    update: (id: string, data: any) => {
      const idx = store.conversations.findIndex(c => c.id === id);
      if (idx >= 0) {
        store.conversations[idx] = { ...store.conversations[idx], ...data };
        saveStore();
        return store.conversations[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.conversations.findIndex(c => c.id === id);
      if (idx >= 0) {
        store.conversations.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
    getAll: () => store.conversations,
  },
  reports: {
    findById: (id: string) => store.reports.find(r => r.id === id),
    findByProject: (projectId: string) => store.reports.filter(r => r.project_id === projectId),
    findByType: (type: string) => store.reports.filter(r => r.type === type),
    create: (report: any) => {
      store.reports.push(report);
      saveStore();
      return report;
    },
    update: (id: string, data: any) => {
      const idx = store.reports.findIndex(r => r.id === id);
      if (idx >= 0) {
        store.reports[idx] = { ...store.reports[idx], ...data };
        saveStore();
        return store.reports[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.reports.findIndex(r => r.id === id);
      if (idx >= 0) {
        store.reports.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
    getAll: () => store.reports,
  },
  riskAlerts: {
    findById: (id: string) => store.risk_alerts.find(a => a.id === id),
    findByProject: (projectId: string) => store.risk_alerts.filter(a => a.project_id === projectId),
    findActiveAlert: (projectId: string, alertType: string, taskId?: string) => 
      store.risk_alerts.find(a => 
        a.project_id === projectId && 
        a.alert_type === alertType && 
        a.task_id === taskId && 
        a.status === 'active'
      ),
    create: (alert: any) => {
      store.risk_alerts.push(alert);
      saveStore();
      return alert;
    },
    update: (id: string, data: any) => {
      const idx = store.risk_alerts.findIndex(a => a.id === id);
      if (idx >= 0) {
        store.risk_alerts[idx] = { ...store.risk_alerts[idx], ...data };
        saveStore();
        return store.risk_alerts[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.risk_alerts.findIndex(a => a.id === id);
      if (idx >= 0) {
        store.risk_alerts.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
    getAll: () => store.risk_alerts,
  },
  riskRules: {
    findById: (id: string) => store.risk_rules.find(r => r.id === id),
    getAll: () => store.risk_rules,
    create: (rule: any) => {
      store.risk_rules.push(rule);
      saveStore();
      return rule;
    },
    update: (id: string, data: any) => {
      const idx = store.risk_rules.findIndex(r => r.id === id);
      if (idx >= 0) {
        store.risk_rules[idx] = { ...store.risk_rules[idx], ...data };
        saveStore();
        return store.risk_rules[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.risk_rules.findIndex(r => r.id === id);
      if (idx >= 0) {
        store.risk_rules.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
  },
  teamMessages: {
    findById: (id: string) => store.team_messages.find(m => m.id === id),
    getAll: () => store.team_messages,
    create: (message: any) => {
      store.team_messages.push(message);
      saveStore();
      return message;
    },
    delete: (id: string) => {
      const idx = store.team_messages.findIndex(m => m.id === id);
      if (idx >= 0) {
        store.team_messages.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
  },
  knowledgeBase: {
    findById: (id: string) => store.knowledge_base.find(k => k.id === id),
    getAll: () => store.knowledge_base,
    create: (knowledge: any) => {
      store.knowledge_base.push(knowledge);
      saveStore();
      return knowledge;
    },
    update: (id: string, data: any) => {
      const idx = store.knowledge_base.findIndex(k => k.id === id);
      if (idx >= 0) {
        store.knowledge_base[idx] = { ...store.knowledge_base[idx], ...data };
        saveStore();
        return store.knowledge_base[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.knowledge_base.findIndex(k => k.id === id);
      if (idx >= 0) {
        store.knowledge_base.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
    getCategories: () => [...new Set(store.knowledge_base.map(k => k.category).filter(Boolean))],
    getTags: () => [...new Set(store.knowledge_base.flatMap(k => k.tags || []))],
  },
  knowledgeProjects: {
    findByKnowledge: (knowledgeId: string) => store.knowledge_projects.filter(kp => kp.knowledge_id === knowledgeId),
    findByProject: (projectId: string) => store.knowledge_projects.filter(kp => kp.project_id === projectId),
    getAll: () => store.knowledge_projects,
    create: (relation: any) => {
      store.knowledge_projects.push(relation);
      saveStore();
      return relation;
    },
    delete: (knowledgeId: string, projectId: string) => {
      const idx = store.knowledge_projects.findIndex(kp => kp.knowledge_id === knowledgeId && kp.project_id === projectId);
      if (idx >= 0) {
        store.knowledge_projects.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
  },
  userSkills: {
    findById: (id: string) => store.user_skills.find(s => s.id === id),
    findByUser: (userId: string) => store.user_skills.filter(s => s.user_id === userId),
    getAll: () => store.user_skills,
    create: (skill: any) => {
      store.user_skills.push(skill);
      saveStore();
      return skill;
    },
    update: (id: string, data: any) => {
      const idx = store.user_skills.findIndex(s => s.id === id);
      if (idx >= 0) {
        store.user_skills[idx] = { ...store.user_skills[idx], ...data };
        saveStore();
        return store.user_skills[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.user_skills.findIndex(s => s.id === id);
      if (idx >= 0) {
        store.user_skills.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
  },
  permissions: {
    findById: (id: string) => store.permissions.find(p => p.id === id),
    findByCode: (code: string) => store.permissions.find(p => p.code === code),
    getAll: () => store.permissions,
    create: (permission: any) => {
      store.permissions.push(permission);
      saveStore();
      return permission;
    },
    update: (id: string, data: any) => {
      const idx = store.permissions.findIndex(p => p.id === id);
      if (idx >= 0) {
        store.permissions[idx] = { ...store.permissions[idx], ...data };
        saveStore();
        return store.permissions[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.permissions.findIndex(p => p.id === id);
      if (idx >= 0) {
        store.permissions.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
  },
  rolePermissions: {
    findByRole: (roleId: string) => store.role_permissions.filter(rp => rp.role_id === roleId),
    getAll: () => store.role_permissions,
    create: (rolePermission: any) => {
      store.role_permissions.push(rolePermission);
      saveStore();
      return rolePermission;
    },
    delete: (roleId: string, permissionId: string) => {
      const idx = store.role_permissions.findIndex(rp => rp.role_id === roleId && rp.permission_id === permissionId);
      if (idx >= 0) {
        store.role_permissions.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
    deleteByRole: (roleId: string) => {
      store.role_permissions = store.role_permissions.filter(rp => rp.role_id !== roleId);
      saveStore();
    },
  },
  userPermissions: {
    findByUser: (userId: string) => store.user_permissions.filter(up => up.user_id === userId),
    getAll: () => store.user_permissions,
    create: (userPermission: any) => {
      store.user_permissions.push(userPermission);
      saveStore();
      return userPermission;
    },
    delete: (userId: string, permissionId: string, resourceId?: string) => {
      const idx = store.user_permissions.findIndex(up => 
        up.user_id === userId && 
        up.permission_id === permissionId && 
        (!resourceId || up.resource_id === resourceId)
      );
      if (idx >= 0) {
        store.user_permissions.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
    deleteByUser: (userId: string) => {
      store.user_permissions = store.user_permissions.filter(up => up.user_id !== userId);
      saveStore();
    },
  },
  projectStages: {
    findById: (id: string) => store.project_stages.find(s => s.id === id),
    findByProject: (projectId: string) => store.project_stages.filter(s => s.project_id === projectId).sort((a, b) => a.order_index - b.order_index),
    getAll: () => store.project_stages,
    create: (stage: any) => {
      store.project_stages.push(stage);
      saveStore();
      return stage;
    },
    update: (id: string, data: any) => {
      const idx = store.project_stages.findIndex(s => s.id === id);
      if (idx >= 0) {
        store.project_stages[idx] = { ...store.project_stages[idx], ...data };
        saveStore();
        return store.project_stages[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.project_stages.findIndex(s => s.id === id);
      if (idx >= 0) {
        store.project_stages.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
    getMaxOrder: (projectId: string) => {
      const stages = store.project_stages.filter(s => s.project_id === projectId);
      return stages.length > 0 ? Math.max(...stages.map(s => s.order_index)) : 0;
    },
  },
  workflowTemplates: {
    findById: (id: string) => store.workflow_templates.find(t => t.id === id),
    getAll: () => store.workflow_templates,
    create: (template: any) => {
      store.workflow_templates.push(template);
      saveStore();
      return template;
    },
    update: (id: string, data: any) => {
      const idx = store.workflow_templates.findIndex(t => t.id === id);
      if (idx >= 0) {
        store.workflow_templates[idx] = { ...store.workflow_templates[idx], ...data };
        saveStore();
        return store.workflow_templates[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const idx = store.workflow_templates.findIndex(t => t.id === id);
      if (idx >= 0) {
        store.workflow_templates.splice(idx, 1);
        saveStore();
        return true;
      }
      return false;
    },
  },
};

export function initializeDatabase() {
  store = { ...emptyStore };
  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  } catch (e) {
    // Ignore errors
  }
}

export function clearTestDatabase() {
  store = { ...emptyStore };
  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  } catch (e) {
    // Ignore errors
  }
}
