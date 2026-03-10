import React, { useState, useEffect } from 'react';
import { 
  CloseOutlined, 
  SendOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  HistoryOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { Popconfirm, Empty, Spin } from 'antd';
import MessageList from './MessageList';
import VoiceInput from './VoiceInput';
import { useAIStore } from '../../stores/aiStore';
import './ChatWindow.css';

const ChatWindow: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  const {
    messages,
    conversations,
    currentConversation,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    loadConversations,
    loadConversation,
    deleteConversation,
    createNewConversation,
    setOpen,
  } = useAIStore();

  // 加载对话列表
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;
    
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  // 处理语音输入
  const handleVoiceTranscript = (text: string) => {
    setInputValue(prev => prev + text);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 切换对话
  const handleSelectConversation = async (id: string) => {
    await loadConversation(id);
    setShowHistory(false);
  };

  // 删除对话
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(id);
  };

  return (
    <div className="chat-window">
      {/* 头部 */}
      <div className="chat-header">
        <div className="header-title">
          <MessageOutlined />
          <span>AI助手</span>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={createNewConversation}
            title="新对话"
          >
            <PlusOutlined />
          </button>
          <button 
            className={`action-btn ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="历史对话"
          >
            <HistoryOutlined />
          </button>
          <button 
            className="action-btn close-btn"
            onClick={() => setOpen(false)}
            title="关闭"
          >
            <CloseOutlined />
          </button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="chat-body">
        {/* 历史对话侧边栏 */}
        {showHistory && (
          <div className="history-sidebar">
            <div className="sidebar-header">
              <h3>历史对话</h3>
            </div>
            <div className="sidebar-content">
              {conversations.length === 0 ? (
                <Empty description="暂无对话记录" />
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`history-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <div className="history-title">{conv.title}</div>
                    <div className="history-time">
                      {new Date(conv.updated_at).toLocaleDateString('zh-CN')}
                    </div>
                    <Popconfirm
                      title="确定删除此对话？"
                      onConfirm={(e) => handleDeleteConversation(conv.id, e as any)}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="确定"
                      cancelText="取消"
                    >
                      <button 
                        className="delete-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 消息区域 */}
        <div className="messages-container">
          {isLoading ? (
            <div className="loading-container">
              <Spin tip="加载中..." />
            </div>
          ) : (
            <MessageList 
              messages={messages}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
            />
          )}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="chat-input">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息... (Shift+Enter换行)"
          disabled={isStreaming}
          rows={1}
          className="input-textarea"
        />
        <VoiceInput 
          onTranscript={handleVoiceTranscript}
          disabled={isStreaming}
        />
        <button
          className={`send-btn ${inputValue.trim() && !isStreaming ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!inputValue.trim() || isStreaming}
        >
          <SendOutlined />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
