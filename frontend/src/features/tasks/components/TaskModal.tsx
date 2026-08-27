import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useAuth } from '../../../contexts/AuthContext';
import { TaskStatus, TaskPriority } from '@snote/shared';
import {
  CheckSquare,
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
  Shield
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: any | null;
  defaultProjectId?: string;
  defaultSubjectId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
  defaultProjectId,
  defaultSubjectId
}) => {
  const { user: currentUser } = useAuth();
  const { subjects, selectedSubjectId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Fetch available projects to link
      api.get<ApiResponse<any[]>>('/projects')
        .then((res) => setProjects(res.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  // When project changes, load its members for assignment
  useEffect(() => {
    if (projectId) {
      api.get<ApiResponse<any>>(`/projects/${projectId}/workspace`)
        .then((res) => {
          const members = res.data?.members || [];
          setProjectMembers(members);
          // If no assignee selected, default to current user if member, or first member
          if (selectedAssigneeIds.length === 0 && currentUser) {
            const isMember = members.some((m: any) => m.userId === currentUser.id);
            if (isMember) {
              setSelectedAssigneeIds([currentUser.id]);
            } else if (members.length > 0) {
              setSelectedAssigneeIds([members[0].userId]);
            }
          }
        })
        .catch(() => {
          setProjectMembers([]);
        });
    } else {
      setProjectMembers([]);
    }
  }, [projectId, currentUser]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setSubjectId(taskToEdit.subjectId || '');
      setProjectId(taskToEdit.projectId || '');

      // Multi-assignees
      const existingAssigneeIds = (taskToEdit.assignees || []).map((a: any) => a.id || a.userId);
      if (existingAssigneeIds.length > 0) {
        setSelectedAssigneeIds(existingAssigneeIds);
      } else if (taskToEdit.userId) {
        setSelectedAssigneeIds([taskToEdit.userId]);
      } else if (taskToEdit.assignee?.id) {
        setSelectedAssigneeIds([taskToEdit.assignee.id]);
      }

      setStatus(taskToEdit.status || TaskStatus.TODO);
      setPriority(taskToEdit.priority || TaskPriority.MEDIUM);
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().slice(0, 16) : '');
      setTagsInput((taskToEdit.tags || []).map((t: any) => t.name).join(', '));
    } else {
      setTitle('');
      setDescription('');
      setSubjectId(defaultSubjectId || selectedSubjectId || '');
      setProjectId(defaultProjectId || '');
      setSelectedAssigneeIds(currentUser?.id ? [currentUser.id] : []);
      setStatus(TaskStatus.TODO);
      setPriority(TaskPriority.MEDIUM);
      setDueDate('');
      setTagsInput('');
    }
  }, [taskToEdit, selectedSubjectId, subjects, isOpen, defaultProjectId, defaultSubjectId, currentUser]);

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) => {
      if (prev.includes(userId)) {
        // Don't allow empty assignees if we can avoid it, but allow toggle
        const filtered = prev.filter((id) => id !== userId);
        return filtered.length > 0 ? filtered : [userId];
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagNames = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit.id}`, {
          title: title.trim(),
          description: description.trim() || undefined,
          subjectId: subjectId || null,
          projectId: projectId || null,
          assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          tagNames
        });
        showToast('Cập nhật công việc thành công!', 'success');
      } else {
        await api.post('/tasks', {
          title: title.trim(),
          description: description.trim() || undefined,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          tagNames
        });
        showToast('Tạo công việc và giao việc thành công!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu công việc', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentProjectName = projects.find((p) => p.id === projectId)?.name;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Chỉnh Sửa Công Việc & Phân Công Nhóm' : 'Giao Việc & Tạo Nhiệm Vụ Mới'}
      maxWidth="680px"
      icon={<CheckSquare size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Project Header context if inside project */}
        {defaultProjectId && currentProjectName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <FolderKanban size={16} style={{ color: 'var(--color-purple)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Đang tạo nhiệm vụ trong đồ án: <b>{currentProjectName}</b>
            </span>
          </div>
        )}

        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Tên công việc / Nhiệm vụ cần làm *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Thiết kế Database & Pipeline tích hợp API"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="snote-input"
            style={{ fontSize: '14.5px', fontWeight: 600 }}
          />
        </div>

        {/* Subject & Project Linkage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Môn học liên quan
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="snote-select"
            >
              <option value="">📝 Việc cá nhân (Không thuộc môn học)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              <FolderKanban size={13} style={{ color: 'var(--color-purple)' }} />
              <span>Đồ án / Dự án nhóm</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="snote-select"
              disabled={Boolean(defaultProjectId)}
            >
              <option value="">-- Không gắn đồ án (Việc cá nhân) --</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  📁 {proj.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-Assignee Selection (Phân công nhiều thành viên tham gia cùng làm) */}
        {projectId && projectMembers.length > 0 && (
          <div style={{ backgroundColor: 'var(--accent-subtle)', padding: '14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', margin: 0 }}>
                <Users size={16} />
                <span>Thành viên tham gia thực hiện công việc ({selectedAssigneeIds.length} người)</span>
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Click để chọn 1 hoặc nhiều người
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
              {projectMembers.map((m: any) => {
                const isLeader = m.role === 'OWNER';
                const isMe = m.userId === currentUser?.id;
                const isSelected = selectedAssigneeIds.includes(m.userId);

                return (
                  <div
                    key={m.userId}
                    onClick={() => toggleAssignee(m.userId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--bg-primary)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      userSelect: 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: isSelected ? 'none' : '1.5px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {m.user?.fullName || m.user?.email} {isMe ? '(Bạn)' : ''}
                      </div>
                      <div style={{ fontSize: '10.5px', color: isLeader ? 'var(--color-purple)' : 'var(--text-muted)' }}>
                        {isLeader ? '👑 Trưởng nhóm' : '👤 Thành viên'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Priority & Due date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Mức độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="snote-select"
            >
              <option value={TaskPriority.LOW}>🟢 Thấp (Low)</option>
              <option value={TaskPriority.MEDIUM}>🟡 Trung bình (Medium)</option>
              <option value={TaskPriority.HIGH}>🟠 Cao (High)</option>
              <option value={TaskPriority.URGENT}>🔴 Khẩn cấp (Urgent)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Hạn chót hoàn thành (Deadline)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="snote-input"
            />
          </div>
        </div>

        {/* Initial status */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Trạng thái thực hiện
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="snote-select"
          >
            <option value={TaskStatus.TODO}>📋 Cần làm (TODO)</option>
            <option value={TaskStatus.IN_PROGRESS}>⚡ Đang thực hiện (IN_PROGRESS)</option>
            <option value={TaskStatus.DONE}>✅ Đã hoàn thành (DONE)</option>
            <option value={TaskStatus.CANCELLED}>🚫 Đã hủy (CANCELLED)</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Mô tả chi tiết / Ghi chú yêu cầu
          </label>
          <textarea
            rows={3}
            placeholder="Mô tả tóm tắt nội dung bài tập, tiêu chí chấm hoặc phân công công việc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="snote-textarea"
          />
        </div>

        {/* Tags */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Thẻ tags phân loại (Phân cách bằng dấu phẩy)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Tag size={15} />
            </span>
            <input
              type="text"
              placeholder="Backend, Frontend, Sprint 1, Research"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="snote-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            <Save size={15} />
            <span>{loading ? 'Đang lưu...' : taskToEdit ? 'Lưu Thay Đổi' : 'Giao Việc & Tạo Task'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
