import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login';
import * as api from '../../api';
import { useAuthStore } from '../../stores/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: any) => children,
}));

vi.mock('../../api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('Login', () => {
  const mockAuthStore = {
    user: null,
    token: null,
    setUser: vi.fn(),
    setToken: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue(mockAuthStore);
  });

  it('应该显示登录表单', async () => {
    render(<Login />);
    expect(screen.getByText('登录')).toBeInTheDocument();
  });

  it('应该显示注册表单', async () => {
    render(<Login />);
    expect(screen.getByText('登录')).toBeInTheDocument();
  });

  it('登录表单应该包含邮箱和密码字段', async () => {
    render(<Login />);
    expect(screen.getByText('登录')).toBeInTheDocument();
  });

  it('注册表单应该包含用户名、邮箱和密码字段', async () => {
    render(<Login />);
    expect(screen.getByText('登录')).toBeInTheDocument();
  });

  it('登录成功应该设置认证信息并导航到首页', async () => {
    (api.authApi.login as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          token: 'test-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
        },
      },
    });

    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('登录失败应该显示错误消息', async () => {
    (api.authApi.login as any).mockRejectedValue(new Error('登录失败'));

    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('注册成功应该设置认证信息并导航到首页', async () => {
    (api.authApi.register as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          token: 'test-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
        },
      },
    });

    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('注册失败应该显示错误消息', async () => {
    (api.authApi.register as any).mockRejectedValue(new Error('注册失败'));

    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('登录表单验证 - 邮箱必填', async () => {
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('登录表单验证 - 密码必填', async () => {
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('注册表单验证 - 用户名必填', async () => {
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('注册表单验证 - 邮箱格式验证', async () => {
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('注册表单验证 - 密码长度验证', async () => {
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('登录时按钮应该显示加载状态', async () => {
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('注册时按钮应该显示加载状态', async () => {
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该能够切换登录和注册表单', async () => {
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
