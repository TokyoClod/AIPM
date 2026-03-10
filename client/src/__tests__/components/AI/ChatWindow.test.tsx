import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatWindow from '../../../components/AI/ChatWindow';
import { useAIStore } from '../../../stores/aiStore';

// Mock aiStore
vi.mock('../../../stores/aiStore', () => ({
  useAIStore: vi.fn(),
}));

// Mock MessageList 组件
vi.mock('../../../components/AI/MessageList', () => ({
  default: ({ messages }: any) => (
    <div data-testid="message-list">
      {messages?.map((m: any) => (
        <div key={m.id} data-testid={`message-${m.id}`}>
          {m.content}
        </div>
      ))}
    </div>
  ),
}));

// Mock VoiceInput 组件
vi.mock('../../../components/AI/VoiceInput', () => ({
  default: ({ onTranscript }: any) => (
    <button
      data-testid="voice-input"
      onClick={() => onTranscript?.('语音文本')}
    >
      Voice
    </button>
  ),
}));

describe('ChatWindow', () => {
  const mockStore = {
    messages: [],
    conversations: [],
    currentConversation: null,
    isLoading: false,
    isStreaming: false,
    streamingContent: '',
    sendMessage: vi.fn(),
    loadConversations: vi.fn(),
    loadConversation: vi.fn(),
    deleteConversation: vi.fn(),
    createNewConversation: vi.fn(),
    setOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAIStore as any).mockReturnValue(mockStore);
  });

  it('应该渲染聊天窗口头部', () => {
    render(<ChatWindow />);
    
    expect(screen.getByText('AI助手')).toBeInTheDocument();
  });

  it('应该渲染输入区域', () => {
    render(<ChatWindow />);
    
    expect(screen.getByPlaceholderText('输入消息... (Shift+Enter换行)')).toBeInTheDocument();
  });

  it('应该渲染操作按钮', () => {
    render(<ChatWindow />);
    
    // 新对话按钮
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('应该能够输入消息', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    
    const input = screen.getByPlaceholderText('输入消息... (Shift+Enter换行)');
    await user.type(input, '测试消息');
    
    expect(input).toHaveValue('测试消息');
  });

  it('点击发送按钮应该发送消息', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    
    const input = screen.getByPlaceholderText('输入消息... (Shift+Enter换行)');
    await user.type(input, '测试消息');
    
    // 找到发送按钮（带有 SendOutlined 图标的按钮）
    const sendButton = screen.getByRole('button', { name: '' });
    await user.click(sendButton);
    
    // 由于输入框有值，应该触发发送
    await waitFor(() => {
      expect(mockStore.sendMessage).toHaveBeenCalled();
    });
  });

  it('按 Enter 键应该发送消息', async () => {
    render(<ChatWindow />);
    
    const input = screen.getByPlaceholderText('输入消息... (Shift+Enter换行)');
    fireEvent.change(input, { target: { value: '测试消息' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    await waitFor(() => {
      expect(mockStore.sendMessage).toHaveBeenCalledWith('测试消息');
    });
  });

  it('按 Shift+Enter 应该换行而不是发送', async () => {
    render(<ChatWindow />);
    
    const input = screen.getByPlaceholderText('输入消息... (Shift+Enter换行)');
    fireEvent.change(input, { target: { value: '测试消息' } });
    fireEvent.keyPress(input, { 
      key: 'Enter', 
      code: 'Enter', 
      charCode: 13,
      shiftKey: true 
    });
    
    // 不应该发送消息
    expect(mockStore.sendMessage).not.toHaveBeenCalled();
  });

  it('空消息不应该发送', async () => {
    render(<ChatWindow />);
    
    const input = screen.getByPlaceholderText('输入消息... (Shift+Enter换行)');
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    expect(mockStore.sendMessage).not.toHaveBeenCalled();
  });

  it('流式传输时应该禁用输入', () => {
    (useAIStore as any).mockReturnValue({
      ...mockStore,
      isStreaming: true,
    });
    
    render(<ChatWindow />);
    
    const input = screen.getByPlaceholderText('输入消息... (Shift+Enter换行)');
    expect(input).toBeDisabled();
  });

  it('应该显示加载状态', () => {
    (useAIStore as any).mockReturnValue({
      ...mockStore,
      isLoading: true,
    });
    
    render(<ChatWindow />);
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('应该显示消息列表', () => {
    const messages = [
      { id: '1', role: 'user', content: '你好' },
      { id: '2', role: 'assistant', content: '你好！有什么可以帮助你的？' },
    ];
    
    (useAIStore as any).mockReturnValue({
      ...mockStore,
      messages,
    });
    
    render(<ChatWindow />);
    
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
  });

  it('点击新对话按钮应该创建新对话', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    
    // 找到新对话按钮（第一个按钮）
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    
    expect(mockStore.createNewConversation).toHaveBeenCalled();
  });

  it('点击关闭按钮应该关闭窗口', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    
    // 找到关闭按钮（最后一个按钮）
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);
    
    expect(mockStore.setOpen).toHaveBeenCalledWith(false);
  });

  it('应该显示历史对话侧边栏', async () => {
    const user = userEvent.setup();
    const conversations = [
      { id: '1', title: '对话1', updated_at: '2024-01-01' },
    ];
    
    (useAIStore as any).mockReturnValue({
      ...mockStore,
      conversations,
    });
    
    render(<ChatWindow />);
    
    // 点击历史按钮
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]);
    
    expect(screen.getByText('历史对话')).toBeInTheDocument();
    expect(screen.getByText('对话1')).toBeInTheDocument();
  });

  it('历史对话为空时应该显示空状态', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    
    // 点击历史按钮
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]);
    
    expect(screen.getByText('暂无对话记录')).toBeInTheDocument();
  });

  it('应该能够选择历史对话', async () => {
    const user = userEvent.setup();
    const conversations = [
      { id: '1', title: '对话1', updated_at: '2024-01-01' },
    ];
    
    (useAIStore as any).mockReturnValue({
      ...mockStore,
      conversations,
    });
    
    render(<ChatWindow />);
    
    // 打开历史侧边栏
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]);
    
    // 点击对话项
    await user.click(screen.getByText('对话1'));
    
    expect(mockStore.loadConversation).toHaveBeenCalledWith('1');
  });

  it('语音输入应该添加文本到输入框', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    
    const voiceButton = screen.getByTestId('voice-input');
    await user.click(voiceButton);
    
    const input = screen.getByPlaceholderText('输入消息... (Shift+Enter换行)');
    expect(input).toHaveValue('语音文本');
  });

  it('应该高亮当前选中的对话', async () => {
    const user = userEvent.setup();
    const conversations = [
      { id: '1', title: '对话1', updated_at: '2024-01-01' },
      { id: '2', title: '对话2', updated_at: '2024-01-02' },
    ];
    
    (useAIStore as any).mockReturnValue({
      ...mockStore,
      conversations,
      currentConversation: { id: '1' },
    });
    
    render(<ChatWindow />);
    
    // 打开历史侧边栏
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]);
    
    // 检查当前对话是否有 active 类
    const activeItem = screen.getByText('对话1').closest('.history-item');
    expect(activeItem).toHaveClass('active');
  });
});
