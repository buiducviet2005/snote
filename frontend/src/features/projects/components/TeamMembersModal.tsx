import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Users, UserPlus, Trash2, Crown, Shield, User, LogOut, Eye, ShieldCheck } from 'lucide-react';
import { ProjectMemberDto, ProjectMemberRole } from '@snote/shared';

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSuccess: () => void;
}

export const TeamMembersModal: React.FC<TeamMembersModalProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess
}) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [emailOrUserId, setEmailOrUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>(ProjectMemberRole.MEMBER);
  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  if (!project) return null;

  const isClassProject = Boolean(project.classId);
  const members: ProjectMemberDto[] = project.members || [];
  const currentMemberRecord = members.find((m) => m.userId === currentUser?.id && m.status === 'ACCEPTED');
  const isOwner = currentMemberRecord?.role === ProjectMemberRole.OWNER || project.userId === currentUser?.id;
  const isAdmin = currentMemberRecord?.role === ProjectMemberRole.ADMIN;
  const canManageMembers = isOwner || isAdmin;

  const getRoleLabel = (role: ProjectMemberRole) => {
    switch (role) {
      case ProjectMemberRole.OWNER:
        return t('projects.role_owner');
      case ProjectMemberRole.ADMIN:
        return t('projects.role_admin');
      case ProjectMemberRole.VIEWER:
        return t('projects.role_viewer');
      default:
        return t('projects.role_member');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUserId.trim()) {
      showToast(t('projects.team_email_placeholder'), 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/projects/${project.id}/members`, {
        emailOrUserId: emailOrUserId.trim(),
        role: inviteRole
      });

      showToast(t('projects.team_invite_btn'), 'success');
      setEmailOrUserId('');
      setInviteRole(ProjectMemberRole.MEMBER);
      onSuccess();
    } catch (err: any) {
      showToast(err.message || t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: ProjectMemberRole, memberName: string) => {
    if (newRole === ProjectMemberRole.OWNER) {
      if (!window.confirm(t('projects.transfer_owner_confirm', { name: memberName }))) return;
    }

    setUpdatingUserId(targetUserId);
    try {
      await api.put(`/projects/${project.id}/members/${targetUserId}`, {
        role: newRole
      });
      showToast(t('projects.transfer_role_success', { name: memberName, role: getRoleLabel(newRole) }), 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || t('common.error'), 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    const isSelf = targetUserId === currentUser?.id;
    const confirmMsg = isSelf
      ? t('projects.leave_self_confirm')
      : t('projects.kick_member_confirm', { name: memberName });

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/projects/${project.id}/members/${targetUserId}`);
      showToast(isSelf ? t('projects.leave_self_success') : t('projects.kick_member_success', { name: memberName }), 'success');
      onSuccess();
      if (isSelf) onClose();
    } catch (err: any) {
      showToast(err.message || t('common.error'), 'error');
    }
  };

  const getRoleBadgeClass = (role: ProjectMemberRole) => {
    switch (role) {
      case ProjectMemberRole.OWNER:
        return 'badge-amber';
      case ProjectMemberRole.ADMIN:
        return 'badge-purple';
      case ProjectMemberRole.VIEWER:
        return 'badge-neutral';
      default:
        return 'badge-green';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('projects.team_modal_title', { name: project.name })}
      maxWidth="660px"
      icon={<Users size={20} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Class Project Sync Notice */}
        {isClassProject && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--type-small)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Shield size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span>
              {t('projects.class_project_members_note')}
            </span>
          </div>
        )}

        {/* Invite Member Form (Visible to Owner & Admin) */}
        {canManageMembers && (
          <form
            onSubmit={handleAddMember}
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>{t('projects.team_invite_heading')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '10px' }}>
              <input
                type="text"
                required
                placeholder={t('projects.team_email_placeholder')}
                value={emailOrUserId}
                onChange={(e) => setEmailOrUserId(e.target.value)}
                className="snote-input"
                style={{ fontSize: 'var(--type-small)' }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as ProjectMemberRole)}
                className="snote-select"
                style={{ fontSize: 'var(--type-small)' }}
              >
                {isOwner && <option value={ProjectMemberRole.ADMIN}>{t('projects.role_admin')} (Admin)</option>}
                <option value={ProjectMemberRole.MEMBER}>{t('projects.role_member')} (Member)</option>
                <option value={ProjectMemberRole.VIEWER}>{t('projects.role_viewer')} (Viewer)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <span>{loading ? t('projects.team_inviting') : t('projects.team_invite_btn')}</span>
              </button>
            </div>
          </form>
        )}

        {/* Current Members List */}
        <div>
          <div style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{t('projects.team_members_header', { count: members.length })}</span>
            <span style={{ fontSize: 'var(--type-small)', color: 'var(--text-muted)' }}>
              {t('projects.team_your_role', { role: getRoleLabel(currentMemberRecord?.role || (isOwner ? ProjectMemberRole.OWNER : ProjectMemberRole.MEMBER)) })}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 'var(--type-small)' }}>
                {t('projects.team_empty')}
              </div>
            ) : (
              members.map((m) => {
                const memberUser = m.user;
                const isPending = m.status === 'PENDING';
                const isMemberOwner = m.role === ProjectMemberRole.OWNER || m.userId === project.userId;
                const isMemberAdmin = m.role === ProjectMemberRole.ADMIN;
                const isMe = m.userId === currentUser?.id;

                const canKickThisMember =
                  !isMe &&
                  ((isOwner && !isMemberOwner) ||
                   (isAdmin && !isMemberOwner && !isMemberAdmin));

                const canChangeThisRole =
                  !isMe && !isPending &&
                  ((isOwner && !isMemberOwner) ||
                   (isAdmin && !isMemberOwner && !isMemberAdmin));

                return (
                  <div
                    key={m.id}
                    className="snote-card"
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: isMe ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    {/* Left: Avatar + Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isMemberOwner
                            ? 'var(--color-warning-subtle)'
                            : isMemberAdmin
                            ? 'rgba(168, 85, 247, 0.15)'
                            : 'var(--accent-subtle)',
                          color: isMemberOwner
                            ? 'var(--color-warning)'
                            : isMemberAdmin
                            ? '#a855f7'
                            : 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'var(--type-body)',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {isMemberOwner ? (
                          <Crown size={18} />
                        ) : isMemberAdmin ? (
                          <ShieldCheck size={18} />
                        ) : memberUser?.fullName ? (
                          memberUser.fullName.charAt(0).toUpperCase()
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{memberUser?.fullName || t('projects.role_member')}</span>
                          {isMe && <span className="badge badge-blue" style={{ fontSize: 'var(--type-caption)', padding: '1px 5px' }}>{t('projects.role_you')}</span>}
                          {isMemberOwner && <span className="badge badge-amber" style={{ fontSize: 'var(--type-caption)', padding: '1px 5px' }}>{t('projects.role_owner')}</span>}
                          {isMemberAdmin && !isMemberOwner && <span className="badge badge-purple" style={{ fontSize: 'var(--type-caption)', padding: '1px 5px' }}>{t('projects.role_admin')}</span>}
                          {isPending && <span className="badge badge-neutral">{t('projects.role_pending')}</span>}
                        </div>
                        <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                          {memberUser?.email || m.userId}
                        </div>
                      </div>
                    </div>

                    {/* Right: Role Selector & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {canChangeThisRole ? (
                        <select
                          disabled={updatingUserId === m.userId}
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.userId, e.target.value as ProjectMemberRole, memberUser?.fullName || t('projects.role_member'))}
                          className="snote-select"
                          style={{ fontSize: 'var(--type-small)', padding: '4px 8px', width: 'auto' }}
                          title={t('projects.reassign_role_tooltip')}
                        >
                          {isOwner && <option value={ProjectMemberRole.OWNER}>{t('projects.role_owner')} (Owner)</option>}
                          {isOwner && <option value={ProjectMemberRole.ADMIN}>{t('projects.role_admin')} (Admin)</option>}
                          <option value={ProjectMemberRole.MEMBER}>{t('projects.role_member')} (Member)</option>
                          <option value={ProjectMemberRole.VIEWER}>{t('projects.role_viewer')} (Viewer)</option>
                        </select>
                      ) : (
                        <span
                          className={`badge ${getRoleBadgeClass(m.role)}`}
                          style={{ fontSize: 'var(--type-caption)' }}
                        >
                          {getRoleLabel(m.role)}
                        </span>
                      )}

                      {/* Kick Button (Owner or Admin kicking subordinate member) */}
                      {canKickThisMember && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, memberUser?.fullName || t('projects.role_member'))}
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '5px' }}
                          title={t('projects.kick_member_confirm', { name: memberUser?.fullName || t('projects.role_member') })}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          {/* Leave the project after transferring ownership. */}
          {currentMemberRecord && !isOwner ? (
            <button
              type="button"
              onClick={() => handleRemoveMember(currentUser!.id, t('projects.role_you'))}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--color-danger)', fontSize: 'var(--type-small)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} />
              <span>{t('projects.leave_project_btn')}</span>
            </button>
          ) : <div />}

          <button type="button" onClick={onClose} className="btn btn-secondary">
            {t('common.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

