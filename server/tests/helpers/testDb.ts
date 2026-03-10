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
