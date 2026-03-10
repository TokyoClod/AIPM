import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Projects from '../../pages/Projects';
import * as api from '../../api';
import { useProjectStore } from '../../stores/projectStore';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: any) => children,
}));

// Mock API
vi.mock('../../api', () => ({
  projectApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  authApi: {
    getUsers: vi.fn(),
  },
}));

// Mock projectStore
vi.mock('../../stores/projectStore', () => ({
  useProjectStore: vi.fn(),
}));

describe('Projects', () => {
  const mockProjects = [
    {
      id: '1',
      name: '项目A',
      description: '项目A描述',
      status: 'active',
      owner_name: '管理员',
      start_date: '2024-01-01',
      end_date: '2024-06-30',
    },
    {
      id: '2',
      name: '项目B',
      description: '项目B描述',
      status: 'completed',
      owner_name: '用户1',
      start_date: '2024-02-01',
      end_date: '2024-07-31',
    },
  ];

  const mockUsers = [
    { id: '1', name: '管理员' },
    { id: '2', name: '用户1' },
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
    
    (api.authApi.getUsers as any).mockResolvedValue({
      data: { success: true, data: mockUsers },
    });
  });

  it('应该显示页面标题', async () => {
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    });
  });

  it('应该显示新建项目按钮', async () => {
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeInTheDocument();
    });
  });

  it('应该显示加载状态', () => {
    render(<Projects />);
    
    // Ant Design Table 的 loading 状态
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('加载完成后应该显示项目列表', async () => {
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('项目A')).toBeInTheDocument();
      expect(screen.getByText('项目B')).toBeInTheDocument();
    });
  });

  it('应该显示项目描述', async () => {
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('项目A描述')).toBeInTheDocument();
      expect(screen.getByText('项目B描述')).toBeInTheDocument();
    });
  });

  it('应该显示项目状态标签', async () => {
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('应该显示项目负责人', async () => {
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
      expect(screen.getByText('用户1')).toBeInTheDocument();
    });
  });

  it('应该显示项目日期', async () => {
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-06-30')).toBeInTheDocument();
    });
  });

  it('点击项目名称应该导航到项目详情', async () => {
    const user = userEvent.setup();
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('项目A')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('项目A'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/projects/1');
  });

  it('点击新建项目按钮应该显示创建表单', async () => {
    const user = userEvent.setup();
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('新建项目'));
    
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeInTheDocument();
      expect(screen.getByLabelText('项目名称')).toBeInTheDocument();
    });
  });

  it('应该能够创建新项目', async () => {
    const user = userEvent.setup();
    
    (api.projectApi.create as any).mockResolvedValue({
      data: { success: true },
    });
    
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeInTheDocument();
    });
    
    // 打开创建表单
    await user.click(screen.getByText('新建项目'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('项目名称')).toBeInTheDocument();
    });
    
    // 填写表单
    await user.type(screen.getByLabelText('项目名称'), '新项目');
    await user.type(screen.getByLabelText('项目描述'), '新项目描述');
    
    // 提交表单
    await user.click(screen.getByText('创建'));
    
    await waitFor(() => {
      expect(api.projectApi.create).toHaveBeenCalled();
    });
  });

  it('点击编辑按钮应该显示编辑表单', async () => {
    const user = userEvent.setup();
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('编辑')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByText('编辑');
    await user.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('编辑项目')).toBeInTheDocument();
    });
  });

  it('应该能够编辑项目', async () => {
    const user = userEvent.setup();
    
    (api.projectApi.update as any).mockResolvedValue({
      data: { success: true },
    });
    
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('编辑')).toBeInTheDocument();
    });
    
    // 点击编辑按钮
    const editButtons = screen.getAllByText('编辑');
    await user.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByLabelText('项目名称')).toBeInTheDocument();
    });
    
    // 修改项目名称
    const nameInput = screen.getByLabelText('项目名称');
    await user.clear(nameInput);
    await user.type(nameInput, '更新后的项目A');
    
    // 提交更新
    await user.click(screen.getByText('更新'));
    
    await waitFor(() => {
      expect(api.projectApi.update).toHaveBeenCalled();
    });
  });

  it('应该能够删除项目', async () => {
    const user = userEvent.setup();
    
    (api.projectApi.delete as any).mockResolvedValue({
      data: { success: true },
    });
    
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('删除')).toBeInTheDocument();
    });
    
    // 点击删除按钮
    const deleteButtons = screen.getAllByText('删除');
    await user.click(deleteButtons[0]);
    
    // 确认删除
    await waitFor(() => {
      expect(screen.getByText('确认删除?')).toBeInTheDocument();
    });
    
    // 点击确认
    await user.click(screen.getByText('确 定'));
    
    await waitFor(() => {
      expect(api.projectApi.delete).toHaveBeenCalledWith('1');
    });
  });

  it('创建项目表单验证 - 项目名称必填', async () => {
    const user = userEvent.setup();
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('新建项目'));
    
    await waitFor(() => {
      expect(screen.getByText('创建')).toBeInTheDocument();
    });
    
    // 不填写项目名称直接提交
    await user.click(screen.getByText('创建'));
    
    await waitFor(() => {
      expect(screen.getByText('请输入项目名称')).toBeInTheDocument();
    });
  });

  it('应该能够选择项目状态', async () => {
    const user = userEvent.setup();
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('新建项目'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('状态')).toBeInTheDocument();
    });
    
    // 点击状态下拉框
    await user.click(screen.getByLabelText('状态'));
    
    await waitFor(() => {
      expect(screen.getByText('进行中')).toBeInTheDocument();
      expect(screen.getByText('已完成')).toBeInTheDocument();
      expect(screen.getByText('已暂停')).toBeInTheDocument();
      expect(screen.getByText('已归档')).toBeInTheDocument();
    });
  });

  it('应该能够选择日期', async () => {
    const user = userEvent.setup();
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('新建项目'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('开始日期')).toBeInTheDocument();
      expect(screen.getByLabelText('结束日期')).toBeInTheDocument();
    });
  });

  it('点击取消应该关闭表单', async () => {
    const user = userEvent.setup();
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('新建项目'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('项目名称')).toBeInTheDocument();
    });
    
    // 点击取消
    await user.click(screen.getByText('取消'));
    
    await waitFor(() => {
      expect(screen.queryByLabelText('项目名称')).not.toBeInTheDocument();
    });
  });

  it('API 错误应该显示错误消息', async () => {
    const user = userEvent.setup();
    
    (api.projectApi.create as any).mockRejectedValue({
      response: {
        data: {
          message: '创建失败',
        },
      },
    });
    
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('新建项目'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('项目名称')).toBeInTheDocument();
    });
    
    await user.type(screen.getByLabelText('项目名称'), '新项目');
    await user.click(screen.getByText('创建'));
    
    await waitFor(() => {
      expect(screen.getByText('创建失败')).toBeInTheDocument();
    });
  });

  it('加载项目失败应该显示错误消息', async () => {
    (api.projectApi.getAll as any).mockRejectedValue(new Error('加载失败'));
    
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('加载项目失败')).toBeInTheDocument();
    });
  });

  it('应该显示分页', async () => {
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('项目A')).toBeInTheDocument();
    });
    
    // Ant Design 分页组件
    expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
  });

  it('编辑时应该预填充表单数据', async () => {
    const user = userEvent.setup();
    render(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText('编辑')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByText('编辑');
    await user.click(editButtons[0]);
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText('项目名称') as HTMLInputElement;
      expect(nameInput.value).toBe('项目A');
    });
  });
});
