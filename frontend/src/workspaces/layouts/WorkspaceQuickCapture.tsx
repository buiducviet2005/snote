import React, { useState, useEffect, useRef } from 'react';
import { PenTool, X, Copy, Check, Save, Trash2, Maximize2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t, language } = useLanguage();
  const [content, setContent] = useState<string>(() => {
    return localStorage.getItem('snote_quick_scratchpad') || '';
  });
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [keepMounted, setKeepMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isClosing = !isOpen && keepMounted;

  useEffect(() => {
    if (isOpen) {
      setKeepMounted(true);
      return;
    }
    if (!keepMounted) return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setKeepMounted(false), reducedMotion ? 0 : 140);
    return () => window.clearTimeout(timer);
  }, [isOpen, keepMounted]);

  // Sync to local storage on edit
  useEffect(() => {
    localStorage.setItem('snote_quick_scratchpad', content);
  }, [content]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      const timer = window.setTimeout(() => textareaRef.current?.focus(), 80);
      return () => window.clearTimeout(timer);
    }
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
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
    if (window.confirm(t('quick_capture.clear_confirm'))) {
      setContent('');
      localStorage.removeItem('snote_quick_scratchpad');
    }
  };

  if (!isOpen && !keepMounted) return null;

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <>
      <div className={`ws-drawer-backdrop ${isClosing ? 'is-closing' : ''}`} onClick={onClose} />
      <aside className={`ws-quick-drawer ${isClosing ? 'is-closing' : ''}`} aria-label={t('quick_capture.title')}>
        {/* Drawer Header */}
        <div className="ws-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PenTool size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: 'var(--type-small)' }}>
              {t('quick_capture.title')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="icon-button"
              onClick={handleCopy}
              title={t('quick_capture.copy_tooltip')}
            >
              {isCopied ? <Check size={14} strokeWidth={1.5} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} strokeWidth={1.5} />}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={handleClear}
              title={t('quick_capture.clear_tooltip')}
            >
              <Trash2 size={15} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              title={t('quick_capture.close_tooltip')}
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
            placeholder={t('quick_capture.placeholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Drawer Footer */}
        <div className="ws-drawer-footer">
          <div className="ws-drawer-stats">
            <span>{t('notes.word_count', { words: wordCount })}</span>
            <span>•</span>
            <span>{t('notes.character_count', { chars: charCount })}</span>
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
                <span>{t('quick_capture.save_success')}</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>{t('quick_capture.save_to_notes')}</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

