import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { ProjectModal } from '../components/ProjectModal';
import { TeamMembersModal } from '../components/TeamMembersModal';
import { ProjectStatus } from '@snote/shared';
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
  UserPlus
} from 'lucide-react';

export const ProjectsListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
  const [memberProject, setMemberProject] = useState<any | null>(null);
  const { showToast } = useToast();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (selectedSemesterId) params.append('semesterId', selectedSemesterId);

      const res = await api.get<ApiResponse<any[]>>(`/projects?${params.toString()}`);
      setProjects(res.data || []);
    } catch {
      showToast('Không thể tải danh sách đồ án', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, selectedSemesterId, showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Quản Lý Đồ Án & Dự Án Môn Học
            </h1>
            <span className="badge badge-purple">{projects.length} đồ án</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Theo dõi đề tài nghiên cứu, bài tập lớn và quản lý phân công thành viên nhóm
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
          <span>Thêm Đồ Án Mới</span>
        </button>
      </div>

      {/* Projects Grid */}
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
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <FolderKanban size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Chưa có đồ án hoặc dự án nào
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Tạo đồ án môn học để theo dõi nhật ký phát triển, tài liệu kỹ thuật và mời bạn học cùng làm nhóm.
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
            const statusConfig = getStatusBadge(proj.status);
            const StatusIcon = statusConfig.icon;
            const memberCount = proj.membersCount || (proj.members?.length || 1);

            return (
              <div
                key={proj.id}
                className="snote-card animate-fade-in"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '230px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className={`badge ${statusConfig.badgeClass}`}>
                      <StatusIcon size={12} />
                      <span>{statusConfig.label}</span>
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setMemberProject(proj)}
                        className="badge badge-purple"
                        style={{ cursor: 'pointer', border: '1px solid var(--color-purple)' }}
                        title="Quản lý thành viên nhóm"
                      >
                        <Users size={11} />
                        <span>{memberCount} Thành viên</span>
                      </button>

                      {proj.dueDate && (
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          <Calendar size={11} />
                          <span>Hạn: {new Date(proj.dueDate).toLocaleDateString('vi-VN')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3
                    onClick={() => {
                      setProjectToEdit(proj);
                      setIsModalOpen(true);
                    }}
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '17px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.35,
                      cursor: 'pointer'
                    }}
                  >
                    {proj.name}
                  </h3>

                  {proj.description && (
                    <p
                      style={{
                        margin: '0 0 14px 0',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {proj.description}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '12px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={12} />
                      <b>{proj.notesCount || 0}</b> notes
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckSquare size={12} />
                      <b>{proj.tasksCount || 0}</b> tasks
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setMemberProject(proj)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-purple)', padding: '4px 8px', fontSize: '12px' }}
                      title="Mời bạn học vào nhóm"
                    >
                      <UserPlus size={13} />
                      <span>Nhóm</span>
                    </button>
                    <button
                      onClick={() => {
                        setProjectToEdit(proj);
                        setIsModalOpen(true);
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-primary)', padding: '4px 8px', fontSize: '12px' }}
                    >
                      <Edit3 size={13} />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id, proj.name)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)', padding: '4px 8px', fontSize: '12px' }}
                    >
                      <Trash2 size={13} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Edit/Create Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
        projectToEdit={projectToEdit}
      />

      {/* Team Members Collaboration Modal */}
      {memberProject && (
        <TeamMembersModal
          isOpen={Boolean(memberProject)}
          onClose={() => setMemberProject(null)}
          project={memberProject}
          onSuccess={() => {
            fetchProjects();
            setMemberProject(null);
          }}
        />
      )}
    </div>
  );
};
