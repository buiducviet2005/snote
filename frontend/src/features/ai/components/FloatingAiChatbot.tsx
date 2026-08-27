import React, { useState, useEffect, useRef } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { AiPromptType, AiChatResponseDto } from '@snote/shared';
import {
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  BookOpen,
  CheckSquare,
  FileText,
  HelpCircle,
  Zap,
  RotateCcw,
  Bot,
  User,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestedActions?: any[];
}

export const FloatingAiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedSubjectId, subjects, selectedSemesterId } = useAppFilter();
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      content: '👋 Chào bạn! Tôi là **SNOTE AI Copilot** – Trợ lý học tập thông minh.\n\nTôi có thể giúp bạn **rút trích bài tập**, **dự đoán đề thi**, **tóm tắt bài giảng** hoặc **giải thích các khái niệm khó** bám sát môn học bạn đang chọn.',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Lắng nghe phím tắt toàn cục Ctrl + J (hoặc Cmd + J) để bật/tắt nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  const handleSendMessage = async (textToSend?: string, promptType: AiPromptType = 'GENERAL') => {
    const message = (textToSend || inputMessage).trim();
    if (!message || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await api.post<ApiResponse<AiChatResponseDto>>('/ai/chat', {
        message,
        promptType,
        subjectId: selectedSubjectId || undefined
      });

      const aiReply = res.data?.reply || 'Đã xử lý yêu cầu thành công.';
      const suggestedActions = res.data?.suggestedActions || [];

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          content: aiReply,
          suggestedActions,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          content: `⚠️ **Lỗi kết nối AI:** ${err.message || 'Không thể phản hồi lúc này.'}`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptType: AiPromptType, promptTitle: string) => {
    const subjectPrefix = activeSubject ? `cho môn [${activeSubject.code || activeSubject.name}]` : '';
    const text = `${promptTitle} ${subjectPrefix}`.trim();
    handleSendMessage(text, promptType);
  };

  const handleCreateTaskFromAi = async (action: any) => {
    try {
      await api.post('/tasks', {
        title: action.title,
        description: action.description || undefined,
        priority: action.priority || 'MEDIUM',
        subjectId: selectedSubjectId || undefined,
        semesterId: selectedSemesterId || undefined
      });
      showToast(`Đã tự động tạo công việc "${action.title}" lên bảng Kanban!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo công việc từ AI', 'error');
    }
  };

  const handleCreateNoteFromAi = async (action: any) => {
    try {
      await api.post('/notes', {
        title: action.title,
        content: `### Tài liệu tổng hợp từ SNOTE AI Copilot\n\n${action.description || 'Đề cương ôn tập'}\n\n*Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}*`,
        subjectId: selectedSubjectId || undefined,
        noteType: 'EXAM_PREP'
      });
      showToast(`Đã lưu bài ghi chú "${action.title}" thành công!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo ghi chú từ AI', 'error');
    }
  };

  return (
    <>
      {/* 1. Launcher Button (Khi đóng - Siêu gọn gàng tại góc phải dưới, không chiếm diện tích) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13.5px',
            transition: 'all 0.2s ease-in-out'
          }}
          title="Mở Trợ lý AI SNOTE (Phím tắt: Ctrl + J)"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} className="pulse-urgent" />
          </div>
          <span>SNOTE AI</span>
          <span
            style={{
              fontSize: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 800
            }}
          >
            Ctrl+J
          </span>
        </button>
      )}

      {/* 2. Expanded Floating Chat Drawer (Khi mở) */}
      {isOpen && (
        <div
          className="snote-card animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: isExpanded ? 'min(760px, calc(100vw - 32px))' : '460px',
            maxWidth: 'calc(100vw - 32px)',
            height: isExpanded ? 'min(840px, calc(100vh - 48px))' : '640px',
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 9999,
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-secondary)',
            backdropFilter: 'blur(20px)',
            transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12))'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-accent)'
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>SNOTE AI Copilot</span>
                  <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 5px' }}>v1.0</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {activeSubject ? `Đang gắn: ${activeSubject.name}` : 'Trợ lý học tập thông minh'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="btn btn-ghost btn-icon btn-sm"
                title={isExpanded ? 'Thu nhỏ kích thước' : 'Phóng rộng khung chat'}
                style={{ color: 'var(--text-secondary)' }}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <Link
                to="/ai-chat"
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-icon btn-sm"
                title="Mở toàn màn hình (/ai-chat)"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Maximize2 size={13} style={{ transform: 'rotate(45deg)' }} />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-icon btn-sm"
                title="Đóng (Ctrl + J)"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Academic Context Bar & Quick Action Pills */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <span>GỢI Ý HỌC THUẬT NHANH (1-CLICK):</span>
              {activeSubject && (
                <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>
                  {activeSubject.code || activeSubject.name}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button
                type="button"
                onClick={() => handleQuickPrompt('EXTRACT_TODOS', 'Rút trích việc cần làm & deadline')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap', borderRadius: 'var(--radius-full)' }}
              >
                <CheckSquare size={12} style={{ color: 'var(--color-success)' }} />
                <span>⚡ Rút trích Todo</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('EXAM_PREDICT', 'Dự đoán 5 câu hỏi trọng tâm đề thi')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap', borderRadius: 'var(--radius-full)' }}
              >
                <Zap size={12} style={{ color: 'var(--color-warning)' }} />
                <span>🎯 Dự đoán thi</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('SUMMARIZE', 'Soạn đề cương tóm tắt 1 trang')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap', borderRadius: 'var(--radius-full)' }}
              >
                <FileText size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>📝 Tóm tắt 1 trang</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('EXPLAIN_CONCEPT', 'Giải thích chi tiết khái niệm cốt lõi')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap', borderRadius: 'var(--radius-full)' }}
              >
                <HelpCircle size={12} style={{ color: 'var(--color-purple)' }} />
                <span>💡 Giải thích thuật ngữ</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className="animate-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAi ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '92%',
                      padding: isAi ? '14px 16px' : '10px 16px',
                      borderRadius: isAi ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      backgroundColor: isAi ? 'var(--bg-card)' : 'var(--accent-primary)',
                      color: isAi ? 'var(--text-primary)' : '#ffffff',
                      border: isAi ? '1px solid var(--border-color)' : 'none',
                      fontSize: '13.5px',
                      lineHeight: 1.55,
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {isAi ? (
                      <MarkdownViewer content={msg.content} />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}

                    {/* AI Suggested Actions Buttons */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                          HÀNH ĐỘNG HỌC TẬP ĐỀ XUẤT:
                        </div>
                        {msg.suggestedActions.map((action, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'var(--bg-primary)',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '12px'
                            }}
                          >
                            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {action.title}
                            </span>
                            {action.actionType === 'CREATE_TASK' ? (
                              <button
                                onClick={() => handleCreateTaskFromAi(action)}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '11px', padding: '3px 8px' }}
                              >
                                + Thêm Task
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCreateNoteFromAi(action)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '11px', padding: '3px 8px' }}
                              >
                                + Tạo Note
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-card)', width: 'fit-content' }}>
                <Sparkles size={16} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI đang phân tích kiến thức...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '8px',
              background: 'var(--bg-card)'
            }}
          >
            <input
              type="text"
              placeholder={activeSubject ? `Hỏi AI về môn ${activeSubject.name}...` : 'Hỏi AI bất kỳ điều gì về bài học...'}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              className="snote-input"
              style={{ fontSize: '13.5px', padding: '9px 14px' }}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="btn btn-primary btn-icon"
              style={{ padding: '0 14px', flexShrink: 0 }}
              title="Gửi câu hỏi"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
