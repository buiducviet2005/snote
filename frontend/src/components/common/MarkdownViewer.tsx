import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { autoFormatPlainTextToMarkdown } from '../../features/notes/utils/smartNoteParser';
import { useLanguage } from '../../contexts/LanguageContext';

interface MarkdownViewerProps {
  content: string;
  className?: string;
  enableSmartFormatting?: boolean;
  onToggleTodo?: (todoIndex: number) => void;
  onNavigateWikiLink?: (target: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = '',
  enableSmartFormatting = true,
  onToggleTodo,
  onNavigateWikiLink,
  onSelectTag
}) => {
  const { t } = useLanguage();
  const formattedContent = useMemo(() => {
    if (!content || !content.trim()) return '';
    return enableSmartFormatting ? autoFormatPlainTextToMarkdown(content) : content;
  }, [content, enableSmartFormatting]);

  let fallbackSequentialCounter = 0;

  if (!formattedContent) {
    return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--type-small)' }}>{t('notes.no_content_detail')}</span>;
  }

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => {
            const href = props.href || '';
            const isWiki = href.startsWith('#wiki:');
            const isTag = href.startsWith('#tag:');

            if (isWiki) {
              const target = decodeURIComponent(href.replace('#wiki:', ''));
              return (
                <span
                  role="button"
                  tabIndex={0}
                  className="note-wiki-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateWikiLink) onNavigateWikiLink(target);
                  }}
                  title={t('notes.open_linked_note', { target })}
                  style={{
                    color: '#60a5fa',
                    backgroundColor: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    padding: '1.5px 7px',
                    borderRadius: '5px',
                    fontWeight: 600,
                    fontSize: 'var(--type-small)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {props.children}
                </span>
              );
            }

            if (isTag) {
              const tag = decodeURIComponent(href.replace('#tag:', ''));
              return (
                <span
                  role="button"
                  tabIndex={0}
                  className="note-tag-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectTag) onSelectTag(tag);
                  }}
                  title={t('notes.filter_by_tag', { tag })}
                  style={{
                    color: '#c084fc',
                    backgroundColor: 'rgba(192, 132, 252, 0.12)',
                    border: '1px solid rgba(192, 132, 252, 0.3)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: 'var(--type-small)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {props.children}
                </span>
              );
            }

            return (
              <a
                {...props}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="note-link-highlight"
                style={{
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '1.5px 7px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: 'var(--type-small)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  wordBreak: 'break-all',
                  transition: 'all 140ms ease-out'
                }}
              />
            );
          },
          li: ({ node, className: liClassName, children, ...props }) => {
            const isTaskItem = Boolean(liClassName?.includes('task-list-item'));
            if (isTaskItem) {
              const lineIndex =
                node?.position?.start?.line != null
                  ? node.position.start.line - 1
                  : fallbackSequentialCounter++;
              return (
                <li
                  {...props}
                  className={`task-list-item ${onToggleTodo ? 'is-interactive' : ''} ${liClassName || ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const target = e.target as HTMLElement;
                    if (target.closest('a') || target.closest('.note-wiki-link') || target.closest('.note-tag-badge')) return;
                    if (onToggleTodo) {
                      onToggleTodo(lineIndex);
                    }
                  }}
                  style={{
                    cursor: onToggleTodo ? 'pointer' : 'default',
                    userSelect: 'text',
                    ...((props.style as any) || {})
                  }}
                  title={onToggleTodo ? t('notes.toggle_todo_tooltip') : undefined}
                >
                  {children}
                </li>
              );
            }
            return (
              <li className={liClassName} {...props}>
                {children}
              </li>
            );
          },
          input: ({ node, ...props }) => {
            if (props.type === 'checkbox') {
              const isChecked = Boolean(props.checked);
              return (
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  tabIndex={-1}
                  className="interactive-todo-checkbox"
                  style={{
                    cursor: onToggleTodo ? 'pointer' : 'default',
                    accentColor: 'var(--color-success)',
                    marginRight: '8px',
                    width: '16px',
                    height: '16px'
                  }}
                />
              );
            }
            return <input {...props} />;
          }
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
};
