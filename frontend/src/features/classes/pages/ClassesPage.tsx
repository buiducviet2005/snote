import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, FolderKanban, Plus, Users, ClipboardList, GraduationCap, Trash2, Eye } from 'lucide-react';
import { api, ApiResponse } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { ProjectWorkspaceModal } from '../../projects/components/ProjectWorkspaceModal';
import { UserRole } from '@snote/shared';
import { ClassProgressOverview, OverviewProject } from '../components/ClassProgressOverview';
import './ClassesPage.css';

type Person = { id: string; fullName: string; email: string; avatarUrl?: string | null };
type ClassMember = { userId: string; role: 'CLASS_ADMIN' | 'STUDENT'; user: Person };
type ClassProject = {
  id: string; name: string; description?: string | null; status: string; dueDate?: string | null;
  _count: { tasks: number; notes: number; progressReports: number };
};
type StudyGroup = {
  id: string; name: string; leaderId: string; leader: Person;
  members: Array<{ userId: string; user: Person }>;
  projects: ClassProject[];
};
type CourseClass = {
  id: string; teacherId: string; name: string; code?: string | null; term?: string | null;
  description?: string | null; teacher: Person; members: ClassMember[]; groups: StudyGroup[];
};
type ClassSummary = {
  id: string; teacherId: string; name: string; code?: string | null; term?: string | null;
  members: Array<{ role: 'CLASS_ADMIN' | 'STUDENT' }>;
  _count: { members: number; groups: number; projects: number };
};
type ProgressReport = {
  id: string; progressPercent: number; summary: string; blockers?: string | null;
  reviewScore?: number | null; reviewComment?: string | null; createdAt: string;
  submittedBy: Person; reviewedBy?: Person | null;
};

const dateInputToApi = (value: string) => `${value}T00:00:00.000Z`;

export const ClassesPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('classId');
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'groups' || tabParam === 'students' ? tabParam : 'overview';
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [classesError, setClassesError] = useState('');
  const [classesReloadKey, setClassesReloadKey] = useState(0);
  const [detail, setDetail] = useState<CourseClass | null>(null);
  const [overviewProjects, setOverviewProjects] = useState<OverviewProject[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [classLoadError, setClassLoadError] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [classSearch, setClassSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classTerm, setClassTerm] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupLeaderId, setGroupLeaderId] = useState('');
  const [projectGroupId, setProjectGroupId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const reportRequestRef = useRef(0);
  const reportPanelRef = useRef<HTMLElement | null>(null);
  const reportTriggerRef = useRef<HTMLElement | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [reportSummary, setReportSummary] = useState('');
  const [reportBlockers, setReportBlockers] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [workspaceProjectId, setWorkspaceProjectId] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    const result = await api.get<ApiResponse<ClassSummary[]>>('/classes');
    setClasses(result.data || []);
    setClassesError('');
  }, []);

  const loadClass = useCallback(async (id: string) => {
    const result = await api.get<ApiResponse<CourseClass>>(`/classes/${id}`);
    if (selectedIdRef.current === id) setDetail(result.data);
  }, []);

  const loadOverview = useCallback(async (id: string) => {
    const result = await api.get<ApiResponse<OverviewProject[]>>(`/classes/${id}/overview`);
    if (selectedIdRef.current === id) setOverviewProjects(result.data || []);
  }, []);

  const loadReports = useCallback(async (classId: string, projectId: string) => {
    const requestId = ++reportRequestRef.current;
    setReportsLoading(true);
    setReportsError('');
    try {
      const result = await api.get<ApiResponse<ProgressReport[]>>(`/classes/${classId}/projects/${projectId}/reports`);
      if (requestId === reportRequestRef.current && selectedIdRef.current === classId) setReports(result.data || []);
    } catch (error) {
      if (requestId === reportRequestRef.current && selectedIdRef.current === classId) {
        setReports([]);
        setReportsError(error instanceof Error ? error.message : 'Không tải được báo cáo');
      }
      throw error;
    } finally {
      if (requestId === reportRequestRef.current) setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadClasses().catch((error: Error) => setClassesError(error.message || 'Không tải được danh sách lớp'))
      .finally(() => setLoading(false));
  }, [loadClasses, classesReloadKey]);

  useEffect(() => {
    if (loading || classesError) return;
    if ((selectedId && classes.some((item) => item.id === selectedId)) || (!selectedId && classes.length === 0)) return;
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      if (classes[0]) updated.set('classId', classes[0].id);
      else updated.delete('classId');
      return updated;
    }, { replace: true });
  }, [classes, classesError, loading, selectedId, setSearchParams]);

  const selectedClassExists = Boolean(selectedId && classes.some((item) => item.id === selectedId));

  useEffect(() => {
    setDetail(null);
    setOverviewProjects([]);
    setClassLoadError('');
    setOverviewError('');
    setSelectedProject(null);
    setReports([]);
    setReportsError('');
    setPendingOnly(false);
    reportRequestRef.current += 1;
    setReportsLoading(false);
    if (selectedId && selectedClassExists) {
      let active = true;
      setOverviewLoading(true);
      Promise.allSettled([loadClass(selectedId), loadOverview(selectedId)])
        .then(([classResult, overviewResult]) => {
          if (!active) return;
          if (classResult.status === 'rejected') setClassLoadError(classResult.reason instanceof Error ? classResult.reason.message : 'Không tải được lớp học');
          if (overviewResult.status === 'rejected') setOverviewError(overviewResult.reason instanceof Error ? overviewResult.reason.message : 'Không tải được tiến độ');
        })
        .finally(() => { if (active) setOverviewLoading(false); });
      return () => { active = false; };
    }
  }, [selectedId, selectedClassExists, loadClass, loadOverview, reloadKey]);

  const selectClass = (id: string) => setSearchParams((current) => {
    const updated = new URLSearchParams(current);
    updated.set('classId', id);
    updated.set('tab', 'overview');
    return updated;
  });

  const selectTab = (tab: 'overview' | 'groups' | 'students') => setSearchParams((current) => {
    const updated = new URLSearchParams(current);
    updated.set('tab', tab);
    return updated;
  });

  const operate = async (action: () => Promise<unknown>, message: string, refreshReports = false) => {
    setBusy(true);
    try {
      await action();
      showToast(message, 'success');
      await loadClasses();
      if (selectedId) await Promise.all([loadClass(selectedId), loadOverview(selectedId)]);
      setClassLoadError('');
      setOverviewError('');
      if (refreshReports && selectedId && selectedProject) await loadReports(selectedId, selectedProject.id);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể hoàn tất thao tác', 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const isTeacher = Boolean(detail && user?.id === detail.teacherId);
  const classRole = detail?.members.find((member) => member.userId === user?.id)?.role;
  const isManager = isTeacher || classRole === 'CLASS_ADMIN';
  const selectedGroup = detail?.groups.find((group) => group.projects.some((project) => project.id === selectedProject?.id));
  const canReport = Boolean(selectedGroup?.members.some((member) => member.userId === user?.id));
  const classQuery = classSearch.trim().toLocaleLowerCase('vi');
  const filteredClasses = classes.filter((item) => `${item.name} ${item.code || ''} ${item.term || ''}`.toLocaleLowerCase('vi').includes(classQuery));
  const visibleReports = pendingOnly ? reports.filter((report) => report.reviewScore == null) : reports;

  const createClass = async (event: React.FormEvent) => {
    event.preventDefault();
    let createdId = '';
    const done = await operate(async () => {
      const result = await api.post<ApiResponse<{ id: string }>>('/classes', { name: className.trim(), code: classCode.trim() || undefined, term: classTerm.trim() || undefined });
      createdId = result.data.id;
    }, 'Đã tạo lớp học');
    if (done) { setClassName(''); setClassCode(''); setClassTerm(''); if (createdId) selectClass(createdId); }
  };

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    const done = await operate(() => api.post(`/classes/${selectedId}/members`, { email: memberEmail.trim() }), 'Đã thêm sinh viên vào lớp');
    if (done) setMemberEmail('');
  };

  const createGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    const done = await operate(() => api.post(`/classes/${selectedId}/groups`, { name: groupName.trim(), leaderId: groupLeaderId }), 'Đã tạo nhóm');
    if (done) { setGroupName(''); setGroupLeaderId(''); }
  };

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !projectGroupId) return;
    const done = await operate(() => api.post(`/classes/${selectedId}/groups/${projectGroupId}/projects`, {
      name: projectName.trim(), dueDate: projectDueDate ? dateInputToApi(projectDueDate) : undefined
    }), 'Đã tạo dự án nhóm');
    if (done) { setProjectName(''); setProjectDueDate(''); setProjectGroupId(null); }
  };

  const openReports = async (project: { id: string; name: string }) => {
    if (!selectedId) return;
    reportTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedProject(project);
    setReports([]);
    setReportsError('');
    setPendingOnly(false);
    setReviewingId(null);
    try { await loadReports(selectedId, project.id); }
    catch (error) { if (selectedIdRef.current === selectedId) showToast(error instanceof Error ? error.message : 'Không tải được báo cáo', 'error'); }
  };

  useEffect(() => {
    if (selectedProject) reportPanelRef.current?.focus();
  }, [selectedProject]);

  const submitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !selectedProject) return;
    const done = await operate(() => api.post(`/classes/${selectedId}/projects/${selectedProject.id}/reports`, {
      progressPercent, summary: reportSummary.trim(), blockers: reportBlockers.trim() || undefined
    }), 'Đã gửi báo cáo tiến độ', true);
    if (done) { setReportSummary(''); setReportBlockers(''); }
  };

  const reviewReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !selectedProject || !reviewingId) return;
    const done = await operate(() => api.put(`/classes/${selectedId}/projects/${selectedProject.id}/reports/${reviewingId}/review`, {
      reviewScore, reviewComment: reviewComment.trim()
    }), 'Đã đánh giá báo cáo', true);
    if (done) { setReviewingId(null); setReviewComment(''); }
  };

  return <div className="classes-page">
    <header className="classes-heading">
      <div><span className="badge badge-blue"><GraduationCap size={14} /> Không gian lớp học</span>
        <h1>Lớp học, nhóm và dự án môn học</h1>
        <p>Giảng viên theo dõi các nhóm; sinh viên vẫn có thể tạo dự án độc lập ở mục Dự án & BTL.</p>
      </div>
    </header>

    {(user?.role === UserRole.TEACHER || isAdmin) && <details className="classes-panel">
      <summary><Plus size={16} /> Tạo lớp học</summary>
      <form className="classes-form" onSubmit={createClass}>
        <label>Tên lớp / môn học<input className="snote-input" required minLength={2} maxLength={150} value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Ví dụ: Cơ sở dữ liệu - Nhóm 01" /></label>
        <label>Mã lớp<input className="snote-input" maxLength={50} value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="CSDL-01" /></label>
        <label>Học kỳ<input className="snote-input" maxLength={100} value={classTerm} onChange={(e) => setClassTerm(e.target.value)} placeholder="2026-2027 / HK1" /></label>
        <button className="btn btn-primary" disabled={busy}>Tạo lớp</button>
      </form>
    </details>}

    {isAdmin && <details className="classes-panel">
      <summary><GraduationCap size={16} /> Cấp vai trò giảng viên</summary>
      <form className="classes-form" onSubmit={async (event) => {
        event.preventDefault();
        const done = await operate(() => api.post('/classes/teachers', { email: teacherEmail.trim() }), 'Đã cấp vai trò giảng viên');
        if (done) setTeacherEmail('');
      }}>
        <label>Email tài khoản<input className="snote-input" type="email" required value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} /></label>
        <button className="btn btn-primary" disabled={busy}>Cấp quyền</button>
      </form>
    </details>}

    <div className="classes-layout">
      <aside className="classes-panel classes-list" aria-label="Danh sách lớp học">
        <h2>Lớp của tôi</h2>
        {classes.length > 5 && <label className="classes-search">Tìm lớp<input className="snote-input" type="search" value={classSearch} onChange={(event) => setClassSearch(event.target.value)} placeholder="Tên, mã lớp, học kỳ" /></label>}
        {loading && <p>Đang tải lớp học...</p>}
        {classesError && <p role="alert">Không tải được danh sách lớp: {classesError} <button type="button" className="btn btn-secondary btn-sm" onClick={() => setClassesReloadKey((current) => current + 1)}>Thử lại</button></p>}
        {!loading && !classesError && classes.length === 0 && <p>Bạn chưa tham gia lớp nào. Giảng viên có thể tạo lớp, hoặc quản lý lớp sẽ thêm bạn bằng email.</p>}
        {!loading && !classesError && classes.length > 0 && filteredClasses.length === 0 && <p>Không tìm thấy lớp phù hợp.</p>}
        {filteredClasses.map((item) => <button key={item.id} type="button" className={`classes-list-item ${selectedId === item.id ? 'active' : ''}`} aria-current={selectedId === item.id ? 'page' : undefined} onClick={() => selectClass(item.id)}>
          <strong>{item.name}</strong><span>{item.code || 'Chưa có mã'} · {item.term || 'Chưa ghi học kỳ'}</span>
          <small>{item._count.members} sinh viên · {item._count.groups} nhóm</small>
        </button>)}
      </aside>

      <main className="classes-main">
        {selectedId && selectedClassExists && (!detail || detail.id !== selectedId) && <div className="classes-panel" role={classLoadError ? 'alert' : 'status'}>
          {classLoadError ? <>Không tải được thông tin lớp: {classLoadError} <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReloadKey((current) => current + 1)}>Thử lại</button></> : 'Đang tải thông tin lớp...'}
        </div>}
        {detail && detail.id === selectedId && <>
          <section className="classes-panel">
            <div className="classes-section-head"><div><span className="badge badge-purple">{isTeacher ? 'Giảng viên' : classRole === 'CLASS_ADMIN' ? 'Quản trị viên lớp' : 'Sinh viên'}</span>
              <h2>{detail.name}</h2><p>{detail.code || 'Không có mã lớp'} · {detail.term || 'Chưa ghi học kỳ'} · GV: {detail.teacher.fullName}</p>
            </div><BookOpen size={24} aria-hidden="true" /></div>
            {detail.description && <p>{detail.description}</p>}
            {isTeacher && <details>
              <summary>Chỉnh sửa thông tin môn học và lớp</summary>
              <form className="classes-form" onSubmit={async (event) => {
                event.preventDefault();
                if (!selectedId) return;
                const form = new FormData(event.currentTarget);
                await operate(() => api.put(`/classes/${selectedId}`, {
                  name: String(form.get('name') || '').trim(),
                  code: String(form.get('code') || '').trim(),
                  term: String(form.get('term') || '').trim(),
                  description: String(form.get('description') || '').trim()
                }), 'Đã cập nhật lớp học');
              }}>
                <label>Tên lớp / môn học<input className="snote-input" name="name" required minLength={2} maxLength={150} defaultValue={detail.name} /></label>
                <label>Mã lớp<input className="snote-input" name="code" maxLength={50} defaultValue={detail.code || ''} /></label>
                <label>Học kỳ<input className="snote-input" name="term" maxLength={100} defaultValue={detail.term || ''} /></label>
                <label>Mô tả<textarea className="snote-textarea" name="description" rows={2} defaultValue={detail.description || ''} /></label>
                <button className="btn btn-primary" disabled={busy}>Lưu thông tin</button>
              </form>
            </details>}
          </section>

          <nav className="classes-tabs" aria-label="Nội dung lớp học">
            <button type="button" className={activeTab === 'overview' ? 'active' : ''} aria-current={activeTab === 'overview' ? 'page' : undefined} onClick={() => selectTab('overview')}>Tổng quan tiến độ & năng suất</button>
            <button type="button" className={activeTab === 'groups' ? 'active' : ''} aria-current={activeTab === 'groups' ? 'page' : undefined} onClick={() => selectTab('groups')}>Nhóm & dự án <span>{detail.groups.length}</span></button>
            <button type="button" className={activeTab === 'students' ? 'active' : ''} aria-current={activeTab === 'students' ? 'page' : undefined} onClick={() => selectTab('students')}>Sinh viên & Lớp trưởng <span>{detail.members.length}</span></button>
          </nav>

          {activeTab === 'overview' && (overviewError ? <section className="classes-panel" role="alert">Không tải được tiến độ: {overviewError} <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReloadKey((current) => current + 1)}>Thử lại</button></section> : <ClassProgressOverview projects={overviewProjects} loading={overviewLoading} isManager={isManager} onOpenReports={openReports} onOpenWorkspace={setWorkspaceProjectId} />)}

          {activeTab === 'students' && <section className="classes-panel">
            <div className="classes-section-head"><h2><Users size={18} /> Danh sách sinh viên & Lớp trưởng ({detail.members.length})</h2></div>
            {isManager && <form className="classes-form" onSubmit={addMember}>
              <label>Thêm sinh viên bằng email<input className="snote-input" type="email" required value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} /></label>
              <button className="btn btn-primary" disabled={busy}>Thêm vào lớp</button>
            </form>}
            <div className="classes-roster">{detail.members.map((member) => <div className="classes-person" key={member.userId}>
              <span><strong>{member.user.fullName}</strong><small>{member.user.email}</small></span>
              <span className="classes-actions">
                {isTeacher ? <select className="snote-select" aria-label={`Vai trò của ${member.user.fullName}`} value={member.role} disabled={busy} onChange={(e) => selectedId && operate(() => api.put(`/classes/${selectedId}/members/${member.userId}`, { role: e.target.value }), 'Đã cập nhật vai trò')}>
                  <option value="STUDENT">Sinh viên</option><option value="CLASS_ADMIN">Lớp trưởng (Quản trị lớp)</option>
                </select> : <span className={`badge ${member.role === 'CLASS_ADMIN' ? 'badge-blue' : 'badge-neutral'}`} style={{ fontSize: '11px' }}>{member.role === 'CLASS_ADMIN' ? 'Lớp trưởng' : 'Sinh viên'}</span>}
                {isManager && member.userId !== user?.id && (isTeacher || member.role !== 'CLASS_ADMIN') && <button type="button" className="btn btn-ghost btn-icon" title={`Xóa ${member.user.fullName} khỏi lớp`} disabled={busy} onClick={() => selectedId && window.confirm(`Xóa ${member.user.fullName} khỏi lớp?`) && operate(() => api.delete(`/classes/${selectedId}/members/${member.userId}`), 'Đã xóa sinh viên khỏi lớp')}><Trash2 size={15} /></button>}
              </span>
            </div>)}</div>
          </section>}

          {activeTab === 'groups' && <section className="classes-panel">
            <div className="classes-section-head"><h2><Users size={18} /> Nhóm học tập ({detail.groups.length})</h2></div>
            {isManager && <form className="classes-form" onSubmit={createGroup}>
              <label>Tên nhóm<input className="snote-input" required minLength={2} maxLength={150} value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ví dụ: Nhóm 1" /></label>
              <label>Trưởng nhóm<select className="snote-select" required value={groupLeaderId} onChange={(e) => setGroupLeaderId(e.target.value)}><option value="">Chọn sinh viên</option>{detail.members.filter((member) => !detail.groups.some((group) => group.members.some((m) => m.userId === member.userId))).map((member) => <option value={member.userId} key={member.userId}>{member.user.fullName}</option>)}</select></label>
              <button className="btn btn-primary" disabled={busy}>Tạo nhóm</button>
            </form>}
            {detail.groups.length === 0 && <p>Chưa có nhóm. Quản lý lớp có thể chia sinh viên thành các nhóm nhỏ.</p>}
            <div className="classes-groups">{detail.groups.map((group) => {
              const isLeader = group.leaderId === user?.id;
              const canManageGroup = isManager || isLeader;
              const available = detail.members.filter((member) => !detail.groups.some((item) => item.members.some((m) => m.userId === member.userId)));
              return <article className="classes-group" key={group.id}>
                <div className="classes-section-head"><div><h3>{group.name}</h3><p>Trưởng nhóm: {group.leader.fullName} · {group.members.length} thành viên</p></div>
                  {isTeacher && <button type="button" className="btn btn-ghost btn-icon" title={`Xóa ${group.name}`} disabled={busy} onClick={() => selectedId && window.confirm(`Xóa nhóm ${group.name}? Nhóm phải không còn dự án.`) && operate(() => api.delete(`/classes/${selectedId}/groups/${group.id}`), 'Đã xóa nhóm')}><Trash2 size={16} /></button>}
                </div>
                {isManager && <div className="classes-group-management">
                  <form className="classes-form" onSubmit={(event) => {
                    event.preventDefault();
                    if (!selectedId) return;
                    const name = String(new FormData(event.currentTarget).get('name') || '').trim();
                    if (name && name !== group.name) operate(() => api.put(`/classes/${selectedId}/groups/${group.id}`, { name }), 'Đã đổi tên nhóm');
                  }}>
                    <label>Tên nhóm<input className="snote-input" name="name" key={group.name} defaultValue={group.name} required minLength={2} maxLength={150} /></label>
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={busy}>Lưu tên</button>
                  </form>
                  <form className="classes-form" onSubmit={(event) => {
                    event.preventDefault();
                    if (!selectedId) return;
                    const leaderId = String(new FormData(event.currentTarget).get('leaderId') || '');
                    if (leaderId && leaderId !== group.leaderId && window.confirm('Chuyển vai trò trưởng nhóm và quyền quản lý các dự án cho sinh viên này?')) {
                      operate(() => api.put(`/classes/${selectedId}/groups/${group.id}/leader`, { userId: leaderId }), 'Đã chuyển vai trò trưởng nhóm');
                    }
                  }}>
                    <label>Trưởng nhóm<select className="snote-select" name="leaderId" key={group.leaderId} defaultValue={group.leaderId} disabled={busy}>
                      {group.members.map((member) => <option key={member.userId} value={member.userId}>{member.user.fullName}</option>)}
                    </select></label>
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={busy}>Chuyển trưởng nhóm</button>
                  </form>
                </div>}
                <div className="classes-roster">{group.members.map((member) => <div className="classes-person" key={member.userId}><span>{member.user.fullName}{member.userId === group.leaderId && <small>Trưởng nhóm</small>}</span>
                  {canManageGroup && member.userId !== group.leaderId && <button type="button" className="btn btn-ghost btn-icon" title={`Xóa ${member.user.fullName} khỏi nhóm`} disabled={busy} onClick={() => selectedId && window.confirm(`Xóa ${member.user.fullName} khỏi nhóm?`) && operate(() => api.delete(`/classes/${selectedId}/groups/${group.id}/members/${member.userId}`), 'Đã xóa thành viên khỏi nhóm')}><Trash2 size={15} /></button>}
                </div>)}</div>
                {canManageGroup && available.length > 0 && <label className="classes-inline-label">Thêm thành viên
                  <select className="snote-select" value="" disabled={busy} onChange={(e) => selectedId && e.target.value && operate(() => api.post(`/classes/${selectedId}/groups/${group.id}/members`, { userId: e.target.value }), 'Đã thêm thành viên vào nhóm')}>
                    <option value="">Chọn sinh viên trong lớp</option>{available.map((member) => <option value={member.userId} key={member.userId}>{member.user.fullName}</option>)}
                  </select></label>}
                <div className="classes-projects"><h4><FolderKanban size={16} /> Dự án nhóm</h4>
                  {group.projects.map((project) => <div className="classes-project" key={project.id}>
                    <div><strong>{project.name}</strong><small>{project.status} · {project._count.tasks} việc · {project._count.progressReports} báo cáo{project.dueDate ? ` · Hạn ${new Date(project.dueDate).toLocaleDateString('vi-VN')}` : ''}</small></div>
                    <div className="classes-actions">{(isManager || group.members.some((member) => member.userId === user?.id)) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => openReports(project)}><ClipboardList size={14} /> Tiến độ</button>}
                      {(isManager || group.members.some((member) => member.userId === user?.id)) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setWorkspaceProjectId(project.id)}><Eye size={14} /> Workspace</button>}
                      {isTeacher && selectedId && <button type="button" className="btn btn-ghost btn-icon" title={`Xóa dự án ${project.name}`} disabled={busy} onClick={() => window.confirm(`Xóa dự án ${project.name}?`) && operate(() => api.delete(`/classes/${selectedId}/projects/${project.id}`), 'Đã xóa dự án')}><Trash2 size={15} /></button>}
                    </div>
                    {(isManager || isLeader) && selectedId && <form className="classes-form classes-project-edit" key={`${project.id}-${project.status}-${project.dueDate || ''}`} onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      const status = String(form.get('status') || project.status);
                      const dueDate = String(form.get('dueDate') || '');
                      const currentDate = project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : '';
                      if (status !== project.status || dueDate !== currentDate) {
                        operate(() => api.put(`/classes/${selectedId}/projects/${project.id}`, {
                          status, dueDate: dueDate ? dateInputToApi(dueDate) : null
                        }), 'Đã cập nhật dự án');
                      }
                    }}><label>Trạng thái<select className="snote-select" name="status" defaultValue={project.status} disabled={busy}>
                      <option value="PLANNED">Lên kế hoạch</option><option value="ACTIVE">Đang làm</option><option value="ON_HOLD">Tạm dừng</option><option value="COMPLETED">Hoàn thành</option><option value="ARCHIVED">Lưu trữ</option>
                    </select></label><label>Hạn nộp<input className="snote-input" name="dueDate" type="date" defaultValue={project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : ''} disabled={busy} /></label>
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={busy}>Lưu dự án</button>
                    </form>}
                  </div>)}
                  {group.projects.length === 0 && <p>{isManager || group.members.some((member) => member.userId === user?.id) ? 'Nhóm chưa có dự án.' : 'Dự án của nhóm khác chỉ hiển thị với thành viên nhóm và quản lý lớp.'}</p>}
                  {canManageGroup && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setProjectGroupId(projectGroupId === group.id ? null : group.id)}><Plus size={14} /> Tạo dự án nhóm</button>}
                  {projectGroupId === group.id && <form className="classes-form" onSubmit={createProject}>
                    <label>Tên dự án<input className="snote-input" required minLength={2} maxLength={150} value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
                    <label>Hạn nộp<input className="snote-input" type="date" value={projectDueDate} onChange={(e) => setProjectDueDate(e.target.value)} /></label>
                    <button className="btn btn-primary" disabled={busy}>Tạo dự án</button>
                  </form>}
                </div>
              </article>;
            })}</div>
          </section>}

          {selectedProject && selectedId && <section className="classes-panel" aria-label="Báo cáo tiến độ" ref={reportPanelRef} tabIndex={-1}>
            <div className="classes-section-head"><div><h2><ClipboardList size={18} /> Tiến độ: {selectedProject.name}</h2><p>Báo cáo của nhóm và đánh giá của giảng viên.</p></div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSelectedProject(null); reportTriggerRef.current?.focus(); }}>Đóng</button></div>
            {canReport && <form className="classes-form classes-report-form" onSubmit={submitReport}>
              <label>Tiến độ (%)<input className="snote-input" type="number" min={0} max={100} required value={progressPercent} onChange={(e) => setProgressPercent(Number(e.target.value))} /></label>
              <label>Nhóm đã hoàn thành gì?<textarea className="snote-textarea" rows={3} required maxLength={5000} value={reportSummary} onChange={(e) => setReportSummary(e.target.value)} /></label>
              <label>Vướng mắc (nếu có)<textarea className="snote-textarea" rows={2} maxLength={5000} value={reportBlockers} onChange={(e) => setReportBlockers(e.target.value)} /></label>
              <button className="btn btn-primary" disabled={busy}>Gửi báo cáo</button>
            </form>}
            {reportsLoading && <p role="status">Đang tải báo cáo...</p>}
            {reportsError && <p role="alert">Không tải được báo cáo: {reportsError}</p>}
            {!reportsLoading && !reportsError && reports.length === 0 && <p>Chưa có báo cáo tiến độ.</p>}
            {isTeacher && reports.length > 0 && <button type="button" className="btn btn-secondary btn-sm" aria-pressed={pendingOnly} onClick={() => setPendingOnly((current) => !current)}>{pendingOnly ? 'Hiện tất cả báo cáo' : `Chỉ xem chờ chấm (${reports.filter((report) => report.reviewScore == null).length})`}</button>}
            {!reportsLoading && pendingOnly && visibleReports.length === 0 && <p>Không có báo cáo chờ chấm.</p>}
            {visibleReports.map((report) => <article className="classes-report" key={report.id}>
              <div className="classes-section-head"><strong>{report.progressPercent}% · {report.submittedBy.fullName}</strong><small>{new Date(report.createdAt).toLocaleString('vi-VN')}</small></div>
              <p>{report.summary}</p>{report.blockers && <p><strong>Vướng mắc:</strong> {report.blockers}</p>}
              {report.reviewScore !== null && report.reviewScore !== undefined && <p className="classes-review"><strong>Đánh giá {report.reviewScore}/100:</strong> {report.reviewComment}</p>}
              {isTeacher && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setReviewingId(report.id); setReviewScore(report.reviewScore ?? 0); setReviewComment(report.reviewComment || ''); }}>Đánh giá</button>}
              {reviewingId === report.id && <form className="classes-form" onSubmit={reviewReport}>
                <label>Điểm tiến độ (0–100)<input className="snote-input" type="number" min={0} max={100} required value={reviewScore} onChange={(e) => setReviewScore(Number(e.target.value))} /></label>
                <label>Nhận xét<textarea className="snote-textarea" required minLength={1} maxLength={5000} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} /></label>
                <button className="btn btn-primary" disabled={busy}>Lưu đánh giá</button>
              </form>}
            </article>)}
          </section>}
        </>}
      </main>
    </div>
    <ProjectWorkspaceModal isOpen={Boolean(workspaceProjectId)} projectId={workspaceProjectId} onClose={() => setWorkspaceProjectId(null)} onRefreshParent={() => { if (selectedId) loadClass(selectedId); }} />
  </div>;
};
