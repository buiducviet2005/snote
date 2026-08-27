import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { ProjectModal } from '../components/ProjectModal';
import { TeamMembersModal } from '../components/TeamMembersModal';
import { ProjectWorkspaceModal } from '../components/ProjectWorkspaceModal';
import { ProjectStatus } from '@snote/shared';
import confetti from 'canvas-confetti';
import {
  FolderKanban,
  Plus,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Sparkles,
  FileText,
  CheckSquare,
  Zap,
  CheckCircle2,
  Users,
  UserPlus,
  ExternalLink,
  ArrowRight,
  MailCheck,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';

export const ProjectsListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
  const [memberProject, setMemberProject] = useState<any | null>(null);
  const [workspaceProjectId, setWorkspaceProjectId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (selectedSemesterId) params.append('semesterId', selectedSemesterId);

      const [resProjects, resInvites] = await Promise.all([
        api.get<ApiResponse<any[]>>(`/projects?${params.toString()}`),
        api.get<ApiResponse<any[]>>('/projects/invitations').catch(() => ({ data: [] }))
      ]);

      setProjects(resProjects.data || []);
      setInvitations(resInvites.data || []);
    } catch {
      showToast('Không thể tải danh sách đồ án', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, selectedSemesterId, showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAcceptInvitation = async (id: string, name: string) => {
    try {
      await api.post(`/projects/${id}/invitations/accept`, {});
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      showToast(`🎉 Bạn đã tham gia đồ án "${name}"!`, 'success');
      fetchProjects();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi chấp nhận lời mời', 'error');
    }
  };

  const handleDeclineInvitation = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn từ chối tham gia đồ án "${name}" không?`)) return;
    try {
      await api.post(`/projects/${id}/invitations/decline`, {});
      showToast(`Đã từ chối lời mời đồ án "${name}"`, 'info');
      fetchProjects();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi từ chối lời mời', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đồ án "${name}" không?`)) return;

    try {
      await api.delete(`/projects/${id}`);
      showToast(`Đã xóa đồ án "${name}"`, 'success');
      fetchProjects();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa đồ án', 'error');
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return { label: 'Đang làm', badgeClass: 'badge-blue', icon: Zap };
      case ProjectStatus.COMPLETED:
        return { label: 'Hoàn thành', badgeClass: 'badge-green', icon: CheckCircle2 };
      case ProjectStatus.ON_HOLD:
        return { label: 'Tạm hoãn', badgeClass: 'badge-amber', icon: Clock };
      default:
        return { label: 'Lên kế hoạch', badgeClass: 'badge-neutral', icon: Calendar };
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Quản Lý Đồ Án & Dự Án Nhóm
            </h1>
            <span className="badge badge-purple">{projects.length} đồ án</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Theo dõi tiến độ, phân công thành viên và xây dựng không gian làm việc số cho đồ án môn học
          </p>
        </div>

        <button
          onClick={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>Tạo Đồ Án Mới</span>
        </button>
      </div>

      {/* Pending Invitations Banner */}
      {invitations.length > 0 && (
        <div
          className="snote-card animate-fade-in"
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <MailCheck size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Lời Mời Tham Gia Đồ Án Nhóm ({invitations.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      📁 {inv.name}
                    </span>
                    {inv.subject && (
                      <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>
                        {inv.subject.code || inv.subject.name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Trưởng nhóm mời: <b>{inv.user?.fullName || inv.user?.email}</b>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleAcceptInvitation(inv.id, inv.name)}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check size={14} />
                    <span>Chấp Nhận</span>
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(inv.id, inv.name)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={14} />
                    <span>Từ Chối</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>Đang tải danh sách đồ án...</span>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div
          className="snote-card"
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-secondary)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-purple-subtle)',
              color: 'var(--color-purple)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <FolderKanban size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Chưa có đồ án hoặc dự án nhóm nào
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Tạo không gian đồ án để theo dõi bài tập lớn, phân chia công việc cho thành viên và lưu trữ tài liệu nhóm.
          </p>
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Tạo Đồ Án Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {projects.map((proj) => {
            const statusMeta = getStatusBadge(proj.status);
            const StatusIcon = statusMeta.icon;
            const membersCount = proj.members?.length || proj._count?.members || 1;

            return (
              <div
                key={proj.id}
                className="snote-card animate-fade-in"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${statusMeta.badgeClass}`}>
                        <StatusIcon size={12} />
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => setMemberProject(proj)}
                        className="btn btn-ghost btn-icon"
                        title="Quản lý thành viên nhóm"
                        style={{ padding: '6px', color: 'var(--text-secondary)' }}
                      >
                        <UserPlus size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setProjectToEdit(proj);
                          setIsModalOpen(true);
                        }}
                        className="btn btn-ghost btn-icon"
                        title="Chỉnh sửa đồ án"
                        style={{ padding: '6px', color: 'var(--text-secondary)' }}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(proj.id, proj.name)}
                        className="btn btn-ghost btn-icon"
                        title="Xóa đồ án"
                        style={{ padding: '6px', color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    onClick={() => setWorkspaceProjectId(proj.id)}
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '16.5px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Mở Không Gian Làm Việc Đồ Án"
                  >
                    <span>{proj.name}</span>
                    <ExternalLink size={13} style={{ color: 'var(--text-muted)' }} />
                  </h3>

                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {proj.description || 'Chưa có mô tả chi tiết cho đồ án này.'}
                  </p>

                  {/* Stats Counter Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <CheckSquare size={12} /> Tasks
                      </div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {proj._count?.tasks || 0}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <FileText size={12} /> Notes
                      </div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {proj._count?.notes || 0}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <Users size={12} /> Thành viên
                      </div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {membersCount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>Hạn nộp: {proj.dueDate ? new Date(proj.dueDate).toLocaleDateString('vi-VN') : 'Chưa đặt'}</span>
                    </div>

                    {proj.members && proj.members.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {proj.members.slice(0, 3).map((m: any, i: number) => (
                          <div
                            key={m.id || i}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--accent-subtle)',
                              color: 'var(--accent-primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 700,
                              marginLeft: i > 0 ? '-6px' : 0,
                              border: '1.5px solid var(--bg-card)'
                            }}
                            title={m.user?.fullName || m.user?.email}
                          >
                            {m.user?.fullName?.charAt(0) || 'U'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Primary CTA: Open Interactive Collaborative Workspace */}
                  <button
                    onClick={() => setWorkspaceProjectId(proj.id)}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '8px 12px' }}
                  >
                    <span>Mở Không Gian Làm Việc</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal (Create/Edit) */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
        projectToEdit={projectToEdit}
      />

      {/* Team Members Modal */}
      {memberProject && (
        <TeamMembersModal
          isOpen={Boolean(memberProject)}
          onClose={() => setMemberProject(null)}
          project={memberProject}
          onSuccess={fetchProjects}
        />
      )}

      {/* Project Interactive Collaborative Workspace Modal */}
      {workspaceProjectId && (
        <ProjectWorkspaceModal
          isOpen={Boolean(workspaceProjectId)}
          onClose={() => setWorkspaceProjectId(null)}
          projectId={workspaceProjectId}
          onRefreshParent={fetchProjects}
        />
      )}
    </div>
  );
};
