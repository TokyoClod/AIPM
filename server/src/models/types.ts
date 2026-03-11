export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'leader' | 'member';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'archived' | 'suspended';
  owner_id: string;
  owner?: User;
  members?: ProjectMember[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'member';
  user?: User;
  created_at: string;
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
  creator_id: string;
  order_index: number;
  assignee?: User;
  creator?: User;
  children?: Task[];
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  user?: User;
  created_at: string;
}

export interface Risk {
  id: string;
  project_id: string;
  task_id?: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  type: 'technical' | 'resource' | 'schedule' | 'quality' | 'other';
  description: string;
  mitigation?: string;
  status: 'identified' | 'mitigating' | 'resolved' | 'accepted';
  created_by: string;
  creator?: User;
  task?: Task;
  created_at: string;
  updated_at: string;
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
  pendingTasks: number;
  inProgressTasks: number;
  totalRisks: number;
  criticalRisks: number;
  upcomingDeadlines: Task[];
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  user_id: string;
  user?: User;
  project_id?: string;
  task_id?: string;
  created_at: string;
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
  memberWorkload: { user: User; taskCount: number; completedCount: number }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface Report {
  id: string;
  project_id: string;
  type: 'weekly' | 'monthly' | 'custom';
  title: string;
  period_start: string;
  period_end: string;
  content: ReportContent;
  generated_by: string;
  format: 'json' | 'pdf' | 'html';
  created_at: string;
  updated_at: string;
}

export interface ReportContent {
  overview: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    completionRate: number;
    delayedTasks: number;
    criticalRisks: number;
  };
  completedTasks: Task[];
  plannedTasks: Task[];
  risks: Risk[];
  aiSummary?: string;
  aiRecommendations?: string[];
  trends?: {
    completionTrend: number[];
    riskTrend: number[];
  };
}

export interface ProjectStage {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
  status: 'pending' | 'active' | 'completed' | 'paused';
  required_task_ids: string[];
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  stages: WorkflowTemplateStage[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTemplateStage {
  name: string;
  order_index: number;
  required_task_ids?: string[];
}
