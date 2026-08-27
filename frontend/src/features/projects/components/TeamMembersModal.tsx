import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, UserPlus, Trash2, Crown, Shield, User } from 'lucide-react';
import { ProjectMemberDto } from '@snote/shared';

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
  const [role, setRole] = useState<'MEMBER' | 'VIEWER'>('MEMBER');
  const [loading, setLoading] = useState(false);

  if (!project) return null;

  const members: ProjectMemberDto[] = project.members || [];
  const isOwner = project.userId === currentUser?.id;

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
        role
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

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thành viên "${memberName}" khỏi đồ án này?`)) return;

    try {
      await api.delete(`/projects/${project.id}/members/${targetUserId}`);
      showToast(`Đã xóa thành viên "${memberName}" khỏi đồ án`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa thành viên', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thành Viên Nhóm Đồ Án: ${project.name}`}
      maxWidth="580px"
      icon={<Users size={20} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Invite Member Form */}
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
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="snote-select"
              style={{ fontSize: '13px' }}
            >
              <option value="MEMBER">Thành viên (Member)</option>
              <option value="VIEWER">Chỉ xem (Viewer)</option>
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

        {/* Current Members List */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>DANH SÁCH THÀNH VIÊN ({members.length}):</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Chưa có thành viên nào khác trong đồ án này
              </div>
            ) : (
              members.map((m) => {
                const memberUser = m.user;
                const isProjectOwner = m.role === 'OWNER' || m.userId === project.userId;
                return (
                  <div
                    key={m.id}
                    className="snote-card"
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isProjectOwner ? 'var(--color-warning-subtle)' : 'var(--accent-subtle)',
                          color: isProjectOwner ? 'var(--color-warning)' : 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700
                        }}
                      >
                        {isProjectOwner ? <Crown size={16} /> : (memberUser?.fullName ? memberUser.fullName.charAt(0).toUpperCase() : <User size={15} />)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{memberUser?.fullName || 'Thành viên'}</span>
                          {isProjectOwner ? (
                            <span className="badge badge-amber" style={{ fontSize: '10px', padding: '1px 5px' }}>Trưởng nhóm</span>
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 5px' }}>{m.role}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {memberUser?.email || m.userId}
                        </div>
                      </div>
                    </div>

                    {!isProjectOwner && isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.userId, memberUser?.fullName || 'thành viên')}
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--color-danger)', padding: '4px' }}
                        title="Xóa khỏi nhóm"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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
