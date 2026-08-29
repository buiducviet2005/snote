import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
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
  const [emailOrUserId, setEmailOrUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>(ProjectMemberRole.MEMBER);
  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  if (!project) return null;

  const members: ProjectMemberDto[] = project.members || [];
  const currentMemberRecord = members.find((m) => m.userId === currentUser?.id);
  const isOwner = currentMemberRecord?.role === ProjectMemberRole.OWNER || project.userId === currentUser?.id;
  const isAdmin = currentMemberRecord?.role === ProjectMemberRole.ADMIN;
  const canManageMembers = isOwner || isAdmin;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUserId.trim()) {
      showToast('Vui lòng nhập Email hoặc Mã tài khoản của thành viên', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/projects/${project.id}/members`, {
        emailOrUserId: emailOrUserId.trim(),
        role: inviteRole
      });

      showToast('Đã thêm thành viên vào dự án thành công!', 'success');
      setEmailOrUserId('');
      setInviteRole(ProjectMemberRole.MEMBER);
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thêm thành viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: ProjectMemberRole, memberName: string) => {
    if (newRole === ProjectMemberRole.OWNER) {
      if (!window.confirm(`Bạn có chắc muốn chuyển giao quyền Trưởng nhóm (OWNER) cho "${memberName}"?`)) return;
    }

    setUpdatingUserId(targetUserId);
    try {
      await api.put(`/projects/${project.id}/members/${targetUserId}`, {
        role: newRole
      });
      showToast(`Đã cập nhật vai trò của "${memberName}" thành ${getRoleLabel(newRole)}`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật vai trò', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    const isSelf = targetUserId === currentUser?.id;
    const confirmMsg = isSelf
      ? 'Bạn có chắc chắn muốn rời khỏi nhóm dự án này?'
      : `Bạn có chắc muốn xóa (kick) thành viên "${memberName}" khỏi dự án?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/projects/${project.id}/members/${targetUserId}`);
      showToast(isSelf ? 'Bạn đã rời khỏi nhóm dự án thành công' : `Đã xóa thành viên "${memberName}" khỏi dự án`, 'success');
      onSuccess();
      if (isSelf) onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thực hiện thao tác', 'error');
    }
  };

  const getRoleLabel = (role: ProjectMemberRole) => {
    switch (role) {
      case ProjectMemberRole.OWNER:
        return 'Trưởng nhóm';
      case ProjectMemberRole.ADMIN:
        return 'Quản trị viên';
      case ProjectMemberRole.VIEWER:
        return 'Chỉ xem';
      default:
        return 'Thành viên';
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
      title={`Thành Viên Nhóm Dự Án: ${project.name}`}
      maxWidth="660px"
      icon={<Users size={20} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Mời Bạn Học Cùng Làm Dự Án / Bài Tập Lớn</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '10px' }}>
              <input
                type="text"
                required
                placeholder="Nhập email (vd: sinhvien@snote.edu.vn) hoặc User ID"
                value={emailOrUserId}
                onChange={(e) => setEmailOrUserId(e.target.value)}
                className="snote-input"
                style={{ fontSize: '13px' }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as ProjectMemberRole)}
                className="snote-select"
                style={{ fontSize: '13px' }}
              >
                {isOwner && <option value={ProjectMemberRole.ADMIN}>Quản trị viên (Admin)</option>}
                <option value={ProjectMemberRole.MEMBER}>Thành viên (Member)</option>
                <option value={ProjectMemberRole.VIEWER}>Chỉ xem (Viewer)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <span>{loading ? 'Đang thêm...' : '+ Mời Vào Dự Án'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Current Members List */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>DANH SÁCH THÀNH VIÊN ({members.length}):</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Vai trò của bạn: <b>{getRoleLabel(currentMemberRecord?.role || (isOwner ? ProjectMemberRole.OWNER : ProjectMemberRole.MEMBER))}</b>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Chưa có thành viên nào khác trong dự án này
              </div>
            ) : (
              members.map((m) => {
                const memberUser = m.user;
                const isMemberOwner = m.role === ProjectMemberRole.OWNER || m.userId === project.userId;
                const isMemberAdmin = m.role === ProjectMemberRole.ADMIN;
                const isMe = m.userId === currentUser?.id;

                // Kiểm tra quyền Kick:
                // - Owner có thể kick tất cả người khác
                // - Admin có thể kick Member và Viewer (không kick Owner hoặc Admin khác)
                const canKickThisMember =
                  !isMe &&
                  ((isOwner && !isMemberOwner) ||
                   (isAdmin && !isMemberOwner && !isMemberAdmin));

                // Kiểm tra quyền đổi Role:
                const canChangeThisRole =
                  !isMe &&
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
                          fontSize: '14px',
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
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{memberUser?.fullName || 'Thành viên'}</span>
                          {isMe && <span className="badge badge-blue" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Bạn</span>}
                          {isMemberOwner && <span className="badge badge-amber" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Trưởng nhóm</span>}
                          {isMemberAdmin && !isMemberOwner && <span className="badge badge-purple" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Quản trị viên</span>}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
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
                          onChange={(e) => handleUpdateRole(m.userId, e.target.value as ProjectMemberRole, memberUser?.fullName || 'thành viên')}
                          className="snote-select"
                          style={{ fontSize: '12px', padding: '4px 8px', width: 'auto' }}
                          title="Cấp lại vai trò cho thành viên"
                        >
                          {isOwner && <option value={ProjectMemberRole.OWNER}>Trưởng nhóm (Owner)</option>}
                          {isOwner && <option value={ProjectMemberRole.ADMIN}>Quản trị viên (Admin)</option>}
                          <option value={ProjectMemberRole.MEMBER}>Thành viên (Member)</option>
                          <option value={ProjectMemberRole.VIEWER}>Chỉ xem (Viewer)</option>
                        </select>
                      ) : (
                        <span
                          className={`badge ${getRoleBadgeClass(m.role)}`}
                          style={{ fontSize: '11px' }}
                        >
                          {getRoleLabel(m.role)}
                        </span>
                      )}

                      {/* Kick Button (Owner or Admin kicking subordinate member) */}
                      {canKickThisMember && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, memberUser?.fullName || 'thành viên')}
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '5px' }}
                          title="Kick / Xóa thành viên khỏi dự án"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}

                      {/* Out Group Button (Self leaving group for non-owners or single-member owner) */}
                      {isMe && !isMemberOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, 'chính bạn')}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Rời khỏi nhóm dự án này"
                        >
                          <LogOut size={13} />
                          <span>Rời nhóm</span>
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
          {/* Quick Leave Button for Current Member if not Owner */}
          {currentMemberRecord && !isOwner ? (
            <button
              type="button"
              onClick={() => handleRemoveMember(currentUser!.id, 'chính bạn')}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--color-danger)', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} />
              <span>Rời khỏi dự án này</span>
            </button>
          ) : <div />}

          <button type="button" onClick={onClose} className="btn btn-secondary">
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};

