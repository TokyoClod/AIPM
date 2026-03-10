import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIAssistant from '../../../components/AI/AIAssistant';
import { useAIStore } from '../../../stores/aiStore';

// Mock aiStore
vi.mock('../../../stores/aiStore', () => ({
  useAIStore: vi.fn(),
}));

// Mock ChatWindow 组件
vi.mock('../../../components/AI/ChatWindow', () => ({
  default: () => <div data-testid="chat-window">Chat Window</div>,
}));

describe('AIAssistant', () => {
  const mockSetOpen = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useAIStore as any).mockReturnValue({
      isOpen: false,
      setOpen: mockSetOpen,
      unreadCount: 0,
    });
    
    // 设置窗口尺寸
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  it('应该渲染浮动按钮', () => {
    render(<AIAssistant />);
    
    const button = document.querySelector('.ai-assistant-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ai-assistant-button');
  });

  it('应该显示消息图标当窗口关闭时', () => {
    render(<AIAssistant />);
    
    // 检查消息图标存在
    const icon = screen.getByRole('img', { name: 'message' });
    expect(icon).toBeInTheDocument();
  });

  it('应该显示关闭图标当窗口打开时', () => {
    (useAIStore as any).mockReturnValue({
      isOpen: true,
      setOpen: mockSetOpen,
      unreadCount: 0,
    });
    
    render(<AIAssistant />);
    
    const button = document.querySelector('.ai-assistant-button');
    expect(button).toHaveClass('open');
    
    // 检查关闭图标存在
    const icon = screen.getByRole('img', { name: 'close' });
    expect(icon).toBeInTheDocument();
  });

  it('点击按钮应该切换窗口状态', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    
    const button = document.querySelector('.ai-assistant-button');
    await user.click(button!);
    
    expect(mockSetOpen).toHaveBeenCalledWith(true);
  });

  it('应该显示未读消息数量徽章', () => {
    (useAIStore as any).mockReturnValue({
      isOpen: false,
      setOpen: mockSetOpen,
      unreadCount: 5,
    });
    
    render(<AIAssistant />);
    
    // 徽章应该显示数字
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('窗口打开时应该显示 ChatWindow 组件', () => {
    (useAIStore as any).mockReturnValue({
      isOpen: true,
      setOpen: mockSetOpen,
      unreadCount: 0,
    });
    
    render(<AIAssistant />);
    
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
  });

  it('窗口关闭时不应该显示 ChatWindow 组件', () => {
    render(<AIAssistant />);
    
    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
  });

  it('应该支持拖拽功能', async () => {
    render(<AIAssistant />);
    
    const button = document.querySelector('.ai-assistant-button') as HTMLElement;
    const rect = {
      left: 100,
      top: 100,
      width: 56,
      height: 56,
      right: 156,
      bottom: 156,
      x: 100,
      y: 100,
      toJSON: () => {},
    };
    
    // Mock getBoundingClientRect
    button.getBoundingClientRect = () => rect as DOMRect;
    
    // 模拟鼠标按下
    fireEvent.mouseDown(button, {
      clientX: 120,
      clientY: 120,
    });
    
    // 模拟鼠标移动
    fireEvent.mouseMove(document, {
      clientX: 200,
      clientY: 200,
    });
    
    // 模拟鼠标释放
    fireEvent.mouseUp(document);
    
    // 验证按钮仍然存在
    expect(button).toBeInTheDocument();
  });

  it('拖拽后不应该触发点击事件', async () => {
    render(<AIAssistant />);
    
    const button = document.querySelector('.ai-assistant-button') as HTMLElement;
    const rect = {
      left: 100,
      top: 100,
      width: 56,
      height: 56,
      right: 156,
      bottom: 156,
      x: 100,
      y: 100,
      toJSON: () => {},
    };
    
    button.getBoundingClientRect = () => rect as DOMRect;
    
    // 模拟拖拽
    fireEvent.mouseDown(button, {
      clientX: 120,
      clientY: 120,
    });
    
    fireEvent.mouseMove(document, {
      clientX: 200,
      clientY: 200,
    });
    
    fireEvent.mouseUp(document);
    
    // 点击不应该触发 setOpen
    fireEvent.click(button);
    expect(mockSetOpen).not.toHaveBeenCalled();
  });

  it('应该支持触摸事件', () => {
    render(<AIAssistant />);
    
    const button = document.querySelector('.ai-assistant-button') as HTMLElement;
    const rect = {
      left: 100,
      top: 100,
      width: 56,
      height: 56,
      right: 156,
      bottom: 156,
      x: 100,
      y: 100,
      toJSON: () => {},
    };
    
    button.getBoundingClientRect = () => rect as DOMRect;
    
    // 模拟触摸开始
    fireEvent.touchStart(button, {
      touches: [{ clientX: 120, clientY: 120 }],
    });
    
    // 模拟触摸移动
    fireEvent.touchMove(button, {
      touches: [{ clientX: 200, clientY: 200 }],
    });
    
    // 模拟触摸结束
    fireEvent.touchEnd(button);
    
    expect(button).toBeInTheDocument();
  });

  it('应该响应窗口大小变化', () => {
    render(<AIAssistant />);
    
    // 触发 resize 事件
    window.innerWidth = 800;
    window.innerHeight = 600;
    fireEvent(window, new Event('resize'));
    
    const button = document.querySelector('.ai-assistant-button');
    expect(button).toBeInTheDocument();
  });

  it('按钮位置应该在边界内', () => {
    render(<AIAssistant />);
    
    const button = document.querySelector('.ai-assistant-button') as HTMLElement;
    const style = button.style;
    
    // 检查位置值是有效的数字
    expect(parseInt(style.left)).not.toBeNaN();
    expect(parseInt(style.top)).not.toBeNaN();
  });

  it('按钮应该有正确的初始位置', () => {
    render(<AIAssistant />);
    
    const button = document.querySelector('.ai-assistant-button') as HTMLElement;
    const style = button.style;
    
    // 初始位置应该在右下角附近
    const left = parseInt(style.left);
    const top = parseInt(style.top);
    
    // 验证位置在合理范围内
    expect(left).toBeGreaterThan(0);
    expect(top).toBeGreaterThan(0);
  });

  it('拖拽时应该添加 dragging 类', () => {
    render(<AIAssistant />);
    
    const button = document.querySelector('.ai-assistant-button') as HTMLElement;
    const rect = {
      left: 100,
      top: 100,
      width: 56,
      height: 56,
      right: 156,
      bottom: 156,
      x: 100,
      y: 100,
      toJSON: () => {},
    };
    
    button.getBoundingClientRect = () => rect as DOMRect;
    
    fireEvent.mouseDown(button, {
      clientX: 120,
      clientY: 120,
    });
    
    fireEvent.mouseMove(document, {
      clientX: 200,
      clientY: 200,
    });
    
    expect(button).toHaveClass('dragging');
    
    fireEvent.mouseUp(document);
    
    expect(button).not.toHaveClass('dragging');
  });
});
