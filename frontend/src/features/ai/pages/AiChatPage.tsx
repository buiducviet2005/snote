import React, { useState, useRef, useEffect } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { AiPromptType, AiChatResponseDto } from '@snote/shared';
import {
  Bot,
  Sparkles,
  Send,
  CheckSquare,
  Zap,
  FileText,
  HelpCircle,
  Layers,
  BookOpen,
  Trash2,
  Copy,
  Check
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestedActions?: any[];
}

export const AiChatPage: React.FC = () => {
  const { selectedSubjectId, setSelectedSubjectId, subjects, selectedSemesterId } = useAppFilter();
  const { showToast } = useToast();
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      content: '### 🎓 Chào mừng bạn đến với Không Gian Trợ Lý AI Học Tập SNOTE!\n\nTôi là mô hình AI được tinh chỉnh chuyên biệt cho sinh viên đại học. Hãy chọn môn học bạn đang ôn tập và sử dụng các công cụ bên dưới để tôi hỗ trợ bạn:\n\n* 📋 **Rút trích Action Items:** Biến bài giảng dài thành danh sách công việc có deadline.\n* 🎯 **Dự đoán Trọng tâm Thi:** Tìm ra 5 dạng bài có khả năng xuất hiện cao nhất trong kỳ thi.\n* 📝 **Soạn Đề Cương 1 Trang:** Tóm tắt ngắn gọn các khái niệm nền tảng.\n* 💡 **Giải Thích Thuật Ngữ:** Giải nghĩa chi tiết bằng các ví dụ thực tế trực quan.',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    const subjectPrefix = activeSubject ? `cho môn học [${activeSubject.code || activeSubject.name}]` : '';
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

  const handleCopyContent = async (content: string, idx: number) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(content);
    } catch {
      showToast('Không thể sao chép phản hồi của AI. Vui lòng thử lại.', 'error');
      return;
    }

    setCopiedIndex(idx);
    showToast('Đã sao chép phản hồi của AI!', 'info');
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử trò chuyện này?')) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          content: 'Cuộc trò chuyện đã được làm mới. Hãy đặt câu hỏi mới cho tôi!',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Trợ Lý Học Tập Thông Minh SNOTE AI
            </h1>
            <span className="badge badge-purple">
              <Sparkles size={12} />
              <span>AI Copilot v1.0</span>
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Hỏi đáp chuyên sâu, rút trích bài tập và dự đoán đề thi bám sát chương trình đào tạo
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Subject Context Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedSubjectId || ''}
              onChange={(e) => setSelectedSubjectId(e.target.value || null)}
              className="snote-select"
              style={{ fontSize: '13px', padding: '6px 12px', minWidth: '180px' }}
            >
              <option value="">-- Mọi môn học --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="btn btn-secondary btn-icon"
            title="Làm mới cuộc trò chuyện"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => handleQuickPrompt('EXTRACT_TODOS', 'Rút trích các bài tập cần nộp & deadline')}
          className="snote-card"
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            textAlign: 'left',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckSquare size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Rút trích Việc Cần Làm</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tự động tìm Todo & Deadline</div>
          </div>
        </button>

        <button
          onClick={() => handleQuickPrompt('EXAM_PREDICT', 'Dự đoán 5 dạng câu hỏi trọng tâm ôn thi')}
          className="snote-card"
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            textAlign: 'left',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Dự đoán Trọng tâm Thi</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>5 dạng bài có xác suất cao nhất</div>
          </div>
        </button>

        <button
          onClick={() => handleQuickPrompt('SUMMARIZE', 'Soạn đề cương tóm tắt 1 trang')}
          className="snote-card"
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            textAlign: 'left',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Tóm tắt Đề cương 1 Trang</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cô đọng bản chất bài giảng</div>
          </div>
        </button>

        <button
          onClick={() => handleQuickPrompt('EXPLAIN_CONCEPT', 'Giải thích chi tiết các thuật ngữ khó kèm ví dụ')}
          className="snote-card"
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            textAlign: 'left',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-purple-subtle)', color: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HelpCircle size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Giải thích Thuật ngữ Khó</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ví dụ thực tế trực quan</div>
          </div>
        </button>
      </div>

      {/* Messages Chat Box */}
      <div
        className="snote-card"
        style={{
          flex: 1,
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)'
        }}
      >
        {messages.map((msg, idx) => {
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
                  maxWidth: '85%',
                  padding: isAi ? '18px 22px' : '12px 20px',
                  borderRadius: isAi ? '4px 20px 20px 20px' : '20px 4px 20px 20px',
                  backgroundColor: isAi ? 'var(--bg-primary)' : 'var(--accent-primary)',
                  color: isAi ? 'var(--text-primary)' : '#ffffff',
                  border: isAi ? '1px solid var(--border-color)' : 'none',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                {isAi ? (
                  <>
                    <MarkdownViewer content={msg.content} />
                    <button
                      onClick={() => handleCopyContent(msg.content, idx)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px'
                      }}
                      title="Sao chép nội dung"
                    >
                      {copiedIndex === idx ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                    </button>
                  </>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{msg.content}</div>
                )}

                {/* AI Suggested Actions */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      ⚡ HÀNH ĐỘNG HỌC TẬP TỰ ĐỘNG ĐƯỢC GỢI Ý:
                    </div>
                    {msg.suggestedActions.map((action, actionIdx) => (
                      <div
                        key={actionIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--bg-secondary)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{action.title}</span>
                        {action.actionType === 'CREATE_TASK' ? (
                          <button
                            onClick={() => handleCreateTaskFromAi(action)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '11.5px', padding: '4px 10px' }}
                          >
                            + Đưa vào Kanban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCreateNoteFromAi(action)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '11.5px', padding: '4px 10px' }}
                          >
                            + Lưu thành Note
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 6px' }}>
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', borderRadius: '14px', background: 'var(--bg-primary)', width: 'fit-content' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Trợ lý AI đang tư duy và liên kết dữ liệu bài giảng...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          marginTop: '14px',
          display: 'flex',
          gap: '10px'
        }}
      >
        <input
          type="text"
          placeholder={activeSubject ? `Nhập câu hỏi liên quan đến môn học [${activeSubject.name}]...` : 'Nhập câu hỏi hoặc yêu cầu học tập cho SNOTE AI...'}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading}
          className="snote-input"
          style={{ fontSize: '14.5px', padding: '12px 18px', borderRadius: 'var(--radius-lg)' }}
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="btn btn-primary"
          style={{ padding: '0 24px', borderRadius: 'var(--radius-lg)', fontWeight: 700 }}
        >
          <Send size={18} />
          <span>Gửi</span>
        </button>
      </form>
    </div>
  );
};
