import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { autoFormatPlainTextToMarkdown } from '../../features/notes/utils/smartNoteParser';

interface MarkdownViewerProps {
  content: string;
  className?: string;
  enableSmartFormatting?: boolean;
  onToggleTodo?: (todoIndex: number) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = '',
  enableSmartFormatting = true,
  onToggleTodo
}) => {
  const formattedContent = useMemo(() => {
    if (!content || !content.trim()) return '';
    return enableSmartFormatting ? autoFormatPlainTextToMarkdown(content) : content;
  }, [content, enableSmartFormatting]);

  let fallbackSequentialCounter = 0;

  if (!formattedContent) {
    return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>Chưa có nội dung chi tiết.</span>;
  }

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
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
                fontSize: '0.94em',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                wordBreak: 'break-all',
                transition: 'all 140ms ease-out'
              }}
            />
          ),
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
                    if (target.closest('a')) return;
                    if (onToggleTodo) {
                      onToggleTodo(lineIndex);
                    }
                  }}
                  style={{
                    cursor: onToggleTodo ? 'pointer' : 'default',
                    userSelect: 'text',
                    ...((props.style as any) || {})
                  }}
                  title={onToggleTodo ? 'Nhấp để đổi trạng thái việc cần làm' : undefined}
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
                  style={{
                    marginRight: '8px',
                    accentColor: 'var(--accent-primary)',
                    cursor: onToggleTodo ? 'pointer' : 'default',
                    transform: 'scale(1.25)',
                    verticalAlign: 'middle',
                    position: 'relative',
                    top: '-1px',
                    pointerEvents: 'none',
                    transition: 'transform var(--transition-fast)'
                  }}
                  title={onToggleTodo ? 'Nhấp để đánh dấu hoàn thành / chưa hoàn thành' : undefined}
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
