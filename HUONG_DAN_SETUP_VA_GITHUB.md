# 📘 CẨM NANG HƯỚNG DẪN THIẾT LẬP (SETUP) VÀ ĐẨY CODE LÊN GITHUB CHO SNOTE

> **Dành cho:** Sinh viên, Giảng viên hướng dẫn và Thành viên nhóm phát triển dự án SNOTE.  
> **Phiên bản:** SNOTE v1.0.0 (Full-stack Modular Monolith: React 19 + Express TypeScript + PostgreSQL 16 Prisma).  
> **Mục tiêu:** Cung cấp hướng dẫn đầy đủ, chuẩn xác từ lúc clone/cài đặt mã nguồn trên máy mới cho đến toàn bộ quy trình đẩy (push) code lên GitHub an toàn, không lỗi xung đột.

---

## 📑 MỤC LỤC
1. [PHẦN 1: THIẾT LẬP VÀ KHỞI CHẠY DỰ ÁN TRÊN MÁY TÍNH (LOCAL SETUP)](#phần-1-thiết-lập-và-khởi-chạy-dự-án-trên-máy-tính-local-setup)
   - [1.1. Chuẩn bị công cụ tiền đề (Prerequisites)](#11-chuẩn-bị-công-cụ-tiền-đề-prerequisites)
   - [1.2. Tải mã nguồn về máy (Git Clone)](#12-tải-mã-nguồn-về-máy-git-clone)
   - [1.3. Cấu hình biến môi trường (.env)](#13-cấu-hình-biến-môi-trường-env)
   - [1.4. Cài đặt các gói phụ thuộc (Dependencies)](#14-cài-đặt-các-gói-phụ-thuộc-dependencies)
   - [1.5. Khởi tạo Cơ sở dữ liệu PostgreSQL & Nạp dữ liệu mẫu](#15-khởi-tạo-cơ-sở-dữ-liệu-postgresql--nạp-dữ-liệu-mẫu)
   - [1.6. Khởi chạy toàn bộ hệ thống (Dev Server)](#16-khởi-chạy-toàn-bộ-hệ-thống-dev-server)
   - [1.7. Danh sách tài khoản mẫu dùng thử](#17-danh-sách-tài-khoản-mẫu-dùng-thử)
   - [1.8. Kiểm tra chất lượng và chạy Test tự động](#18-kiểm-tra-chất-lượng-và-chạy-test-tự-động)
2. [PHẦN 2: QUY TRÌNH ĐẨY CODE LÊN GITHUB (GIT & GITHUB WORKFLOW)](#phần-2-quy-trình-đẩy-code-lên-github-git--github-workflow)
   - [2.1. Cấu hình định danh Git cá nhân](#21-cấu-hình-định-danh-git-cá-nhân)
   - [2.2. Kiểm tra Remote Repository](#22-kiểm-tra-remote-repository)
   - [2.3. Quy trình 4 bước chuẩn để đẩy code lên GitHub](#23-quy-trình-4-bước-chuẩn-để-đẩy-code-lên-github)
   - [2.4. Xác thực bảo mật với GitHub (Tránh lỗi mật khẩu bị từ chối)](#24-xác-thực-bảo-mật-với-github-tránh-lỗi-mật-khẩu-bị-từ-chối)
   - [2.5. Quy trình làm việc nhóm với nhánh (Branching & Pull Request)](#25-quy-trình-làm-việc-nhóm-với-nhánh-branching--pull-request)
   - [2.6. Xử lý các lỗi Git thường gặp nhất (Troubleshooting)](#26-xử-lý-các-lỗi-git-thường-gặp-nhất-troubleshooting)
3. [PHẦN 3: BẢNG TRA CỨU CÁC CÂU LỆNH HÀNG NGÀY (CHEAT SHEET)](#phần-3-bảng-tra-cứu-các-câu-lệnh-hàng-ngày-cheat-sheet)

---

# PHẦN 1: THIẾT LẬP VÀ KHỞI CHẠY DỰ ÁN TRÊN MÁY TÍNH (LOCAL SETUP)

### 1.1. Chuẩn bị công cụ tiền đề (Prerequisites)

Hãy đảm bảo máy tính của bạn đã cài đặt sẵn các công cụ sau:

| Công cụ | Phiên bản khuyến nghị | Hướng dẫn kiểm tra | Tải về |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.19+`, `v22.12+` hoặc `v24+` *(Bắt buộc do Prisma 7)* | `node -v` | [nodejs.org](https://nodejs.org/) |
| **npm** | `v10+` (Đi kèm Node.js) | `npm -v` | Đi kèm với Node.js |
| **Git** | `v2.40+` | `git --version` | [git-scm.com](https://git-scm.com/) |
| **PostgreSQL** | `PostgreSQL 16` (hoặc Docker Desktop) | `psql --version` hoặc `docker -v` | [docker.com](https://www.docker.com/) hoặc [postgresql.org](https://www.postgresql.org/) |

---

### 1.2. Tải mã nguồn về máy (Git Clone)

Mở Terminal (trên macOS/Linux) hoặc PowerShell/Git Bash (trên Windows), di chuyển đến thư mục làm việc và thực hiện clone:

```bash
# Clone dự án từ GitHub
git clone https://github.com/naverisme/snote.git

# Di chuyển vào thư mục dự án
cd snote
```

*(Lưu ý: Nếu bạn dùng repository riêng của nhóm mình, hãy thay URL trên bằng link repository của bạn).*

---

### 1.3. Cấu hình biến môi trường (.env)

Hệ thống SNOTE bao gồm 2 file `.env` riêng biệt cho Backend và Frontend. Có sẵn các file mẫu `.env.example`:

#### Cách sao chép nhanh:

* **Trên Windows (PowerShell / Command Prompt):**
  ```powershell
  copy backend\.env.example backend\.env
  copy frontend\.env.example frontend\.env
  ```

* **Trên macOS / Linux:**
  ```bash
  cp backend/.env.example backend/.env
  cp frontend/.env.example frontend/.env
  ```

#### Kiểm tra nội dung cấu hình chuẩn:

1. **`backend/.env`**:
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL="postgresql://ainote_dev_user:ainote_dev_password_2026@localhost:5432/ainote_dev_db?schema=public"
   JWT_SECRET="super_secret_jwt_access_key_min_32_characters_2026"
   JWT_EXPIRES_IN="15m"
   JWT_REFRESH_SECRET="super_secret_jwt_refresh_key_min_32_characters_2026"
   JWT_REFRESH_EXPIRES_IN="7d"
   CORS_ORIGIN="http://localhost:5173"
   GOOGLE_CLIENT_ID=""
   ```
   *(Nếu bạn dùng PostgreSQL cài trực tiếp trên máy với user/password khác, hãy cập nhật `DATABASE_URL` tương ứng).*

2. **`frontend/.env`**:
   ```env
   VITE_API_URL="http://localhost:4000/api"
   VITE_GOOGLE_CLIENT_ID=""
   ```

---

### 1.4. Cài đặt các gói phụ thuộc (Dependencies)

Tại thư mục gốc của dự án (`snote/`), chạy 1 câu lệnh duy nhất để cài đặt toàn bộ:

```bash
npm run install:all
```

*Lệnh trên sẽ tự động cài đặt thư viện cho thư mục gốc monorepo, thư mục `backend/` và thư mục `frontend/`.*

Nếu bạn muốn cài đặt thủ công từng thư mục:
```bash
npm install                     # Cài đặt root monorepo
npm install --prefix backend    # Cài đặt backend
npm install --prefix frontend   # Cài đặt frontend
```

---

### 1.5. Khởi tạo Cơ sở dữ liệu PostgreSQL & Nạp dữ liệu mẫu

#### Bước 1: Khởi động cơ sở dữ liệu
* **Cách 1 (Khuyên dùng - Nhanh nhất qua Docker):**  
  Bật Docker Desktop lên, sau đó mở terminal tại thư mục gốc và chạy:
  ```bash
  docker compose up -d postgres_db
  ```
  Container PostgreSQL 16 sẽ tự động chạy ngầm trên cổng `5432` với cấu hình đúng khớp với file `.env`.

* **Cách 2 (PostgreSQL cài trực tiếp trên máy không dùng Docker):**  
  Mở công cụ `psql` hoặc `pgAdmin` và chạy các câu lệnh SQL sau để tạo tài khoản và CSDL:
  ```sql
  CREATE USER ainote_dev_user WITH PASSWORD 'ainote_dev_password_2026';
  CREATE DATABASE ainote_dev_db OWNER ainote_dev_user;
  GRANT ALL PRIVILEGES ON DATABASE ainote_dev_db TO ainote_dev_user;
  ```

#### Bước 2: Đồng bộ cấu trúc bảng và nạp dữ liệu mẫu (Seed)
Tại thư mục gốc `snote/`, chạy lệnh thiết lập tự động:

```bash
npm run db:setup
```

Lệnh này sẽ thực hiện tuần tự 3 tác vụ:
1. `prisma generate`: Sinh mã nguồn Prisma Client TypeScript tương ứng với schema.
2. `prisma migrate`: Tự động tạo toàn bộ các bảng trong CSDL PostgreSQL.
3. `prisma seed`: Nạp sẵn các tài khoản mẫu, môn học, đồ án mẫu và ghi chú để bạn thử nghiệm ngay.

---

### 1.6. Khởi chạy toàn bộ hệ thống (Dev Server)

Sau khi hoàn tất bước 1.5, chỉ cần chạy đúng 1 lệnh tại thư mục gốc:

```bash
npm run dev
```

Terminal sẽ khởi chạy song song 2 tiến trình bằng `concurrently`:
* 🌐 **Frontend:** [http://localhost:5173](http://localhost:5173) *(Giao diện người dùng SNOTE)*
* ⚙️ **Backend API:** [http://localhost:4000/api](http://localhost:4000/api) *(Máy chủ API)*
* 🩺 **Health Check:** [http://localhost:4000/health](http://localhost:4000/health) *(Kiểm tra trạng thái máy chủ)*

*(Muốn dừng chương trình, bấm tổ hợp phím `Ctrl + C` trong terminal).*

---

### 1.7. Danh sách tài khoản mẫu dùng thử

Sau khi chạy seed, hệ thống đã có sẵn 3 cách đăng nhập để kiểm thử:

| Loại tài khoản | Tài khoản / Email | Mật khẩu | Đặc quyền & Dữ liệu có sẵn |
| :--- | :--- | :--- | :--- |
| 🎓 **Sinh viên (Student)** | `sinhvien@snote.edu.vn` | `Student@123456` | Có sẵn Học kỳ 1, 3 Môn học (Cơ sở dữ liệu, Mạng máy tính, Kiến trúc Phần mềm), bài tập và ghi chú. |
| 👑 **Quản trị viên (Admin)** | `admin@snote.edu.vn` | `Admin@123456` | Có quyền truy cập trang `/status`, giám sát hệ thống và phân quyền. |
| 🚀 **Google 1-Click (Dev)** | `naverworke.address@gmail.com` | *Không cần mật khẩu* | Nhấn nút **"Đăng nhập bằng Google"** trên màn hình Login, hệ thống tự động đăng nhập tài khoản sinh viên Google. |

---

### 1.8. Kiểm tra chất lượng và chạy Test tự động

Trước khi commit hoặc đẩy code lên GitHub, bạn nên chạy bộ kiểm thử toàn diện:

```bash
# 1. Kiểm tra lỗi kiểu dữ liệu TypeScript (Strict Mode)
npm run type-check

# 2. Chạy toàn bộ 84 Unit & Integration Tests (Backend + Frontend)
npm test

# 3. Thử nghiệm đóng gói Production Build
npm run build
```

Nếu tất cả các lệnh trên trả về màu xanh (Exit code 0), mã nguồn của bạn hoàn toàn chuẩn xác và an toàn để đẩy lên GitHub.

---

# PHẦN 2: QUY TRÌNH ĐẨY CODE LÊN GITHUB (GIT & GITHUB WORKFLOW)

### 2.1. Cấu hình định danh Git cá nhân

Trước khi commit lần đầu trên máy tính của bạn, hãy khai báo tên và email gắn liền với tài khoản GitHub của bạn:

```bash
# Đặt tên hiển thị trên các commit
git config --global user.name "Họ và Tên của Bạn"

# Đặt email chính xác khớp với tài khoản GitHub
git config --global user.email "email_cua_ban@gmail.com"

# Kiểm tra lại cấu hình đã lưu
git config user.name
git config user.email
```

> 💡 **Khắc phục lỗi xuống dòng Windows/Linux:**  
> Trên hệ điều hành Windows, hãy chạy thêm lệnh này để tránh cảnh báo `LF will be replaced by CRLF`:
> ```bash
> git config --global core.autocrlf true
> ```

---

### 2.2. Kiểm tra Remote Repository

Kiểm tra xem máy tính của bạn đã liên kết với kho lưu trữ GitHub nào:

```bash
git remote -v
```

* Nếu đã hiển thị `origin  https://github.com/naverisme/snote.git (fetch)` thì bạn đã kết nối thành công.
* Nếu chưa có remote nào (hoặc bạn muốn trỏ sang kho mã nguồn mới của bạn), hãy thêm remote bằng lệnh:
  ```bash
  git remote add origin https://github.com/Tên_Tài_Khoản_Của_Bạn/Tên_Repo.git
  ```
* Nếu muốn đổi địa chỉ remote hiện tại:
  ```bash
  git remote set-url origin https://github.com/Tên_Tài_Khoản_Của_Bạn/Tên_Repo.git
  ```

---

### 2.3. Quy trình 4 bước chuẩn để đẩy code lên GitHub

Mỗi khi bạn vừa hoàn thành một tính năng, sửa xong lỗi hoặc cập nhật tài liệu, hãy thực hiện đúng 4 bước sau:

```mermaid
flowchart LR
    A["1. git status<br/>(Xem thay đổi)"] --> B["2. git add .<br/>(Đưa vào Staging)"]
    B --> C["3. git commit -m '...'<br/>(Ghi nhận đóng gói)"]
    C --> D["4. git push origin main<br/>(Đẩy lên GitHub)"]
```

#### Bước 1: Kiểm tra trạng thái các file thay đổi
```bash
git status
```
*Lệnh này giúp bạn thấy rõ những file nào vừa được chỉnh sửa (`modified`), file nào mới thêm (`untracked`), và file nào bị xóa (`deleted`).*

#### Bước 2: Đưa các thay đổi vào khu vực chuẩn bị (Staging Area)
```bash
# Đưa toàn bộ các thay đổi vào staging
git add .

# Hoặc nếu chỉ muốn add từng file cụ thể:
git add frontend/src/features/notes/pages/NotesListPage.tsx
```

#### Bước 3: Tạo commit với thông điệp rõ ràng
Quy ước đặt tên commit chuyên nghiệp theo chuẩn Conventional Commits:
* `feat:` thêm tính năng mới (Ví dụ: `git commit -m "feat(auth): them dang nhap google identity"`)
* `fix:` sửa lỗi (Ví dụ: `git commit -m "fix(notes): sua loi hien thi markdown link"`)
* `docs:` cập nhật tài liệu (Ví dụ: `git commit -m "docs: cap nhat huong dan setup va github"`)
* `refactor:` tái cấu trúc mã nguồn tối ưu hơn mà không đổi hành vi
* `style:` tinh chỉnh giao diện CSS, màu sắc, khoảng cách

Câu lệnh:
```bash
git commit -m "feat(auth): hoan thien dang nhap google va hop thoai quen mat khau"
```

#### Bước 4: Đẩy commit lên GitHub
```bash
# Đẩy lên nhánh main
git push origin main
```
*(Nếu đây là lần đầu tiên bạn đẩy lên nhánh mới, hãy dùng: `git push -u origin main`).*

---

### 2.4. Xác thực bảo mật với GitHub (Tránh lỗi mật khẩu bị từ chối)

> ⚠️ **LƯU Ý CỰC KỲ QUAN TRỌNG:**  
> Kể từ tháng 8/2021, **GitHub đã chặn hoàn toàn việc sử dụng mật khẩu tài khoản** để thực hiện `git push`. Nếu bạn nhập mật khẩu đăng nhập của web GitHub, bạn sẽ gặp lỗi:  
> `fatal: Authentication failed for 'https://github.com/...'`

Để đẩy code lên GitHub, bạn hãy chọn **1 trong 2 cách đơn giản sau**:

#### Cách 1: Sử dụng GitHub Personal Access Token (PAT) - Khuyên dùng

1. Đăng nhập vào trang web [GitHub.com](https://github.com/).
2. Nhấp vào ảnh đại diện ở góc trên bên phải ➡️ Chọn **Settings**.
3. Cuộn xuống dưới cùng của menu bên trái ➡️ Chọn **Developer Settings**.
4. Chọn **Personal access tokens** ➡️ Chọn **Tokens (classic)**.
5. Nhấp vào nút **Generate new token** ➡️ Chọn **Generate new token (classic)**.
6. Điền thông tin:
   - **Note:** `snote-token-dev`
   - **Expiration:** Chọn `90 days` hoặc `No expiration`.
   - **Select scopes:** Tích chọn ô vuông **`repo`** (Cấp toàn quyền truy cập repository).
7. Cuộn xuống cuối và bấm **Generate token**.
8. **Sao chép mã Token** hiển thị trên màn hình (Có dạng `ghp_xxxxxxxxxxxxxxxxxxxx`). *Hãy lưu lại mã này vào sổ ghi chú cá nhân vì GitHub sẽ chỉ hiển thị duy nhất 1 lần.*
9. Khi chạy `git push origin main` trên máy tính, cửa sổ nhắc đăng nhập sẽ hiện ra:
   - **Username:** Nhập tên đăng nhập GitHub của bạn.
   - **Password:** **DÁN MÃ TOKEN (`ghp_...`) VỪA SAO CHÉP VÀO ĐÂY** (Không nhập mật khẩu tài khoản).

#### Cách 2: Sử dụng GitHub CLI (Đăng nhập 1 lần qua trình duyệt)
Nếu bạn có cài đặt GitHub CLI (`gh`), chỉ cần chạy:
```bash
gh auth login
```
* Chọn `GitHub.com` ➡️ Chọn `HTTPS` ➡️ Chọn `Yes` để xác thực với Git credentials ➡️ Chọn `Login with a web browser`.
* Nhập mã xác nhận hiển thị trên terminal vào trình duyệt, bấm **Authorize**. Bạn sẽ vĩnh viễn không bao giờ phải nhập lại mật khẩu khi `git push`.

---

### 2.5. Quy trình làm việc nhóm với nhánh (Branching & Pull Request)

Khi có từ 2 sinh viên trở lên cùng làm chung một đồ án, tuyệt đối **không nên cùng push trực tiếp lên nhánh `main`** để tránh đè code lẫn nhau. Hãy áp dụng quy trình chia nhánh chuẩn:

```mermaid
gitGraph
   commit id: "Khởi tạo repo"
   branch feature/student-A
   checkout feature/student-A
   commit id: "Làm chức năng Ghi chú"
   commit id: "Sửa giao diện Note"
   checkout main
   merge feature/student-A id: "Merge PR #1"
   branch feature/student-B
   checkout feature/student-B
   commit id: "Làm chức năng Lớp học"
   checkout main
   merge feature/student-B id: "Merge PR #2"
```

#### Quy trình 5 bước cho mỗi thành viên:

1. **Lấy code mới nhất về trước khi bắt đầu làm:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Tạo nhánh làm việc riêng của bạn:**
   ```bash
   git checkout -b feature/quan-ly-mon-hoc
   ```

3. **Lập trình và commit trên nhánh riêng:**
   ```bash
   git add .
   git commit -m "feat(subjects): them form tao mon hoc moi"
   ```

4. **Đẩy nhánh riêng lên GitHub:**
   ```bash
   git push -u origin feature/quan-ly-mon-hoc
   ```

5. **Tạo Pull Request (PR) trên web GitHub:**
   - Truy cập vào repository trên trình duyệt, bạn sẽ thấy nút vàng **"Compare & pull request"**.
   - Bấm vào nút đó, mô tả các thay đổi và bấm **Create pull request**.
   - Trưởng nhóm hoặc bạn cùng nhóm xem lại mã nguồn (Code Review) và bấm **Merge pull request** để hòa nhập code vào nhánh `main`.

---

### 2.6. Xử lý các lỗi Git thường gặp nhất (Troubleshooting)

#### Lỗi 1: `[rejected - non-fast-forward] Updates were rejected because the remote contains work that you do not have locally`
* **Nguyên nhân:** Trên GitHub có commit mới hơn mà máy tính của bạn chưa tải về (Ví dụ: có người vừa merge Pull Request hoặc sửa trực tiếp trên web).
* **Cách khắc phục an toàn nhất:**
  ```bash
  # Tải code mới về và đặt các commit của bạn lên trên cùng
  git pull --rebase origin main

  # Sau đó đẩy lại lên GitHub
  git push origin main
  ```

#### Lỗi 2: Xung đột mã nguồn (Merge Conflict)
* **Nguyên nhân:** Bạn và đồng đội cùng sửa vào một dòng trong cùng một file.
* **Cách khắc phục:**
  1. Mở file bị báo đỏ trong VS Code. Bạn sẽ thấy các khối đánh dấu:
     ```text
     <<<<<<< HEAD (Current Change - Mã nguồn hiện tại của bạn)
     const API_URL = "http://localhost:4000/api";
     =======
     const API_URL = process.env.VITE_API_URL;
     >>>>>>> origin/main (Incoming Change - Mã nguồn từ GitHub)
     ```
  2. Chọn phương án giữ lại: bấm **Accept Incoming Change**, **Accept Current Change**, hoặc **Accept Both Changes** trong VS Code.
  3. Xóa các ký tự `<<<<<<<`, `=======`, `>>>>>>>` và lưu file.
  4. Tiếp tục quá trình rebase:
     ```bash
     git add .
     git rebase --continue
     git push origin main
     ```

#### Lỗi 3: Lỡ commit file cấu hình bí mật (.env) hoặc thư mục nặng (node_modules)
* **Nguyên nhân:** File `.gitignore` chưa được áp dụng kịp thời.
* **Cách khắc phục:**
  Gỡ bỏ file khỏi Git tracking nhưng vẫn giữ nguyên file trên ổ đĩa máy tính:
  ```bash
  # Gỡ theo dõi file .env
  git rm --cached backend/.env
  git rm --cached frontend/.env

  # Gỡ theo dõi thư mục node_modules nếu lỡ add
  git rm -r --cached node_modules/

  # Commit lại thay đổi gỡ bỏ
  git commit -m "fix(git): loai bo file cau hinh khoi git tracking"
  git push origin main
  ```

---

# PHẦN 3: BẢNG TRA CỨU CÁC CÂU LỆNH HÀNG NGÀY (CHEAT SHEET)

### 📌 Nhóm lệnh Setup & Vận hành

| Câu lệnh | Vị trí chạy | Ý nghĩa tác vụ |
| :--- | :--- | :--- |
| `npm run install:all` | Thư mục gốc `snote/` | Cài đặt dependencies cho root, backend và frontend. |
| `docker compose up -d postgres_db` | Thư mục gốc `snote/` | Khởi động PostgreSQL 16 trong Docker. |
| `npm run db:setup` | Thư mục gốc `snote/` | Generate Prisma, chạy Migrate CSDL và nạp dữ liệu mẫu (Seed). |
| `npm run dev` | Thư mục gốc `snote/` | Khởi chạy song song cả Backend (Port 4000) và Frontend (Port 5173). |
| `npm run type-check` | Thư mục gốc `snote/` | Soát lỗi TypeScript nghiêm ngặt toàn bộ dự án. |
| `npm test` | Thư mục gốc `snote/` | Chạy bộ kiểm thử tự động (84 unit & integration tests). |
| `npm run build` | Thư mục gốc `snote/` | Đóng gói sản phẩm sẵn sàng triển khai thực tế. |
| `npx prisma studio --schema backend/prisma/schema.prisma` | Thư mục gốc `snote/` | Mở giao diện web quản lý Database trực quan trên cổng 5555. |

### 📌 Nhóm lệnh Git & GitHub

| Câu lệnh | Ý nghĩa tác vụ |
| :--- | :--- |
| `git status` | Xem trạng thái các file vừa chỉnh sửa. |
| `git diff` | Xem chi tiết từng dòng code vừa thay đổi so với commit trước. |
| `git add .` | Chuẩn bị toàn bộ file thay đổi vào Staging. |
| `git commit -m "mô tả"` | Đóng gói thay đổi kèm thông điệp rõ ràng. |
| `git pull --rebase origin main` | Tải code mới nhất từ GitHub về máy an toàn, tránh sinh merge commit rác. |
| `git push origin main` | Đẩy mã nguồn từ máy lên nhánh chính GitHub. |
| `git checkout -b <tên-nhánh>` | Tạo và chuyển ngay sang một nhánh làm việc mới. |
| `git branch -a` | Xem danh sách tất cả các nhánh cục bộ và trên GitHub. |
| `git log --oneline -n 10` | Xem lịch sử 10 commit gần nhất dạng rút gọn. |

---

> 🎯 **Lời khuyên cho kỳ bảo vệ đồ án:**  
> Trước mỗi buổi báo cáo hoặc trước khi nộp link GitHub cho giảng viên, hãy luôn chạy `npm run type-check` và `npm test` để đảm bảo mã nguồn của bạn đạt trạng thái hoàn hảo 100%, không phát sinh bất kỳ lỗi cú pháp nào!

