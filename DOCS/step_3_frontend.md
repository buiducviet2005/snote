# Bước 3.4 – Thiết kế Stack Frontend & Khởi tạo SPA (AI Note)

Tài liệu này thuộc **Bước nhỏ 4** trong cấu trúc 7 bước nhỏ của **Bước 3 lớn (Thiết kế Kiến trúc Hệ thống & Nền tảng)** cho dự án **AI Note**.

Tài liệu đặc tả chi tiết kiến trúc, cấu trúc thư mục dạng **Feature-based**, cấu hình môi trường, hệ thống Router và tầng dịch vụ gọi API backend cho ứng dụng Single Page Application (SPA).

---

## 🧭 VỊ TRÍ TRONG TIẾN TRÌNH BƯỚC 3 LỚN

- **Bước 3.1:** Chọn kiến trúc tổng thể (Modular Monolith, ranh giới 1 transaction ACID trên PostgreSQL).
- **Bước 3.2:** Thiết kế domain nội bộ & ranh giới module (10 Bounded Contexts, Layered Pattern).
- **Bước 3.3:** Chọn stack backend & dựng bộ khung skeleton từ số 0 (Node.js + TS + Express + Prisma).
- **Bước 3.4:** **Chọn stack frontend, thiết lập Single Page Application (SPA) & cấu trúc Feature-based (Nội dung tài liệu này).**
- **Bước 3.5:** Thiết kế cấu trúc repo & tổ chức mã nguồn tổng thể.
- **Bước 3.6:** Chuẩn cấu hình môi trường & quản lý secrets.
- **Bước 3.7:** Chuẩn logging, error handling & bảo mật cơ bản.

---

## 1. Mục tiêu Kỹ thuật & Quyết định Công nghệ

### 1.1. Mục tiêu của Bước 3.4
- Thiết lập một dự án frontend độc lập trong thư mục `frontend/` sử dụng **Vite + React + TypeScript**.
- Tổ chức mã nguồn theo mô hình **Feature-driven / Domain-centric** xoay quanh các phân hệ chính: `notes`, `tasks`, `schedule`, `semesters`.
- Cấu hình biến môi trường (`VITE_API_BASE_URL`) và xây dựng tầng giao tiếp mạng `services/api.ts` chuẩn mực.
- Thiết lập hệ thống điều hướng Client-side (**React Router DOM**) cho 3 màn hình cốt lõi của sinh viên: Ghi chú, Công việc và Lịch học.
- Xác thực luồng gọi API và cơ chế CORS kết nối giữa Frontend (`port 5173`) và Backend (`port 4000`).

### 1.2. Quyết định Công nghệ Frontend
| Thành phần | Công nghệ lựa chọn | Lý do kỹ thuật |
| :--- | :--- | :--- |
| **Bundler & Dev Server** | `Vite` | Khởi động server cực nhanh (ES Modules native), tối ưu build production bằng Rollup, HMR mượt mà. |
| **Core UI Library** | `React` + `TypeScript` | Kiểm soát chặt chẽ kiểu dữ liệu của DTOs từ Bước 2/3, hạn chế runtime errors. |
| **Routing** | `react-router-dom` | Quản lý điều hướng Client-side SPA, hỗ trợ nested layouts và dynamic route params. |
| **API Client Layer** | `Fetch API` / Typed Wrapper | Đóng gói layer `services/api.ts` tái sử dụng, tự động gắn Base URL và header `Content-Type`. |
| **State Management** | `Zustand` & `TanStack Query` | Phân định rõ: TanStack Query quản lý Server State (cache/invalidation); Zustand quản lý UI Context (activeSemester/Subject). |

---

## 2. Cấu trúc Thư mục Frontend (Feature-Based Architecture)

Mã nguồn frontend được tổ chức theo cấu trúc module tính năng kết hợp thành phần dùng chung:

```text
frontend/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── global.css            # Stylesheets toàn cục, reset CSS, typography
│   ├── components/                   # Các UI components dùng chung toàn hệ thống
│   │   ├── layout/                   # Khung bố cục chung
│   │   │   ├── AppLayout.tsx         # Layout chính chứa Sidebar và Main Content Outlet
│   │   │   ├── Sidebar.tsx           # Thanh điều hướng trái (Notes, Tasks, Schedule, Semesters)
│   │   │   └── Topbar.tsx            # Thanh tiêu đề, thông tin người dùng và context học kỳ
│   │   └── ui/                       # Atomic UI Components tái sử dụng
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── Badge.tsx
│   ├── features/                     # Chia theo từng Domain nghiệp vụ (Feature Modules)
│   │   ├── notes/                    # Phân hệ Quản lý Ghi chú
│   │   │   ├── components/
│   │   │   │   ├── NoteEditor.tsx    # Trình soạn thảo ghi chú
│   │   │   │   └── NoteItem.tsx      # Card hiển thị ghi chú tóm tắt
│   │   │   ├── hooks/
│   │   │   │   └── useNotes.ts       # Custom hook fetch và quản lý state ghi chú
│   │   │   ├── pages/
│   │   │   │   ├── NoteDetailPage.tsx
│   │   │   │   └── NotesListPage.tsx # Màn hình danh sách ghi chú
│   │   │   └── index.ts              # Public API của feature notes
│   │   ├── tasks/                    # Phân hệ Quản lý Công việc & Deadline
│   │   │   ├── components/
│   │   │   │   └── TaskItem.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useTasks.ts
│   │   │   ├── pages/
│   │   │   │   └── TasksListPage.tsx # Màn hình danh sách công việc
│   │   │   └── index.ts
│   │   ├── schedule/                 # Phân hệ Thời khóa biểu & Lịch thi
│   │   │   ├── components/
│   │   │   │   └── ScheduleCalendar.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSchedule.ts
│   │   │   ├── pages/
│   │   │   │   └── ScheduleWeekPage.tsx
│   │   │   └── index.ts
│   │   └── semesters/                # Phân hệ Học kỳ & Môn học
│   │       ├── components/
│   │       │   └── SemesterSelector.tsx
│   │       ├── hooks/
│   │       │   └── useSemesters.ts
│   │       ├── pages/
│   │       │   └── SemesterOverviewPage.tsx
│   │       └── index.ts
│   ├── router/
│   │   └── index.tsx                 # Cấu hình React Router (createBrowserRouter)
│   ├── services/
│   │   └── api.ts                    # HTTP Client đóng gói fetch API
│   ├── store/
│   │   └── appContext.ts             # Quản lý UI state (học kỳ/môn học đang chọn)
│   ├── App.tsx
│   └── main.tsx                      # Entry point React
├── .env                              # Biến môi trường local (chứa VITE_API_BASE_URL)
├── .env.example                      # Mẫu biến môi trường
├── index.html                        # HTML Template
├── package.json
├── tsconfig.json
└── vite.config.ts                    # Cấu hình Vite server & build
```

---

## 3. Cấu hình Môi trường & Layer Gọi API Backend

### 3.1. Cấu hình `.env`
Các biến môi trường trong Vite bắt buộc có tiền tố `VITE_`:

```env
# frontend/.env.example & frontend/.env
VITE_API_BASE_URL=http://localhost:4000/api
```

### 3.2. HTTP Client Wrapper (`src/services/api.ts`)
```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
```

---

## 4. Cấu hình Điều hướng (React Router Setup)

Hệ thống sử dụng `createBrowserRouter` định tuyến 3 màn hình cốt lõi:

```tsx
// src/router/index.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { NotesListPage } from '../features/notes/pages/NotesListPage';
import { TasksListPage } from '../features/tasks/pages/TasksListPage';
import { ScheduleWeekPage } from '../features/schedule/pages/ScheduleWeekPage';
import { SemesterOverviewPage } from '../features/semesters/pages/SemesterOverviewPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/notes" replace /> },
      { path: 'notes', element: <NotesListPage /> },
      { path: 'tasks', element: <TasksListPage /> },
      { path: 'schedule', element: <ScheduleWeekPage /> },
      { path: 'semesters', element: <SemesterOverviewPage /> }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

---

## 5. Tiêu chí Hoàn thành Bước 3.4 (Definition of Done)

- [x] Dự án Vite + React + TypeScript đã được khởi tạo trong `frontend/`.
- [x] Cấu trúc thư mục Feature-based (`notes`, `tasks`, `schedule`, `semesters`) đã được thiết lập đầy đủ.
- [x] Đã cấu hình `.env` với biến `VITE_API_BASE_URL` và xây dựng module `services/api.ts`.
- [x] Đã cài đặt `react-router-dom`, tạo router với Layout chuẩn (Sidebar, NavLinks, Main Content Outlet).
- [x] Đã kiểm thử kết nối gọi API sang Backend (`/api/notes`) và kiểm tra tính tương thích CORS.
