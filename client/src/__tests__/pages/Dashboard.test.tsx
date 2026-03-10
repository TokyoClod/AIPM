import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../pages/Dashboard';
import * as api from '../../api';
import { useProjectStore } from '../../stores/projectStore';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: any) => children,
}));

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="echarts">Chart</div>,
}));

// Mock API
vi.mock('../../api', () => ({
  reportApi: {
    getDashboard: vi.fn(),
  },
  projectApi: {
    getAll: vi.fn(),
    getDashboard: vi.fn(),
  },
}));

// Mock projectStore
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
    
    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument();
    });
  });

  it('应该显示加载状态', () => {
    render(<Dashboard />);
    
    // 初始应该显示加载状态
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('加载完成后应该显示统计数据', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // totalProjects
      expect(screen.getByText('5')).toBeInTheDocument(); // activeProjects
    });
  });

  it('应该显示统计卡片', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('总项目数')).toBeInTheDocument();
      expect(screen.getByText('活跃项目')).toBeInTheDocument();
      expect(screen.getByText('待处理任务')).toBeInTheDocument();
      expect(screen.getByText('关键风险')).toBeInTheDocument();
    });
  });

  it('应该显示任务完成情况图表', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('任务完成情况')).toBeInTheDocument();
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });
  });

  it('应该显示风险分布图表', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('风险分布')).toBeInTheDocument();
    });
  });

  it('应该显示待处理任务列表', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('待处理任务')).toBeInTheDocument();
      expect(screen.getByText('任务1')).toBeInTheDocument();
      expect(screen.getByText('任务2')).toBeInTheDocument();
    });
  });

  it('应该显示关键风险列表', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('关键风险')).toBeInTheDocument();
      expect(screen.getByText('风险1')).toBeInTheDocument();
      expect(screen.getByText('风险2')).toBeInTheDocument();
    });
  });

  it('点击任务应该导航到任务详情', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('任务1')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('任务1'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/tasks/1');
  });

  it('点击查看全部任务应该导航到任务页面', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('查看全部')).toBeInTheDocument();
    });
    
    const viewAllLinks = screen.getAllByText('查看全部');
    await user.click(viewAllLinks[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/tasks');
  });

  it('点击查看全部风险应该导航到风险页面', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('查看全部')).toHaveLength(2);
    });
    
    const viewAllLinks = screen.getAllByText('查看全部');
    await user.click(viewAllLinks[1]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/risks');
  });

  it('应该显示项目选择器', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('选择项目查看详情')).toBeInTheDocument();
    });
  });

  it('选择项目应该加载项目详情', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('选择项目查看详情')).toBeInTheDocument();
    });
    
    // 选择项目
    const select = screen.getByPlaceholderText('选择项目查看详情');
    await user.click(select);
    
    await waitFor(() => {
      expect(screen.getByText('项目A')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('项目A'));
    
    await waitFor(() => {
      expect(api.projectApi.getDashboard).toHaveBeenCalledWith('1');
    });
  });

  it('清除项目选择应该回到全局概览', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('选择项目查看详情')).toBeInTheDocument();
    });
    
    // 选择项目
    const select = screen.getByPlaceholderText('选择项目查看详情');
    await user.click(select);
    
    await waitFor(() => {
      expect(screen.getByText('项目A')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('项目A'));
    
    // 清除选择
    await user.click(select);
    await user.click(screen.getByText('全局概览'));
    
    await waitFor(() => {
      expect(api.reportApi.getDashboard).toHaveBeenCalled();
    });
  });

  it('应该显示任务状态标签', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
    });
  });

  it('应该显示风险级别标签', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });
  });

  it('API 错误应该被处理', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (api.reportApi.getDashboard as any).mockRejectedValue(new Error('API Error'));
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('项目详情视图应该显示项目进度', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('选择项目查看详情')).toBeInTheDocument();
    });
    
    // 选择项目
    const select = screen.getByPlaceholderText('选择项目查看详情');
    await user.click(select);
    
    await waitFor(() => {
      expect(screen.getByText('项目A')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('项目A'));
    
    await waitFor(() => {
      // 项目详情视图应该显示不同的统计
      expect(screen.getByText('总任务数')).toBeInTheDocument();
      expect(screen.getByText('已完成任务')).toBeInTheDocument();
    });
  });

  it('空数据应该显示空状态', async () => {
    (api.reportApi.getDashboard as any).mockResolvedValue({
      data: { success: true, data: null },
    });
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('暂无待处理任务')).toBeInTheDocument();
    });
  });

  it('应该显示完成率百分比', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });
});
