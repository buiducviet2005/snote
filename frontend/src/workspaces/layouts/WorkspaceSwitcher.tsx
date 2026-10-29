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
  const [activeView, setActiveView] = useState<'LIST' | 'CREATE' | 'JOIN' | 'MANAGE'>('LIST');
  const [manageTab, setManageTab] = useState<'PROGRESS' | 'MEMBERS'>('PROGRESS');
  const [progressData, setProgressData] = useState<any | null>(null);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [isLoadingManage, setIsLoadingManage] = useState(false);

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


  const fetchManageData = async (wsId: string) => {
    try {
      setIsLoadingManage(true);
      const [progRes, memRes] = await Promise.all([
        api.get<any>(`/workspaces/${wsId}/progress`).catch(() => ({ data: null })),
        api.get<any>(`/workspaces/${wsId}/members`).catch(() => ({ data: [] }))
      ]);
      setProgressData(progRes.data?.data || progRes.data || null);
      const mList = memRes.data?.data || memRes.data || [];
      setMembersList(Array.isArray(mList) ? mList : []);
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingManage(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: WorkspaceRole) => {
    try {
      await api.patch(`/workspaces/${currentWorkspace.id}/members/${memberId}`, { role: newRole });
      showToast('Đã cập nhật vai trò thành viên thành công!', 'success');
      fetchManageData(currentWorkspace.id);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đổi vai trò thành viên', 'error');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${memberName}" khỏi Không gian này không?`)) return;
    try {
      await api.delete(`/workspaces/${currentWorkspace.id}/members/${memberId}`);
      showToast(`Đã xóa "${memberName}" khỏi không gian!`, 'success');
      fetchManageData(currentWorkspace.id);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa thành viên', 'error');
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
                className={`ws-action-pill-btn ${activeView === 'MANAGE' ? 'active' : ''}`}
                onClick={() => {
                  if (activeView === 'MANAGE') {
                    setActiveView('LIST');
                  } else {
                    setActiveView('MANAGE');
                    fetchManageData(currentWorkspace.id);
                  }
                }}
                title="Quan sát tiến độ & Quản lý cấp quyền thành viên"
              >
                <Users size={12} />
                <span>Quản lý & Tiến độ</span>
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
                  <span>Đồ án & Nhóm làm việc</span>
                </button>
                <button
                  type="button"
                  className={`ws-type-opt ${createType === 'PERSONAL' ? 'active' : ''}`}
                  onClick={() => setCreateType('PERSONAL')}
                >
                  <User size={13} />
                  <span>Không gian cá nhân</span>
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

          {/* VIEW: WORKSPACE GOVERNANCE & PROGRESS OBSERVATION */}
          {activeView === 'MANAGE' && (
            <div className="ws-manage-box">
              <div className="ws-manage-header">
                <div>
                  <div className="ws-subform-title">Quản Lý Không Gian & Tiến Độ</div>
                  <span style={{ fontSize: '11px', color: 'var(--ws-text-muted)' }}>{currentWorkspace.name}</span>
                </div>
                <button
                  type="button"
                  className="ws-btn-cancel"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => setActiveView('LIST')}
                >
                  Quay lại
                </button>
              </div>

              {/* Subtabs: PROGRESS vs MEMBERS */}
              <div className="ws-manage-tabs">
                <button
                  type="button"
                  className={`ws-manage-tab ${manageTab === 'PROGRESS' ? 'active' : ''}`}
                  onClick={() => setManageTab('PROGRESS')}
                >
                  Tiến độ & Năng suất
                </button>
                <button
                  type="button"
                  className={`ws-manage-tab ${manageTab === 'MEMBERS' ? 'active' : ''}`}
                  onClick={() => setManageTab('MEMBERS')}
                >
                  Thành viên & Phân quyền ({membersList.length})
                </button>
              </div>

              {isLoadingManage ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', fontSize: '12px', color: 'var(--ws-text-muted)' }}>
                  Đang đồng bộ dữ liệu quản trị...
                </div>
              ) : manageTab === 'PROGRESS' ? (
                <div className="ws-manage-progress-pane">
                  {/* Progress Bar */}
                  <div className="ws-progress-summary-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}>
                      <span>Tiến độ tổng thể</span>
                      <span style={{ color: 'var(--ws-accent)' }}>{progressData?.completionRate || 0}%</span>
                    </div>
                    <div className="ws-progress-bar-bg">
                      <div
                        className="ws-progress-bar-fill"
                        style={{ width: `${progressData?.completionRate || 0}%` }}
                      />
                    </div>
                    <div className="ws-progress-counters">
                      <span>✓ {progressData?.completedTasks || 0} xong</span>
                      <span>⚡ {progressData?.inProgressTasks || 0} đang làm</span>
                      <span>• {progressData?.todoTasks || 0} cần làm</span>
                      {progressData?.overdueTasks > 0 && (
                        <span style={{ color: '#ef4444' }}>! {progressData.overdueTasks} quá hạn</span>
                      )}
                    </div>
                  </div>

                  {/* Member Productivity Breakdown */}
                  <div className="ws-member-prod-section">
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ws-text-muted)', marginBottom: '8px', display: 'block' }}>
                      Năng suất từng thành viên
                    </span>
                    {(!progressData?.memberProductivity || progressData.memberProductivity.length === 0) ? (
                      <div style={{ fontSize: '11px', color: 'var(--ws-text-faint)', fontStyle: 'italic', padding: '10px 0' }}>
                        Chưa có dữ liệu phân công nhiệm vụ cho thành viên.
                      </div>
                    ) : (
                      progressData.memberProductivity.map((m: any) => (
                        <div key={m.userId} className="ws-prod-member-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{m.fullName || m.email}</span>
                            <span style={{ fontSize: '11px', color: 'var(--ws-accent)', fontWeight: 700 }}>
                              {m.completedCount}/{m.assignedCount} xong ({m.productivityPercent}%)
                            </span>
                          </div>
                          <div className="ws-progress-bar-bg" style={{ height: '4px', marginTop: '4px' }}>
                            <div
                              className="ws-progress-bar-fill"
                              style={{ width: `${m.productivityPercent}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="ws-manage-members-pane">
                  {/* Member List with Role Dropdowns */}
                  <div className="ws-members-list-scroll">
                    {membersList.map((m: any) => {
                      const isOwner = m.role === 'OWNER';
                      const canEditThisMember = currentWorkspace.role === 'OWNER' && !isOwner;
                      return (
                        <div key={m.id} className="ws-manage-member-row">
                          <div className="ws-member-info">
                            <span className="ws-member-name">{m.user?.fullName || m.user?.email || 'Thành viên'}</span>
                            <span className="ws-member-email">{m.user?.email}</span>
                          </div>

                          <div className="ws-member-role-actions">
                            {isOwner ? (
                              <span className="ws-role-tag owner">Trưởng nhóm</span>
                            ) : canEditThisMember ? (
                              <select
                                className="ws-role-select"
                                value={m.role}
                                onChange={(e) => handleUpdateMemberRole(m.id, e.target.value as WorkspaceRole)}
                              >
                                <option value="MEMBER">Thành viên</option>
                                <option value="MANAGER">Quản lý</option>
                              </select>
                            ) : (
                              <span className="ws-role-tag">{m.role === 'MANAGER' ? 'Quản lý' : 'Thành viên'}</span>
                            )}

                            {canEditThisMember && (
                              <button
                                type="button"
                                className="ws-member-kick-btn"
                                onClick={() => handleRemoveMember(m.id, m.user?.fullName || m.user?.email)}
                                title="Xóa khỏi nhóm"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Member Subform */}
                  <form onSubmit={handleAddMember} className="ws-add-member-mini-form">
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ws-text-muted)' }}>Mời thêm thành viên</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <input
                        type="email"
                        required
                        placeholder="Email sinh viên..."
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        className="ws-mini-input"
                      />
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value as WorkspaceRole)}
                        className="ws-mini-select"
                      >
                        <option value="MEMBER">Thành viên</option>
                        <option value="MANAGER">Quản lý</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isSubmittingMember}
                        className="ws-btn-submit"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        {isSubmittingMember ? '...' : 'Mời'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
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
