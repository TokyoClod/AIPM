import React, { useState, useRef, useEffect } from 'react';
import { MessageOutlined, CloseOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import ChatWindow from './ChatWindow';
import { useAIStore } from '../../stores/aiStore';
import './AIAssistant.css';

const AIAssistant: React.FC = () => {
  const { isOpen, setOpen, unreadCount } = useAIStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);

  // 初始化位置 - 右下角
  useEffect(() => {
    const initPosition = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setPosition({
        x: windowWidth - 80,
        y: windowHeight - 80,
      });
    };
    
    initPosition();
    window.addEventListener('resize', initPosition);
    return () => window.removeEventListener('resize', initPosition);
  }, []);

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    hasDragged.current = false;
  };

  // 处理拖拽移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      hasDragged.current = true;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // 边界限制
      const buttonSize = 56;
      const maxX = window.innerWidth - buttonSize;
      const maxY = window.innerHeight - buttonSize;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 处理点击
  const handleClick = () => {
    // 如果发生了拖拽，不触发点击
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }
    setOpen(!isOpen);
  };

  // 触摸事件支持（移动端）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!buttonRef.current) return;
    
    const touch = e.touches[0];
    const rect = buttonRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    setIsDragging(true);
    hasDragged.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    hasDragged.current = true;
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    
    // 边界限制
    const buttonSize = 56;
    const maxX = window.innerWidth - buttonSize;
    const maxY = window.innerHeight - buttonSize;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      {/* 浮动按钮 */}
      <div
        ref={buttonRef}
        className={`ai-assistant-button ${isOpen ? 'open' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          left: position.x,
          top: position.y,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Badge count={unreadCount} offset={[-5, 5]}>
          <div className="button-inner">
            {isOpen ? (
              <CloseOutlined className="button-icon" />
            ) : (
              <MessageOutlined className="button-icon" />
            )}
          </div>
        </Badge>
      </div>

      {/* 对话窗口 */}
      {isOpen && (
        <div 
          className="ai-assistant-window"
          style={{
            // 确保窗口在按钮附近显示
            right: window.innerWidth - position.x + 20,
            bottom: window.innerHeight - position.y,
          }}
        >
          <ChatWindow />
        </div>
      )}
    </>
  );
};

export default AIAssistant;
