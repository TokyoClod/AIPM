import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) => 
    api.post('/auth/register', { email, password, name }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  getUsers: () => api.get('/auth/users'),
  updateUserRole: (id: string, role: string) => 
    api.put(`/auth/users/${id}/role`, { role }),
};

export const projectApi = {
  getAll: () => api.get('/projects'),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addMember: (projectId: string, userId: string, role: string) => 
    api.post(`/projects/${projectId}/members`, { user_id: userId, role }),
  removeMember: (projectId: string, userId: string) => 
    api.delete(`/projects/${projectId}/members/${userId}`),
  getDashboard: (id: string) => api.get(`/projects/${id}/dashboard`),
};

export const taskApi = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  updateProgress: (id: string, data: any) => api.put(`/tasks/${id}/progress`, data),
  addComment: (id: string, content: string) => 
    api.post(`/tasks/${id}/comments`, { content }),
  getGantt: (projectId: string) => api.get(`/tasks/gantt/${projectId}`),
};

export const riskApi = {
  getAll: (params?: any) => api.get('/risks', { params }),
  create: (data: any) => api.post('/risks', data),
  update: (id: string, data: any) => api.put(`/risks/${id}`, data),
  delete: (id: string) => api.delete(`/risks/${id}`),
  // 风险预警接口
  getAlerts: (params?: any) => api.get('/risks/alerts', { params }),
  analyzeProject: (projectId: string) => api.post('/risks/analyze', { project_id: projectId }),
  resolveAlert: (id: string, action: string, resolutionNote?: string) => 
    api.put(`/risks/alerts/${id}/resolve`, { action, resolution_note: resolutionNote }),
  scanProject: (projectId: string) => api.post('/risks/scan', { project_id: projectId }),
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const reportApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  generateDailyReport: (projectId?: string) => 
    api.post('/reports/daily-report', { project_id: projectId }),
  getRiskAnalytics: (projectId?: string) => 
    api.get('/reports/analytics/risks', { params: { project_id: projectId } }),
};

export const aiApi = {
  aiChat: (message: string, conversationId?: string) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ message });
    if (conversationId) {
      params.append('conversation_id', conversationId);
    }
    return new EventSource(`/api/ai/chat?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } as any);
  },

  aiParse: (content: string) => 
    api.post('/ai/parse', { content }),

  aiAnalyze: (projectId: string) => 
    api.post(`/ai/analyze/${projectId}`),

  getConversations: () => 
    api.get('/ai/conversations'),

  getConversation: (id: string) => 
    api.get(`/ai/conversations/${id}`),

  deleteConversation: (id: string) => 
    api.delete(`/ai/conversations/${id}`),
};

export const workbenchApi = {
  getOverview: () => api.get('/workbench/overview'),
  getTodos: () => api.get('/workbench/todos'),
  getSchedule: () => api.get('/workbench/schedule'),
  getStats: () => api.get('/workbench/stats'),
  completeTodo: (id: string) => api.put(`/workbench/todos/${id}/complete`),
};

export const teamApi = {
  getStatus: () => api.get('/team/status'),
  getWorkload: () => api.get('/team/workload'),
  getWorkloadSummary: () => api.get('/team/workload/summary'),
  getMessages: () => api.get('/team/messages'),
  sendMessage: (data: any) => api.post('/team/messages', data),
};

export const stagesApi = {
  getProjectStages: (projectId: string) => api.get(`/projects/${projectId}/stages`),
  createStage: (projectId: string, data: any) => api.post(`/projects/${projectId}/stages`, data),
  updateStage: (projectId: string, stageId: string, data: any) => 
    api.put(`/projects/${projectId}/stages/${stageId}`, data),
  deleteStage: (projectId: string, stageId: string) => 
    api.delete(`/projects/${projectId}/stages/${stageId}`),
  updateStageStatus: (projectId: string, stageId: string, status: string) => 
    api.put(`/projects/${projectId}/stages/${stageId}/status`, { status }),
  reorderStages: (projectId: string, stageIds: string[]) => 
    api.put(`/projects/${projectId}/stages/reorder`, { stage_ids: stageIds }),
};

export const templatesApi = {
  getTemplates: () => api.get('/templates'),
  createTemplate: (data: any) => api.post('/templates', data),
  getTemplate: (id: string) => api.get(`/templates/${id}`),
  deleteTemplate: (id: string) => api.delete(`/templates/${id}`),
  applyTemplate: (projectId: string, templateId: string) => 
    api.post(`/templates/${templateId}/apply`, { project_id: projectId }),
};

export const performanceApi = {
  getTeamPerformance: () => api.get('/performance/team'),
  getTeamTrends: (period: 'week' | 'month') => api.get('/performance/team/trends', { params: { period } }),
  getMembersPerformance: () => api.get('/performance/members'),
  getMemberPerformance: (memberId: string) => api.get(`/performance/members/${memberId}`),
  compareMembers: (memberIds: string[]) => api.post('/performance/members/compare', { member_ids: memberIds }),
};

export const knowledgeApi = {
  getList: (params?: any) => api.get('/knowledge', { params }),
  create: (data: any) => api.post('/knowledge', data),
  getDetail: (id: string) => api.get(`/knowledge/${id}`),
  update: (id: string, data: any) => api.put(`/knowledge/${id}`, data),
  delete: (id: string) => api.delete(`/knowledge/${id}`),
  search: (keyword: string) => api.get('/knowledge/search', { params: { keyword } }),
  getByProject: (projectId: string) => api.get(`/knowledge/project/${projectId}`),
  linkProject: (knowledgeId: string, projectId: string) => 
    api.post(`/knowledge/${knowledgeId}/link-project`, { project_id: projectId }),
  getCategories: () => api.get('/knowledge/categories'),
  getTags: () => api.get('/knowledge/tags'),
};

export const smartAssignApi = {
  getRecommendations: (taskId: string) => api.get(`/smart-assign/task/${taskId}/recommendations`),
  getWorkloadBalance: () => api.get('/smart-assign/workload-balance'),
  addSkill: (userId: string, skill: string, level: number) => 
    api.post(`/smart-assign/skills`, { user_id: userId, skill, level }),
  getUserSkills: (userId: string) => api.get(`/smart-assign/skills/${userId}`),
  updateSkill: (skillId: string, level: number) => 
    api.put(`/smart-assign/skills/${skillId}`, { level }),
  deleteSkill: (skillId: string) => api.delete(`/smart-assign/skills/${skillId}`),
};

export const permissionsApi = {
  getAll: () => api.get('/permissions'),
  getRolePermissions: (roleId: string) => api.get(`/permissions/roles/${roleId}`),
  updateRolePermissions: (roleId: string, permissions: string[]) => 
    api.put(`/permissions/roles/${roleId}`, { permissions }),
  getUserPermissions: (userId: string) => api.get(`/permissions/users/${userId}`),
  updateUserPermissions: (userId: string, permissions: string[]) => 
    api.put(`/permissions/users/${userId}`, { permissions }),
  checkPermission: (permission: string) => api.post('/permissions/check', { permission }),
};

export default api;
