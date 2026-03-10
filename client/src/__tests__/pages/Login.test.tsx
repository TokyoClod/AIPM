import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login';
import * as api from '../../api';
import { useAuthStore } from '../../stores/authStore';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: any) => children,
}));

// Mock API
vi.mock('../../api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

// Mock authStore
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('Login', () => {
  const mockSetAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      setAuth: mockSetAuth,
    });
  });

  it('应该渲染登录表单', () => {
    render(<Login />);
    
    expect(screen.getByText('AIPM 项目管理平台')).toBeInTheDocument();
    expect(screen.getByText('登录')).toBeInTheDocument();
    expect(screen.getByText('注册')).toBeInTheDocument();
  });

  it('应该显示登录和注册标签页', () => {
    render(<Login />);
    
    expect(screen.getByRole('tab', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '注册' })).toBeInTheDocument();
  });

  it('登录表单应该包含邮箱和密码字段', () => {
    render(<Login />);
    
    // 默认显示登录表单
    expect(screen.getByPlaceholderText('邮箱')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
  });

  it('应该能够切换到注册标签页', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    await user.click(screen.getByRole('tab', { name: '注册' }));
    
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
  });

  it('注册表单应该包含用户名、邮箱和密码字段', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    await user.click(screen.getByRole('tab', { name: '注册' }));
    
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('邮箱')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
  });

  it('登录成功应该设置认证信息并导航到首页', async () => {
    const user = userEvent.setup();
    
    (api.authApi.login as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { id: '1', name: '测试用户', email: 'test@example.com' },
          token: 'test-token',
        },
      },
    });
    
    render(<Login />);
    
    // 填写登录表单
    await user.type(screen.getByPlaceholderText('邮箱'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));
    
    await waitFor(() => {
      expect(api.authApi.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockSetAuth).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('登录失败应该显示错误消息', async () => {
    const user = userEvent.setup();
    
    (api.authApi.login as any).mockRejectedValue({
      response: {
        data: {
          message: '邮箱或密码错误',
        },
      },
    });
    
    render(<Login />);
    
    await user.type(screen.getByPlaceholderText('邮箱'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('密码'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: '登录' }));
    
    await waitFor(() => {
      expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument();
    });
  });

  it('注册成功应该设置认证信息并导航到首页', async () => {
    const user = userEvent.setup();
    
    (api.authApi.register as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { id: '1', name: '新用户', email: 'new@example.com' },
          token: 'test-token',
        },
      },
    });
    
    render(<Login />);
    
    // 切换到注册标签页
    await user.click(screen.getByRole('tab', { name: '注册' }));
    
    // 填写注册表单
    await user.type(screen.getByPlaceholderText('用户名'), '新用户');
    await user.type(screen.getByPlaceholderText('邮箱'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '注册' }));
    
    await waitFor(() => {
      expect(api.authApi.register).toHaveBeenCalledWith('new@example.com', 'password123', '新用户');
      expect(mockSetAuth).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('注册失败应该显示错误消息', async () => {
    const user = userEvent.setup();
    
    (api.authApi.register as any).mockRejectedValue({
      response: {
        data: {
          message: '邮箱已被注册',
        },
      },
    });
    
    render(<Login />);
    
    await user.click(screen.getByRole('tab', { name: '注册' }));
    
    await user.type(screen.getByPlaceholderText('用户名'), '新用户');
    await user.type(screen.getByPlaceholderText('邮箱'), 'existing@example.com');
    await user.type(screen.getByPlaceholderText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '注册' }));
    
    await waitFor(() => {
      expect(screen.getByText('邮箱已被注册')).toBeInTheDocument();
    });
  });

  it('登录表单验证 - 邮箱必填', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    await user.click(screen.getByRole('button', { name: '登录' }));
    
    await waitFor(() => {
      expect(screen.getByText('请输入邮箱')).toBeInTheDocument();
    });
  });

  it('登录表单验证 - 密码必填', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    await user.type(screen.getByPlaceholderText('邮箱'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: '登录' }));
    
    await waitFor(() => {
      expect(screen.getByText('请输入密码')).toBeInTheDocument();
    });
  });

  it('注册表单验证 - 用户名必填', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    await user.click(screen.getByRole('tab', { name: '注册' }));
    await user.click(screen.getByRole('button', { name: '注册' }));
    
    await waitFor(() => {
      expect(screen.getByText('请输入用户名')).toBeInTheDocument();
    });
  });

  it('注册表单验证 - 邮箱格式验证', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    await user.click(screen.getByRole('tab', { name: '注册' }));
    
    await user.type(screen.getByPlaceholderText('用户名'), '测试用户');
    await user.type(screen.getByPlaceholderText('邮箱'), 'invalid-email');
    await user.type(screen.getByPlaceholderText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '注册' }));
    
    await waitFor(() => {
      expect(screen.getByText('请输入有效邮箱')).toBeInTheDocument();
    });
  });

  it('注册表单验证 - 密码长度验证', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    await user.click(screen.getByRole('tab', { name: '注册' }));
    
    await user.type(screen.getByPlaceholderText('用户名'), '测试用户');
    await user.type(screen.getByPlaceholderText('邮箱'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('密码'), '12345');
    await user.click(screen.getByRole('button', { name: '注册' }));
    
    await waitFor(() => {
      expect(screen.getByText('密码至少6位')).toBeInTheDocument();
    });
  });

  it('登录时按钮应该显示加载状态', async () => {
    const user = userEvent.setup();
    
    // 模拟慢速响应
    (api.authApi.login as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<Login />);
    
    await user.type(screen.getByPlaceholderText('邮箱'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));
    
    // 按钮应该显示加载状态
    const button = screen.getByRole('button', { name: /登录/i });
    expect(button).toHaveAttribute('loading');
  });

  it('注册时按钮应该显示加载状态', async () => {
    const user = userEvent.setup();
    
    (api.authApi.register as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<Login />);
    
    await user.click(screen.getByRole('tab', { name: '注册' }));
    
    await user.type(screen.getByPlaceholderText('用户名'), '测试用户');
    await user.type(screen.getByPlaceholderText('邮箱'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '注册' }));
    
    const button = screen.getByRole('button', { name: /注册/i });
    expect(button).toHaveAttribute('loading');
  });
});
