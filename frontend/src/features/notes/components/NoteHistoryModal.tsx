import React, { useState, useEffect } from 'react';
import { NoteVersionSnapshot, noteHistoryStorage } from '../utils/noteHistoryStorage';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  History,
  RotateCcw,
  X,
  Clock,
  Calendar,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import './NoteHistoryModal.css';

interface NoteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  currentTitle: string;
  currentContent: string;
  onRestore: (snapshot: NoteVersionSnapshot) => void;
}

export const NoteHistoryModal: React.FC<NoteHistoryModalProps> = ({
  isOpen,
  onClose,
  noteId,
  currentTitle,
  currentContent,
  onRestore
}) => {
  const { language } = useLanguage();
  const [snapshots, setSnapshots] = useState<NoteVersionSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<NoteVersionSnapshot | null>(null);

  useEffect(() => {
    if (isOpen && noteId) {
      const list = noteHistoryStorage.getSnapshots(noteId);
      setSnapshots(list);
      if (list.length > 0) {
        setSelectedSnapshot(list[0]);
      } else {
        setSelectedSnapshot(null);
      }
    }
  }, [isOpen, noteId]);

  if (!isOpen) return null;

  const handleRestoreClick = () => {
    if (!selectedSnapshot) return;
    const confirmMsg = language === 'vi'
      ? `Bạn có chắc chắn muốn khôi phục (back lại) bài ghi về phiên bản lúc ${selectedSnapshot.formattedTime} (${selectedSnapshot.formattedDate}) không?`
      : `Are you sure you want to restore the note to the version from ${selectedSnapshot.formattedTime} (${selectedSnapshot.formattedDate})?`;

    if (window.confirm(confirmMsg)) {
      onRestore(selectedSnapshot);
      onClose();
    }
  };

  const getTypeLabel = (type: NoteVersionSnapshot['type']) => {
    switch (type) {
      case 'AUTO_SAVE':
        return language === 'vi' ? 'Tự động lưu' : 'Auto-save';
      case 'MANUAL_SAVE':
        return language === 'vi' ? 'Lưu thủ công (Ctrl+S)' : 'Manual save';
      case 'RESTORE_POINT':
        return language === 'vi' ? 'Điểm khôi phục' : 'Restore point';
      case 'INITIAL':
        return language === 'vi' ? 'Bản ban đầu' : 'Initial version';
      default:
        return 'Snapshot';
    }
  };

  const currentChars = currentContent.length;

  return (
    <div className="snote-history-overlay" onClick={onClose}>
      <div className="snote-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="snote-history-header">
          <div className="snote-history-title-wrap">
            <div className="snote-history-icon-badge">
              <History size={18} />
            </div>
            <div>
              <h2 className="snote-history-title">
                {language === 'vi' ? 'Lịch sử phiên bản bài ghi' : 'Note Version History'}
              </h2>
              <p className="snote-history-subtitle">
                {language === 'vi'
                  ? 'Xem lại các mốc thời gian đã lưu và khôi phục (back lại) nội dung cũ bất kỳ lúc nào.'
                  : 'Review saved checkpoints and rollback to any previous version anytime.'}
              </p>
            </div>
          </div>
          <button type="button" className="snote-history-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body 2 columns */}
        <div className="snote-history-body">
          {/* Left column: Timeline List */}
          <div className="snote-history-timeline">
            <div className="snote-history-list-header">
              <span>{language === 'vi' ? 'Các mốc đã lưu' : 'Saved Checkpoints'} ({snapshots.length})</span>
            </div>

            {snapshots.length === 0 ? (
              <div className="snote-history-empty">
                <Clock size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <span>{language === 'vi' ? 'Chưa có mốc lịch sử nào được lưu cho bài này.' : 'No history checkpoints saved yet.'}</span>
              </div>
            ) : (
              <div className="snote-history-list">
                {snapshots.map((snap, idx) => {
                  const isSelected = selectedSnapshot?.id === snap.id;
                  const charDiff = snap.charCount - currentChars;

                  return (
                    <div
                      key={snap.id}
                      className={`snote-history-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedSnapshot(snap)}
                    >
                      <div className="snote-history-item-top">
                        <span className="snote-history-item-time">
                          <Clock size={11} />
                          {snap.formattedTime}
                        </span>
                        <span className={`snote-history-type-badge ${snap.type.toLowerCase()}`}>
                          {getTypeLabel(snap.type)}
                        </span>
                      </div>

                      <div className="snote-history-item-date">
                        <Calendar size={11} />
                        <span>{snap.formattedDate}</span>
                        {idx === 0 && (
                          <span className="snote-history-latest-pill">
                            {language === 'vi' ? 'Gần nhất' : 'Latest'}
                          </span>
                        )}
                      </div>

                      <div className="snote-history-item-meta">
                        <span>{snap.wordCount} {language === 'vi' ? 'từ' : 'words'}</span>
                        <span>•</span>
                        <span>{snap.charCount} {language === 'vi' ? 'ký tự' : 'chars'}</span>
                        {charDiff !== 0 && (
                          <span className={`snote-history-diff ${charDiff > 0 ? 'plus' : 'minus'}`}>
                            ({charDiff > 0 ? `+${charDiff}` : charDiff})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right column: Preview & Restore Action */}
          <div className="snote-history-preview">
            {selectedSnapshot ? (
              <div className="snote-history-preview-inner">
                {/* Preview Toolbar */}
                <div className="snote-history-preview-toolbar">
                  <div className="snote-history-preview-info">
                    <span className="snote-history-preview-title">
                      {selectedSnapshot.title || (language === 'vi' ? 'Ghi chú không tên' : 'Untitled Note')}
                    </span>
                    <span className="snote-history-preview-sub">
                      {language === 'vi' ? 'Bản lưu lúc:' : 'Saved at:'} {selectedSnapshot.formattedTime} - {selectedSnapshot.formattedDate} ({getTypeLabel(selectedSnapshot.type)})
                    </span>
                  </div>

                  <button
                    type="button"
                    className="snote-history-restore-btn"
                    onClick={handleRestoreClick}
                  >
                    <RotateCcw size={14} />
                    <span>{language === 'vi' ? 'Khôi phục phiên bản này' : 'Restore this version'}</span>
                  </button>
                </div>

                {/* Preview Content Area */}
                <div className="snote-history-preview-body">
                  <MarkdownViewer content={selectedSnapshot.content} />
                </div>
              </div>
            ) : (
              <div className="snote-history-preview-empty">
                <FileText size={40} style={{ opacity: 0.25, marginBottom: '12px' }} />
                <span>{language === 'vi' ? 'Chọn một mốc thời gian bên trái để xem trước' : 'Select a checkpoint to preview'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="snote-history-footer">
          <div className="snote-history-tip">
            <Sparkles size={14} style={{ color: 'var(--ws-accent)' }} />
            <span>
              {language === 'vi'
                ? 'Mẹo: Bạn có thể nhấn Ctrl + S bất kỳ lúc nào khi đang soạn thảo để tạo ngay một mốc lịch sử an toàn.'
                : 'Tip: Press Ctrl + S anytime while editing to immediately save a new safe checkpoint.'}
            </span>
          </div>

          <button type="button" className="snote-history-footer-close" onClick={onClose}>
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
