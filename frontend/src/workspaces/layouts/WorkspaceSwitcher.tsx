import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WorkspaceSummary, WorkspaceType, WorkspaceRole, WorkspaceInvitation } from './types';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import {
  Check,
  Plus,
  Search,
  User,
  GraduationCap,
  FolderGit2,
  ChevronDown,
  UserPlus,
  Link,
  Mail,
  X,
  Bell,
  CheckCircle2,
  XCircle,
  Shield,
  Users
} from 'lucide-react';

interface WorkspaceSwitcherProps {
  currentWorkspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  onSelectWorkspace: (ws: WorkspaceSummary) => void;
  onRefreshWorkspaces?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerMode?: 'rail' | 'topbar' | 'both' | 'none';
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  onRefreshWorkspaces,
  isOpen: controlledIsOpen,
  onOpenChange,
  triggerMode = 'rail'
}) => {
  const { showToast } = useToast();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalIsOpen(value);
    }
  };

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | WorkspaceType | 'INVITATIONS'>('ALL');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Sub-action views
  const [activeView, setActiveView] = useState<'LIST' | 'CREATE' | 'JOIN' | 'ADD_MEMBER'>('LIST');

  // Create form state
  const [createType, setCreateType] = useState<WorkspaceType>('PROJECT');
  const [createName, setCreateName] = useState('');
  const [createCode, setCreateCode] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Join form state
  const [joinCode, setJoinCode] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);

  // Add member form state
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<WorkspaceRole>('MEMBER');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  // Invitations state
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch pending invitations on mount or when opened
  const fetchInvitations = async () => {
    try {
      setIsLoadingInvitations(true);
      const res = await api.get<any>('/workspaces/invitations');
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setInvitations(list);
      }
    } catch {
      // Non-blocking on invitation fetch
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchInvitations();
      setTimeout(() => searchInputRef.current?.focus(), 60);
    } else {
      setActiveView('LIST');
      setSearch('');
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Filtered workspaces
  const filtered = useMemo(() => {
    let list = workspaces;
    if (categoryFilter !== 'ALL' && categoryFilter !== 'INVITATIONS') {
      list = list.filter((w) => w.type === categoryFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.code && w.code.toLowerCase().includes(q)) ||
        (w.subjectCode && w.subjectCode.toLowerCase().includes(q))
    );
  }, [workspaces, search, categoryFilter]);

  // Handle Accept Invitation
  const handleAcceptInvitation = async (invitation: WorkspaceInvitation) => {
    try {
      await api.post(`/workspaces/invitations/${invitation.id}/accept`, {});
      showToast(`Đã tham gia Không gian: ${invitation.workspace.name}`, 'success');
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      if (onRefreshWorkspaces) onRefreshWorkspaces();
      onSelectWorkspace(invitation.workspace);
      setIsOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể chấp nhận lời mời', 'error');
    }
  };

  // Handle Decline Invitation
  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await api.post(`/workspaces/invitations/${invitationId}/decline`, {});
      showToast('Đã từ chối lời mời', 'info');
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể từ chối lời mời', 'error');
    }
  };

  // Handle Create Workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      showToast('Vui lòng nhập tên Không gian làm việc', 'error');
      return;
    }

    try {
      setIsSubmittingCreate(true);
      const payload: any = {
        type: createType,
        name: createName.trim()
      };

      if (createType === 'PROJECT') {
        payload.project = {
          description: createDesc.trim() || undefined,
          status: 'ACTIVE'
        };
      }

      const res = await api.post<any>('/workspaces', payload);
      const newWs = res.data?.data?.workspace || res.data?.data || res.data;
      showToast(`Đã tạo Không gian: ${createName.trim()}`, 'success');

      setCreateName('');
      setCreateCode('');
      setCreateDesc('');
      setActiveView('LIST');
      if (onRefreshWorkspaces) onRefreshWorkspaces();
      if (newWs && newWs.id) {
        onSelectWorkspace(newWs);
      }
      setIsOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tạo không gian làm việc', 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Join Workspace
  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      showToast('Vui lòng nhập Mã môn học hoặc ID không gian', 'error');
      return;
    }

    try {
      setIsSubmittingJoin(true);
      const res = await api.post<any>('/workspaces/join', {
        codeOrId: joinCode.trim()
      });
      const joinedWs = res.data?.data?.workspace || res.data?.data || res.data;
      showToast(`Đã tham gia Không gian: ${joinedWs?.name || joinCode.trim()}`, 'success');
      setJoinCode('');
      setActiveView('LIST');
      if (onRefreshWorkspaces) onRefreshWorkspaces();
      if (joinedWs && joinedWs.id) {
        onSelectWorkspace(joinedWs);
      }
      setIsOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không tìm thấy hoặc không thể tham gia không gian', 'error');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) {
      showToast('Vui lòng nhập Email thành viên', 'error');
      return;
    }

    try {
      setIsSubmittingMember(true);
      await api.post(`/workspaces/${currentWorkspace.id}/members`, {
        email: memberEmail.trim().toLowerCase(),
        role: memberRole
      });
      showToast(`Đã gửi lời mời tham gia tới ${memberEmail.trim()}`, 'success');
      setMemberEmail('');
      setActiveView('LIST');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể thêm thành viên vào không gian', 'error');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const getWorkspaceTypeIcon = (type: WorkspaceType) => {
    switch (type) {
      case 'PERSONAL':
        return <User size={15} />;
      case 'SUBJECT':
        return <GraduationCap size={15} />;
      case 'PROJECT':
        return <FolderGit2 size={15} />;
    }
  };

  const getTriggerMonogram = () => {
    if (currentWorkspace.code) {
      return currentWorkspace.code.replace(/[^A-Za-z0-9]/g, '').slice(0, 3);
    }
    return currentWorkspace.name.trim().charAt(0).toUpperCase();
  };

  const canAddMember = currentWorkspace.role === 'OWNER' || currentWorkspace.role === 'MANAGER';

  return (
    <div ref={dropdownRef} className="ws-switcher-rail-wrapper">
      {/* 1. Rail Trigger Icon with Monogram & Dropdown Arrow Indicator */}
      {(triggerMode === 'rail' || triggerMode === 'both') && (
        <button
          type="button"
          className={`ws-switcher-rail-btn ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title={`Không gian hiện tại: ${currentWorkspace.name} ▾ (Nhấp để chọn & quản lý)`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Chọn Không gian làm việc"
        >
          <span className="ws-switcher-monogram">{getTriggerMonogram()}</span>
          <span className="ws-rail-chevron-indicator">
            <ChevronDown size={10} />
          </span>
          {invitations.length > 0 && (
            <span className="ws-rail-badge-ping" title={`${invitations.length} lời mời tham gia`} />
          )}
        </button>
      )}

      {/* Floating Tooltip next to Switcher Mark */}
      {!isOpen && (triggerMode === 'rail' || triggerMode === 'both') && (
        <div className="ws-rail-tooltip" role="tooltip">
          <span className="ws-tooltip-text">
            Workspace: {currentWorkspace.name} {currentWorkspace.code ? `[${currentWorkspace.code}]` : ''}
          </span>
          <span className="ws-tooltip-badge">▾ Đổi</span>
        </div>
      )}

      {/* 2. Workspace Management Flyout Popover */}
      {isOpen && (
        <div className="ws-switcher-flyout" role="dialog" aria-label="Quản lý không gian làm việc">
          {/* Header Title with Close */}
          <div className="ws-flyout-header-row">
            <div className="ws-flyout-header-title">
              <span className="ws-tag-mono">WORKSPACE</span>
              <span className="ws-header-text">Không Gian Làm Việc</span>
            </div>
            <button
              type="button"
              className="ws-flyout-close-btn"
              onClick={() => setIsOpen(false)}
              title="Đóng bảng chọn"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Sub-actions Switcher Buttons */}
          <div className="ws-flyout-actions-row">
            <button
              type="button"
              className={`ws-action-pill-btn ${activeView === 'CREATE' ? 'active' : ''}`}
              onClick={() => setActiveView(activeView === 'CREATE' ? 'LIST' : 'CREATE')}
              title="Tạo Không gian mới"
            >
              <Plus size={12} />
              <span>Tạo mới</span>
            </button>

            <button
              type="button"
              className={`ws-action-pill-btn ${activeView === 'JOIN' ? 'active' : ''}`}
              onClick={() => setActiveView(activeView === 'JOIN' ? 'LIST' : 'JOIN')}
              title="Tham gia bằng Mã hoặc ID"
            >
              <Link size={12} />
              <span>Tham gia</span>
            </button>

            {canAddMember && (
              <button
                type="button"
                className={`ws-action-pill-btn ${activeView === 'ADD_MEMBER' ? 'active' : ''}`}
                onClick={() => setActiveView(activeView === 'ADD_MEMBER' ? 'LIST' : 'ADD_MEMBER')}
                title="Mời thành viên vào không gian này"
              >
                <UserPlus size={12} />
                <span>Thêm bạn</span>
              </button>
            )}
          </div>

          {/* VIEW: CREATE WORKSPACE */}
          {activeView === 'CREATE' && (
            <form onSubmit={handleCreateWorkspace} className="ws-subform-box">
              <div className="ws-subform-title">Khởi tạo Không Gian Mới</div>

              <div className="ws-type-segmented-wrap">
                <button
                  type="button"
                  className={`ws-type-opt ${createType === 'PROJECT' ? 'active' : ''}`}
                  onClick={() => setCreateType('PROJECT')}
                >
                  <FolderGit2 size={13} />
                  <span>Đồ án / Dự án</span>
                </button>
                <button
                  type="button"
                  className={`ws-type-opt ${createType === 'SUBJECT' ? 'active' : ''}`}
                  onClick={() => setCreateType('SUBJECT')}
                >
                  <GraduationCap size={13} />
                  <span>Lớp học</span>
                </button>
                <button
                  type="button"
                  className={`ws-type-opt ${createType === 'PERSONAL' ? 'active' : ''}`}
                  onClick={() => setCreateType('PERSONAL')}
                >
                  <User size={13} />
                  <span>Cá nhân</span>
                </button>
              </div>

              <div className="ws-form-field">
                <label>Tên không gian *</label>
                <input
                  type="text"
                  required
                  placeholder={createType === 'PROJECT' ? 'Ví dụ: Đồ án Website SNOTE' : 'Ví dụ: Phát triển ứng dụng Web'}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>

              {createType === 'PROJECT' && (
                <div className="ws-form-field">
                  <label>Mô tả ngắn</label>
                  <textarea
                    rows={2}
                    placeholder="Mục tiêu hoặc bài tập lớn nhóm..."
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                  />
                </div>
              )}

              <div className="ws-subform-actions">
                <button
                  type="button"
                  className="ws-btn-cancel"
                  onClick={() => setActiveView('LIST')}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="ws-btn-submit"
                >
                  {isSubmittingCreate ? 'Đang tạo...' : 'Tạo Không Gian'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: JOIN WORKSPACE */}
          {activeView === 'JOIN' && (
            <form onSubmit={handleJoinWorkspace} className="ws-subform-box">
              <div className="ws-subform-title">Tham gia Không Gian Làm Việc</div>
              <p className="ws-subform-hint">
                Nhập mã lớp học (Ví dụ: <code>INT3306</code>) hoặc ID không gian nhóm của bạn.
              </p>

              <div className="ws-form-field">
                <label>Mã hoặc ID không gian *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập mã môn học hoặc UUID..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
              </div>

              <div className="ws-subform-actions">
                <button
                  type="button"
                  className="ws-btn-cancel"
                  onClick={() => setActiveView('LIST')}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJoin}
                  className="ws-btn-submit"
                >
                  {isSubmittingJoin ? 'Đang kiểm tra...' : 'Tham Gia Ngay'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: ADD MEMBER */}
          {activeView === 'ADD_MEMBER' && (
            <form onSubmit={handleAddMember} className="ws-subform-box">
              <div className="ws-subform-title">Thêm Thành Viên Vào Không Gian</div>
              <p className="ws-subform-hint">
                Không gian: <strong>{currentWorkspace.name}</strong>
              </p>

              <div className="ws-form-field">
                <label>Email tài khoản người dùng *</label>
                <input
                  type="email"
                  required
                  placeholder="nguyenvana@vnu.edu.vn"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </div>

              <div className="ws-form-field">
                <label>Vai trò trong không gian</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as WorkspaceRole)}
                  className="ws-select-field"
                >
                  <option value="MEMBER">Thành viên (MEMBER - Tạo & xem việc, ghi chú)</option>
                  <option value="MANAGER">Quản lý (MANAGER - Quản lý việc & thành viên)</option>
                  <option value="VIEWER">Chỉ xem (VIEWER - Xem nội dung)</option>
                </select>
              </div>

              <div className="ws-subform-actions">
                <button
                  type="button"
                  className="ws-btn-cancel"
                  onClick={() => setActiveView('LIST')}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMember}
                  className="ws-btn-submit"
                >
                  {isSubmittingMember ? 'Đang gửi...' : 'Gửi Lời Mời'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: DEFAULT WORKSPACE LIST & INVITATIONS */}
          {activeView === 'LIST' && (
            <>
              {/* Search Bar */}
              <div className="ws-flyout-search-wrap">
                <Search size={14} className="ws-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="ws-flyout-search-input"
                  placeholder="Tìm kiếm theo tên hoặc mã môn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Category Filter Pills (Dự án & Lớp học nằm ở workspace) */}
              <div className="ws-flyout-tabs">
                <button
                  type="button"
                  className={`ws-flyout-tab ${categoryFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('ALL')}
                >
                  Tất cả ({workspaces.length})
                </button>
                <button
                  type="button"
                  className={`ws-flyout-tab ${categoryFilter === 'SUBJECT' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('SUBJECT')}
                >
                  Lớp học ({workspaces.filter((w) => w.type === 'SUBJECT').length})
                </button>
                <button
                  type="button"
                  className={`ws-flyout-tab ${categoryFilter === 'PROJECT' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('PROJECT')}
                >
                  Đồ án ({workspaces.filter((w) => w.type === 'PROJECT').length})
                </button>
                <button
                  type="button"
                  className={`ws-flyout-tab ${categoryFilter === 'INVITATIONS' ? 'active' : ''} ${invitations.length > 0 ? 'has-invites' : ''}`}
                  onClick={() => setCategoryFilter('INVITATIONS')}
                >
                  <Bell size={11} style={{ marginRight: '3px' }} />
                  Lời mời ({invitations.length})
                </button>
              </div>

              {/* List Content */}
              {categoryFilter === 'INVITATIONS' ? (
                <div className="ws-flyout-list" role="listbox">
                  {invitations.length === 0 ? (
                    <div className="ws-flyout-empty">
                      Bạn không có lời mời tham gia không gian nào đang chờ.
                    </div>
                  ) : (
                    invitations.map((inv) => (
                      <div key={inv.id} className="ws-invite-card">
                        <div className="ws-invite-meta">
                          <div className="ws-item-monochrome-icon">
                            {getWorkspaceTypeIcon(inv.workspace?.type || 'PROJECT')}
                          </div>
                          <div className="ws-invite-details">
                            <span className="ws-invite-title">{inv.workspace?.name}</span>
                            <span className="ws-invite-sub">
                              {inv.invitedBy?.fullName ? `Từ: ${inv.invitedBy.fullName}` : 'Lời mời tham gia'} • Vai trò: {inv.role}
                            </span>
                          </div>
                        </div>
                        <div className="ws-invite-actions">
                          <button
                            type="button"
                            className="ws-invite-accept-btn"
                            onClick={() => handleAcceptInvitation(inv)}
                            title="Chấp nhận lời mời"
                          >
                            <CheckCircle2 size={13} />
                            <span>Chấp nhận</span>
                          </button>
                          <button
                            type="button"
                            className="ws-invite-decline-btn"
                            onClick={() => handleDeclineInvitation(inv.id)}
                            title="Từ chối lời mời"
                          >
                            <XCircle size={13} />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="ws-flyout-list" role="listbox">
                  {filtered.length === 0 ? (
                    <div className="ws-flyout-empty">
                      Không tìm thấy không gian làm việc phù hợp.
                    </div>
                  ) : (
                    filtered.map((ws, idx) => {
                      const isSelected = ws.id === currentWorkspace.id;
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          className={`ws-flyout-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            onSelectWorkspace(ws);
                            setIsOpen(false);
                          }}
                        >
                          <div className="ws-item-monochrome-icon">
                            {getWorkspaceTypeIcon(ws.type)}
                          </div>

                          <div className="ws-item-info">
                            <div className="ws-item-title-row">
                              <span className="ws-item-name">{ws.name}</span>
                              {ws.code && <span className="ws-mono-tag">{ws.code}</span>}
                            </div>
                            <div className="ws-item-sub-row">
                              <span className="ws-role-text">
                                {ws.role === 'OWNER' ? 'Sở hữu' : ws.role === 'MANAGER' ? 'Quản lý' : 'Thành viên'}
                              </span>
                              {ws.memberCount && ws.memberCount > 1 && (
                                <span className="ws-member-text">
                                  • {ws.memberCount} thành viên
                                </span>
                              )}
                              {ws.status === 'ARCHIVED' && (
                                <span className="ws-archived-pill">Lưu trữ</span>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <Check size={14} className="ws-item-check-icon" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
