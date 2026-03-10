import { vi } from 'vitest';
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock API 响应
export const mockApiResponse = <T,>(data: T, success = true) => ({
  data: {
    success,
    data,
  },
});

// Mock 错误响应
export const mockApiError = (message: string, status = 400) => ({
  response: {
    status,
    data: {
      success: false,
      message,
    },
  },
});

// 创建 wrapper 用于测试包含 router 的组件
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// 自定义 render 函数
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock API 模块
export const createMockApi = () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    getUsers: vi.fn(),
    updateUserRole: vi.fn(),
  },
  projectApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    getDashboard: vi.fn(),
  },
  taskApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateProgress: vi.fn(),
    addComment: vi.fn(),
    getGantt: vi.fn(),
  },
  riskApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAlerts: vi.fn(),
    analyzeProject: vi.fn(),
    resolveAlert: vi.fn(),
    scanProject: vi.fn(),
  },
  notificationApi: {
    getAll: vi.fn(),
    getUnreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    delete: vi.fn(),
  },
  reportApi: {
    getDashboard: vi.fn(),
    generateDailyReport: vi.fn(),
    getRiskAnalytics: vi.fn(),
  },
  aiApi: {
    aiChat: vi.fn(),
    aiParse: vi.fn(),
    aiAnalyze: vi.fn(),
    getConversations: vi.fn(),
    getConversation: vi.fn(),
    deleteConversation: vi.fn(),
  },
});

// 等待异步更新
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 重新导出 testing-library
export * from '@testing-library/react';
export { customRender as render };
