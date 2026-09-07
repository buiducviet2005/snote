/**
 * ==============================================================================
 * SNOTE - HỆ THỐNG QUẢN TRỊ HỌC TẬP & ĐỒ ÁN TOÀN DIỆN (WEB SCRIPT EDITION)
 * Nền tảng: Google Apps Script Web App (V8 Runtime) & Google Sheets Database
 * Kiến trúc: 1-URL Single Web App Portal, Zero-Scriptlets, Dynamic Header Indexing
 * Chế độ: 4 Trạng thái chuẩn (TODO, IN_PROGRESS, REVIEW, DONE)
 * Tự động đánh giá Đúng hạn / Trễ hạn, Kéo thả Kanban, Gantt Timeline,
 * Bảng chi tiết 11 cột, Ma trận Eisenhower, Ghi Chú & Đề Cương, Roadmap DFA Parser
 * ==============================================================================
 */

const SHEET_USERS = 'Users';
const SHEET_SEMESTERS = 'Semesters';
const SHEET_SUBJECTS = 'Subjects';
const SHEET_PROJECTS = 'Projects';
const SHEET_TASKS = 'Tasks';
const SHEET_NOTES = 'Notes';
const SHEET_ROADMAPS = 'Roadmaps';
const SHEET_AUDIT_LOGS = 'AuditLogs';

/**
 * Khởi chạy Web App - Pure HTML Output (Không dùng template scriptlet)
 */
function doGet(e) {
  try {
    ensureAllSheetsInitialized();
  } catch (err) {
    console.warn('Lỗi khởi tạo sheet ngầm:', err.message);
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('SNOTE - Quản Lý Học Tập & Đồ Án')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Tự động khởi tạo 7 Sheet chuẩn nếu chưa tồn tại (Bảo toàn 100% dữ liệu cũ)
 */
function ensureAllSheetsInitialized() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAdminUserExists(ss);
  ensureSemestersSheetExists(ss);
  ensureSubjectsSheetExists(ss);
  ensureProjectsSheetExists(ss);
  ensureTasksSheetExists(ss);
  ensureNotesSheetExists(ss);
  ensureRoadmapsSheetExists(ss);
  ensureAuditLogsSheetExists(ss);
}

// ==============================================================================
// 1. CÁC HÀM TIỆN ÍCH CHUẨN HÓA DỮ LIỆU & JSON SERIALIZATION
// ==============================================================================

function formatDateString(val) {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(val).trim();
  if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.substring(0, 10);
  return s;
}

function formatDateTimeString(val) {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    const h = String(val.getHours()).padStart(2, '0');
    const min = String(val.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  }
  return String(val).trim();
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    if (typeof str === 'object') return str;
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

/**
 * Phòng vệ Tiêm lệnh bảng tính (Formula Injection Defense)
 * Tự động chèn dấu nháy đơn ' nếu giá trị chuỗi bắt đầu bằng =, +, -, @
 */
function sanitizeSheetCell(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^[=+\-@]/.test(trimmed)) {
      return "'" + val;
    }
  }
  return val;
}

function generateRandomString(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  for (let i = 0; i < len; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// ==============================================================================
// 2. QUẢN LÝ SHEET USERS (Xác thực Admin & Phiên Token)
// ==============================================================================

function getColumnIndicesUsers(headers) {
  const indices = { email: 0, password: 1, fullName: 2, token: 3, lastLogin: 4 };
  headers.forEach((h, idx) => {
    const clean = String(h || '').toLowerCase().trim().replace(/[_-]/g, '');
    if (clean === 'email' || clean === 'taikhoan') indices.email = idx;
    else if (clean === 'password' || clean === 'matkhau') indices.password = idx;
    else if (clean === 'fullname' || clean === 'hoten') indices.fullName = idx;
    else if (clean === 'sessiontoken' || clean === 'token') indices.token = idx;
    else if (clean === 'lastlogin' || clean === 'dangnhapcuoi') indices.lastLogin = idx;
  });
  return indices;
}

function ensureAdminUserExists(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_USERS);
    sheet.appendRow(['email', 'password', 'full_name', 'session_token', 'last_login']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.appendRow(['admin@gmail.com', '123456', 'Quản Trị Viên SNOTE', '', new Date().toISOString()]);
  }
}

function handleAdminLogin(email, password) {
  try {
    ensureAllSheetsInitialized();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    if (!sheet) return { success: false, message: 'Sheet Users không tồn tại.' };

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: false, message: 'Chưa có tài khoản quản trị nào.' };

    const headers = data[0];
    const idx = getColumnIndicesUsers(headers);

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const rowEmail = String(row[idx.email] || '').trim().toLowerCase();
      const rowPass = String(row[idx.password] || '').trim();

      if (rowEmail === cleanEmail && rowPass === cleanPass) {
        const token = 'SEC-TOK-' + new Date().getTime() + '-' + generateRandomString(8);
        sheet.getRange(r + 1, idx.token + 1).setValue(token);
        sheet.getRange(r + 1, idx.lastLogin + 1).setValue(new Date().toISOString());

        return {
          success: true,
          sessionToken: token,
          fullName: String(row[idx.fullName] || 'Quản Trị Viên'),
          email: rowEmail
        };
      }
    }
    return { success: false, message: 'Email hoặc mật khẩu không chính xác.' };
  } catch (err) {
    return { success: false, message: 'Lỗi xác thực: ' + err.message };
  }
}

function verifySessionToken(token) {
  try {
    if (!token) return JSON.stringify({ valid: false });
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    if (!sheet) return JSON.stringify({ valid: false });

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return JSON.stringify({ valid: false });

    const idx = getColumnIndicesUsers(data[0]);
    for (let r = 1; r < data.length; r++) {
      const rowToken = String(data[r][idx.token] || '').trim();
      if (rowToken && rowToken === String(token).trim()) {
        return JSON.stringify({
          valid: true,
          email: String(data[r][idx.email] || ''),
          fullName: String(data[r][idx.fullName] || 'Quản Trị Viên')
        });
      }
    }
    return JSON.stringify({ valid: false });
  } catch (err) {
    return JSON.stringify({ valid: false, error: err.message });
  }
}

// ==============================================================================
// 3. QUẢN LÝ SHEET SEMESTERS & SUBJECTS (Học Kỳ & Môn Học)
// ==============================================================================

function getColumnIndicesSemesters(headers) {
  const indices = { id: 0, name: 1, startDate: 2, endDate: 3, isActive: 4 };
  headers.forEach((h, idx) => {
    const clean = String(h || '').toLowerCase().trim().replace(/[_-]/g, '');
    if (clean === 'semesterid' || clean === 'id') indices.id = idx;
    else if (clean === 'semestername' || clean === 'name' || clean === 'tenhocky') indices.name = idx;
    else if (clean === 'startdate' || clean === 'ngaybatdau') indices.startDate = idx;
    else if (clean === 'enddate' || clean === 'ngayketthuc') indices.endDate = idx;
    else if (clean === 'isactive' || clean === 'active') indices.isActive = idx;
  });
  return indices;
}

function ensureSemestersSheetExists(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SEMESTERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SEMESTERS);
    sheet.appendRow(['semester_id', 'semester_name', 'start_date', 'end_date', 'is_active']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.appendRow(['SEM-2026-1', 'Học Kỳ 1 (2026 - 2027)', '2026-09-01', '2027-01-15', 'TRUE']);
  }
}

function getColumnIndicesSubjects(headers) {
  const indices = { id: 0, semesterId: 1, name: 2, code: 3, credits: 4, color: 5 };
  headers.forEach((h, idx) => {
    const clean = String(h || '').toLowerCase().trim().replace(/[_-]/g, '');
    if (clean === 'subjectid' || clean === 'id') indices.id = idx;
    else if (clean === 'semesterid') indices.semesterId = idx;
    else if (clean === 'subjectname' || clean === 'name' || clean === 'tenmon') indices.name = idx;
    else if (clean === 'subjectcode' || clean === 'code' || clean === 'mamon') indices.code = idx;
    else if (clean === 'credits' || clean === 'tinchi') indices.credits = idx;
    else if (clean === 'color' || clean === 'mau') indices.color = idx;
  });
  return indices;
}

function ensureSubjectsSheetExists(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SUBJECTS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SUBJECTS);
    sheet.appendRow(['subject_id', 'semester_id', 'subject_name', 'subject_code', 'credits', 'color']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.appendRow(['SUB-101', 'SEM-2026-1', 'Phát Triển Ứng Dụng Web', 'INT3306', 3, '#3b82f6']);
    sheet.appendRow(['SUB-102', 'SEM-2026-1', 'Hệ Quản Trị Cơ Sở Dữ Liệu', 'INT3202', 3, '#10b981']);
    sheet.appendRow(['SUB-103', 'SEM-2026-1', 'Kiến Trúc Máy Tính', 'INT2204', 3, '#8b5cf6']);
  }
}

// ==============================================================================
// 4. QUẢN LÝ SHEET PROJECTS (Đồ Án Nhóm & Mã PIN 4 Số)
// ==============================================================================

function getColumnIndicesProjects(headers) {
  const indices = { 
    id: 0, 
    subjectId: 1, 
    name: 2, 
    pin: 3, 
    description: 4, 
    createdAt: 5,
    deadline: 6,
    instructor: 7,
    members: 8,
    status: 9
  };
  headers.forEach((h, idx) => {
    const clean = String(h || '').toLowerCase().trim().replace(/[_-]/g, '');
    if (clean === 'projectid' || clean === 'id') indices.id = idx;
    else if (clean === 'subjectid') indices.subjectId = idx;
    else if (clean === 'projectname' || clean === 'name' || clean === 'tendoan') indices.name = idx;
    else if (clean === 'pincode' || clean === 'pin' || clean === 'matkhau') indices.pin = idx;
    else if (clean === 'description' || clean === 'mota') indices.description = idx;
    else if (clean === 'createdat' || clean === 'ngaytao') indices.createdAt = idx;
    else if (clean === 'deadline' || clean === 'hannop') indices.deadline = idx;
    else if (clean === 'instructor' || clean === 'giangvien') indices.instructor = idx;
    else if (clean === 'members' || clean === 'thanhvien') indices.members = idx;
    else if (clean === 'status' || clean === 'trangthai') indices.status = idx;
  });
  return indices;
}

function ensureProjectsSheetExists(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROJECTS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROJECTS);
  } else if (sheet.getLastRow() === 0) {
    // Tự phục hồi header nếu bị xóa nhầm (Self-Healing Schema)
    sheet.appendRow([
      'project_id', 'subject_id', 'project_name', 'pin_code', 'description', 
      'created_at', 'deadline', 'instructor', 'members', 'status'
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    return;
  }
  if (!sheet.getLastRow()) {
    sheet.appendRow([
      'project_id', 'subject_id', 'project_name', 'pin_code', 'description', 
      'created_at', 'deadline', 'instructor', 'members', 'status'
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.appendRow([
      'PRJ-101', 'SUB-101', 'Đồ Án SNOTE Web App - Nhóm 1', '1234', 
      'Xây dựng ứng dụng quản trị học tập cho sinh viên', new Date().toISOString(), 
      '2026-10-15', 'TS. Nguyễn Văn A', 'An, Bình, Tôi', 'ACTIVE'
    ]);
    sheet.appendRow([
      'PRJ-102', 'SUB-102', 'Hệ Thống Phân Tích Dữ Liệu Lớn', '5678', 
      'Tối ưu hóa truy vấn CSDL phân tán', new Date().toISOString(), 
      '2026-11-20', 'ThS. Trần Thị B', 'Cường, Dung', 'ACTIVE'
    ]);
  }
}

function getPublicProjectsList() {
  try {
    ensureAllSheetsInitialized();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROJECTS);
    if (!sheet) return { success: false, message: 'Sheet Projects không tồn tại.' };

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, projects: [] };

    const idx = getColumnIndicesProjects(data[0]);
    const list = [];
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const pId = String(row[idx.id] || '').trim();
      const pName = String(row[idx.name] || '').trim();
      if (pId && pName) {
        list.push({
          projectId: pId,
          projectName: pName,
          description: String(row[idx.description] || ''),
          subjectId: String(row[idx.subjectId] || ''),
          pinCode: String(row[idx.pin] || ''),
          deadline: idx.deadline !== undefined ? String(row[idx.deadline] || '') : '',
          instructor: idx.instructor !== undefined ? String(row[idx.instructor] || '') : '',
          members: idx.members !== undefined ? String(row[idx.members] || '') : '',
          status: idx.status !== undefined ? String(row[idx.status] || 'ACTIVE') : 'ACTIVE'
        });
      }
    }
    return { success: true, projects: list };
  } catch (err) {
    return { success: false, message: 'Lỗi nạp danh sách đồ án: ' + err.message };
  }
}

function accessProjectPortal(projectId, pinCode) {
  try {
    ensureAllSheetsInitialized();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pSheet = ss.getSheetByName(SHEET_PROJECTS);
    if (!pSheet) return { success: false, message: 'Sheet Projects không tồn tại.' };

    const pData = pSheet.getDataRange().getValues();
    const pIdx = getColumnIndicesProjects(pData[0]);

    let projectFound = null;
    const cleanPid = String(projectId || '').trim();
    const cleanPin = String(pinCode || '').trim();

    // PHÒNG THỦ BRUTE-FORCE BẰNG CACHE SERVICE RATE LIMITING (5 LẦN THỬ / 15 PHÚT)
    const cache = CacheService.getScriptCache();
    const rateLimitKey = 'ratelimit_pin_' + cleanPid;
    const failCountStr = cache.get(rateLimitKey);
    const failCount = failCountStr ? parseInt(failCountStr, 10) : 0;

    if (failCount >= 5) {
      return {
        success: false,
        message: 'Đồ án đang tạm khóa xác thực 15 phút do nhập sai mã PIN quá 5 lần liên tiếp để bảo vệ an toàn.'
      };
    }

    for (let r = 1; r < pData.length; r++) {
      const row = pData[r];
      const rowId = String(row[pIdx.id] || '').trim();
      const rowPin = String(row[pIdx.pin] || '').trim();

      if (rowId === cleanPid) {
        if (rowPin !== cleanPin) {
          const newFails = failCount + 1;
          cache.put(rateLimitKey, String(newFails), 900); // Khóa 15 phút
          const remaining = 5 - newFails;
          return {
            success: false,
            message: 'Mã PIN 4 số của đồ án không đúng. Còn ' + Math.max(0, remaining) + ' lần thử trước khi bị khóa tạm thời.'
          };
        }
        // Xóa bộ đếm lỗi khi đăng nhập thành công
        cache.remove(rateLimitKey);
        projectFound = {
          projectId: rowId,
          projectName: String(row[pIdx.name] || ''),
          description: String(row[pIdx.description] || ''),
          subjectId: String(row[pIdx.subjectId] || ''),
          pinCode: rowPin,
          deadline: pIdx.deadline !== undefined ? String(row[pIdx.deadline] || '') : '',
          instructor: pIdx.instructor !== undefined ? String(row[pIdx.instructor] || '') : '',
          members: pIdx.members !== undefined ? String(row[pIdx.members] || '') : '',
          status: pIdx.status !== undefined ? String(row[pIdx.status] || 'ACTIVE') : 'ACTIVE'
        };
        break;
      }
    }

    if (!projectFound) {
      return { success: false, message: 'Không tìm thấy đồ án với mã: ' + cleanPid };
    }

    // Nạp toàn bộ Tasks, Notes, Roadmaps thuộc đồ án
    const tasks = getTasksByProjectInternal(ss, cleanPid);
    const notes = getNotesByProjectInternal(ss, cleanPid);
    const roadmaps = getRoadmapsByProjectInternal(ss, cleanPid);

    // Nạp toàn bộ danh sách đồ án cho switcher
    const allProjectsRes = getPublicProjectsList();
    const allProjects = (allProjectsRes && allProjectsRes.success && allProjectsRes.projects.length > 0)
      ? allProjectsRes.projects
      : [projectFound];

    return {
      success: true,
      project: projectFound,
      projects: allProjects,
      tasks: tasks,
      notes: notes,
      roadmaps: roadmaps
    };
  } catch (err) {
    return { success: false, message: 'Lỗi truy cập đồ án: ' + err.message };
  }
}

function saveProject(authContextJson, projectDataJson) {
  try {
    const p = safeJsonParse(projectDataJson, null);
    if (!p || !p.projectName) return { success: false, message: 'Tên đồ án không được để trống.' };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureProjectsSheetExists(ss);
    const sheet = ss.getSheetByName(SHEET_PROJECTS);
    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesProjects(data[0]);

    const targetId = p.projectId ? String(p.projectId).trim() : 'PRJ-' + (100 + data.length);
    const pin = p.pinCode ? String(p.pinCode).trim() : '1234';

    let foundRow = -1;
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx.id] || '').trim() === targetId) {
        foundRow = r + 1;
        break;
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, idx.name + 1).setValue(p.projectName);
      sheet.getRange(foundRow, idx.pin + 1).setValue(pin);
      sheet.getRange(foundRow, idx.description + 1).setValue(p.description || '');
      sheet.getRange(foundRow, idx.subjectId + 1).setValue(p.subjectId || '');
      if (idx.deadline !== undefined) sheet.getRange(foundRow, idx.deadline + 1).setValue(p.deadline || '');
      if (idx.instructor !== undefined) sheet.getRange(foundRow, idx.instructor + 1).setValue(p.instructor || '');
      if (idx.members !== undefined) sheet.getRange(foundRow, idx.members + 1).setValue(p.members || '');
      if (idx.status !== undefined) sheet.getRange(foundRow, idx.status + 1).setValue(p.status || 'ACTIVE');
    } else {
      const newRow = [];
      newRow[idx.id] = targetId;
      newRow[idx.subjectId] = p.subjectId || 'SUB-101';
      newRow[idx.name] = p.projectName;
      newRow[idx.pin] = pin;
      newRow[idx.description] = p.description || '';
      newRow[idx.createdAt] = new Date().toISOString();
      if (idx.deadline !== undefined) newRow[idx.deadline] = p.deadline || '';
      if (idx.instructor !== undefined) newRow[idx.instructor] = p.instructor || '';
      if (idx.members !== undefined) newRow[idx.members] = p.members || '';
      if (idx.status !== undefined) newRow[idx.status] = p.status || 'ACTIVE';
      sheet.appendRow(newRow);
    }

    return { 
      success: true, 
      projectId: targetId, 
      project: {
        projectId: targetId,
        projectName: p.projectName,
        pinCode: pin,
        description: p.description || '',
        subjectId: p.subjectId || 'SUB-101',
        deadline: p.deadline || '',
        instructor: p.instructor || '',
        members: p.members || '',
        status: p.status || 'ACTIVE'
      },
      message: 'Lưu đồ án thành công!' 
    };
  } catch (err) {
    return { success: false, message: 'Lỗi lưu đồ án: ' + err.message };
  }
}

function deleteProject(authContextJson, projectId) {
  try {
    const cleanPid = String(projectId || '').trim();
    if (!cleanPid) return { success: false, message: 'Mã đồ án không hợp lệ.' };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pSheet = ss.getSheetByName(SHEET_PROJECTS);
    if (!pSheet) return { success: false, message: 'Sheet Projects không tồn tại.' };

    const data = pSheet.getDataRange().getValues();
    const idx = getColumnIndicesProjects(data[0]);

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx.id] || '').trim() === cleanPid) {
        pSheet.deleteRow(r + 1);
        break;
      }
    }

    // Xóa liên hoàn tasks, notes, roadmaps thuộc đồ án
    deleteCascadeByProject(ss, SHEET_TASKS, cleanPid);
    deleteCascadeByProject(ss, SHEET_NOTES, cleanPid);
    deleteCascadeByProject(ss, SHEET_ROADMAPS, cleanPid);

    return { success: true, message: 'Đã xóa đồ án và toàn bộ dữ liệu liên quan.' };
  } catch (err) {
    return { success: false, message: 'Lỗi xóa đồ án: ' + err.message };
  }
}

function deleteCascadeByProject(ss, sheetName, projectId) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  // Cột project_id ở vị trí 1 (cột B) trong cả Tasks, Notes, Roadmaps
  for (let r = data.length - 1; r >= 1; r--) {
    if (String(data[r][1] || '').trim() === projectId) {
      sheet.deleteRow(r + 1);
    }
  }
}

// ==============================================================================
// 5. QUẢN LÝ SHEET TASKS (13 Cột, 4 Trạng Thái, Đánh Giá Tự Động)
// ==============================================================================

function getColumnIndicesTasks(headers) {
  const indices = {
    taskId: 0, projectId: 1, title: 2, priority: 3, status: 4, dueDate: 5,
    assignee: 6, checklists: 7, frequency: 8, completedAt: 9, evaluation: 10,
    categoryField: 11, reporter: 12
  };
  headers.forEach((h, idx) => {
    const clean = String(h || '').toLowerCase().trim().replace(/[_-]/g, '');
    if (clean === 'taskid' || clean === 'id') indices.taskId = idx;
    else if (clean === 'projectid') indices.projectId = idx;
    else if (clean === 'title' || clean === 'tieude') indices.title = idx;
    else if (clean === 'priority' || clean === 'mucdo') indices.priority = idx;
    else if (clean === 'status' || clean === 'trangthai') indices.status = idx;
    else if (clean === 'duedate' || clean === 'hanchot') indices.dueDate = idx;
    else if (clean === 'assignee' || clean === 'phutrach') indices.assignee = idx;
    else if (clean === 'checklists' || clean === 'checklist') indices.checklists = idx;
    else if (clean === 'frequency' || clean === 'tansuat') indices.frequency = idx;
    else if (clean === 'completedat' || clean === 'ngayhoanthanh') indices.completedAt = idx;
    else if (clean === 'evaluation' || clean === 'danhgia') indices.evaluation = idx;
    else if (clean === 'categoryfield' || clean === 'linhvuc' || clean === 'monhoc') indices.categoryField = idx;
    else if (clean === 'reporter' || clean === 'nguoigiao') indices.reporter = idx;
  });
  return indices;
}

function ensureTasksSheetExists(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_TASKS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TASKS);
    const headers = [
      'task_id', 'project_id', 'title', 'priority', 'status', 'due_date',
      'assignee', 'checklists', 'frequency', 'completed_at', 'evaluation',
      'category_field', 'reporter'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');

    const sampleTasks = [
      ['TASK-1001', 'PRJ-101', 'Thiết kế giao diện Kanban 4 cột', 'HIGH', 'DONE', '2026-09-10', 'Nguyễn Văn A', '[{"text":"Vẽ phác thảo UI","completed":true},{"text":"Tối ưu DragDrop","completed":true}]', 'Một lần', '2026-09-08 10:30', 'Đúng hạn', 'Frontend', 'Trưởng nhóm'],
      ['TASK-1002', 'PRJ-101', 'Tích hợp Sơ đồ Gantt Timeline 21 ngày', 'HIGH', 'IN_PROGRESS', '2026-09-18', 'Trần Thị B', '[{"text":"Cửa sổ 21 ngày","completed":true},{"text":"Vạch Hôm nay","completed":false}]', 'Hàng tuần', '', '', 'Frontend', 'Trưởng nhóm'],
      ['TASK-1003', 'PRJ-101', 'Bộ phân tích lộ trình Roadmap DFA', 'MEDIUM', 'REVIEW', '2026-09-22', 'Lê Văn C', '[{"text":"Regex DFA Parser","completed":true}]', 'Một lần', '', '', 'Backend', 'Trưởng nhóm'],
      ['TASK-1004', 'PRJ-101', 'Tối ưu hóa truy vấn Google Sheets', 'LOW', 'TODO', '2026-09-30', 'Phạm Minh D', '[]', 'Hàng tháng', '', '', 'Database', 'Trưởng nhóm']
    ];
    sampleTasks.forEach(row => sheet.appendRow(row));
  }
}

function getTasksByProjectInternal(ss, projectId) {
  const sheet = ss.getSheetByName(SHEET_TASKS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const idx = getColumnIndicesTasks(data[0]);
  const tasks = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowPid = String(row[idx.projectId] || '').trim();
    if (rowPid === projectId) {
      tasks.push({
        taskId: String(row[idx.taskId] || ''),
        projectId: rowPid,
        title: String(row[idx.title] || ''),
        priority: String(row[idx.priority] || 'MEDIUM').toUpperCase(),
        status: String(row[idx.status] || 'TODO').toUpperCase(),
        dueDate: formatDateString(row[idx.dueDate]),
        assignee: String(row[idx.assignee] || ''),
        checklists: safeJsonParse(row[idx.checklists], []),
        frequency: String(row[idx.frequency] || 'Một lần'),
        completedAt: formatDateTimeString(row[idx.completedAt]),
        evaluation: String(row[idx.evaluation] || ''),
        categoryField: String(row[idx.categoryField] || 'Chung'),
        reporter: String(row[idx.reporter] || '')
      });
    }
  }
  return tasks;
}

/**
 * Cập nhật trạng thái nhanh (Dùng cho Kéo thả Kanban Optimistic UI)
 * Tự động tính completed_at và đánh giá Đúng hạn / Trễ hạn
 */
function updateTaskStatus(projectIdOrAuth, taskId, newStatus) {
  try {
    let cleanPid = '';
    let cleanTid = String(taskId || '').trim();
    let cleanStatus = String(newStatus || '').trim().toUpperCase();

    if (typeof projectIdOrAuth === 'object' && projectIdOrAuth !== null) {
      cleanPid = String(projectIdOrAuth.projectId || '').trim();
    } else if (typeof projectIdOrAuth === 'string') {
      const trimmed = projectIdOrAuth.trim();
      if (trimmed.startsWith('{')) {
        const parsed = safeJsonParse(trimmed, {});
        cleanPid = String(parsed.projectId || '').trim();
      } else {
        cleanPid = trimmed;
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TASKS);
    if (!sheet) return { success: false, message: 'Sheet Tasks không tồn tại.' };

    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesTasks(data[0]);

    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const rowTid = String(row[idx.taskId] || '').trim();
      const rowPid = String(row[idx.projectId] || '').trim();
      if (rowTid === cleanTid && (!cleanPid || rowPid === cleanPid)) {
        const rowNum = r + 1;
        sheet.getRange(rowNum, idx.status + 1).setValue(cleanStatus);

        let completedAtStr = '';
        let evalStr = '';

        if (cleanStatus === 'DONE') {
          const now = new Date();
          completedAtStr = formatDateTimeString(now);
          sheet.getRange(rowNum, idx.completedAt + 1).setValue(completedAtStr);

          const rawDue = row[idx.dueDate];
          const dueStr = formatDateString(rawDue);
          if (!dueStr) {
            evalStr = 'Đúng hạn';
          } else {
            const todayStr = formatDateString(now);
            evalStr = (todayStr <= dueStr) ? 'Đúng hạn' : 'Trễ hạn';
          }
          sheet.getRange(rowNum, idx.evaluation + 1).setValue(evalStr);
        } else {
          // Nếu chuyển ngược lại trạng thái chưa hoàn thành
          sheet.getRange(rowNum, idx.completedAt + 1).setValue('');
          sheet.getRange(rowNum, idx.evaluation + 1).setValue('');
        }

        return {
          success: true,
          taskId: cleanTid,
          status: cleanStatus,
          completedAt: completedAtStr,
          evaluation: evalStr
        };
      }
    }
    return { success: false, message: 'Không tìm thấy công việc ' + cleanTid };
  } catch (err) {
    return { success: false, message: 'Lỗi cập nhật trạng thái: ' + err.message };
  }
}

function updateTaskChecklist(authContextJson, taskId, checklistsJson) {
  try {
    const cleanTid = String(taskId || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TASKS);
    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesTasks(data[0]);

    const chksStr = typeof checklistsJson === 'string' ? checklistsJson : JSON.stringify(checklistsJson);

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx.taskId] || '').trim() === cleanTid) {
        sheet.getRange(r + 1, idx.checklists + 1).setValue(chksStr);
        return { success: true, taskId: cleanTid, checklists: safeJsonParse(chksStr, []) };
      }
    }
    return { success: false, message: 'Không tìm thấy công việc ' + cleanTid };
  } catch (err) {
    return { success: false, message: 'Lỗi cập nhật checklist: ' + err.message };
  }
}

function saveTask(authContextJson, taskDataJson) {
  try {
    const t = safeJsonParse(taskDataJson, null);
    if (!t || !t.title) return { success: false, message: 'Tiêu đề công việc không được để trống.' };

    const cleanPid = String(t.projectId || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TASKS);
    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesTasks(data[0]);

    const targetId = t.taskId ? String(t.taskId).trim() : 'TASK-' + (1000 + data.length);
    const cleanStatus = String(t.status || 'TODO').toUpperCase();

    let completedAt = t.completedAt || '';
    let evaluation = t.evaluation || '';

    if (cleanStatus === 'DONE' && !completedAt) {
      completedAt = formatDateTimeString(new Date());
      const dueStr = formatDateString(t.dueDate);
      const todayStr = formatDateString(new Date());
      evaluation = (!dueStr || todayStr <= dueStr) ? 'Đúng hạn' : 'Trễ hạn';
    }

    const chksStr = typeof t.checklists === 'string' ? t.checklists : JSON.stringify(t.checklists || []);

    let foundRow = -1;
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx.taskId] || '').trim() === targetId) {
        foundRow = r + 1;
        break;
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, idx.title + 1).setValue(t.title);
      sheet.getRange(foundRow, idx.priority + 1).setValue(t.priority || 'MEDIUM');
      sheet.getRange(foundRow, idx.status + 1).setValue(cleanStatus);
      sheet.getRange(foundRow, idx.dueDate + 1).setValue(formatDateString(t.dueDate));
      sheet.getRange(foundRow, idx.assignee + 1).setValue(t.assignee || '');
      sheet.getRange(foundRow, idx.checklists + 1).setValue(chksStr);
      sheet.getRange(foundRow, idx.frequency + 1).setValue(t.frequency || 'Một lần');
      sheet.getRange(foundRow, idx.completedAt + 1).setValue(completedAt);
      sheet.getRange(foundRow, idx.evaluation + 1).setValue(evaluation);
      sheet.getRange(foundRow, idx.categoryField + 1).setValue(t.categoryField || 'Chung');
      sheet.getRange(foundRow, idx.reporter + 1).setValue(t.reporter || '');
    } else {
      const newRow = [];
      newRow[idx.taskId] = targetId;
      newRow[idx.projectId] = cleanPid;
      newRow[idx.title] = t.title;
      newRow[idx.priority] = t.priority || 'MEDIUM';
      newRow[idx.status] = cleanStatus;
      newRow[idx.dueDate] = formatDateString(t.dueDate);
      newRow[idx.assignee] = t.assignee || '';
      newRow[idx.checklists] = chksStr;
      newRow[idx.frequency] = t.frequency || 'Một lần';
      newRow[idx.completedAt] = completedAt;
      newRow[idx.evaluation] = evaluation;
      newRow[idx.categoryField] = t.categoryField || 'Chung';
      newRow[idx.reporter] = t.reporter || '';
      sheet.appendRow(newRow);
    }

    return {
      success: true,
      taskId: targetId,
      task: {
        taskId: targetId,
        projectId: cleanPid,
        title: t.title,
        priority: t.priority || 'MEDIUM',
        status: cleanStatus,
        dueDate: formatDateString(t.dueDate),
        assignee: t.assignee || '',
        checklists: safeJsonParse(chksStr, []),
        frequency: t.frequency || 'Một lần',
        completedAt: completedAt,
        evaluation: evaluation,
        categoryField: t.categoryField || 'Chung',
        reporter: t.reporter || ''
      }
    };
  } catch (err) {
    return { success: false, message: 'Lỗi lưu công việc: ' + err.message };
  }
}

function deleteTask(authContextJson, taskId, projectId) {
  try {
    const cleanTid = String(taskId || '').trim();
    const cleanPid = String(projectId || '').trim();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TASKS);
    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesTasks(data[0]);

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx.taskId] || '').trim() === cleanTid) {
        sheet.deleteRow(r + 1);
        return { success: true, taskId: cleanTid, message: 'Đã xóa công việc.' };
      }
    }
    return { success: false, message: 'Không tìm thấy công việc ' + cleanTid };
  } catch (err) {
    return { success: false, message: 'Lỗi xóa công việc: ' + err.message };
  }
}

// ==============================================================================
// 6. QUẢN LÝ SHEET NOTES (Kho Ghi Chú & Đề Cương)
// ==============================================================================

function getColumnIndicesNotes(headers) {
  const indices = {
    noteId: 0, projectId: 1, authorEmail: 2, title: 3, noteType: 4,
    tags: 5, contentMd: 6, isPinned: 7, createdAt: 8
  };
  headers.forEach((h, idx) => {
    const clean = String(h || '').toLowerCase().trim().replace(/[_-]/g, '');
    if (clean === 'noteid' || clean === 'id') indices.noteId = idx;
    else if (clean === 'projectid') indices.projectId = idx;
    else if (clean === 'authoremail' || clean === 'author' || clean === 'tacgia') indices.authorEmail = idx;
    else if (clean === 'title' || clean === 'tieude') indices.title = idx;
    else if (clean === 'notetype' || clean === 'type' || clean === 'loai') indices.noteType = idx;
    else if (clean === 'tags' || clean === 'the') indices.tags = idx;
    else if (clean === 'contentmd' || clean === 'content' || clean === 'noidung') indices.contentMd = idx;
    else if (clean === 'ispinned' || clean === 'pinned' || clean === 'ghim') indices.isPinned = idx;
    else if (clean === 'createdat' || clean === 'ngaytao') indices.createdAt = idx;
  });
  return indices;
}

function ensureNotesSheetExists(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NOTES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NOTES);
    const headers = ['note_id', 'project_id', 'author_email', 'title', 'note_type', 'tags', 'content_md', 'is_pinned', 'created_at'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');

    const sampleNotes = [
      ['NOTE-101', 'PRJ-101', 'admin@gmail.com', 'Đề cương chi tiết môn Kiến trúc máy tính', 'LECTURE', '#chuong1 #pipeline', '## 1. Nguyên lý cơ bản\n- Tập lệnh RISC-V 32-bit\n- Kỹ thuật phân đường ống Pipeline 5 tầng:\n  - IF: Nạp lệnh\n  - ID: Giải mã lệnh\n  - EX: Thực thi\n  - MEM: Truy xuất bộ nhớ\n  - WB: Ghi kết quả\n\n### Checklist ôn thi:\n- [x] Đọc chương 1 slide bài giảng\n- [ ] Làm bài tập tính chu kỳ xung clock', 'TRUE', new Date().toISOString()],
      ['NOTE-102', 'PRJ-101', 'admin@gmail.com', 'Ý tưởng tối ưu hóa kiến trúc SNOTE', 'IDEA', '#kientruc #snote', '### Kỹ thuật áp dụng:\n1. 1-URL Single Web App Portal\n2. Pure HTML Static Output (Zero-Scriptlet)\n3. Optimistic UI cho Kanban Drag & Drop\n4. Cửa sổ trượt 21 ngày cho Gantt Timeline', 'FALSE', new Date().toISOString()]
    ];
    sampleNotes.forEach(row => sheet.appendRow(row));
  }
}

function getNotesByProjectInternal(ss, projectId) {
  const sheet = ss.getSheetByName(SHEET_NOTES);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const idx = getColumnIndicesNotes(data[0]);
  const notes = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowPid = String(row[idx.projectId] || '').trim();
    if (rowPid === projectId) {
      notes.push({
        noteId: String(row[idx.noteId] || ''),
        projectId: rowPid,
        authorEmail: String(row[idx.authorEmail] || ''),
        title: String(row[idx.title] || ''),
        noteType: String(row[idx.noteType] || 'LECTURE'),
        tags: String(row[idx.tags] || ''),
        contentMd: String(row[idx.contentMd] || ''),
        isPinned: String(row[idx.isPinned] || '').toUpperCase() === 'TRUE',
        createdAt: formatDateString(row[idx.createdAt])
      });
    }
  }
  return notes;
}

function saveNote(authContextJson, noteDataJson) {
  try {
    const n = safeJsonParse(noteDataJson, null);
    if (!n || !n.title) return { success: false, message: 'Tiêu đề ghi chú không được để trống.' };

    const cleanPid = String(n.projectId || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NOTES);
    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesNotes(data[0]);

    const targetId = n.noteId ? String(n.noteId).trim() : 'NOTE-' + (100 + data.length);
    const isPinnedStr = (n.isPinned === true || String(n.isPinned).toUpperCase() === 'TRUE') ? 'TRUE' : 'FALSE';

    let foundRow = -1;
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx.noteId] || '').trim() === targetId) {
        foundRow = r + 1;
        break;
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, idx.title + 1).setValue(n.title);
      sheet.getRange(foundRow, idx.noteType + 1).setValue(n.noteType || 'LECTURE');
      sheet.getRange(foundRow, idx.tags + 1).setValue(n.tags || '');
      sheet.getRange(foundRow, idx.contentMd + 1).setValue(n.contentMd || '');
      sheet.getRange(foundRow, idx.isPinned + 1).setValue(isPinnedStr);
    } else {
      const newRow = [];
      newRow[idx.noteId] = targetId;
      newRow[idx.projectId] = cleanPid;
      newRow[idx.authorEmail] = n.authorEmail || 'member';
      newRow[idx.title] = n.title;
      newRow[idx.noteType] = n.noteType || 'LECTURE';
      newRow[idx.tags] = n.tags || '';
      newRow[idx.contentMd] = n.contentMd || '';
      newRow[idx.isPinned] = isPinnedStr;
      newRow[idx.createdAt] = new Date().toISOString();
      sheet.appendRow(newRow);
    }

    return {
      success: true,
      noteId: targetId,
      note: {
        noteId: targetId,
        projectId: cleanPid,
        title: n.title,
        noteType: n.noteType || 'LECTURE',
        tags: n.tags || '',
        contentMd: n.contentMd || '',
        isPinned: isPinnedStr === 'TRUE',
        createdAt: formatDateString(new Date())
      }
    };
  } catch (err) {
    return { success: false, message: 'Lỗi lưu ghi chú: ' + err.message };
  }
}

function togglePinNote(authContextJson, noteId) {
  try {
    const cleanNid = String(noteId || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NOTES);
    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesNotes(data[0]);

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx.noteId] || '').trim() === cleanNid) {
        const current = String(data[r][idx.isPinned] || '').toUpperCase() === 'TRUE';
        const updated = !current;
        sheet.getRange(r + 1, idx.isPinned + 1).setValue(updated ? 'TRUE' : 'FALSE');
        return { success: true, noteId: cleanNid, isPinned: updated };
      }
    }
    return { success: false, message: 'Không tìm thấy ghi chú ' + cleanNid };
  } catch (err) {
    return { success: false, message: 'Lỗi ghim ghi chú: ' + err.message };
  }
}

function deleteNote(authContextJson, noteId) {
  try {
    const cleanNid = String(noteId || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NOTES);
    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesNotes(data[0]);

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx.noteId] || '').trim() === cleanNid) {
        sheet.deleteRow(r + 1);
        return { success: true, noteId: cleanNid };
      }
    }
    return { success: false, message: 'Không tìm thấy ghi chú ' + cleanNid };
  } catch (err) {
    return { success: false, message: 'Lỗi xóa ghi chú: ' + err.message };
  }
}

/**
 * 1-Click chuyển đổi ghi chú thành công việc trên Kanban / Gantt
 */
function convertNoteToTask(authContextJson, noteId) {
  try {
    const cleanNid = String(noteId || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const nSheet = ss.getSheetByName(SHEET_NOTES);
    const nData = nSheet.getDataRange().getValues();
    const nIdx = getColumnIndicesNotes(nData[0]);

    let foundNote = null;
    for (let r = 1; r < nData.length; r++) {
      if (String(nData[r][nIdx.noteId] || '').trim() === cleanNid) {
        foundNote = {
          projectId: String(nData[r][nIdx.projectId] || ''),
          title: String(nData[r][nIdx.title] || ''),
          contentMd: String(nData[r][nIdx.contentMd] || '')
        };
        break;
      }
    }

    if (!foundNote) return { success: false, message: 'Không tìm thấy ghi chú.' };

    // Trích xuất checklist từ nội dung Markdown (- [ ] hoặc - [x])
    const checklists = [];
    const lines = foundNote.contentMd.split('\n');
    lines.forEach(line => {
      const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (match) {
        checklists.push({
          text: match[2].trim(),
          completed: match[1].toLowerCase() === 'x'
        });
      }
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Hạn mặc định 7 ngày sau

    const newTaskData = {
      projectId: foundNote.projectId,
      title: '[Ghi Chú] ' + foundNote.title,
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: formatDateString(dueDate),
      categoryField: 'Notes Sync',
      checklists: checklists
    };

    return saveTask(authContextJson, JSON.stringify(newTaskData));
  } catch (err) {
    return { success: false, message: 'Lỗi chuyển note thành task: ' + err.message };
  }
}

// ==============================================================================
// 7. QUẢN LÝ SHEET ROADMAPS & BỘ PHÂN TÍCH CÚ PHÁP DFA
// ==============================================================================

function getColumnIndicesRoadmaps(headers) {
  const indices = {
    roadmapId: 0, projectId: 1, title: 2, rawText: 3, milestones: 4, createdAt: 5
  };
  headers.forEach((h, idx) => {
    const clean = String(h || '').toLowerCase().trim().replace(/[_-]/g, '');
    if (clean === 'roadmapid' || clean === 'id') indices.roadmapId = idx;
    else if (clean === 'projectid') indices.projectId = idx;
    else if (clean === 'title' || clean === 'tieude') indices.title = idx;
    else if (clean === 'rawtext' || clean === 'text' || clean === 'vanban') indices.rawText = idx;
    else if (clean === 'milestones' || clean === 'chang' || clean === 'giaidoan') indices.milestones = idx;
    else if (clean === 'createdat' || clean === 'ngaytao') indices.createdAt = idx;
  });
  return indices;
}

function ensureRoadmapsSheetExists(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ROADMAPS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ROADMAPS);
    const headers = ['roadmap_id', 'project_id', 'title', 'raw_text', 'milestones', 'created_at'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');

    const sampleRaw = `=== GIAI ĐOẠN 1: Khởi Động & Đặc Tả ===\n- [Khảo sát yêu cầu SRS] | Độ ưu tiên: CAO | Thời gian: 7 ngày\n  + Phỏng vấn giảng viên\n  + Lập tài liệu đặc tả\n- [Thiết kế kiến trúc hệ thống] | Độ ưu tiên: CAO | Thời gian: 5 ngày\n  + Thiết kế CSDL Google Sheets\n  + Xác định 25+ hàm API\n=== GIAI ĐOẠN 2: Triển Khai Backend & Frontend ===\n- [Xây dựng Code.gs] | Độ ưu tiên: CAO | Thời gian: 4 ngày\n- [Thiết kế Index.html SPA] | Độ ưu tiên: TRUNG BÌNH | Thời gian: 6 ngày`;

    const sampleMilestones = [
      {
        phaseName: 'GIAI ĐOẠN 1: Khởi Động & Đặc Tả',
        goals: [
          { title: 'Khảo sát yêu cầu SRS', priority: 'HIGH', days: 7, checklists: ['Phỏng vấn giảng viên', 'Lập tài liệu đặc tả'] },
          { title: 'Thiết kế kiến trúc hệ thống', priority: 'HIGH', days: 5, checklists: ['Thiết kế CSDL Google Sheets', 'Xác định 25+ hàm API'] }
        ]
      },
      {
        phaseName: 'GIAI ĐOẠN 2: Triển Khai Backend & Frontend',
        goals: [
          { title: 'Xây dựng Code.gs', priority: 'HIGH', days: 4, checklists: [] },
          { title: 'Thiết kế Index.html SPA', priority: 'MEDIUM', days: 6, checklists: [] }
        ]
      }
    ];

    sheet.appendRow(['RDM-101', 'PRJ-101', 'Lộ Trình Đồ Án Chuẩn 10 Tuần', sampleRaw, JSON.stringify(sampleMilestones), new Date().toISOString()]);
  }
}

function getRoadmapsByProjectInternal(ss, projectId) {
  const sheet = ss.getSheetByName(SHEET_ROADMAPS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const idx = getColumnIndicesRoadmaps(data[0]);
  const roadmaps = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowPid = String(row[idx.projectId] || '').trim();
    if (rowPid === projectId) {
      roadmaps.push({
        roadmapId: String(row[idx.roadmapId] || ''),
        projectId: rowPid,
        title: String(row[idx.title] || ''),
        rawText: String(row[idx.rawText] || ''),
        milestones: safeJsonParse(row[idx.milestones], []),
        createdAt: formatDateString(row[idx.createdAt])
      });
    }
  }
  return roadmaps;
}

function saveRoadmap(authContextJson, roadmapDataJson) {
  try {
    const r = safeJsonParse(roadmapDataJson, null);
    if (!r || !r.title) return { success: false, message: 'Tiêu đề lộ trình không được để trống.' };

    const cleanPid = String(r.projectId || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_ROADMAPS);
    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesRoadmaps(data[0]);

    const targetId = r.roadmapId ? String(r.roadmapId).trim() : 'RDM-' + (100 + data.length);
    const mlsStr = typeof r.milestones === 'string' ? r.milestones : JSON.stringify(r.milestones || []);

    let foundRow = -1;
    for (let row = 1; row < data.length; row++) {
      if (String(data[row][idx.roadmapId] || '').trim() === targetId) {
        foundRow = row + 1;
        break;
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, idx.title + 1).setValue(r.title);
      sheet.getRange(foundRow, idx.rawText + 1).setValue(r.rawText || '');
      sheet.getRange(foundRow, idx.milestones + 1).setValue(mlsStr);
    } else {
      const newRow = [];
      newRow[idx.roadmapId] = targetId;
      newRow[idx.projectId] = cleanPid;
      newRow[idx.title] = r.title;
      newRow[idx.rawText] = r.rawText || '';
      newRow[idx.milestones] = mlsStr;
      newRow[idx.createdAt] = new Date().toISOString();
      sheet.appendRow(newRow);
    }

    return {
      success: true,
      roadmapId: targetId,
      roadmap: {
        roadmapId: targetId,
        projectId: cleanPid,
        title: r.title,
        rawText: r.rawText || '',
        milestones: safeJsonParse(mlsStr, []),
        createdAt: formatDateString(new Date())
      }
    };
  } catch (err) {
    return { success: false, message: 'Lỗi lưu lộ trình: ' + err.message };
  }
}

function deleteRoadmap(authContextJson, roadmapId) {
  try {
    const cleanRid = String(roadmapId || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_ROADMAPS);
    const data = sheet.getDataRange().getValues();
    const idx = getColumnIndicesRoadmaps(data[0]);

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx.roadmapId] || '').trim() === cleanRid) {
        sheet.deleteRow(r + 1);
        return { success: true, roadmapId: cleanRid };
      }
    }
    return { success: false, message: 'Không tìm thấy lộ trình ' + cleanRid };
  } catch (err) {
    return { success: false, message: 'Lỗi xóa lộ trình: ' + err.message };
  }
}

/**
 * Chuyển đổi hàng loạt toàn bộ mục tiêu của lộ trình thành các công việc trên Kanban/Gantt
 */
function convertBatchRoadmapToTasks(authContextJson, projectId, roadmapId) {
  try {
    const cleanPid = String(projectId || '').trim();
    const cleanRid = String(roadmapId || '').trim();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rSheet = ss.getSheetByName(SHEET_ROADMAPS);
    const rData = rSheet.getDataRange().getValues();
    const rIdx = getColumnIndicesRoadmaps(rData[0]);

    let foundRoadmap = null;
    for (let r = 1; r < rData.length; r++) {
      if (String(rData[r][rIdx.roadmapId] || '').trim() === cleanRid) {
        foundRoadmap = {
          title: String(rData[r][rIdx.title] || ''),
          milestones: safeJsonParse(rData[r][rIdx.milestones], [])
        };
        break;
      }
    }

    if (!foundRoadmap) return { success: false, message: 'Không tìm thấy lộ trình.' };

    const tSheet = ss.getSheetByName(SHEET_TASKS);
    const tData = tSheet.getDataRange().getValues();
    const tIdx = getColumnIndicesTasks(tData[0]);

    let currentTaskCount = tData.length;
    let addedCount = 0;
    let baseDate = new Date();

    foundRoadmap.milestones.forEach(m => {
      const phaseName = m.phaseName || 'Giai đoạn';
      (m.goals || []).forEach(g => {
        currentTaskCount++;
        const targetId = 'TASK-' + (1000 + currentTaskCount);
        const days = parseInt(g.days || '5', 10);

        const targetDue = new Date(baseDate);
        targetDue.setDate(targetDue.getDate() + days);

        const chks = (g.checklists || []).map(txt => ({
          text: String(txt).trim(),
          completed: false
        }));

        const newRow = [];
        newRow[tIdx.taskId] = targetId;
        newRow[tIdx.projectId] = cleanPid;
        newRow[tIdx.title] = g.title || 'Mục tiêu không tên';
        newRow[tIdx.priority] = (g.priority || 'MEDIUM').toUpperCase();
        newRow[tIdx.status] = 'TODO';
        newRow[tIdx.dueDate] = formatDateString(targetDue);
        newRow[tIdx.assignee] = '';
        newRow[tIdx.checklists] = JSON.stringify(chks);
        newRow[tIdx.frequency] = 'Một lần';
        newRow[tIdx.completedAt] = '';
        newRow[tIdx.evaluation] = '';
        newRow[tIdx.categoryField] = phaseName;
        newRow[tIdx.reporter] = 'Lộ Trình Import';

        tSheet.appendRow(newRow);
        addedCount++;

        // Dời mốc ngày cho mục tiêu tiếp theo
        baseDate = new Date(targetDue);
      });
    });

    const refreshedTasks = getTasksByProjectInternal(ss, cleanPid);
    return {
      success: true,
      message: `Đã chuyển đổi thành công ${addedCount} công việc vào đồ án!`,
      tasks: refreshedTasks
    };
  } catch (err) {
    return { success: false, message: 'Lỗi chuyển đổi hàng loạt: ' + err.message };
  }
}

// ==============================================================================
// 8. BẢNG ĐIỀU KHIỂN QUẢN TRỊ (ADMIN SUITE) & BACKUP / RESTORE
// ==============================================================================

function getAdminDashboardData(sessionToken) {
  try {
    const verify = JSON.parse(verifySessionToken(sessionToken));
    if (!verify.valid) return { success: false, message: 'Phiên quản trị không hợp lệ hoặc đã hết hạn.' };

    ensureAllSheetsInitialized();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Projects
    const pSheet = ss.getSheetByName(SHEET_PROJECTS);
    const pData = pSheet ? pSheet.getDataRange().getValues() : [];
    const pIdx = pData.length > 0 ? getColumnIndicesProjects(pData[0]) : {};
    const projects = [];
    for (let r = 1; r < pData.length; r++) {
      projects.push({
        projectId: String(pData[r][pIdx.id] || ''),
        projectName: String(pData[r][pIdx.name] || ''),
        pinCode: String(pData[r][pIdx.pin] || ''),
        description: String(pData[r][pIdx.description] || ''),
        subjectId: String(pData[r][pIdx.subjectId] || ''),
        createdAt: formatDateString(pData[r][pIdx.createdAt])
      });
    }

    // 2. Semesters & Subjects
    const sSheet = ss.getSheetByName(SHEET_SEMESTERS);
    const sData = sSheet ? sSheet.getDataRange().getValues() : [];
    const sIdx = sData.length > 0 ? getColumnIndicesSemesters(sData[0]) : {};
    const semesters = [];
    for (let r = 1; r < sData.length; r++) {
      semesters.push({
        semesterId: String(sData[r][sIdx.id] || ''),
        semesterName: String(sData[r][sIdx.name] || ''),
        startDate: formatDateString(sData[r][sIdx.startDate]),
        endDate: formatDateString(sData[r][sIdx.endDate]),
        isActive: String(sData[r][sIdx.isActive] || '').toUpperCase() === 'TRUE'
      });
    }

    const subSheet = ss.getSheetByName(SHEET_SUBJECTS);
    const subData = subSheet ? subSheet.getDataRange().getValues() : [];
    const subIdx = subData.length > 0 ? getColumnIndicesSubjects(subData[0]) : {};
    const subjects = [];
    for (let r = 1; r < subData.length; r++) {
      subjects.push({
        subjectId: String(subData[r][subIdx.id] || ''),
        semesterId: String(subData[r][subIdx.semesterId] || ''),
        subjectName: String(subData[r][subIdx.name] || ''),
        subjectCode: String(subData[r][subIdx.code] || ''),
        credits: parseInt(subData[r][subIdx.credits] || '3', 10),
        color: String(subData[r][subIdx.color] || '#3b82f6')
      });
    }

    // 3. All Tasks
    const tSheet = ss.getSheetByName(SHEET_TASKS);
    const tData = tSheet ? tSheet.getDataRange().getValues() : [];
    const tIdx = tData.length > 0 ? getColumnIndicesTasks(tData[0]) : {};
    const allTasks = [];
    for (let r = 1; r < tData.length; r++) {
      allTasks.push({
        taskId: String(tData[r][tIdx.taskId] || ''),
        projectId: String(tData[r][tIdx.projectId] || ''),
        title: String(tData[r][tIdx.title] || ''),
        priority: String(tData[r][tIdx.priority] || 'MEDIUM').toUpperCase(),
        status: String(tData[r][tIdx.status] || 'TODO').toUpperCase(),
        dueDate: formatDateString(tData[r][tIdx.dueDate]),
        assignee: String(tData[r][tIdx.assignee] || ''),
        checklists: safeJsonParse(tData[r][tIdx.checklists], []),
        frequency: String(tData[r][tIdx.frequency] || 'Một lần'),
        completedAt: formatDateTimeString(tData[r][tIdx.completedAt]),
        evaluation: String(tData[r][tIdx.evaluation] || ''),
        categoryField: String(tData[r][tIdx.categoryField] || 'Chung'),
        reporter: String(tData[r][tIdx.reporter] || '')
      });
    }

    // 4. All Notes
    const nSheet = ss.getSheetByName(SHEET_NOTES);
    const nData = nSheet ? nSheet.getDataRange().getValues() : [];
    const nIdx = nData.length > 0 ? getColumnIndicesNotes(nData[0]) : {};
    const allNotes = [];
    for (let r = 1; r < nData.length; r++) {
      allNotes.push({
        noteId: String(nData[r][nIdx.noteId] || ''),
        projectId: String(nData[r][nIdx.projectId] || ''),
        authorEmail: String(nData[r][nIdx.authorEmail] || ''),
        title: String(nData[r][nIdx.title] || ''),
        noteType: String(nData[r][nIdx.noteType] || 'LECTURE'),
        tags: String(nData[r][nIdx.tags] || ''),
        contentMd: String(nData[r][nIdx.contentMd] || ''),
        isPinned: String(nData[r][nIdx.isPinned] || '').toUpperCase() === 'TRUE',
        createdAt: formatDateString(nData[r][nIdx.createdAt])
      });
    }

    // 5. All Roadmaps
    const rSheet = ss.getSheetByName(SHEET_ROADMAPS);
    const rData = rSheet ? rSheet.getDataRange().getValues() : [];
    const rIdx = rData.length > 0 ? getColumnIndicesRoadmaps(rData[0]) : {};
    const allRoadmaps = [];
    for (let r = 1; r < rData.length; r++) {
      allRoadmaps.push({
        roadmapId: String(rData[r][rIdx.roadmapId] || ''),
        projectId: String(rData[r][rIdx.projectId] || ''),
        title: String(rData[r][rIdx.title] || ''),
        rawText: String(rData[r][rIdx.rawText] || ''),
        milestones: safeJsonParse(rData[r][rIdx.milestones], []),
        createdAt: formatDateString(rData[r][rIdx.createdAt])
      });
    }

    return {
      success: true,
      adminEmail: verify.email,
      fullName: verify.fullName,
      projects: projects,
      semesters: semesters,
      subjects: subjects,
      tasks: allTasks,
      notes: allNotes,
      roadmaps: allRoadmaps
    };
  } catch (err) {
    return { success: false, message: 'Lỗi nạp dữ liệu quản trị: ' + err.message };
  }
}

/**
 * Xuất bản sao lưu toàn bộ 7 Sheet dạng JSON
 */
function exportFullBackupJson(sessionToken) {
  try {
    const data = getAdminDashboardData(sessionToken);
    if (!data.success) return data;
    return {
      success: true,
      backupTimestamp: new Date().toISOString(),
      system: 'SNOTE Web Script Edition',
      data: data
    };
  } catch (err) {
    return { success: false, message: 'Lỗi xuất backup: ' + err.message };
  }
}

/**
 * Xóa sạch toàn bộ dữ liệu mẫu (Clean Database), chỉ giữ lại Header
 */
function cleanSampleData(sessionToken) {
  try {
    const verify = JSON.parse(verifySessionToken(sessionToken));
    if (!verify.valid) return { success: false, message: 'Phiên quản trị không hợp lệ.' };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetsToClear = [SHEET_TASKS, SHEET_NOTES, SHEET_ROADMAPS];

    sheetsToClear.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet && sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
      }
    });

    return { success: true, message: 'Đã dọn sạch toàn bộ dữ liệu mẫu trong Tasks, Notes và Roadmaps!' };
  } catch (err) {
    return { success: false, message: 'Lỗi dọn dữ liệu mẫu: ' + err.message };
  }
}


// ==============================================================================
// 9. UNIFIED INITIAL DATA RPC & TRANSACTION BATCH SYNC ENGINE
// ==============================================================================

function ensureAuditLogsSheetExists(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_AUDIT_LOGS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_AUDIT_LOGS);
    sheet.appendRow(['log_id', 'timestamp', 'user_email', 'action_type', 'target_table', 'target_id', 'details']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  }
}

/**
 * Nạp toàn bộ dữ liệu ban đầu chỉ trong 1 round-trip duy nhất (Initial Cold Load 0ms wait)
 */
function fetchAllInitialData(authContextJson) {
  try {
    ensureAllSheetsInitialized();
    const auth = safeJsonParse(authContextJson, {});
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Projects
    const pSheet = ss.getSheetByName(SHEET_PROJECTS);
    const pData = pSheet ? pSheet.getDataRange().getValues() : [];
    const pIdx = pData.length > 0 ? getColumnIndicesProjects(pData[0]) : {};
    const projects = [];
    for (let r = 1; r < pData.length; r++) {
      projects.push({
        projectId: String(pData[r][pIdx.id] || ''),
        projectName: String(pData[r][pIdx.name] || ''),
        pinCode: String(pData[r][pIdx.pin] || ''),
        description: String(pData[r][pIdx.description] || ''),
        subjectId: String(pData[r][pIdx.subjectId] || ''),
        createdAt: formatDateString(pData[r][pIdx.createdAt])
      });
    }

    // 2. Semesters & Subjects
    const sSheet = ss.getSheetByName(SHEET_SEMESTERS);
    const sData = sSheet ? sSheet.getDataRange().getValues() : [];
    const sIdx = sData.length > 0 ? getColumnIndicesSemesters(sData[0]) : {};
    const semesters = [];
    for (let r = 1; r < sData.length; r++) {
      semesters.push({
        semesterId: String(sData[r][sIdx.id] || ''),
        semesterName: String(sData[r][sIdx.name] || ''),
        startDate: formatDateString(sData[r][sIdx.startDate]),
        endDate: formatDateString(sData[r][sIdx.endDate])
      });
    }

    const subSheet = ss.getSheetByName(SHEET_SUBJECTS);
    const subData = subSheet ? subSheet.getDataRange().getValues() : [];
    const subIdx = subData.length > 0 ? getColumnIndicesSubjects(subData[0]) : {};
    const subjects = [];
    for (let r = 1; r < subData.length; r++) {
      subjects.push({
        subjectId: String(subData[r][subIdx.id] || ''),
        subjectName: String(subData[r][subIdx.name] || ''),
        subjectCode: String(subData[r][subIdx.code] || ''),
        semesterId: String(subData[r][subIdx.semesterId] || '')
      });
    }

    // 3. Tasks
    const tSheet = ss.getSheetByName(SHEET_TASKS);
    const tData = tSheet ? tSheet.getDataRange().getValues() : [];
    const tIdx = tData.length > 0 ? getColumnIndicesTasks(tData[0]) : {};
    const tasks = [];
    for (let r = 1; r < tData.length; r++) {
      const pid = String(tData[r][tIdx.projectId] || '').trim();
      if (!auth.projectId || auth.role === 'ADMIN' || pid === auth.projectId) {
        tasks.push({
          taskId: String(tData[r][tIdx.taskId] || ''),
          projectId: pid,
          title: String(tData[r][tIdx.title] || ''),
          priority: String(tData[r][tIdx.priority] || 'MEDIUM'),
          status: String(tData[r][tIdx.status] || 'TODO'),
          dueDate: formatDateString(tData[r][tIdx.dueDate]),
          startDate: formatDateString(tData[r][tIdx.startDate]),
          completedAt: formatDateTimeString(tData[r][tIdx.completedAt]),
          evaluation: String(tData[r][tIdx.evaluation] || ''),
          category: String(tData[r][tIdx.category] || ''),
          assignee: String(tData[r][tIdx.assignee] || ''),
          description: String(tData[r][tIdx.description] || ''),
          checklists: safeJsonParse(tData[r][tIdx.checklists], [])
        });
      }
    }

    // 4. Notes
    const nSheet = ss.getSheetByName(SHEET_NOTES);
    const nData = nSheet ? nSheet.getDataRange().getValues() : [];
    const nIdx = nData.length > 0 ? getColumnIndicesNotes(nData[0]) : {};
    const notes = [];
    for (let r = 1; r < nData.length; r++) {
      const pid = String(nData[r][nIdx.projectId] || '').trim();
      if (!auth.projectId || auth.role === 'ADMIN' || pid === auth.projectId) {
        notes.push({
          noteId: String(nData[r][nIdx.noteId] || ''),
          projectId: pid,
          title: String(nData[r][nIdx.title] || ''),
          content: String(nData[r][nIdx.content] || ''),
          noteType: String(nData[r][nIdx.noteType] || 'LECTURE'),
          tags: safeJsonParse(nData[r][nIdx.tags], []),
          isPinned: String(nData[r][nIdx.isPinned] || '').toUpperCase() === 'TRUE',
          createdAt: formatDateTimeString(nData[r][nIdx.createdAt]),
          updatedAt: formatDateTimeString(nData[r][nIdx.updatedAt])
        });
      }
    }

    // 5. Roadmaps
    const rSheet = ss.getSheetByName(SHEET_ROADMAPS);
    const rData = rSheet ? rSheet.getDataRange().getValues() : [];
    const rIdx = rData.length > 0 ? getColumnIndicesRoadmaps(rData[0]) : {};
    const roadmaps = [];
    for (let r = 1; r < rData.length; r++) {
      const pid = String(rData[r][rIdx.projectId] || '').trim();
      if (!auth.projectId || auth.role === 'ADMIN' || pid === auth.projectId) {
        roadmaps.push({
          roadmapId: String(rData[r][rIdx.roadmapId] || ''),
          projectId: pid,
          title: String(rData[r][rIdx.title] || ''),
          description: String(rData[r][rIdx.description] || ''),
          rawText: String(rData[r][rIdx.rawText] || ''),
          milestones: safeJsonParse(rData[r][rIdx.milestones], []),
          updatedAt: formatDateTimeString(rData[r][rIdx.updatedAt])
        });
      }
    }

    return {
      success: true,
      data: {
        projects: projects,
        tasks: tasks,
        notes: notes,
        roadmaps: roadmaps,
        semesters: semesters,
        subjects: subjects,
        timestamp: new Date().toISOString()
      }
    };
  } catch (err) {
    return { success: false, message: 'Lỗi tải dữ liệu khởi tạo: ' + err.message };
  }
}

/**
 * Xử lý Giao dịch Đồng bộ Hàng loạt (Transaction Batch Sync)
 * Áp dụng ScriptLock để đảm bảo tính toàn vẹn ACID, chống Race Condition & Quota Limit
 */
function executeBatchSync(batchPayloadJson) {
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(15000);
  if (!hasLock) {
    return { success: false, message: 'Máy chủ đang bận xử lý giao dịch đồng thời, vui lòng thử lại sau vài giây.' };
  }

  try {
    ensureAllSheetsInitialized();
    const payload = typeof batchPayloadJson === 'string' ? safeJsonParse(batchPayloadJson, {}) : batchPayloadJson;
    const ops = payload.operations || [];
    const authContext = payload.authContext || {};
    const clientSessionId = payload.clientSessionId || 'anon';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const results = [];

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const table = String(op.table || '').toUpperCase();
      const action = String(op.action || '').toUpperCase();
      const data = op.data || {};

      try {
        if (table === 'TASKS') {
          if (action === 'SAVE') {
            const res = saveTask(JSON.stringify(authContext), JSON.stringify(data));
            results.push({ opId: i, success: res.success, message: res.message });
          } else if (action === 'STATUS') {
            const res = updateTaskStatus(JSON.stringify(authContext), op.taskId, op.status);
            results.push({ opId: i, success: res.success, message: res.message });
          } else if (action === 'CHECKLIST') {
            const res = updateTaskChecklist(JSON.stringify(authContext), op.taskId, JSON.stringify(op.checklists || []));
            results.push({ opId: i, success: res.success, message: res.message });
          } else if (action === 'DELETE') {
            const res = deleteTask(JSON.stringify(authContext), op.taskId);
            results.push({ opId: i, success: res.success, message: res.message });
          }
        } else if (table === 'NOTES') {
          if (action === 'SAVE') {
            const res = saveNote(JSON.stringify(authContext), JSON.stringify(data));
            results.push({ opId: i, success: res.success, message: res.message });
          } else if (action === 'PIN') {
            const res = togglePinNote(JSON.stringify(authContext), op.noteId);
            results.push({ opId: i, success: res.success, message: res.message });
          } else if (action === 'DELETE') {
            const res = deleteNote(JSON.stringify(authContext), op.noteId);
            results.push({ opId: i, success: res.success, message: res.message });
          }
        } else if (table === 'ROADMAPS') {
          if (action === 'SAVE') {
            const res = saveRoadmap(JSON.stringify(authContext), JSON.stringify(data));
            results.push({ opId: i, success: res.success, message: res.message });
          } else if (action === 'DELETE') {
            const res = deleteRoadmap(JSON.stringify(authContext), op.roadmapId);
            results.push({ opId: i, success: res.success, message: res.message });
          }
        } else if (table === 'PROJECTS') {
          if (action === 'SAVE') {
            const res = saveProject(authContext.token, JSON.stringify(data));
            results.push({ opId: i, success: res.success, message: res.message });
          } else if (action === 'DELETE') {
            const res = deleteProject(authContext.token, op.projectId);
            results.push({ opId: i, success: res.success, message: res.message });
          }
        }
      } catch (opErr) {
        results.push({ opId: i, success: false, message: opErr.message });
      }
    }

    // Ghi nhận Audit Log
    try {
      ensureAuditLogsSheetExists(ss);
      const auditSheet = ss.getSheetByName(SHEET_AUDIT_LOGS);
      if (auditSheet) {
        auditSheet.appendRow([
          'LOG-' + generateRandomString(8),
          formatDateTimeString(new Date()),
          authContext.email || clientSessionId,
          'BATCH_SYNC',
          'MULTI_TABLE',
          ops.length + ' operations',
          JSON.stringify(results).substring(0, 500)
        ]);
      }
    } catch (auditErr) {
      console.warn('Lỗi ghi audit log:', auditErr.message);
    }

    return {
      success: true,
      processedCount: ops.length,
      results: results,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, message: 'Lỗi giao dịch Batch Sync: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}
