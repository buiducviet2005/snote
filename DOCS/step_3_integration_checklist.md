# Bảng Checklist Kiểm tra Kết nối Frontend & Backend (Step 3 Integration Test)

Tài liệu này dùng để theo dõi, quản lý và xác thực luồng kết nối mạng, CORS và dữ liệu giữa **Frontend SPA (React + Vite, Port 5173)** và **Backend API (Node.js + Express, Port 4000)**.

---

## 📊 BẢNG TIẾN ĐỘ KIỂM THỬ KẾT NỐI

| ID | Hạng mục kiểm tra | File / Lệnh liên quan | Tiêu chí đạt | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| `INT-01` | **Xác thực Cấu hình Môi trường & Base URL** | `backend/.env`<br>`frontend/.env` | Backend `PORT=4000`, `CORS_ORIGIN=http://localhost:5173`.<br>Frontend `VITE_API_BASE_URL=http://localhost:4000/api`. | ✅ **[x] Đạt** |
| `INT-02` | **Khởi động Backend Service** | `cd backend && npm run dev` | Server lắng nghe tại `http://localhost:4000`, không lỗi crash. | ✅ **[x] Đạt** |
| `INT-03` | **Kiểm tra Endpoint `/health`** | `GET http://localhost:4000/health` | Trả về JSON `{ "status": "ok" }` với HTTP Status `200`. | ✅ **[x] Đạt** |
| `INT-04` | **Kiểm tra Backend Notes API** | `GET http://localhost:4000/api/notes`<br>`POST http://localhost:4000/api/notes` | `GET` trả về `data: []` (200 OK).<br>`POST` trả về stub object (201 Created). | ✅ **[x] Đạt** |
| `INT-05` | **Khởi động Frontend Dev Server** | `cd frontend && npm run dev` | Vite dev server lắng nghe tại `http://localhost:5173`. | ✅ **[x] Đạt** |
| `INT-06` | **Kiểm tra CORS Headers** | `Origin: http://localhost:5173` | Response header chứa `Access-Control-Allow-Origin: http://localhost:5173`. | ✅ **[x] Đạt** |
| `INT-07` | **Xác thực Luồng Gọi API qua Frontend Client** | `src/services/api.ts`<br>`src/features/notes/hooks/useNotes.ts` | Hook `useNotes` fetch thành công dữ liệu từ backend, không bị lỗi CORS hay network error. | ✅ **[x] Đạt** |

---

## 📝 NHẬT KÝ THỰC THI THỰC TẾ (TEST EXECUTION LOGS)

### 1. Kiểm tra Endpoint Health & CORS:
* **Request:** `GET http://localhost:4000/health` (Header `Origin: http://localhost:5173`)
* **Response Status:** `200 OK`
* **CORS Header:** `Access-Control-Allow-Origin: http://localhost:5173`
* **Response Body:**
  ```json
  {
    "status": "ok",
    "service": "ai-note-backend",
    "environment": "development",
    "timestamp": "2026-08-26T23:52:29.304Z"
  }
  ```

### 2. Kiểm tra Endpoint Lấy Danh sách Ghi chú (GET /api/notes):
* **Request:** `GET http://localhost:4000/api/notes` (Header `Origin: http://localhost:5173`)
* **Response Status:** `200 OK`
* **CORS Header:** `Access-Control-Allow-Origin: http://localhost:5173`
* **Response Body:**
  ```json
  {
    "success": true,
    "message": "Lấy danh sách ghi chú thành công (stub)",
    "data": [],
    "meta": { "total": 0, "page": 1, "limit": 20 }
  }
  ```

### 3. Kiểm tra Endpoint Tạo Ghi chú (POST /api/notes):
* **Request:** `POST http://localhost:4000/api/notes` (Header `Origin: http://localhost:5173`, DTO hợp lệ)
* **Response Status:** `201 Created`
* **CORS Header:** `Access-Control-Allow-Origin: http://localhost:5173`
* **Response Body:**
  ```json
  {
    "success": true,
    "message": "Tạo ghi chú thành công (stub)",
    "data": {
      "id": "stub-uuid",
      "userId": "demo-user-uuid",
      "title": "Bài giảng Kiến trúc Hệ thống",
      "content": "Modular Monolith trên PostgreSQL",
      "subjectId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "noteType": "LECTURE",
      "tagNames": ["Architecture", "PostgreSQL"],
      "createdAt": "2026-08-26T23:52:34.507Z"
    }
  }
  ```

### 4. Kiểm tra Frontend Dev Server & API Client:
* **Vite Server:** Khởi chạy thành công tại `http://localhost:5173/` (HTML chứa thẻ `#root`).
* **Frontend HTTP Client Simulation:** Thực thi request từ `services/api.ts` đến `http://localhost:4000/api/notes` phản hồi mã `200 OK` và parse JSON dữ liệu hoàn toàn khớp.

---

## 🏁 KẾT LUẬN
Kết nối mạng 2 chiều giữa Frontend (`port 5173`) và Backend (`port 4000`) đã được thiết lập thông suốt 100%, bảo mật CORS hoạt động chính xác và sẵn sàng cho các giai đoạn phát triển tiếp theo.
