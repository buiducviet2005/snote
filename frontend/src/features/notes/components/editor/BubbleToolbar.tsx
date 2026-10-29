import React from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/core';
import { useLanguage } from '../../../../contexts/LanguageContext';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Quote,
  CheckCircle2
} from 'lucide-react';

interface BubbleToolbarProps {
  editor: Editor | null;
  onConvertToTask?: (selectedText: string) => void;
}

export const BubbleToolbar: React.FC<BubbleToolbarProps> = ({ editor, onConvertToTask }) => {
  const { t } = useLanguage();
  if (!editor) return null;

  const handleConvertToTask = () => {
    if (!onConvertToTask) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (selectedText.trim()) {
      onConvertToTask(selectedText.trim());
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      className="snote-bubble-menu"
      options={{
        placement: 'top',
        offset: 8
      }}
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`snote-bubble-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
        title={t('editor.bold')}
      >
        <Bold size={13} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`snote-bubble-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
        title={t('editor.italic')}
      >
        <Italic size={13} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`snote-bubble-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
        title={t('editor.strike')}
      >
        <Strikethrough size={13} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`snote-bubble-btn ${editor.isActive('code') ? 'is-active' : ''}`}
        title={t('editor.code')}
      >
        <Code size={13} />
      </button>

      <div className="snote-bubble-divider" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`snote-bubble-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
        title={t('editor.h1')}
      >
        <Heading1 size={13} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`snote-bubble-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
        title={t('editor.h2')}
      >
        <Heading2 size={13} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`snote-bubble-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
        title={t('editor.bullet_list')}
      >
        <List size={13} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`snote-bubble-btn ${editor.isActive('taskList') ? 'is-active' : ''}`}
        title={t('editor.todo_list')}
      >
        <CheckSquare size={13} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`snote-bubble-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
        title={t('editor.quote')}
      >
        <Quote size={13} />
      </button>

      {onConvertToTask && (
        <>
          <div className="snote-bubble-divider" />
          <button
            type="button"
            onClick={handleConvertToTask}
            className="snote-bubble-btn convert-task"
            title={t('notes.convert_to_task')}
          >
            <CheckCircle2 size={13} style={{ color: 'var(--ws-accent)' }} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{t('notes.convert_to_task')}</span>
          </button>
        </>
      )}
    </BubbleMenu>
  );
};
