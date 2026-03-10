import React, { useEffect } from 'react';
import { AudioOutlined, StopOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import './VoiceInput.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled = false }) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // 当录音结束时，将识别的文字传递给父组件
  useEffect(() => {
    if (!isListening && transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [isListening, transcript, onTranscript, resetTranscript]);

  // 显示错误信息
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 检查浏览器支持
  useEffect(() => {
    if (!isSupported) {
      console.warn('Speech recognition is not supported in this browser');
    }
  }, [isSupported]);

  const handleToggleListening = () => {
    if (disabled) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="voice-input-wrapper">
      <button
        className={`voice-btn ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggleListening}
        disabled={disabled}
        title={isListening ? '停止录音' : '开始语音输入'}
      >
        {isListening ? (
          <>
            <div className="voice-waves">
              <span className="wave"></span>
              <span className="wave"></span>
              <span className="wave"></span>
            </div>
            <StopOutlined />
          </>
        ) : (
          <AudioOutlined />
        )}
      </button>
      
      {isListening && (
        <div className="voice-status">
          <div className="voice-indicator">
            <span className="dot"></span>
            <span>正在录音...</span>
          </div>
          {(transcript || interimTranscript) && (
            <div className="voice-preview">
              {transcript}
              <span className="interim">{interimTranscript}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
