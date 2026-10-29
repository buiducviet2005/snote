import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ProjectModal } from '../components/ProjectModal';
import { TeamMembersModal } from '../components/TeamMembersModal';
import { ProjectWorkspaceModal } from '../components/ProjectWorkspaceModal';
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
  UserPlus,
  ExternalLink,
  ArrowRight,
  MailCheck,
  Check,
  X,
  LogOut,
  ShieldAlert
} from 'lucide-react';

export const ProjectsListPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedSubjectId, selectedSemesterId } = useAppFilter();
  const { t, formatDate } = useLanguage();
  const [projects, setProjects] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
  const [memberProjectId, setMemberProjectId] = useState<string | null>(null);
  const memberProject = projects.find((project) => project.id === memberProjectId) || null;
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
      showToast(t('projects.load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, selectedSemesterId, showToast, t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAcceptInvitation = async (id: string, name: string) => {
    try {
      await api.post(`/projects/${id}/invitations/accept`, {});
      showToast(t('projects.join_success_banner', { name }), 'success');
      fetchProjects();
      window.dispatchEvent(new Event('snote_refresh_workspaces'));
    } catch (err: any) {
      showToast(err.message || t('projects.join_error'), 'error');
    }
  };

  const handleDeclineInvitation = async (id: string, name: string) => {
    if (!window.confirm(t('projects.decline_confirm', { name }))) return;
    try {
      await api.post(`/projects/${id}/invitations/decline`, {});
      showToast(t('projects.decline_success', { name }), 'info');
      fetchProjects();
    } catch (err: any) {
      showToast(err.message || t('projects.decline_error'), 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t('projects.delete_confirm', { name }))) return;

    try {
      await api.delete(`/projects/${id}`);
      showToast(t('projects.delete_success_msg', { name }), 'success');
      fetchProjects();
    } catch (err: any) {
      showToast(err.message || t('projects.delete_error'), 'error');
    }
  };

  const handleLeave = async (id: string, name: string) => {
    if (!user) return;
    if (!window.confirm(t('projects.leave_confirm', { name }))) return;

    try {
      await api.delete(`/projects/${id}/members/${user.id}`);
      showToast(t('projects.leave_success', { name }), 'success');
      fetchProjects();
      window.dispatchEvent(new Event('snote_refresh_workspaces'));
    } catch (err: any) {
      showToast(err.message || t('projects.leave_error'), 'error');
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return { label: t('classes.status_active'), badgeClass: 'badge-blue', icon: Zap };
      case ProjectStatus.COMPLETED:
        return { label: t('classes.status_completed'), badgeClass: 'badge-green', icon: CheckCircle2 };
      case ProjectStatus.ON_HOLD:
        return { label: t('classes.status_on_hold'), badgeClass: 'badge-amber', icon: Clock };
      default:
        return { label: t('classes.status_planned'), badgeClass: 'badge-neutral', icon: Calendar };
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-purple" style={{ fontSize: 'var(--type-caption)', padding: '3px 8px' }}>
            {t('projects.header_badge', { count: projects.length })}
          </span>
        </div>

        <button
          onClick={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary btn-sm"
          style={{ padding: '7px 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>{t('projects.create_btn')}</span>
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
            <h3 style={{ margin: 0, fontSize: 'var(--type-body)', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('projects.invitations_title', { count: invitations.length })}
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
                    <span style={{ fontSize: 'var(--type-body)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      📁 {inv.name}
                    </span>
                    {inv.subject && (
                      <span className="badge badge-blue" style={{ fontSize: 'var(--type-caption)' }}>
                        {inv.subject.code || inv.subject.name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--type-small)', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {t('projects.invited_by', { name: inv.user?.fullName || inv.user?.email })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleAcceptInvitation(inv.id, inv.name)}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check size={14} />
                    <span>{t('projects.accept_invite')}</span>
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(inv.id, inv.name)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={14} />
                    <span>{t('projects.decline_invite')}</span>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: 'var(--type-body)' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>{t('projects.loading')}</span>
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
          <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--type-section)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('projects.empty_title')}
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: 'var(--type-small)', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            {t('projects.empty_desc')}
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
            <span>{t('projects.create_first')}</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {projects.map((proj) => {
            const statusMeta = getStatusBadge(proj.status);
            const StatusIcon = statusMeta.icon;
            const membersCount = proj.members?.length || proj._count?.members || 1;
            const currentMember = proj.members?.find((m: any) => m.userId === user?.id);
            const isOwner = currentMember?.role === 'OWNER' || proj.userId === user?.id;
            const isMember = Boolean(currentMember);
            const isClassProject = Boolean(proj.classId);

            return (
              <div
                key={proj.id}
                className="snote-card stagger-card"
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
                      {isClassProject && <span className="badge badge-purple">{t('projects.class_project_tag')}</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => setMemberProjectId(proj.id)}
                        className="btn btn-ghost btn-icon"
                        title={t('projects.manage_members_tooltip')}
                        aria-label={t('projects.manage_members_tooltip')}
                        style={{ minWidth: '30px', minHeight: '30px', padding: '4px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Users size={15} />
                      </button>
                      {!isClassProject && <button
                        onClick={() => {
                          setProjectToEdit(proj);
                          setIsModalOpen(true);
                        }}
                        className="btn btn-ghost btn-icon"
                        title={t('projects.edit_tooltip')}
                        aria-label={t('projects.edit_tooltip')}
                        style={{ minWidth: '30px', minHeight: '30px', padding: '4px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit3 size={15} />
                      </button>}
                      {!isClassProject && (isOwner ? (
                        <button
                          onClick={() => handleDelete(proj.id, proj.name)}
                          className="btn btn-ghost btn-icon"
                          title={t('projects.delete_tooltip')}
                          aria-label={t('projects.delete_tooltip')}
                          style={{ minWidth: '30px', minHeight: '30px', padding: '4px', color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : isMember ? (
                        <button
                          onClick={() => handleLeave(proj.id, proj.name)}
                          className="btn btn-ghost btn-icon"
                          title={t('projects.leave_tooltip')}
                          aria-label={t('projects.leave_tooltip')}
                          style={{ minWidth: '30px', minHeight: '30px', padding: '4px', color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <LogOut size={15} />
                        </button>
                      ) : null)}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    onClick={() => setWorkspaceProjectId(proj.id)}
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: 'var(--type-section)',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title={t('projects.open_workspace_tooltip')}
                  >
                    <span>{proj.name}</span>
                    <ExternalLink size={13} style={{ color: 'var(--text-muted)' }} />
                  </h3>

                  <p style={{ margin: '0 0 16px 0', fontSize: 'var(--type-small)', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {proj.description || t('projects.no_desc')}
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
                      <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <CheckSquare size={12} /> {t('projects.tasks_stat')}
                      </div>
                      <div style={{ fontSize: 'var(--type-body)', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {proj._count?.tasks || 0}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <FileText size={12} /> {t('projects.notes_stat')}
                      </div>
                      <div style={{ fontSize: 'var(--type-body)', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {proj._count?.notes || 0}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <Users size={12} /> {t('projects.members_stat')}
                      </div>
                      <div style={{ fontSize: 'var(--type-body)', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {membersCount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--type-caption)', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{proj.dueDate ? t('projects.due_stat', { date: formatDate(proj.dueDate) }) : t('projects.not_set')}</span>
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
                              fontSize: 'var(--type-caption)',
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
                    <span>{t('projects.open_workspace')}</span>
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
          onClose={() => setMemberProjectId(null)}
          project={memberProject}
          onSuccess={() => {
            void fetchProjects();
            window.dispatchEvent(new Event('snote_refresh_workspaces'));
          }}
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
