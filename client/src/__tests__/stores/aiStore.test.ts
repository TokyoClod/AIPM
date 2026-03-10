import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAIStore } from '../../stores/aiStore';
import * as api from '../../api';

// Mock API
vi.mock('../../api', () => ({
  aiApi: {
    getConversations: vi.fn(),
    getConversation: vi.fn(),
    deleteConversation: vi.fn(),
    aiChat: vi.fn(),
  },
}));

describe('aiStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 重置 store 状态
    useAIStore.setState({
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
      isOpen: false,
      unreadCount: 0,
      streamingContent: '',
    });
  });

  it('初始状态应该是正确的', () => {
    const state = useAIStore.getState();
    
    expect(state.conversations).toEqual([]);
    expect(state.currentConversation).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.isStreaming).toBe(false);
    expect(state.isOpen).toBe(false);
    expect(state.unreadCount).toBe(0);
    expect(state.streamingContent).toBe('');
  });

  it('setOpen 应该设置窗口开关状态', () => {
    const { setOpen } = useAIStore.getState();
    
    setOpen(true);
    expect(useAIStore.getState().isOpen).toBe(true);
    
    setOpen(false);
    expect(useAIStore.getState().isOpen).toBe(false);
  });

  it('打开窗口时应该清除未读数', () => {
    // 先设置未读数
    useAIStore.setState({ unreadCount: 5 });
    
    const { setOpen } = useAIStore.getState();
    setOpen(true);
    
    expect(useAIStore.getState().unreadCount).toBe(0);
  });

  it('loadConversations 应该加载对话列表', async () => {
    const mockConversations = [
      { id: '1', title: '对话1', updated_at: '2024-01-01' },
      { id: '2', title: '对话2', updated_at: '2024-01-02' },
    ];
    
    (api.aiApi.getConversations as any).mockResolvedValue({
      data: { data: mockConversations },
    });
    
    const { loadConversations } = useAIStore.getState();
    await loadConversations();
    
    const state = useAIStore.getState();
    expect(state.conversations).toEqual(mockConversations);
    expect(state.isLoading).toBe(false);
  });

  it('loadConversations 错误处理', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (api.aiApi.getConversations as any).mockRejectedValue(new Error('API Error'));
    
    const { loadConversations } = useAIStore.getState();
    await loadConversations();
    
    const state = useAIStore.getState();
    expect(state.isLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('loadConversation 应该加载特定对话', async () => {
    const mockConversation = {
      id: '1',
      title: '对话1',
      messages: [
        { id: 'm1', role: 'user', content: '你好' },
        { id: 'm2', role: 'assistant', content: '你好！' },
      ],
    };
    
    (api.aiApi.getConversation as any).mockResolvedValue({
      data: { data: mockConversation },
    });
    
    const { loadConversation } = useAIStore.getState();
    await loadConversation('1');
    
    const state = useAIStore.getState();
    expect(state.currentConversation).toEqual(mockConversation);
    expect(state.messages).toEqual(mockConversation.messages);
  });

  it('deleteConversation 应该删除对话', async () => {
    // 先设置一些对话
    useAIStore.setState({
      conversations: [
        { id: '1', title: '对话1' },
        { id: '2', title: '对话2' },
      ],
    });
    
    (api.aiApi.deleteConversation as any).mockResolvedValue({});
    
    const { deleteConversation } = useAIStore.getState();
    await deleteConversation('1');
    
    const state = useAIStore.getState();
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].id).toBe('2');
  });

  it('deleteConversation 应该清除当前对话如果删除的是当前对话', async () => {
    useAIStore.setState({
      currentConversation: { id: '1', title: '对话1' },
      messages: [{ id: 'm1', content: '消息' }],
      conversations: [{ id: '1', title: '对话1' }],
    });
    
    (api.aiApi.deleteConversation as any).mockResolvedValue({});
    
    const { deleteConversation } = useAIStore.getState();
    await deleteConversation('1');
    
    const state = useAIStore.getState();
    expect(state.currentConversation).toBeNull();
    expect(state.messages).toEqual([]);
  });

  it('createNewConversation 应该创建新对话', () => {
    useAIStore.setState({
      currentConversation: { id: '1', title: '旧对话' },
      messages: [{ id: 'm1', content: '消息' }],
    });
    
    const { createNewConversation } = useAIStore.getState();
    createNewConversation();
    
    const state = useAIStore.getState();
    expect(state.currentConversation).toBeNull();
    expect(state.messages).toEqual([]);
  });

  it('clearMessages 应该清空消息', () => {
    useAIStore.setState({
      messages: [
        { id: 'm1', content: '消息1' },
        { id: 'm2', content: '消息2' },
      ],
    });
    
    const { clearMessages } = useAIStore.getState();
    clearMessages();
    
    expect(useAIStore.getState().messages).toEqual([]);
  });

  it('incrementUnread 应该增加未读数', () => {
    useAIStore.setState({ unreadCount: 0 });
    
    const { incrementUnread } = useAIStore.getState();
    incrementUnread();
    expect(useAIStore.getState().unreadCount).toBe(1);
    
    incrementUnread();
    expect(useAIStore.getState().unreadCount).toBe(2);
  });

  it('clearUnread 应该清除未读数', () => {
    useAIStore.setState({ unreadCount: 5 });
    
    const { clearUnread } = useAIStore.getState();
    clearUnread();
    
    expect(useAIStore.getState().unreadCount).toBe(0);
  });

  it('sendMessage 应该添加用户消息', async () => {
    const mockEventSource = {
      onmessage: null as any,
      onerror: null as any,
      close: vi.fn(),
    };
    
    (api.aiApi.aiChat as any).mockReturnValue(mockEventSource);
    
    const { sendMessage } = useAIStore.getState();
    
    // 开始发送消息
    const sendPromise = sendMessage('你好');
    
    // 验证用户消息已添加
    const stateAfterSend = useAIStore.getState();
    expect(stateAfterSend.messages).toHaveLength(1);
    expect(stateAfterSend.messages[0].role).toBe('user');
    expect(stateAfterSend.messages[0].content).toBe('你好');
    expect(stateAfterSend.isStreaming).toBe(true);
    
    // 模拟接收到响应
    mockEventSource.onmessage({ data: '[DONE]' } as MessageEvent);
    
    await sendPromise;
    
    // 验证流式传输结束
    const stateAfterDone = useAIStore.getState();
    expect(stateAfterDone.isStreaming).toBe(false);
  });

  it('sendMessage 应该处理流式内容', async () => {
    const mockEventSource = {
      onmessage: null as any,
      onerror: null as any,
      close: vi.fn(),
    };
    
    (api.aiApi.aiChat as any).mockReturnValue(mockEventSource);
    
    const { sendMessage } = useAIStore.getState();
    const sendPromise = sendMessage('测试');
    
    // 模拟流式内容
    mockEventSource.onmessage({ data: JSON.stringify({ content: '你' }) } as MessageEvent);
    expect(useAIStore.getState().streamingContent).toBe('你');
    
    mockEventSource.onmessage({ data: JSON.stringify({ content: '好' }) } as MessageEvent);
    expect(useAIStore.getState().streamingContent).toBe('你好');
    
    // 结束
    mockEventSource.onmessage({ data: '[DONE]' } as MessageEvent);
    
    await sendPromise;
    
    const state = useAIStore.getState();
    expect(state.streamingContent).toBe('');
    expect(state.messages).toHaveLength(2); // 用户消息 + 助手消息
  });

  it('sendMessage 应该处理错误', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockEventSource = {
      onmessage: null as any,
      onerror: null as any,
      close: vi.fn(),
    };
    
    (api.aiApi.aiChat as any).mockReturnValue(mockEventSource);
    
    const { sendMessage } = useAIStore.getState();
    const sendPromise = sendMessage('测试');
    
    // 触发错误
    mockEventSource.onerror(new Event('error'));
    
    await sendPromise;
    
    const state = useAIStore.getState();
    expect(state.isStreaming).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('sendMessage 应该更新对话 ID（新对话）', async () => {
    const mockEventSource = {
      onmessage: null as any,
      onerror: null as any,
      close: vi.fn(),
    };
    
    (api.aiApi.aiChat as any).mockReturnValue(mockEventSource);
    
    const { sendMessage } = useAIStore.getState();
    const sendPromise = sendMessage('新对话');
    
    // 模拟返回新的对话 ID
    mockEventSource.onmessage({ 
      data: JSON.stringify({ conversation_id: 'new-conv-id' }) 
    } as MessageEvent);
    
    mockEventSource.onmessage({ data: '[DONE]' } as MessageEvent);
    
    await sendPromise;
    
    const state = useAIStore.getState();
    expect(state.currentConversation?.id).toBe('new-conv-id');
  });
});
