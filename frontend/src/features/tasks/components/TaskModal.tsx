import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Modal } from '../../../components/common/Modal';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { StudyDateTimePicker } from '../../../components/common/StudyDateTimePicker';
import { ShareModal } from '../../../components/common/ShareModal';
import { toggleChecklistItem } from '../../notes/utils/smartNoteParser';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { TaskStatus, TaskPriority } from '@snote/shared';
import {
  CheckSquare,
  Plus,
  Calendar,
  Layers,
  Flame,
  Tag,
  Save,
  Clock,
  FileText,
  FolderKanban,
  UserCheck,
  Users,
  Check,
  User,
  Shield,
  Edit3,
  Eye,
  CheckCircle2,
  Circle,
  Share2
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: any | null;
  initialMode?: 'VIEW' | 'EDIT';
  defaultProjectId?: string | null;
  defaultSubjectId?: string | null;
  defaultWorkspaceId?: string | null;
  defaultWorkspaceName?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
  initialMode,
  defaultProjectId,
  defaultSubjectId,
  defaultWorkspaceId,
  defaultWorkspaceName
}) => {
  const { t, formatDateTime } = useLanguage();
  const { user: currentUser } = useAuth();
  const { subjects, selectedSubjectId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [slotLimit, setSlotLimit] = useState(1);
  const [allowSelfAssign, setAllowSelfAssign] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [dueDateOnly, setDueDateOnly] = useState('');
  const [dueTimeOnly, setDueTimeOnly] = useState('18:00');
  const [checklistText, setChecklistText] = useState('');
  const [markdownDetails, setMarkdownDetails] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [mode, setMode] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const parseDescriptionParts = (fullDesc: string) => {
    if (!fullDesc) return { check: '', md: '' };
    const lines = fullDesc.split('\n');
    const checkLines: string[] = [];
    const mdLines: string[] = [];
    let inChecklist = true;
    for (const l of lines) {
      if (/^-\s*\[[ xX]\]\s*/.test(l.trim()) || (/^-\s+/.test(l.trim()) && inChecklist)) {
        checkLines.push(l.trim().replace(/^-\s*\[[ xX]\]\s*/, '- '));
      } else {
        inChecklist = false;
        mdLines.push(l);
      }
    }
    return {
      check: checkLines.join('\n'),
      md: mdLines.join('\n').trim()
    };
  };

  const combineDescriptionParts = (check: string, md: string) => {
    const formattedCheck = check
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.startsWith('- ') ? `- [ ] ${l.slice(2)}` : `- [ ] ${l}`))
      .join('\n');
    if (formattedCheck && md.trim()) {
      return `${formattedCheck}\n\n${md.trim()}`;
    }
    return formattedCheck || md.trim();
  };

  const isSavedRef = useRef(false);
  const wasOpenRef = useRef(false);
  const lastTaskIdRef = useRef<string | null | undefined>(undefined);
  const workspaceGenRef = useRef(0);
  const { showToast } = useToast();

  const initialValuesRef = useRef({
    title: '',
    description: '',
    subjectId: '',
    projectId: '',
    selectedAssigneeIds: [] as string[],
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    tagsInput: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch available projects to link
      api.get<ApiResponse<any[]>>('/projects')
        .then((res) => setProjects(res.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  // When project changes, load its members for assignment & filter out invalid assignees (generation-gated)
  useEffect(() => {
    if (!isOpen) return;

    const groupWorkspaceId = !projectId && (taskToEdit?.workspaceId || defaultWorkspaceId);
    if (projectId || groupWorkspaceId) {
      const gen = ++workspaceGenRef.current;
      setLoadingMembers(true);

      api.get<ApiResponse<any>>(projectId ? `/projects/${projectId}/workspace` : `/workspaces/${groupWorkspaceId}/members`)
        .then((res) => {
          if (gen !== workspaceGenRef.current) return;
          setLoadingMembers(false);
          const members = projectId ? (res.data?.members || []) : (Array.isArray(res.data) ? res.data : []);
          setProjectMembers(members);
          const memberUserIds = new Set(members.map((m: any) => m.userId));

          setSelectedAssigneeIds((prev) => {
            // Filter invalid assignees not belonging to the new project
            const valid = prev.filter((id) => memberUserIds.has(id));
            let nextAssignees: string[] = [];
            if (valid.length > 0) {
              nextAssignees = valid;
            } else if (currentUser && memberUserIds.has(currentUser.id)) {
              nextAssignees = [currentUser.id];
            } else if (members.length > 0) {
              nextAssignees = [members[0].userId];
            } else {
              nextAssignees = [];
            }

            // Sync initial snapshot if it had no valid assignees in this project yet
            if (
              initialValuesRef.current.selectedAssigneeIds.length === 0 ||
              !initialValuesRef.current.selectedAssigneeIds.some((id) => memberUserIds.has(id))
            ) {
              initialValuesRef.current.selectedAssigneeIds = nextAssignees;
            }

            return nextAssignees;
          });
        })
        .catch(() => {
          if (gen !== workspaceGenRef.current) return;
          setLoadingMembers(false);
          setProjectMembers([]);
          // Clear assignees on failure to prevent submitting orphaned assignees
          setSelectedAssigneeIds([]);
        });
    } else {
      workspaceGenRef.current++;
      setLoadingMembers(false);
      setProjectMembers([]);
      // When projectId is empty (personal task), default to current user if not set
      setSelectedAssigneeIds((prev) => {
        const next = prev.length > 0 ? prev : (currentUser?.id ? [currentUser.id] : []);
        return next;
      });
    }
  }, [isOpen, projectId, defaultWorkspaceId, taskToEdit?.workspaceId, currentUser]);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      lastTaskIdRef.current = undefined;
      return;
    }

    const taskId = taskToEdit?.id ?? null;
    const isNewOpen = !wasOpenRef.current;
    const isTaskChanged = taskId !== lastTaskIdRef.current;

    if (!isNewOpen && !isTaskChanged) {
      return;
    }

    wasOpenRef.current = true;
    lastTaskIdRef.current = taskId;
    isSavedRef.current = false;

    if (taskToEdit) {
      const initTitle = taskToEdit.title || '';
      const { check: parsedCheck, md: parsedMd } = parseDescriptionParts(taskToEdit.description || '');
      setChecklistText(parsedCheck);
      setMarkdownDetails(parsedMd);

      if (taskToEdit.dueDate) {
        const d = new Date(taskToEdit.dueDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setDueDateOnly(`${yyyy}-${mm}-${dd}`);
        setDueTimeOnly(`${hh}:${min}`);
      } else {
        setDueDateOnly('');
        setDueTimeOnly('18:00');
      }

      if (taskToEdit.startDate) {
        const d = new Date(taskToEdit.startDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setStartDate(`${yyyy}-${mm}-${dd}`);
        setStartTime(`${hh}:${min}`);
      } else {
        setStartDate('');
        setStartTime('08:00');
      }
      const initDescription = taskToEdit.description || '';
      const initSubjectId = taskToEdit.subjectId || '';
      const initProjectId = taskToEdit.projectId || '';

      // Multi-assignees
      const existingAssigneeIds = (taskToEdit.assignees || []).map((a: any) => a.id || a.userId);
      let initAssignees: string[] = [];
      if (existingAssigneeIds.length > 0) {
        initAssignees = existingAssigneeIds;
      } else if (taskToEdit.userId) {
        initAssignees = [taskToEdit.userId];
      } else if (taskToEdit.assignee?.id) {
        initAssignees = [taskToEdit.assignee.id];
      }

      const initStatus = taskToEdit.status || TaskStatus.TODO;
      const initPriority = taskToEdit.priority || TaskPriority.MEDIUM;
      const initDueDate = taskToEdit.dueDate
        ? (() => {
            const date = new Date(taskToEdit.dueDate);
            return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
          })()
        : '';
      const initTags = (taskToEdit.tags || []).map((t: any) => t.name).join(', ');
      const initMode = initialMode || 'VIEW';

      setTitle(initTitle);
      setDescription(initDescription);
      setSubjectId(initSubjectId);
      setProjectId(initProjectId);
      setSelectedAssigneeIds(initAssignees);
      setStatus(initStatus);
      setPriority(initPriority);
      setDueDate(initDueDate);
      setTagsInput(initTags);
      setMode(initMode);

      initialValuesRef.current = {
        title: initTitle,
        description: initDescription,
        subjectId: initSubjectId,
        projectId: initProjectId,
        selectedAssigneeIds: initAssignees,
        status: initStatus,
        priority: initPriority,
        dueDate: initDueDate,
        tagsInput: initTags
      };
    } else {
      // In project context: defaultProjectId is defined. Do not fall back to selectedSubjectId if defaultSubjectId is null/empty
      const initProjectId = defaultProjectId || '';
      const initSubjectId = defaultProjectId ? (defaultSubjectId || '') : (defaultSubjectId || selectedSubjectId || '');
      const initAssignees = currentUser?.id ? [currentUser.id] : [];
      const initStatus = TaskStatus.TODO;
      const initPriority = TaskPriority.MEDIUM;
      const initDueDate = '';
      const initTags = '';
      const initMode = initialMode || 'EDIT';

      setTitle('');
      setDescription('');
      setChecklistText('');
      setMarkdownDetails('');
      setStartDate('');
      setStartTime('08:00');
      setDueDateOnly('');
      setDueTimeOnly('18:00');
      setSlotLimit(1);
      setAllowSelfAssign(true);
      setSubjectId(initSubjectId);
      setProjectId(initProjectId);
      setSelectedAssigneeIds(initAssignees);
      setStatus(initStatus);
      setPriority(initPriority);
      setDueDate(initDueDate);
      setTagsInput(initTags);
      setMode(initMode);

      initialValuesRef.current = {
        title: '',
        description: '',
        subjectId: initSubjectId,
        projectId: initProjectId,
        selectedAssigneeIds: initAssignees,
        status: initStatus,
        priority: initPriority,
        dueDate: initDueDate,
        tagsInput: initTags
      };
    }
  }, [isOpen, taskToEdit, defaultProjectId, defaultSubjectId, initialMode, selectedSubjectId, currentUser]);

  const isDirty = useMemo(() => {
    if (mode !== 'EDIT') return false;
    const initial = initialValuesRef.current;
    const assigneesChanged =
      selectedAssigneeIds.length !== initial.selectedAssigneeIds.length ||
      [...selectedAssigneeIds].sort().join(',') !== [...initial.selectedAssigneeIds].sort().join(',');

    return (
      title !== initial.title ||
      description !== initial.description ||
      subjectId !== initial.subjectId ||
      projectId !== initial.projectId ||
      status !== initial.status ||
      priority !== initial.priority ||
      dueDate !== initial.dueDate ||
      tagsInput !== initial.tagsInput ||
      assigneesChanged
    );
  }, [mode, title, description, subjectId, projectId, status, priority, dueDate, tagsInput, selectedAssigneeIds]);

  const handleRequestClose = useCallback(() => {
    if (mode === 'EDIT' && isDirty && !isSavedRef.current) {
      const confirmDiscard = window.confirm(
        t('tasks.unsaved_close_confirm')
      );
      if (!confirmDiscard) {
        return;
      }
    }
    onClose();
  }, [mode, isDirty, onClose, t]);

  const handleCancelEdit = useCallback(() => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        t('tasks.unsaved_view_confirm')
      );
      if (!confirmDiscard) {
        return;
      }
    }
    if (taskToEdit) {
      const init = initialValuesRef.current;
      setTitle(init.title);
      setDescription(init.description);
      setSubjectId(init.subjectId);
      setProjectId(init.projectId);
      setSelectedAssigneeIds(init.selectedAssigneeIds);
      setStatus(init.status);
      setPriority(init.priority);
      setDueDate(init.dueDate);
      setTagsInput(init.tagsInput);
      setMode('VIEW');
    } else {
      onClose();
    }
  }, [isDirty, taskToEdit, onClose, t]);

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) => {
      if (prev.includes(userId)) {
        const filtered = prev.filter((id) => id !== userId);
        return filtered.length > 0 ? filtered : [userId];
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleQuickToggleStatus = async () => {
    if (!taskToEdit) return;
    const nextStatus = status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    setStatus(nextStatus);
    try {
      await api.patch(`/tasks/${taskToEdit.id}/status`, { status: nextStatus });
      showToast(nextStatus === TaskStatus.DONE ? t('tasks.completed_toast') : t('tasks.reopened_toast'), 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || t('tasks.status_update_error'), 'error');
    }
  };

  const handleToggleTodoInTask = async (todoIndex: number) => {
    const newDesc = toggleChecklistItem(description, todoIndex);
    setDescription(newDesc);
    if (taskToEdit) {
      taskToEdit.description = newDesc;
      try {
        await api.put(`/tasks/${taskToEdit.id}`, { description: newDesc });
        onSuccess();
      } catch {
        showToast(t('tasks.progress_update_error'), 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast(t('tasks.enter_title_error'), 'error');
      return;
    }

    if (projectId && loadingMembers) {
      showToast(t('tasks.loading_members_warning'), 'warning');
      return;
    }

    const finalDesc = combineDescriptionParts(checklistText, markdownDetails);
    let finalDueDate: string | undefined = undefined;
    if (dueDateOnly) {
      finalDueDate = new Date(`${dueDateOnly}T${dueTimeOnly || '18:00'}:00`).toISOString();
    }
    let finalStartDate: string | undefined = undefined;
    if (startDate) {
      finalStartDate = new Date(`${startDate}T${startTime || '08:00'}:00`).toISOString();
    }
    const tagNames = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit.id}`, {
          title: title.trim(),
          description: finalDesc || undefined,
          subjectId: subjectId || null,
          projectId: projectId || null,
          assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
          status,
          priority,
          dueDate: finalDueDate || null,
          startDate: finalStartDate || null,
          tagNames
        });
        showToast(t('tasks.update_success'), 'success');
      } else {
        await api.post('/tasks', {
          title: title.trim(),
          description: finalDesc || undefined,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          workspaceId: defaultWorkspaceId || undefined,
          assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
          status,
          priority,
          dueDate: finalDueDate || undefined,
          startDate: finalStartDate || undefined,
          tagNames
        });
        showToast(t('tasks.create_success'), 'success');
      }

      isSavedRef.current = true;
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || t('tasks.save_error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentProjectName = projects.find((p) => p.id === projectId)?.name;
  const currentSubject = subjects.find((s) => s.id === subjectId);
  const isDone = status === TaskStatus.DONE;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleRequestClose}
        title={
          taskToEdit
            ? mode === 'VIEW'
              ? t('tasks.view_modal_title')
              : t('tasks.edit_task')
            : t('tasks.create_task')
        }
        maxWidth={mode === 'VIEW' ? '680px' : '720px'}
        icon={
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
          </div>
        }
      >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* VIEW / PREVIEW MODE: Minimalist, clean title, subtle metadata string, bounded description */}
        {mode === 'VIEW' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Title with Quick Complete Toggle */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {taskToEdit && (
                <button
                  type="button"
                  onClick={handleQuickToggleStatus}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDone ? 'var(--color-success)' : 'var(--text-muted)',
                    padding: '2px',
                    display: 'flex',
                    marginTop: '2px'
                  }}
                  title={isDone ? t('tasks.mark_undone') : t('tasks.mark_done')}
                >
                  {isDone ? <CheckCircle2 size={22} style={{ fill: 'rgba(16, 185, 129, 0.2)' }} /> : <Circle size={22} />}
                </button>
              )}

              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: 'var(--type-section)',
                    fontWeight: 800,
                    color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: isDone ? 'line-through' : 'none',
                    lineHeight: 1.35,
                    wordBreak: 'break-word'
                  }}
                >
                  {title || t('tasks.untitled_task')}
                </h2>

                {/* Subtle Metadata String */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px',
                    fontSize: 'var(--type-small)',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  {dueDate && (
                    <span>
                      {t('tasks.due_date_label')}: <b style={{ color: 'var(--text-primary)' }}>{formatDateTime(dueDate, { dateStyle: 'medium', timeStyle: 'short' })}</b>
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    {t('tasks.priority_label')}:{' '}
                    <b style={{ color: priority === TaskPriority.URGENT ? 'var(--color-danger)' : priority === TaskPriority.HIGH ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                      {priority === TaskPriority.URGENT
                        ? t('tasks.priority_urgent')
                        : priority === TaskPriority.HIGH
                        ? t('tasks.priority_high')
                        : priority === TaskPriority.MEDIUM
                        ? t('tasks.priority_medium')
                        : t('tasks.priority_low')}
                    </b>
                  </span>
                  <span>•</span>
                  <span>
                    {t('tasks.status_label')}: <b style={{ color: isDone ? 'var(--color-success)' : 'var(--accent-primary)' }}>
                      {isDone
                        ? t('tasks.status_done')
                        : status === TaskStatus.IN_PROGRESS
                        ? t('tasks.status_in_progress')
                        : t('tasks.status_todo')}
                    </b>
                  </span>
                  {currentSubject && (
                    <>
                      <span>•</span>
                      <span style={{ color: currentSubject.color || 'var(--accent-primary)', fontWeight: 600 }}>
                        [{currentSubject.code || t('classes.subject_card')}] {currentSubject.name}
                      </span>
                    </>
                  )}
                  {currentProjectName && (
                    <>
                      <span>•</span>
                      <span style={{ color: 'var(--color-purple)', fontWeight: 600 }}>{currentProjectName}</span>
                    </>
                  )}
                  {tagsInput.trim() && (
                    <>
                      <span>•</span>
                      <span>{tagsInput}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bounded Task Description to Prevent Overflow */}
            <div>
              <div style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('tasks.details_label')}
              </div>
              <div
                className="snote-card"
                style={{
                  maxHeight: '260px',
                  minHeight: '80px',
                  overflowY: 'auto',
                  padding: '16px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere'
                }}
              >
                {description.trim() ? (
                  <MarkdownViewer content={description} onToggleTodo={handleToggleTodoInTask} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--type-small)', fontStyle: 'italic' }}>
                    {t('tasks.no_details')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* EDIT / CREATE MODE: Full inputs and form controls */
          <>
            {/* Tiêu đề công việc (*) */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('tasks.task_title')}
              </label>
              <input
                type="text"
                required
                placeholder={t('tasks.task_title_placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="snote-input"
                style={{ fontSize: 'var(--type-body)', borderRadius: '10px' }}
              />
            </div>

            {/* Không gian lưu trữ & Độ ưu tiên (Row) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('tasks.workspace_storage')}
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="snote-select"
                  disabled={Boolean(defaultProjectId || defaultWorkspaceId)}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="">{defaultWorkspaceId ? t('tasks.group_workspace', { name: defaultWorkspaceName || '' }) : t('tasks.personal_task')}</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('tasks.priority_label')}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="snote-select"
                  style={{ borderRadius: '10px' }}
                >
                  <option value={TaskPriority.MEDIUM}>{t('tasks.priority_medium')}</option>
                  <option value={TaskPriority.HIGH}>{t('tasks.priority_high')}</option>
                  <option value={TaskPriority.URGENT}>{t('tasks.priority_urgent')}</option>
                  <option value={TaskPriority.LOW}>{t('tasks.priority_low')}</option>
                </select>
              </div>
            </div>

            {/* Giới hạn số người nhận việc Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '180px' }}>
                <span style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('tasks.slot_limit_label')}
                </span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={slotLimit}
                  onChange={(e) => setSlotLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  className="snote-input"
                  style={{ width: '100%', maxWidth: '240px', height: '34px', borderRadius: '8px' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={allowSelfAssign}
                  onChange={(e) => setAllowSelfAssign(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <span>{t('tasks.allow_self_assign')}</span>
              </label>
            </div>

            {/* Multi-Assignee Selection if inside project */}
            {(projectId || defaultWorkspaceId || taskToEdit?.workspaceId) && loadingMembers && (
              <div style={{ backgroundColor: 'var(--accent-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)', fontSize: 'var(--type-small)', color: 'var(--text-muted)' }}>
                ⏳ {t('tasks.loading_members')}
              </div>
            )}

            {(projectId || defaultWorkspaceId || taskToEdit?.workspaceId) && !loadingMembers && projectMembers.length > 0 && (
              <div style={{ backgroundColor: 'var(--accent-subtle)', padding: '12px', borderRadius: '10px', border: '1px solid var(--accent-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--accent-primary)', margin: 0 }}>
                    <Users size={14} />
                    <span>{t('tasks.assign_members', { count: selectedAssigneeIds.length })}</span>
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
                  {projectMembers.map((m: any) => {
                    const isSelected = selectedAssigneeIds.includes(m.userId);
                    return (
                      <label
                        key={m.userId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-input)',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          fontSize: 'var(--type-small)'
                        }}
                      >
                        <input type="checkbox" checked={isSelected} onChange={() => toggleAssignee(m.userId)} style={{ accentColor: 'var(--accent-primary)' }} />
                        <span style={{ fontWeight: isSelected ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.user?.fullName || m.user?.email}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ngày & Giờ bắt đầu & Hạn chót (Row) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('tasks.start_datetime')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="snote-input"
                    style={{ borderRadius: '8px', fontSize: 'var(--type-small)', padding: '6px 8px', minWidth: '95px' }}
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="snote-input"
                    style={{ borderRadius: '8px', fontSize: 'var(--type-small)', padding: '6px 8px', minWidth: '95px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('tasks.due_datetime')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <input
                    type="date"
                    value={dueDateOnly}
                    onChange={(e) => setDueDateOnly(e.target.value)}
                    className="snote-input"
                    style={{ borderRadius: '8px', fontSize: 'var(--type-small)', padding: '6px 8px', minWidth: '95px' }}
                  />
                  <input
                    type="time"
                    value={dueTimeOnly}
                    onChange={(e) => setDueTimeOnly(e.target.value)}
                    className="snote-input"
                    style={{ borderRadius: '8px', fontSize: 'var(--type-small)', padding: '6px 8px', minWidth: '95px' }}
                  />
                </div>
              </div>
            </div>

            {/* Danh sách đầu việc Checklist (mỗi dòng 1 mục) */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('tasks.checklist_input_label')}
              </label>
              <textarea
                rows={3}
                placeholder={t('tasks.checklist_placeholder')}
                value={checklistText}
                onChange={(e) => setChecklistText(e.target.value)}
                className="snote-textarea"
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 'var(--type-small)',
                  borderRadius: '10px',
                  lineHeight: '1.6'
                }}
              />
            </div>

            {/* Nội dung chi tiết (Hỗ trợ Markdown) */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('tasks.details_markdown_label')}
              </label>
              <textarea
                rows={4}
                placeholder={t('tasks.details_placeholder')}
                value={markdownDetails}
                onChange={(e) => setMarkdownDetails(e.target.value)}
                className="snote-textarea"
                style={{ borderRadius: '10px', lineHeight: '1.5' }}
              />
            </div>
          </>
        )}

        {/* Modal Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {mode === 'VIEW' ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode('EDIT')}
                  className="btn btn-primary"
                  style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit3 size={15} />
                  <span>{t('tasks.edit_task')}</span>
                </button>
                {taskToEdit && (
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title={t('tasks.share_task_tooltip')}
                  >
                    <Share2 size={15} />
                    <span>{t('notes.share')}</span>
                  </button>
                )}
              </>
            ) : taskToEdit ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <Eye size={14} />
                <span>{t('tasks.back_to_details')}</span>
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleRequestClose}
              className="btn btn-secondary"
            >
              {mode === 'VIEW' ? t('common.close') : t('common.cancel')}
            </button>
            {mode === 'EDIT' && (
              <button
                type="submit"
                disabled={loading || (Boolean(projectId) && loadingMembers)}
                className="btn btn-primary"
                style={{ fontWeight: 700 }}
              >
                {taskToEdit && <Save size={15} />}
                <span>{loading ? t('tasks.saving') : (Boolean(projectId) && loadingMembers) ? t('tasks.loading_members_btn') : taskToEdit ? t('tasks.save_changes') : t('tasks.create_task')}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>

    {taskToEdit && (
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        targetType="TASK"
        targetId={taskToEdit.id}
        targetTitle={taskToEdit.title || t('tasks.untitled_task')}
      />
    )}
  </>
);
};
