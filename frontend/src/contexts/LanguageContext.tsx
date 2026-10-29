import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

export type Language = 'vi' | 'en';

export interface Translations {
  [key: string]: string;
}

const translationsVi: Translations = {
  // Navigation
  'nav.notes': 'Ghi chú',
  'nav.tasks': 'Công việc',
  'nav.schedule': 'Lịch trình',
  'nav.classes': 'Lớp học',
  'nav.projects': 'Đồ án',
  'nav.progress': 'Tiến độ',
  'nav.settings': 'Cài đặt',
  'nav.command_palette': 'Bảng lệnh (Ctrl+K)',
  'nav.quick_capture': 'Tạo nhanh (Ctrl+N)',

  // Common
  'common.all': 'Tất cả',
  'common.create': 'Tạo mới',
  'common.edit': 'Chỉnh sửa',
  'common.delete': 'Xóa',
  'common.save': 'Lưu',
  'common.cancel': 'Hủy',
  'common.confirm': 'Xác nhận',
  'common.search': 'Tìm kiếm...',
  'common.loading': 'Đang tải...',
  'common.actions': 'Thao tác',
  'common.status': 'Trạng thái',
  'common.priority': 'Mức độ ưu tiên',
  'common.select_all': 'Chọn tất cả',
  'common.deselect_all': 'Bỏ chọn tất cả',
  'common.personal': 'Việc cá nhân',
  'common.team_project': 'Dự án nhóm',
  'common.today': 'Hôm nay',
  'common.language': 'Ngôn ngữ',

  // Tasks & Metrics
  'tasks.all_count': 'Tất cả',
  'tasks.today_count': 'Hôm nay',
  'tasks.in_progress_count': 'Đang làm',
  'tasks.pending_count': 'Chờ duyệt',
  'tasks.done_count': 'Đã xong',
  'tasks.archived_count': 'Đã lưu trữ',
  'tasks.unassigned_count': 'Chưa giao',
  'tasks.search_placeholder': 'Tìm việc, người làm, checklist...',
  'tasks.filter_assignee_all': 'Tất cả người làm',
  'tasks.filter_date_all': 'Tất cả thời hạn',
  'tasks.filter_date_today_overdue': 'Hôm nay & Quá hạn',
  'tasks.filter_date_today': 'Hôm nay',
  'tasks.filter_date_week': 'Tuần này',
  'tasks.filter_date_overdue': 'Quá hạn',
  'tasks.filter_priority_all': 'Mọi mức ưu tiên',
  'tasks.priority_urgent': 'Khẩn cấp',
  'tasks.priority_high': 'Cao',
  'tasks.priority_medium': 'Trung bình',
  'tasks.priority_low': 'Thấp',
  'tasks.status_todo': 'Chờ làm',
  'tasks.status_in_progress': 'Đang làm',
  'tasks.status_pending': 'Chờ duyệt',
  'tasks.status_done': 'Đã xong',
  'tasks.overdue': 'Quá hạn',
  'tasks.assigned': 'Phụ trách',
  'tasks.due_at': 'Hạn chót',
  'tasks.batch_done': 'Hoàn tất ({count})',
  'tasks.batch_delete': 'Xóa ({count})',
  'tasks.select_all_with_count': 'Chọn tất cả ({count} công việc)',
  'tasks.view_gantt': 'Sơ đồ Gantt tiến độ (7 Tuần)',
  'tasks.view_hourly': 'Lịch chi tiết theo giờ',
  'tasks.view_list': 'Danh sách nhiệm vụ & Hạn chót',
  'tasks.view_kanban': 'Bảng Kanban',
  'tasks.view_eisenhower': 'Ma trận Eisenhower (2x2)',
  'tasks.no_tasks': 'Chưa có công việc nào trong danh sách',
  'tasks.create_task': 'Thêm công việc',

  // Gantt (Vertex42)
  'gantt.title': 'Tiến Độ Dự Án (Vertex42 Schedule • 7 Tuần / 49 Ngày)',
  'gantt.prev_week': 'Tuần trước',
  'gantt.today': 'Hôm nay',
  'gantt.next_week': 'Tuần sau',
  'gantt.wbs': 'WBS',
  'gantt.task_name': 'CÔNG VIỆC',
  'gantt.priority': 'ƯU TIÊN',
  'gantt.assignee': 'PHỤ TRÁCH',
  'gantt.start': 'BẮT ĐẦU',
  'gantt.due': 'HẾT HẠN',
  'gantt.days': 'NGÀY',
  'gantt.pct_done': '% XONG',
  'gantt.week_prefix': 'Tuần',

  // Schedule (Hourly)
  'schedule.title': 'Lịch trình thời gian thực chi tiết theo khung giờ học tập & đồ án',
  'schedule.all_day_tray': 'CẢ NGÀY / KHÔNG CỐ ĐỊNH GIỜ',
  'schedule.prev_day': 'Trước',
  'schedule.today': 'Hôm nay',
  'schedule.next_day': 'Sau',
  'schedule.add_event': 'Thêm Sự Kiện',
  'schedule.no_timed_events': 'Không có sự kiện ấn định giờ trong khung thời gian này.',

  // Classes & Roles
  'classes.title': 'Lớp Học & Đồ Án Môn Học',
  'classes.role_teacher': 'Giáo viên',
  'classes.role_student': 'Sinh viên',
  'classes.join_class': 'Tham gia lớp học',
  'classes.join_btn': 'Vào lớp',
  'classes.create_class': 'Tạo lớp học mới',
  'classes.class_code': 'Mã lớp',
  'classes.class_uid': 'Mã định danh lớp (UID)',
  'classes.copy_uid': 'Sao chép UID',
  'classes.copied': 'Đã sao chép!',
  'classes.filter_year': 'Năm học',
  'classes.all_years': 'Tất cả các năm',
  'classes.productivity': 'Bảng Năng Suất & Phân Công Nhiệm Vụ',
  'classes.enter_code_or_uid': 'Nhập mã lớp (ví dụ CS50) hoặc UID duy nhất...',

  // Auth
  'auth.login': 'Đăng nhập',
  'auth.register': 'Đăng ký tài khoản',
  'auth.logout': 'Đăng xuất',
  'auth.email': 'Địa chỉ Email',
  'auth.password': 'Mật khẩu',
  'auth.select_role': 'Bạn sử dụng SNOTE với vai trò gì?',
  'auth.teacher_desc': 'Tạo & quản lý lớp học, phân nhóm đồ án, theo dõi tiến độ và năng suất sinh viên.',
  'auth.student_desc': 'Tham gia lớp học của giáo viên bằng mã lớp/UID, tham gia nhóm đồ án và làm nhiệm vụ.'
};

const translationsEn: Translations = {
  // Navigation
  'nav.notes': 'Notes',
  'nav.tasks': 'Tasks',
  'nav.schedule': 'Schedule',
  'nav.classes': 'Classes',
  'nav.projects': 'Projects',
  'nav.progress': 'Progress',
  'nav.settings': 'Settings',
  'nav.command_palette': 'Command Palette (Ctrl+K)',
  'nav.quick_capture': 'Quick Capture (Ctrl+N)',

  // Common
  'common.all': 'All',
  'common.create': 'Create',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.search': 'Search...',
  'common.loading': 'Loading...',
  'common.actions': 'Actions',
  'common.status': 'Status',
  'common.priority': 'Priority',
  'common.select_all': 'Select all',
  'common.deselect_all': 'Deselect all',
  'common.personal': 'Personal',
  'common.team_project': 'Team Project',
  'common.today': 'Today',
  'common.language': 'Language',

  // Tasks & Metrics
  'tasks.all_count': 'All',
  'tasks.today_count': 'Today',
  'tasks.in_progress_count': 'In Progress',
  'tasks.pending_count': 'In Review',
  'tasks.done_count': 'Done',
  'tasks.archived_count': 'Archived',
  'tasks.unassigned_count': 'Unassigned',
  'tasks.search_placeholder': 'Search tasks, assignees, checklists...',
  'tasks.filter_assignee_all': 'All assignees',
  'tasks.filter_date_all': 'All due dates',
  'tasks.filter_date_today_overdue': 'Due today & overdue',
  'tasks.filter_date_today': 'Today',
  'tasks.filter_date_week': 'This week',
  'tasks.filter_date_overdue': 'Overdue',
  'tasks.filter_priority_all': 'All priorities',
  'tasks.priority_urgent': 'Urgent',
  'tasks.priority_high': 'High',
  'tasks.priority_medium': 'Medium',
  'tasks.priority_low': 'Low',
  'tasks.status_todo': 'To Do',
  'tasks.status_in_progress': 'In Progress',
  'tasks.status_pending': 'In Review',
  'tasks.status_done': 'Done',
  'tasks.overdue': 'Overdue',
  'tasks.assigned': 'Assigned',
  'tasks.due_at': 'Due date',
  'tasks.batch_done': 'Mark done ({count})',
  'tasks.batch_delete': 'Delete ({count})',
  'tasks.select_all_with_count': 'Select all ({count} tasks)',
  'tasks.view_gantt': 'Gantt Progress Schedule (7 Weeks)',
  'tasks.view_hourly': 'Real-time Hourly Schedule',
  'tasks.view_list': 'Task List & Deadlines',
  'tasks.view_kanban': 'Kanban Board',
  'tasks.view_eisenhower': 'Eisenhower Matrix (2x2)',
  'tasks.no_tasks': 'No tasks in this list yet',
  'tasks.create_task': 'New Task',

  // Gantt (Vertex42)
  'gantt.title': 'Project Progress (Vertex42 Schedule • 7 Weeks / 49 Days)',
  'gantt.prev_week': 'Prev week',
  'gantt.today': 'Today',
  'gantt.next_week': 'Next week',
  'gantt.wbs': 'WBS',
  'gantt.task_name': 'TASK NAME',
  'gantt.priority': 'PRIORITY',
  'gantt.assignee': 'ASSIGNEE',
  'gantt.start': 'START',
  'gantt.due': 'DUE',
  'gantt.days': 'DAYS',
  'gantt.pct_done': '% DONE',
  'gantt.week_prefix': 'Week',

  // Schedule (Hourly)
  'schedule.title': 'Real-time detailed hourly schedule for academic & project milestones',
  'schedule.all_day_tray': 'ALL DAY / UNTIMED',
  'schedule.prev_day': 'Prev',
  'schedule.today': 'Today',
  'schedule.next_day': 'Next',
  'schedule.add_event': 'Add Event',
  'schedule.no_timed_events': 'No scheduled events in this time slot.',

  // Classes & Roles
  'classes.title': 'Classes & Course Projects',
  'classes.role_teacher': 'Teacher',
  'classes.role_student': 'Student',
  'classes.join_class': 'Join Class',
  'classes.join_btn': 'Join',
  'classes.create_class': 'Create New Class',
  'classes.class_code': 'Course Code',
  'classes.class_uid': 'Unique Class UID',
  'classes.copy_uid': 'Copy UID',
  'classes.copied': 'Copied!',
  'classes.filter_year': 'Academic Year',
  'classes.all_years': 'All years',
  'classes.productivity': 'Member Productivity & Task Allocation',
  'classes.enter_code_or_uid': 'Enter course code (e.g. CS50) or unique UID...',

  // Auth
  'auth.login': 'Log In',
  'auth.register': 'Create Account',
  'auth.logout': 'Log Out',
  'auth.email': 'Email Address',
  'auth.password': 'Password',
  'auth.select_role': 'How do you intend to use SNOTE?',
  'auth.teacher_desc': 'Create & manage classrooms, group project teams, monitor student progress and productivity.',
  'auth.student_desc': 'Join classrooms with teacher code/UID, collaborate in project teams and complete tasks.'
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'snote_locale_lang';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'vi' || saved === 'en') return saved;
      // Default to Vietnamese if browser is vi, else default to vi for current academic context
      return 'vi';
    } catch {
      return 'vi';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore local storage error
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const dict = useMemo(() => {
    return language === 'en' ? translationsEn : translationsVi;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let str = dict[key] || translationsVi[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
