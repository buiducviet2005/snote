import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api, ApiResponse } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { ShareTargetType, ShareAccessLevel } from '@snote/shared';
import {
  Share2,
  Mail,
  Link,
  Copy,
  Check,
  Trash2,
  UserPlus,
  Globe,
  Shield,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'NOTE' | 'TASK' | 'PROJECT';
  targetId: string;
  targetTitle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle
}) => {
  const [activeTab, setActiveTab] = useState<'USER' | 'LINK'>('USER');
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<ShareAccessLevel>(ShareAccessLevel.VIEW);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [shares, setShares] = useState<any[]>([]);
  const [publicShare, setPublicShare] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const fetchShares = async () => {
    try {
      const res = await api.get<ApiResponse<any[]>>('/shares/shared-by-me');
      const filtered = (res.data || []).filter(
        (s) => s.targetType === targetType && s.targetId === targetId
      );
      setShares(filtered.filter((s) => !s.isPublic));
      const pub = filtered.find((s) => s.isPublic);
      setPublicShare(pub || null);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      setEmail('');
      setCopied(false);
    }
  }, [isOpen, targetId, targetType]);

  const handleShareWithUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await api.post('/shares', {
        targetType,
        targetId,
        sharedWithEmail: email.trim().toLowerCase(),
        accessLevel,
        isPublic: false
      });

      showToast(`Đã chia sẻ thành công với ${email}`, 'success');
      setEmail('');
      fetchShares();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi chia sẻ tài liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePublicLink = async () => {
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<any>>('/shares', {
        targetType,
        targetId,
        accessLevel: ShareAccessLevel.VIEW,
        isPublic: true,
        expiresInDays: expiresInDays > 0 ? expiresInDays : undefined
      });

      setPublicShare(res.data);
      showToast('Đã tạo liên kết chia sẻ công khai!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo liên kết công khai', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      await api.delete(`/shares/${shareId}`);
      showToast('Đã thu hồi quyền chia sẻ', 'info');
      fetchShares();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thu hồi chia sẻ', 'error');
    }
  };

  const publicUrl = publicShare?.shareToken
    ? `${window.location.origin}/share/${publicShare.shareToken}`
    : '';

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chia sẻ: ${targetTitle}`}
      maxWidth="620px"
      icon={<Share2 size={22} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Tab Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '3px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('USER')}
            className={`btn btn-sm ${activeTab === 'USER' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontWeight: activeTab === 'USER' ? 700 : 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={15} />
            <span>Chia sẻ với bạn học</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LINK')}
            className={`btn btn-sm ${activeTab === 'LINK' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontWeight: activeTab === 'LINK' ? 700 : 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Globe size={15} />
            <span>Liên kết công khai</span>
          </button>
        </div>

        {/* TAB 1: SHARE WITH USER VIA EMAIL */}
        {activeTab === 'USER' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <form onSubmit={handleShareWithUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Nhập email của bạn học:
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Mail size={15} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="banhoc@sinhvien.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="snote-input"
                    style={{ paddingLeft: '36px', fontSize: '13px' }}
                  />
                </div>

                <select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value as ShareAccessLevel)}
                  className="snote-select"
                  style={{ fontSize: '12.5px', width: '130px' }}
                >
                  <option value={ShareAccessLevel.VIEW}>👁️ Chỉ xem</option>
                  <option value={ShareAccessLevel.EDIT}>✏️ Chỉnh sửa</option>
                </select>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700, padding: '0 16px', flexShrink: 0 }}
                >
                  {loading ? 'Đang gửi...' : 'Chia sẻ'}
                </button>
              </div>
            </form>

            {/* List of active shares */}
            <div style={{ marginTop: '6px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Những người đang có quyền truy cập ({shares.length}):
              </div>

              {shares.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  Chưa có bạn học nào được chia sẻ riêng tài liệu này.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shares.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-primary)',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {(s.sharedWithUser?.fullName || s.sharedWithEmail || 'U').slice(0, 2).toUpperCase()}
                        </span>

                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {s.sharedWithUser?.fullName || s.sharedWithEmail}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {s.accessLevel === ShareAccessLevel.EDIT ? '✏️ Quyền Chỉnh sửa' : '👁️ Quyền Chỉ xem'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevokeShare(s.id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        title="Thu hồi quyền chia sẻ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PUBLIC LINK SHARE */}
        {activeTab === 'LINK' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {publicShare ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Globe size={15} />
                    <span>Liên kết công khai đang kích hoạt</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRevokeShare(publicShare.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11.5px', color: 'var(--color-danger)', padding: '2px 8px' }}
                  >
                    Vô hiệu hóa link
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="snote-input"
                    style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
                    style={{ fontWeight: 700, gap: '4px', padding: '0 14px', flexShrink: 0 }}
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  🔒 Bất kỳ ai có liên kết này đều có thể xem nội dung tài liệu.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-subtle)',
                  textAlign: 'center'
                }}
              >
                <Globe size={28} style={{ color: 'var(--accent-primary)', margin: '0 auto' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Chưa tạo liên kết công khai
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Tạo liên kết để gửi cho bạn bè trong nhóm Zalo / Messenger mà không cần họ đăng nhập SNOTE.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="snote-select"
                    style={{ fontSize: '12px', width: '140px' }}
                  >
                    <option value={7}>Hết hạn sau 7 ngày</option>
                    <option value={30}>Hết hạn sau 30 ngày</option>
                    <option value={0}>Không bao giờ hết hạn</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleCreatePublicLink}
                    disabled={loading}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700, padding: '7px 16px' }}
                  >
                    {loading ? 'Đang tạo...' : 'Tạo Liên Kết Công Khai'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '8px 18px' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};
