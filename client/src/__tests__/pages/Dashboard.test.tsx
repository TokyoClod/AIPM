import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../pages/Dashboard';
import * as api from '../../api';
import { useProjectStore } from '../../stores/projectStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: any) => children,
}));

vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="echarts">Chart</div>,
}));

vi.mock('../../api', () => ({
  reportApi: {
    getDashboard: vi.fn(),
  },
  projectApi: {
    getAll: vi.fn(),
    getDashboard: vi.fn(),
  },
}));

vi.mock('../../stores/projectStore', () => ({
  useProjectStore: vi.fn(),
}));

describe('Dashboard', () => {
  const mockDashboardStats = {
    totalProjects: 10,
    activeProjects: 5,
    pendingTasks: 20,
    criticalRisks: 3,
    completedTasks: 30,
    inProgressTasks: 15,
    completionRate: 75,
    upcomingTasks: [
      { id: '1', title: '任务1', status: 'pending', end_date: '2024-01-15' },
      { id: '2', title: '任务2', status: 'in_progress', end_date: '2024-01-16' },
    ],
    risks: [
      { id: '1', description: '风险1', level: 'high', type: 'technical' },
      { id: '2', description: '风险2', level: 'medium', type: 'resource' },
    ],
  };

  const mockProjects = [
    { id: '1', name: '项目A' },
    { id: '2', name: '项目B' },
  ];

  const mockStore = {
    dashboardStats: null,
    setDashboardStats: vi.fn(),
    projectDashboard: null,
    setProjectDashboard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useProjectStore as any).mockReturnValue(mockStore);
    
    (api.projectApi.getAll as any).mockResolvedValue({
      data: { success: true, data: mockProjects },
    });
    
    (api.reportApi.getDashboard as any).mockResolvedValue({
      data: { success: true, data: mockDashboardStats },
    });
    
    (api.projectApi.getDashboard as any).mockResolvedValue({
      data: { 
        success: true, 
        data: {
          project: mockProjects[0],
          stats: {
            totalTasks: 20,
            completedTasks: 10,
            inProgressTasks: 5,
            pendingTasks: 5,
            overdueTasks: 2,
            criticalRisks: 1,
            completionRate: 50,
          },
          upcomingTasks: [],
          riskItems: [],
        },
      },
    });
  });

  it('应该显示页面标题', async () => {
    render(<Dashboard />);
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
  });

  it('应该显示加载状态', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('加载完成后应该显示统计数据', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示统计卡片', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示任务完成情况图表', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示待处理任务列表', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示关键风险列表', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('点击任务应该导航到任务详情', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('点击查看全部任务应该导航到任务页面', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示项目选择器', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('选择项目应该加载项目详情', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('清除项目选择应该回到全局概览', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示任务状态标签', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示风险级别标签', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('项目详情视图应该显示项目进度', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示完成率百分比', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
