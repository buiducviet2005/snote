import React, { useState, useEffect, useRef } from 'react';
import { PenTool, X, Copy, Check, Save, Trash2, Maximize2 } from 'lucide-react';

interface WorkspaceQuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPersonalNotes?: (content: string) => void;
}

export const WorkspaceQuickCapture: React.FC<WorkspaceQuickCaptureProps> = ({
  isOpen,
  onClose,
  onSaveToPersonalNotes
}) => {
  const [content, setContent] = useState<string>(() => {
    return localStorage.getItem('snote_quick_scratchpad') || '';
  });
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync to local storage on edit
  useEffect(() => {
    localStorage.setItem('snote_quick_scratchpad', content);
  }, [content]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSaveToNotes = () => {
    if (!content.trim()) return;
    if (onSaveToPersonalNotes) {
      onSaveToPersonalNotes(content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc muốn xóa sạch nội dung nháp này không?')) {
      setContent('');
      localStorage.removeItem('snote_quick_scratchpad');
    }
  };

  if (!isOpen) return null;

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <>
      <div className="ws-drawer-backdrop" onClick={onClose} />
      <aside className="ws-quick-drawer" aria-label="Bàn ghi nháp nhanh">
        {/* Drawer Header */}
        <div className="ws-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PenTool size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '13.5px' }}>
              Bàn Ghi Nháp Siêu Tốc (Quick Capture)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="icon-button"
              onClick={handleCopy}
              title="Sao chép toàn bộ"
            >
              {isCopied ? <Check size={15} style={{ color: '#16a34a' }} /> : <Copy size={15} />}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={handleClear}
              title="Xóa trắng nháp"
            >
              <Trash2 size={15} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              title="Đóng (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="ws-drawer-body">
          <textarea
            ref={textareaRef}
            className="ws-drawer-textarea"
            placeholder="Ghi nhanh công thức toán học, đoạn trích bài giảng, hoặc ý tưởng đồ án... Dữ liệu tự động lưu trong máy."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Drawer Footer */}
        <div className="ws-drawer-footer">
          <div className="ws-drawer-stats">
            <span>{wordCount} từ</span>
            <span>•</span>
            <span>{charCount} ký tự</span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSaveToNotes}
            disabled={!content.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {saveSuccess ? (
              <>
                <Check size={13} />
                <span>Đã lưu thành công!</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Chuyển vào Ghi chú</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
