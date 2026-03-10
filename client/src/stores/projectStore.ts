import { create } from 'zustand';

interface ProjectState {
  projects: any[];
  currentProject: any | null;
  projectDashboard: any | null;
  tasks: any[];
  risks: any[];
  dashboardStats: any | null;
  loading: boolean;
  setProjects: (projects: any[]) => void;
  setCurrentProject: (project: any | null) => void;
  setProjectDashboard: (dashboard: any | null) => void;
  setTasks: (tasks: any[]) => void;
  setRisks: (risks: any[]) => void;
  setDashboardStats: (stats: any | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  projectDashboard: null,
  tasks: [],
  risks: [],
  dashboardStats: null,
  loading: false,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjectDashboard: (dashboard) => set({ projectDashboard: dashboard }),
  setTasks: (tasks) => set({ tasks }),
  setRisks: (risks) => set({ risks }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setLoading: (loading) => set({ loading }),
}));
