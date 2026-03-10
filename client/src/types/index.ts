export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'leader' | 'member';
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'archived' | 'suspended';
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  members?: ProjectMember[];
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'member';
  name?: string;
  email?: string;
  avatar?: string;
}

export interface Task {
  id: string;
  project_id: string;
  parent_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  start_date?: string;
  end_date?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  risk_description?: string;
  assignee_id?: string;
  assignee_name?: string;
  assignee_email?: string;
  creator_id: string;
  creator_name?: string;
  order_index: number;
  children?: Task[];
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  user_name?: string;
  avatar?: string;
  created_at: string;
}

export interface Risk {
  id: string;
  project_id: string;
  task_id?: string;
  task_title?: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  type: 'technical' | 'resource' | 'schedule' | 'quality' | 'other';
  description: string;
  mitigation?: string;
  status: 'identified' | 'mitigating' | 'resolved' | 'accepted';
  created_by: string;
  creator_name?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'task' | 'project' | 'risk' | 'system';
  title: string;
  content?: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
  criticalRisks: number;
  upcomingTasks: Task[];
  risks: Risk[];
}

export interface ProjectDashboard {
  project: Project;
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalRisks: number;
    criticalRisks: number;
    completionRate: number;
  };
  taskDistribution: { status: string; count: number }[];
  priorityDistribution: { priority: string; count: number }[];
  riskItems: Risk[];
  upcomingTasks: Task[];
  memberWorkload: { id: string; name: string; email: string; avatar?: string; taskCount: number; completedCount: number }[];
}

export interface RiskAnalytics {
  byLevel: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recommendations: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// AI相关类型定义
export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export interface AIParseResult {
  tasks: Partial<Task>[];
  risks: Partial<Risk>[];
  summary: string;
}

export interface AIRiskAnalysis {
  projectId: string;
  risks: Array<{
    type: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation: string;
  }>;
  recommendations: string[];
}

// 风险预警类型定义
export interface RiskAlert {
  id: string;
  project_id: string;
  project_name?: string;
  task_id?: string;
  task_title?: string;
  alert_type: 'task_delay' | 'resource_conflict' | 'progress_anomaly' | 'deadline_approaching' | 'budget_overrun' | 'quality_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  suggestion: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'ignored';
  triggered_by: string;
  triggered_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskAnalysisResult {
  projectId: string;
  projectName: string;
  overallRiskScore: number;
  alerts: RiskAlert[];
  recommendations: string[];
  riskTrend: {
    date: string;
    score: number;
  }[];
}
