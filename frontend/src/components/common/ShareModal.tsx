import React, { useEffect, useRef, useState } from 'react';
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

type ShareListStatus = 'idle' | 'loading' | 'error' | 'empty' | 'ready';
type PendingAction =
  | 'share'
  | 'link'
  | 'copy'
  | { type: 'revoke'; shareId: string }
  | null;
type ExpiryTimerPlan =
  | { kind: 'expired'; now: number }
  | { kind: 'timer'; delay: number };

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const resolveShareClock = (expiryNow: number, now = Date.now()): number =>
  Math.max(expiryNow, now);

const getExpiryTimerPlan = (
  expiresAt: number,
  expiryNow: number,
  now = Date.now()
): ExpiryTimerPlan => {
  const current = resolveShareClock(expiryNow, now);
  if (expiresAt <= current) return { kind: 'expired', now: current };
  return {
    kind: 'timer',
    delay: Math.min(2_147_483_647, expiresAt - current + 1)
  };
};

const getExpiryTimestamp = (share: any | null): number | null => {
  if (!share?.expiresAt) return null;
  const timestamp = new Date(share.expiresAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
};

const isShareExpired = (share: any | null, now = Date.now()): boolean => {
  const expiresAt = getExpiryTimestamp(share);
  return expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= now);
};

const selectPublicShare = (shares: any[], now = Date.now()): any | null =>
  shares.find((share) => !isShareExpired(share, now)) ?? shares[0] ?? null;

const getNextPublicExpiry = (shares: any[], now = Date.now()): number | undefined =>
  shares
    .map(getExpiryTimestamp)
    .filter(
      (expiresAt): expiresAt is number =>
        expiresAt !== null && Number.isFinite(expiresAt) && expiresAt > now
    )
    .sort((a, b) => a - b)[0];

const getPublicUrl = (share: any | null, now = Date.now()): string =>
  !isShareExpired(share, now) && share?.shareToken
    ? `${window.location.origin}/share/${share.shareToken}`
    : '';

const formatExpiry = (share: any | null): string | null => {
  const expiresAt = getExpiryTimestamp(share);
  return expiresAt !== null && Number.isFinite(expiresAt)
    ? new Date(expiresAt).toLocaleString('vi-VN')
    : null;
};

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
  const [publicShares, setPublicShares] = useState<any[]>([]);
  const [shareDataTargetKey, setShareDataTargetKey] = useState('');
  const [shareListStatus, setShareListStatus] = useState<ShareListStatus>('idle');
  const [shareListError, setShareListError] = useState('');
  const [shareListReloadKey, setShareListReloadKey] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [copied, setCopied] = useState(false);
  const [expiryNow, setExpiryNow] = useState(() => Date.now());
  const { showToast } = useToast();

  const targetKey = `${targetType}:${targetId}`;
  const targetKeyRef = useRef(targetKey);
  const isOpenRef = useRef(isOpen);
  const sharesRequestIdRef = useRef(0);
  const actionRequestIdRef = useRef(0);
  const dataVersionRef = useRef(0);
  const copiedResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  targetKeyRef.current = targetKey;
  isOpenRef.current = isOpen;

  const hasCurrentShareData = shareDataTargetKey === targetKey;
  const visibleShareListStatus: ShareListStatus =
    isOpen && !hasCurrentShareData ? 'loading' : shareListStatus;
  const visibleShares = hasCurrentShareData ? shares : [];
  const visiblePublicShares = hasCurrentShareData ? publicShares : [];
  const shareClock = resolveShareClock(expiryNow);
  const visiblePublicShare = selectPublicShare(visiblePublicShares, shareClock);
  const publicShareExpired = Boolean(
    visiblePublicShare && isShareExpired(visiblePublicShare, shareClock)
  );
  const publicShareExpiry = formatExpiry(visiblePublicShare);
  const publicUrl = getPublicUrl(visiblePublicShare, shareClock);
  const publicUrlRef = useRef(publicUrl);
  publicUrlRef.current = publicUrl;
  const nextPublicExpiry = getNextPublicExpiry(visiblePublicShares, shareClock);
  const isActionPending = pendingAction !== null;
  const isSharingWithUser = pendingAction === 'share';
  const isCreatingPublicLink = pendingAction === 'link';
  const isCopying = pendingAction === 'copy';
  const revokingShareId =
    typeof pendingAction === 'object' && pendingAction?.type === 'revoke'
      ? pendingAction.shareId
      : null;

  const isCurrentTarget = (requestedTargetKey: string) =>
    isOpenRef.current && targetKeyRef.current === requestedTargetKey;

  const isCurrentAction = (requestId: number, requestedTargetKey: string) =>
    actionRequestIdRef.current === requestId &&
    isCurrentTarget(requestedTargetKey);

  useEffect(() => {
    actionRequestIdRef.current += 1;
    dataVersionRef.current += 1;

    setActiveTab('USER');
    setEmail('');
    setAccessLevel(ShareAccessLevel.VIEW);
    setExpiresInDays(30);
    setShares([]);
    setPublicShares([]);
    setShareDataTargetKey('');
    publicUrlRef.current = '';
    setExpiryNow(Date.now());
    setShareListError('');
    setPendingAction(null);
    setCopied(false);

    return () => {
      if (copiedResetTimerRef.current) {
        clearTimeout(copiedResetTimerRef.current);
        copiedResetTimerRef.current = null;
      }
    };
  }, [isOpen, targetId, targetType]);

  useEffect(() => {
    if (!isOpen || nextPublicExpiry === undefined) return;
    const plan = getExpiryTimerPlan(nextPublicExpiry, expiryNow);
    if (plan.kind === 'expired') {
      setExpiryNow(plan.now);
      return;
    }
    const timer = setTimeout(() => setExpiryNow(Date.now()), plan.delay);
    return () => clearTimeout(timer);
  }, [expiryNow, isOpen, nextPublicExpiry, targetKey]);

  useEffect(() => {
    setCopied(false);
  }, [publicUrl]);

  useEffect(() => {
    if (!isOpen) {
      setShareListStatus('idle');
      return;
    }

    setShareDataTargetKey(targetKey);
    const requestId = ++sharesRequestIdRef.current;
    const requestedVersion = dataVersionRef.current;
    let cancelled = false;
    const isCurrentRequest = () =>
      !cancelled &&
      sharesRequestIdRef.current === requestId &&
      dataVersionRef.current === requestedVersion &&
      isOpenRef.current &&
      targetKeyRef.current === targetKey;

    setShareListStatus('loading');
    setShareListError('');

    const loadShares = async () => {
      try {
        const res = await api.get<ApiResponse<any[]>>('/shares/shared-by-me');
        if (!isCurrentRequest()) return;
        const filtered = (res.data || []).filter(
          (share) => share.targetType === targetType && share.targetId === targetId
        );
        const privateShares = filtered.filter((share) => !share.isPublic);
        const publicShares = filtered.filter((share) => share.isPublic);
        const now = Date.now();
        const nextPublicShare = selectPublicShare(publicShares, now);
        setShares(privateShares);
        publicUrlRef.current = getPublicUrl(nextPublicShare, now);
        setPublicShares(publicShares);
        setExpiryNow(now);
        setShareListStatus(privateShares.length > 0 ? 'ready' : 'empty');
      } catch (error) {
        if (!isCurrentRequest()) return;
        setShareListError(
          getErrorMessage(error, 'Không thể tải danh sách người được chia sẻ.')
        );
        setShareListStatus('error');
      }
    };

    void loadShares();
    return () => {
      cancelled = true;
      if (sharesRequestIdRef.current === requestId) sharesRequestIdRef.current += 1;
    };
  }, [isOpen, shareListReloadKey, targetId, targetKey, targetType]);

  const handleShareWithUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const requestId = ++actionRequestIdRef.current;
    const requestedTargetKey = targetKey;
    const targetEmail = email.trim().toLowerCase();
    setPendingAction('share');

    try {
      await api.post('/shares', {
        targetType,
        targetId,
        sharedWithEmail: targetEmail,
        accessLevel,
        isPublic: false
      });

      if (!isCurrentAction(requestId, requestedTargetKey)) return;

      dataVersionRef.current += 1;
      showToast(`Đã chia sẻ thành công với ${targetEmail}`, 'success');
      setEmail('');
      setShareListReloadKey((current) => current + 1);
    } catch (error) {
      if (!isCurrentAction(requestId, requestedTargetKey)) return;

      showToast(getErrorMessage(error, 'Lỗi khi chia sẻ tài liệu'), 'error');
    } finally {
      if (isCurrentAction(requestId, requestedTargetKey)) setPendingAction(null);
    }
  };

  const handleCreatePublicLink = async () => {
    const requestId = ++actionRequestIdRef.current;
    const requestedTargetKey = targetKey;
    setPendingAction('link');

    try {
      const res = await api.post<ApiResponse<any>>('/shares', {
        targetType,
        targetId,
        accessLevel: ShareAccessLevel.VIEW,
        isPublic: true,
        expiresInDays: expiresInDays > 0 ? expiresInDays : undefined
      });

      if (!isCurrentAction(requestId, requestedTargetKey)) return;

      dataVersionRef.current += 1;
      const now = Date.now();
      const nextPublicShares = [
        res.data,
        ...publicShares.filter((share) => share.id !== res.data?.id)
      ];
      publicUrlRef.current = getPublicUrl(
        selectPublicShare(nextPublicShares, now),
        now
      );
      setPublicShares(nextPublicShares);
      setExpiryNow(now);
      showToast('Đã tạo liên kết chia sẻ công khai!', 'success');
      setShareListReloadKey((current) => current + 1);
    } catch (error) {
      if (!isCurrentAction(requestId, requestedTargetKey)) return;

      showToast(getErrorMessage(error, 'Lỗi khi tạo liên kết công khai'), 'error');
    } finally {
      if (isCurrentAction(requestId, requestedTargetKey)) setPendingAction(null);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    const requestId = ++actionRequestIdRef.current;
    const requestedTargetKey = targetKey;
    setPendingAction({ type: 'revoke', shareId });

    try {
      await api.delete(`/shares/${shareId}`);

      if (!isCurrentAction(requestId, requestedTargetKey)) return;

      dataVersionRef.current += 1;
      showToast('Đã thu hồi quyền chia sẻ', 'info');
      const revokedPublicShare = publicShares.some((share) => share.id === shareId);
      if (revokedPublicShare) {
        const now = Date.now();
        const remainingPublicShares = publicShares.filter(
          (share) => share.id !== shareId
        );
        if (copiedResetTimerRef.current) {
          clearTimeout(copiedResetTimerRef.current);
          copiedResetTimerRef.current = null;
        }
        setCopied(false);
        publicUrlRef.current = getPublicUrl(
          selectPublicShare(remainingPublicShares, now),
          now
        );
        setPublicShares(remainingPublicShares);
        setExpiryNow(now);
      }
      setShareListReloadKey((current) => current + 1);
    } catch (error) {
      if (!isCurrentAction(requestId, requestedTargetKey)) return;

      showToast(getErrorMessage(error, 'Lỗi khi thu hồi chia sẻ'), 'error');
    } finally {
      if (isCurrentAction(requestId, requestedTargetKey)) setPendingAction(null);
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl || !visiblePublicShare || isShareExpired(visiblePublicShare)) {
      showToast(
        visiblePublicShare && isShareExpired(visiblePublicShare)
          ? 'Liên kết đã hết hạn và không thể sao chép.'
          : 'Chưa có liên kết để sao chép.',
        'error'
      );
      return;
    }

    const clipboard = navigator.clipboard;
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      setCopied(false);
      showToast(
        'Không thể sao chép vì trình duyệt không cung cấp quyền truy cập bộ nhớ tạm.',
        'error'
      );
      return;
    }

    const requestId = ++actionRequestIdRef.current;
    const requestedTargetKey = targetKey;
    const copiedUrl = publicUrl;
    setCopied(false);
    setPendingAction('copy');

    try {
      await clipboard.writeText(copiedUrl);
      if (
        !isCurrentAction(requestId, requestedTargetKey) ||
        publicUrlRef.current !== copiedUrl ||
        isShareExpired(visiblePublicShare)
      ) {
        return;
      }

      setCopied(true);
      showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');

      if (copiedResetTimerRef.current) {
        clearTimeout(copiedResetTimerRef.current);
      }
      copiedResetTimerRef.current = setTimeout(() => {
        setCopied(false);
        copiedResetTimerRef.current = null;
      }, 2500);
    } catch {
      if (!isCurrentAction(requestId, requestedTargetKey)) return;

      setCopied(false);
      showToast(
        'Không thể sao chép liên kết. Vui lòng thử lại hoặc sao chép thủ công.',
        'error'
      );
    } finally {
      if (isCurrentAction(requestId, requestedTargetKey)) setPendingAction(null);
    }
  };

  const createPublicLinkCard = (
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
          Tạo liên kết công khai mới
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
          disabled={isActionPending}
          className="btn btn-primary btn-sm"
          style={{ fontWeight: 700, padding: '7px 16px' }}
        >
          {isCreatingPublicLink ? 'Đang tạo...' : 'Tạo Liên Kết Công Khai'}
        </button>
      </div>
    </div>
  );

  const listFeedback =
    visibleShareListStatus === 'loading' ? (
      <div
        role="status"
        style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}
      >
        Đang tải danh sách người được chia sẻ...
      </div>
    ) : visibleShareListStatus === 'error' ? (
      <div
        role="alert"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: '10px 12px', color: 'var(--color-danger)', fontSize: '12.5px', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)' }}
      >
        <span>
          <strong>Không tải được danh sách chia sẻ.</strong>{' '}
          <span style={{ color: 'var(--text-secondary)' }}>{shareListError}</span>
        </span>
        <button type="button" onClick={() => setShareListReloadKey((current) => current + 1)} className="btn btn-secondary btn-sm">
          Thử lại
        </button>
      </div>
    ) : null;

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
              <label
                htmlFor="share-recipient-email"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}
              >
                Nhập email của bạn học:
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Mail size={15} />
                  </span>
                  <input
                    id="share-recipient-email"
                    type="email"
                    required
                    placeholder="banhoc@sinhvien.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isActionPending}
                    className="snote-input"
                    style={{ paddingLeft: '36px', fontSize: '13px' }}
                  />
                </div>

                <select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value as ShareAccessLevel)}
                  disabled={isActionPending}
                  className="snote-select"
                  style={{ fontSize: '12.5px', width: '130px' }}
                >
                  <option value={ShareAccessLevel.VIEW}>👁️ Chỉ xem</option>
                  <option value={ShareAccessLevel.EDIT}>✏️ Chỉnh sửa</option>
                </select>

                <button
                  type="submit"
                  disabled={isActionPending || !email.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700, padding: '0 16px', flexShrink: 0 }}
                >
                  {isSharingWithUser ? 'Đang gửi...' : 'Chia sẻ'}
                </button>
              </div>
            </form>

            {/* List of active shares */}
            <div
              style={{ marginTop: '6px' }}
              aria-live="polite"
              aria-busy={visibleShareListStatus === 'loading'}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Những người đang có quyền truy cập
                {visibleShareListStatus === 'ready' ? ` (${visibleShares.length})` : ''}:
              </div>

              {listFeedback}

              {visibleShareListStatus === 'empty' && (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  Chưa có bạn học nào được chia sẻ riêng tài liệu này.
                </div>
              )}

              {visibleShareListStatus === 'ready' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visibleShares.map((s) => (
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
                        disabled={isActionPending}
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        title="Thu hồi quyền chia sẻ"
                        aria-label={
                          revokingShareId === s.id
                            ? 'Đang thu hồi quyền chia sẻ'
                            : `Thu hồi quyền chia sẻ của ${s.sharedWithUser?.fullName || s.sharedWithEmail}`
                        }
                      >
                        <Trash2 size={15} aria-hidden="true" />
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
            {visibleShareListStatus === 'loading' || visibleShareListStatus === 'error' ? (
              listFeedback
            ) : visiblePublicShare && publicShareExpired ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '14px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-danger)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={15} aria-hidden="true" />
                      <span>Liên kết công khai đã hết hạn</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRevokeShare(visiblePublicShare.id)}
                      disabled={isActionPending}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11.5px', color: 'var(--color-danger)', padding: '2px 8px' }}
                    >
                      {revokingShareId === visiblePublicShare.id
                        ? 'Đang vô hiệu hóa...'
                        : 'Thu hồi liên kết'}
                    </button>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {publicShareExpiry
                      ? `Liên kết đã hết hạn lúc ${publicShareExpiry}.`
                      : 'Liên kết không có thời hạn hợp lệ.'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Liên kết này không thể sao chép hoặc sử dụng. Bạn có thể tạo liên kết mới trực tiếp bên dưới.
                  </div>
                </div>
                {createPublicLinkCard}
              </>
            ) : visiblePublicShare ? (
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
                    onClick={() => handleRevokeShare(visiblePublicShare.id)}
                    disabled={isActionPending}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11.5px', color: 'var(--color-danger)', padding: '2px 8px' }}
                  >
                    {revokingShareId === visiblePublicShare.id
                      ? 'Đang vô hiệu hóa...'
                      : 'Vô hiệu hóa link'}
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
                    disabled={isActionPending}
                    className={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
                    style={{ fontWeight: 700, gap: '4px', padding: '0 14px', flexShrink: 0 }}
                    aria-live="polite"
                  >
                    {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                    <span>
                      {isCopying ? 'Đang sao chép...' : copied ? 'Đã sao chép' : 'Sao chép'}
                    </span>
                  </button>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {publicShareExpiry
                    ? `Có hiệu lực đến ${publicShareExpiry}. `
                    : 'Liên kết không đặt thời hạn. '}
                  Bất kỳ ai có liên kết này đều có thể xem nội dung tài liệu.
                </div>
              </div>
            ) : (
              createPublicLinkCard
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
