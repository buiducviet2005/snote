# 🚀 HƯỚNG DẪN THIẾT LẬP VÀ CHẠY DỰ ÁN SNOTE TRÊN MÁY MỚI (TỪ A ĐẾN Z)

Tài liệu này hướng dẫn chi tiết từng bước để clone và khởi chạy thành công toàn bộ hệ thống **SNOTE** (Backend API + Frontend SPA + CSDL PostgreSQL) trên bất kỳ máy tính mới nào (Windows, macOS, Linux) sau khi tải mã nguồn từ GitHub.

---

## 📋 1. YÊU CẦU TIỀN ĐỀ (PREREQUISITES)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các phần mềm sau:

1. **Git:** [https://git-scm.com/](https://git-scm.com/) (Dùng để clone mã nguồn).
2. **Node.js:** `20.19+`, `22.12+` hoặc `24+` (theo yêu cầu của Prisma 7).
   - Tải tại: [https://nodejs.org/](https://nodejs.org/)
   - Kiểm tra phiên bản bằng lệnh:
     ```bash
     node -v
     npm -v
     ```
3. **Cơ sở dữ liệu PostgreSQL 16 (chọn 1 trong 2 cách):**
   - **Cách 1 (Khuyên dùng - Nhanh nhất):** Cài đặt **Docker Desktop** ([https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)).
   - **Cách 2:** Cài đặt PostgreSQL 16 trực tiếp lên hệ điều hành ([https://www.postgresql.org/download/](https://www.postgresql.org/download/)).

---

## ⚡ CÁCH 1: KHỞI TẠO TỰ ĐỘNG BẰNG SCRIPT 1-CLICK (KHUYÊN DÙNG)

Dự án có script kiểm tra phần mềm tiền đề (Git, phiên bản Node.js tương thích Prisma 7, npm, Docker & PostgreSQL) và tự động cài đặt thư viện, tạo file cấu hình, đồng bộ CSDL:

* 🔍 **Tự động quét & kiểm tra:**
  - `[OK] / [WARN]` **Git:** Kiểm tra sự hiện diện của Git trong PATH.
  - `[OK] / [FAIL]` **Node.js:** Kiểm tra và chặn lại nếu không phải `20.19+`, `22.12+` hoặc `24+`.
  - `[OK] / [FAIL]` **npm:** Kiểm tra trình quản lý gói npm.
  - `[OK] / [WARN]` **Docker & PostgreSQL:** Kiểm tra Docker CLI và kiểm tra Docker Daemon có đang chạy hay không để tự khởi động container PostgreSQL.

### 🔹 Trên Windows:
Nhấp đúp chuột vào file **`setup.bat`** (hoặc mở Command Prompt / PowerShell tại thư mục dự án và gõ):
```cmd
.\setup.bat
```

### 🔹 Trên macOS / Linux:
Mở Terminal tại thư mục dự án và chạy:
```bash
chmod +x setup.sh
./setup.sh
```

---

## 🛠️ CÁCH 2: THIẾT LẬP THỦ CÔNG TỪNG BƯỚC (STEP-BY-STEP)

Nếu bạn muốn tự thực hiện từng câu lệnh để kiểm soát chi tiết, hãy làm theo các bước dưới đây:

### Bước 1: Clone Mã Nguồn Từ GitHub
Mở Terminal / PowerShell trên máy mới và chạy lệnh:
```bash
git clone https://github.com/naverisme/snote.git
cd snote
```
*(Nếu bạn dùng repository riêng của bạn, hãy thay thế đường link GitHub tương ứng).*

---

### Bước 2: Tạo Các Tệp Cấu Hình Môi Trường (.env)
Dự án đã có sẵn các file mẫu `.env.example`. Hãy sao chép chúng sang `.env`:

#### Trên Windows (Command Prompt / PowerShell):
```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

#### Trên macOS / Linux:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

> 💡 **Kiểm tra file `backend/.env`:**
> ```env
> PORT=4000
> NODE_ENV=development
> DATABASE_URL="postgresql://ainote_dev_user:ainote_dev_password_2026@localhost:5432/ainote_dev_db?schema=public"
> JWT_SECRET="super_secret_jwt_access_key_min_32_characters_2026"
> JWT_EXPIRES_IN="15m"
> JWT_REFRESH_SECRET="super_secret_jwt_refresh_key_min_32_characters_2026"
> JWT_REFRESH_EXPIRES_IN="7d"
> CORS_ORIGIN="http://localhost:5173"
> ```

---

### Bước 3: Cài Đặt Dependencies Cho Toàn Bộ Monorepo
Tại thư mục gốc `snote/`, chạy tuần tự các lệnh sau:

```bash
# 1. Cài đặt root dependencies (concurrently, typescript...)
npm install

# 2. Cài đặt dependencies cho Backend
npm install --prefix backend

# 3. Cài đặt dependencies cho Frontend
npm install --prefix frontend
```

---

### Bước 4: Khởi Chạy Cơ Sở Dữ Liệu PostgreSQL

#### Lựa chọn A: Sử dụng Docker Compose (Khuyên dùng)
Hãy đảm bảo **Docker Desktop đã được bật**, sau đó tại thư mục gốc chạy:
```bash
docker compose up -d postgres_db
```
*(Hệ thống sẽ tự động kéo image `postgres:16-alpine` và khởi tạo container với user: `ainote_dev_user`, pass: `ainote_dev_password_2026`, db: `ainote_dev_db` trên port `5432`).*

#### Lựa chọn B: Sử dụng PostgreSQL cài trực tiếp trên máy
Nếu không dùng Docker, hãy mở pgAdmin hoặc `psql` và tạo database + user tương ứng:
```sql
CREATE USER ainote_dev_user WITH PASSWORD 'ainote_dev_password_2026';
CREATE DATABASE ainote_dev_db OWNER ainote_dev_user;
GRANT ALL PRIVILEGES ON DATABASE ainote_dev_db TO ainote_dev_user;
```
*(Hoặc bạn có thể chỉnh sửa chuỗi `DATABASE_URL` trong `backend/.env` cho khớp với tài khoản PostgreSQL hiện có trên máy của bạn).*

---

### Bước 5: Đồng Bộ CSDL & Nạp Dữ Liệu Mẫu (Database Migration & Seed)
Tại thư mục gốc `snote/`, chạy 3 lệnh sau để tạo bảng và nạp sẵn tài khoản mẫu:

```bash
# 1. Sinh Prisma Client
npm run prisma:generate --prefix backend

# 2. Áp dụng Database Migrations (Tạo toàn bộ bảng CSDL)
npm run prisma:migrate --prefix backend

# 3. Nạp dữ liệu mẫu (Tạo sẵn tài khoản Admin, Sinh viên, Học kỳ, Môn học)
npm run prisma:seed --prefix backend
```

Nếu nâng cấp một cơ sở dữ liệu đã có dữ liệu từ phiên bản trước khi có chức năng lớp học, hãy sao lưu và áp dụng [SQL bổ sung cho lớp học](backend/prisma/sql/20261013_classroom.sql) một lần, rồi chạy lại `npm run prisma:generate --prefix backend`. Xem [mô hình lớp học và phân quyền](DOCS/CLASSROOM_MODEL.md). Kho mã hiện chưa có lịch sử migration nền đầy đủ cho cơ sở dữ liệu cũ.

Để bật đăng nhập Google, cấu hình cùng một OAuth Client ID trong `backend/.env` (`GOOGLE_CLIENT_ID`) và `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`).

---

### Bước 6: Khởi Chạy Toàn Bộ Hệ Thống (1 Lệnh Duy Nhất)
Tại thư mục gốc `snote/`:
```bash
npm run dev
```

Hệ thống sẽ khởi chạy song song cả 2 dịch vụ:
* 🖥️ **Frontend SPA (Giao diện người dùng):** 👉 [http://localhost:5173](http://localhost:5173)
* ⚙️ **Backend API Server:** 👉 [http://localhost:4000/api](http://localhost:4000/api)
* 🩺 **Health Check:** 👉 [http://localhost:4000/health](http://localhost:4000/health)

---

## 🔑 3. TÀI KHOẢN MẪU DÙNG THỬ (PRE-SEEDED ACCOUNTS)

Sau khi chạy lệnh `prisma:seed`, hệ thống đã chuẩn bị sẵn 2 tài khoản mẫu để bạn đăng nhập ngay lập tức:

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Quyền hạn / Dữ liệu có sẵn |
| :--- | :--- | :--- | :--- |
| 🎓 **Sinh viên (Student)** | `sinhvien@snote.edu.vn` | `Student@123456` | Đã có sẵn Học kỳ 1, 3 Môn học (Cơ sở dữ liệu, Mạng máy tính, Kiến trúc Phần mềm), Đồ án mẫu. |
| 👑 **Quản trị viên (Admin)** | `admin@snote.edu.vn` | `Admin@123456` | Quyền giám sát hệ thống, theo dõi sức khỏe và quản trị toàn bộ dữ liệu. |

> Bạn cũng có thể bấm nút **"Đăng ký tài khoản mới"** trên giao diện [http://localhost:5173/auth/register](http://localhost:5173/auth/register) để tạo tài khoản sinh viên riêng của mình.

---

## 🛠️ 4. BẢNG TRA CỨU CÁC LỆNH HỮU ÍCH (SCRIPTS PLAYBOOK)

| Lệnh thực thi | Vị trí chạy | Mục đích sử dụng |
| :--- | :--- | :--- |
| `npm run dev` | Thư mục gốc `snote/` | Chạy đồng thời cả Backend và Frontend trong 1 terminal. |
| `npm run dev:backend` | Thư mục gốc `snote/` | Chỉ khởi chạy riêng Backend API (Port 4000). |
| `npm run dev:frontend` | Thư mục gốc `snote/` | Chỉ khởi chạy riêng Frontend Dev Server (Port 5173). |
| `npm run type-check` | Thư mục gốc `snote/` | Kiểm tra tính toàn vẹn kiểu dữ liệu TypeScript toàn bộ dự án. |
| `npm run build` | Thư mục gốc `snote/` | Build production cho toàn bộ Backend, Frontend và Shared. |
| `npx prisma studio` | `backend/` | Mở giao diện Web quản trị dữ liệu trực quan trên trình duyệt (Port 5555). |
| `docker compose down` | Thư mục gốc `snote/` | Tắt container PostgreSQL khi không sử dụng. |

---

## ❓ 5. XỬ LÝ CÁC LỖI THƯỜNG GẶP (TROUBLESHOOTING)

### Lỗi 1: `P1001: Can't reach database server at localhost:5432`
- **Nguyên nhân:** Dịch vụ PostgreSQL chưa chạy hoặc Docker Desktop chưa bật.
- **Cách xử lý:** 
  - Mở Docker Desktop và chạy lại lệnh: `docker compose up -d postgres_db`.
  - Hoặc kiểm tra xem cổng 5432 có đang bị chương trình khác chiếm dụng hay không.

### Lỗi 2: `Port 4000 or 5173 is already in use`
- **Nguyên nhân:** Có tiến trình cũ đang chạy nền chiếm cổng 4000 hoặc 5173.
- **Cách xử lý:** 
  - Trên Windows (PowerShell):
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
    ```
  - Trên macOS / Linux:
    ```bash
    kill -9 $(lsof -t -i:4000)
    kill -9 $(lsof -t -i:5173)
    ```

---

🎉 **Chúc bạn thiết lập và trải nghiệm SNOTE thành công!** Nếu cần hỗ trợ thêm, hãy tham khảo chi tiết tại thư mục [DOCS/](DOCS/).
