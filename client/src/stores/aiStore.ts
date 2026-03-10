import { create } from 'zustand';
import { AIConversation, AIMessage } from '../types';
import { aiApi } from '../api';

interface AIStore {
  // 状态
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  messages: AIMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  isOpen: boolean;
  unreadCount: number;
  streamingContent: string;

  // 操作
  setOpen: (open: boolean) => void;
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  createNewConversation: () => void;
  clearMessages: () => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export const useAIStore = create<AIStore>((set, get) => ({
  // 初始状态
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  isOpen: false,
  unreadCount: 0,
  streamingContent: '',

  // 设置窗口开关状态
  setOpen: (open: boolean) => {
    set({ isOpen: open });
    if (open) {
      set({ unreadCount: 0 });
    }
  },

  // 加载对话列表
  loadConversations: async () => {
    try {
      set({ isLoading: true });
      const response = await aiApi.getConversations();
      set({ 
        conversations: response.data.data || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('加载对话列表失败:', error);
      set({ isLoading: false });
    }
  },

  // 加载特定对话
  loadConversation: async (id: string) => {
    try {
      set({ isLoading: true });
      const response = await aiApi.getConversation(id);
      const conversation = response.data.data;
      set({
        currentConversation: conversation,
        messages: conversation?.messages || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('加载对话失败:', error);
      set({ isLoading: false });
    }
  },

  // 发送消息
  sendMessage: async (content: string) => {
    const { currentConversation, messages } = get();
    
    // 添加用户消息
    const userMessage: AIMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation?.id || '',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    
    set({ 
      messages: [...messages, userMessage],
      isStreaming: true,
      streamingContent: '',
    });

    try {
      // 创建EventSource连接
      const eventSource = aiApi.aiChat(content, currentConversation?.id);
      
      let assistantMessage: AIMessage = {
        id: `assistant-${Date.now()}`,
        conversation_id: currentConversation?.id || '',
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };

      eventSource.onmessage = (event) => {
        const data = event.data;
        
        // 检查是否是结束标记
        if (data === '[DONE]') {
          eventSource.close();
          set({ isStreaming: false });
          
          // 添加完整的助手消息
          const finalMessages = get().messages;
          assistantMessage.content = get().streamingContent;
          set({
            messages: [...finalMessages, assistantMessage],
            streamingContent: '',
          });
          
          // 更新对话列表
          get().loadConversations();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            set(state => ({
              streamingContent: state.streamingContent + parsed.content,
            }));
          }
          if (parsed.conversation_id && !currentConversation) {
            // 新对话，更新conversation_id
            assistantMessage.conversation_id = parsed.conversation_id;
            set({
              currentConversation: {
                id: parsed.conversation_id,
                title: content.substring(0, 30),
                messages: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            });
          }
        } catch (e) {
          // 如果不是JSON，直接追加内容
          set(state => ({
            streamingContent: state.streamingContent + data,
          }));
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource错误:', error);
        eventSource.close();
        set({ isStreaming: false });
      };

    } catch (error) {
      console.error('发送消息失败:', error);
      set({ isStreaming: false });
    }
  },

  // 删除对话
  deleteConversation: async (id: string) => {
    try {
      await aiApi.deleteConversation(id);
      const { conversations, currentConversation } = get();
      set({
        conversations: conversations.filter(c => c.id !== id),
        currentConversation: currentConversation?.id === id ? null : currentConversation,
        messages: currentConversation?.id === id ? [] : get().messages,
      });
    } catch (error) {
      console.error('删除对话失败:', error);
    }
  },

  // 创建新对话
  createNewConversation: () => {
    set({
      currentConversation: null,
      messages: [],
    });
  },

  // 清空消息
  clearMessages: () => {
    set({ messages: [] });
  },

  // 增加未读数
  incrementUnread: () => {
    set(state => ({ unreadCount: state.unreadCount + 1 }));
  },

  // 清除未读数
  clearUnread: () => {
    set({ unreadCount: 0 });
  },
}));
