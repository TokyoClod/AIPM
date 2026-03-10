import React, { useEffect, useRef } from 'react';
import { AIMessage } from '../../types';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import './MessageList.css';

interface MessageListProps {
  messages: AIMessage[];
  streamingContent?: string;
  isStreaming?: boolean;
}

// 代码块组件
const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // 动态导入highlight.js并高亮代码
      import('highlight.js').then((hljs) => {
        if (codeRef.current) {
          hljs.default.highlightElement(codeRef.current);
        }
      });
    }
  }, [value]);

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">{language || 'plaintext'}</span>
        <button 
          className="copy-button"
          onClick={() => navigator.clipboard.writeText(value)}
        >
          复制
        </button>
      </div>
      <pre>
        <code ref={codeRef} className={`language-${language}`}>
          {value}
        </code>
      </pre>
    </div>
  );
};

// Markdown渲染组件
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  // 简单的Markdown解析器（如果react-markdown未安装）
  const parseMarkdown = (text: string): React.ReactNode => {
    // 处理代码块
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // 添加代码块前的文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex} className="markdown-text">
            {parseInlineMarkdown(text.substring(lastIndex, match.index))}
          </span>
        );
      }

      // 添加代码块
      parts.push(
        <CodeBlock 
          key={match.index} 
          language={match[1] || 'plaintext'} 
          value={match[2].trim()} 
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // 添加最后的文本
    if (lastIndex < text.length) {
      parts.push(
        <span key={lastIndex} className="markdown-text">
          {parseInlineMarkdown(text.substring(lastIndex))}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  // 解析行内Markdown
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    // 处理行内代码
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // 处理粗体
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // 处理链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // 处理换行
    text = text.replace(/\n/g, '<br/>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return <div className="markdown-content">{parseMarkdown(content)}</div>;
};

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  streamingContent = '', 
  isStreaming = false 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`message-item ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
        >
          <div className="message-avatar">
            {message.role === 'user' ? (
              <UserOutlined />
            ) : (
              <RobotOutlined />
            )}
          </div>
          <div className="message-content">
            <div className="message-role">
              {message.role === 'user' ? '你' : 'AI助手'}
            </div>
            <div className="message-text">
              <MarkdownRenderer content={message.content} />
            </div>
            <div className="message-time">
              {new Date(message.created_at).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      ))}
      
      {/* 流式响应内容 */}
      {isStreaming && streamingContent && (
        <div className="message-item assistant-message streaming">
          <div className="message-avatar">
            <RobotOutlined />
          </div>
          <div className="message-content">
            <div className="message-role">AI助手</div>
            <div className="message-text">
              <MarkdownRenderer content={streamingContent} />
            </div>
          </div>
        </div>
      )}
      
      {/* 加载指示器 */}
      {isStreaming && !streamingContent && (
        <div className="message-item assistant-message loading">
          <div className="message-avatar">
            <RobotOutlined />
          </div>
          <div className="message-content">
            <div className="message-role">AI助手</div>
            <div className="message-text">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
