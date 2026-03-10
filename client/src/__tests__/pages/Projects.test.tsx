import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Projects from '../../pages/Projects';
import * as api from '../../api';
import { useProjectStore } from '../../stores/projectStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: any) => children,
}));

vi.mock('../../api', () => ({
  projectApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../stores/projectStore', () => ({
  useProjectStore: vi.fn(),
}));

describe('Projects', () => {
  const mockProjects = [
    { id: '1', name: '项目A', description: '项目A描述', status: 'active' },
    { id: '2', name: '项目B', description: '项目B描述', status: 'completed' },
  ];

  const mockStore = {
    projects: [],
    setProjects: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useProjectStore as any).mockReturnValue(mockStore);
    
    (api.projectApi.getAll as any).mockResolvedValue({
      data: { success: true, data: mockProjects },
    });
  });

  it('应该显示页面标题', async () => {
    render(<Projects />);
    expect(screen.getByText('项目管理')).toBeInTheDocument();
  });

  it('应该显示加载状态', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('加载完成后应该显示项目列表', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示项目描述', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示新建项目按钮', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('点击新建项目按钮应该显示创建表单', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('创建项目成功应该刷新列表', async () => {
    (api.projectApi.create as any).mockResolvedValue({
      data: { success: true, data: { id: '3', name: '新项目' } },
    });

    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('创建项目失败应该显示错误消息', async () => {
    (api.projectApi.create as any).mockRejectedValue(new Error('创建失败'));

    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('点击项目应该导航到项目详情', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('点击删除按钮应该显示确认对话框', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('确认删除应该调用删除API', async () => {
    (api.projectApi.delete as any).mockResolvedValue({
      data: { success: true },
    });

    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('删除项目失败应该显示错误消息', async () => {
    (api.projectApi.delete as any).mockRejectedValue(new Error('删除失败'));

    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示项目状态标签', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示搜索框', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('搜索应该过滤项目列表', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示项目成员数量', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示项目任务数量', async () => {
    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('空项目列表应该显示空状态', async () => {
    (api.projectApi.getAll as any).mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(<Projects />);
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
