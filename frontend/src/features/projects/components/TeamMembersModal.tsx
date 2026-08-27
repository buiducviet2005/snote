import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, UserPlus, Trash2, Crown, Shield, User, LogOut, Check } from 'lucide-react';
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUserId.trim()) {
      showToast('Vui lòng nhập Email hoặc Mã tài khoản của bạn học', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/projects/${project.id}/members`, {
        emailOrUserId: emailOrUserId.trim(),
        role: inviteRole
      });

      showToast('Đã thêm thành viên vào đồ án thành công!', 'success');
      setEmailOrUserId('');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thêm thành viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: ProjectMemberRole, memberName: string) => {
    if (newRole === ProjectMemberRole.OWNER) {
      if (!window.confirm(`Bạn có chắc muốn cấp quyền Trưởng nhóm (OWNER) cho "${memberName}"?`)) return;
    }

    setUpdatingUserId(targetUserId);
    try {
      await api.put(`/projects/${project.id}/members/${targetUserId}`, {
        role: newRole
      });
      showToast(`Đã cập nhật quyền của "${memberName}" thành ${newRole}`, 'success');
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
      ? 'Bạn có chắc chắn muốn rời khỏi nhóm đồ án này?'
      : `Bạn có chắc muốn xóa thành viên "${memberName}" khỏi đồ án?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/projects/${project.id}/members/${targetUserId}`);
      showToast(isSelf ? 'Bạn đã rời khỏi nhóm đồ án' : `Đã xóa thành viên "${memberName}" khỏi đồ án`, 'success');
      onSuccess();
      if (isSelf) onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thực hiện thao tác', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thành Viên Nhóm Đồ Án: ${project.name}`}
      maxWidth="620px"
      icon={<Users size={20} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Invite Member Form (Visible to Owner & Member) */}
        {currentMemberRecord?.role !== ProjectMemberRole.VIEWER && (
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
              <span>Mời Bạn Học Cùng Làm Đồ Án</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
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
                <span>{loading ? 'Đang thêm...' : '+ Mời Vào Đồ Án'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Current Members List */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>DANH SÁCH THÀNH VIÊN ({members.length}):</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Quyền của bạn: <b>{currentMemberRecord?.role || 'OWNER'}</b>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Chưa có thành viên nào khác trong đồ án này
              </div>
            ) : (
              members.map((m) => {
                const memberUser = m.user;
                const isMemberOwner = m.role === ProjectMemberRole.OWNER || m.userId === project.userId;
                const isMe = m.userId === currentUser?.id;

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
                          backgroundColor: isMemberOwner ? 'var(--color-warning-subtle)' : 'var(--accent-subtle)',
                          color: isMemberOwner ? 'var(--color-warning)' : 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {isMemberOwner ? <Crown size={18} /> : (memberUser?.fullName ? memberUser.fullName.charAt(0).toUpperCase() : <User size={16} />)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{memberUser?.fullName || 'Thành viên'}</span>
                          {isMe && <span className="badge badge-blue" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Bạn</span>}
                          {isMemberOwner && <span className="badge badge-amber" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Trưởng nhóm</span>}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {memberUser?.email || m.userId}
                        </div>
                      </div>
                    </div>

                    {/* Right: Role Selector & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isOwner && !isMemberOwner ? (
                        <select
                          disabled={updatingUserId === m.userId}
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.userId, e.target.value as ProjectMemberRole, memberUser?.fullName || 'thành viên')}
                          className="snote-select"
                          style={{ fontSize: '12px', padding: '4px 8px', width: 'auto' }}
                          title="Cấp lại vai trò cho thành viên"
                        >
                          <option value={ProjectMemberRole.MEMBER}>Thành viên (Member)</option>
                          <option value={ProjectMemberRole.VIEWER}>Chỉ xem (Viewer)</option>
                          <option value={ProjectMemberRole.OWNER}>Trưởng nhóm (Owner)</option>
                        </select>
                      ) : (
                        <span
                          className={`badge ${isMemberOwner ? 'badge-amber' : m.role === ProjectMemberRole.VIEWER ? 'badge-neutral' : 'badge-green'}`}
                          style={{ fontSize: '11px' }}
                        >
                          {m.role === ProjectMemberRole.OWNER ? 'Trưởng nhóm' : m.role === ProjectMemberRole.VIEWER ? 'Chỉ xem' : 'Thành viên'}
                        </span>
                      )}

                      {/* Remove Button (Owner kicking non-owner) */}
                      {isOwner && !isMemberOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, memberUser?.fullName || 'thành viên')}
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '5px' }}
                          title="Xóa thành viên khỏi nhóm"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}

                      {/* Leave Project Button (Self non-owner leaving) */}
                      {isMe && !isMemberOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, 'chính bạn')}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '4px 8px', fontSize: '12px' }}
                          title="Rời khỏi nhóm đồ án"
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};
