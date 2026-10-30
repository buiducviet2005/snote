import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { BubbleToolbar } from './BubbleToolbar';
import { createSlashCommandExtension } from './extensions/slashCommand';
import { draftStorage } from '../../utils/draftStorage';
import { useLanguage } from '../../../../contexts/LanguageContext';
import './SnoteEditor.css';

export interface SnoteEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  noteId?: string;
  placeholder?: string;
  readOnly?: boolean;
  onConvertToTask?: (selectedText: string) => void;
  className?: string;
}

export const SnoteEditor: React.FC<SnoteEditorProps> = ({
  content,
  onChange,
  noteId,
  placeholder,
  readOnly = false,
  onConvertToTask,
  className = ''
}) => {
  const { t } = useLanguage();
  const isInternalUpdateRef = useRef(false);
  const lastNoteIdRef = useRef<string | undefined>(noteId);

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false
        }
      }),
      Markdown.configure({
        indentation: {
          style: 'space',
          size: 2
        }
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Placeholder.configure({
        placeholder: placeholder || t('editor.placeholder')
      }),
      createSlashCommandExtension(onConvertToTask, t)
    ],
    contentType: 'markdown',
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      isInternalUpdateRef.current = true;
      const markdown = (ed as any).getMarkdown?.() || '';
      onChange(markdown);
      if (noteId) {
        draftStorage.save(noteId, markdown);
      }
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 50);
    }
  });

  // Handle noteId switch or external content changes
  useEffect(() => {
    if (!editor) return;

    if (lastNoteIdRef.current !== noteId) {
      lastNoteIdRef.current = noteId;
      // Load content from draft if newer, otherwise from props
      const draft = noteId ? draftStorage.get(noteId) : null;
      const initialMarkdown = draft?.content !== undefined ? draft.content : content;
      (editor.commands as any).setContent(initialMarkdown || '', { contentType: 'markdown' });
      return;
    }

    // CRITICAL: NEVER call setContent while the user is actively focused or typing!
    // Calling setContent() while typing re-mounts the ProseMirror DOM tree, causing aggressive screen stutter.
    if (!editor.isFocused && !isInternalUpdateRef.current) {
      const currentMarkdown = (editor as any).getMarkdown?.() || '';
      if (content !== currentMarkdown) {
        (editor.commands as any).setContent(content || '', { contentType: 'markdown' });
      }
    }
  }, [content, noteId, editor]);

  // Handle readOnly toggles
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  return (
    <div className={`snote-editor-container ${className} ${readOnly ? 'is-readonly' : ''}`}>
      {editor && !readOnly && (
        <BubbleToolbar editor={editor} onConvertToTask={onConvertToTask} />
      )}
      <EditorContent editor={editor} className="snote-editor-content" />
    </div>
  );
};
