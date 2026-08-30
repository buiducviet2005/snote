@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ==============================================================================
echo 🎓 SNOTE – TRÌNH CÀI ĐẶT & THIẾT LẬP TỰ ĐỘNG (WINDOWS)
echo ==============================================================================
echo.

:: ==============================================================================
:: BƯỚC 1: KIỂM TRA TOÀN DIỆN CÁC PHẦN MỀM TIỀN ĐỀ (PREREQUISITES CHECK)
:: ==============================================================================
echo [1/6] 🔍 Đang kiểm tra các phần mềm tiền đề bắt buộc trên hệ thống...
echo ------------------------------------------------------------------------------

set PREREQ_FAIL=0

:: 1.1. Kiểm tra Git
git --version > nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%g in ('git --version') do (
        echo  [OK]   Git:                 %%g
    )
) else (
    echo  [WARN] Git:                 Chưa phát hiện Git trong PATH.
    echo         👉 Khuyên dùng cài đặt Git tại: https://git-scm.com/
)

:: 1.2. Kiểm tra Node.js
node -v > nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
    echo  [OK]   Node.js:             !NODE_VERSION!
    
    :: Kiểm tra version >= 18
    for /f "tokens=1 delims=." %%a in ("!NODE_VERSION:~1!") do set NODE_MAJOR=%%a
    if !NODE_MAJOR! lss 18 (
        echo  [FAIL] Phiên bản Node.js hiện tại (!NODE_VERSION!) quá cũ ^(Yêu cầu tối thiểu ^>= v18.0.0^).
        echo         👉 Vui lòng nâng cấp Node.js LTS tại: https://nodejs.org/
        set PREREQ_FAIL=1
    )
) else (
    echo  [FAIL] Node.js:             CHƯA ĐƯỢC CÀI ĐẶT!
    echo         👉 Bắt buộc tải và cài đặt Node.js LTS tại: https://nodejs.org/
    set PREREQ_FAIL=1
)

:: 1.3. Kiểm tra npm
npm -v > nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%m in ('npm -v') do (
        echo  [OK]   npm Package Manager: v%%m
    )
) else (
    echo  [FAIL] npm:                 CHƯA ĐƯỢC CÀI ĐẶT!
    set PREREQ_FAIL=1
)

:: 1.4. Kiểm tra Docker / PostgreSQL
set DOCKER_AVAILABLE=0
set DOCKER_DAEMON_RUNNING=0

docker -v > nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%d in ('docker -v') do (
        echo  [OK]   Docker CLI:          %%d
    )
    set DOCKER_AVAILABLE=1
    
    docker info > nul 2>&1
    if !errorlevel! equ 0 (
        echo  [OK]   Docker Daemon:       Đang hoạt động (Ready)
        set DOCKER_DAEMON_RUNNING=1
    ) else (
        echo  [WARN] Docker Daemon:       Docker Desktop đã cài nhưng CHƯA BẬT.
        echo         👉 Hãy mở ứng dụng Docker Desktop nếu muốn tự động chạy DB bằng Docker.
    )
) else (
    echo  [INFO] Docker:              Không tìm thấy Docker.
    echo         ℹ️ Hệ thống sẽ sử dụng dịch vụ PostgreSQL cục bộ nếu đã cài đặt.
)

:: Dừng lại nếu thiếu Node.js hoặc npm
if !PREREQ_FAIL! equ 1 (
    echo.
    echo ❌ THIẾT LẬP BỊ DỪNG: Máy tính của bạn chưa đáp ứng đủ phần mềm tiền đề!
    echo Vui lòng cài đặt các phần mềm bị [FAIL] ở trên rồi chạy lại file setup.bat.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Kiểm tra phần mềm tiền đề hoàn tất! Đủ điều kiện khởi tạo dự án.
echo.

:: ==============================================================================
:: BƯỚC 2: TẠO FILE CẤU HÌNH MÔI TRƯỜNG (.ENV)
:: ==============================================================================
echo [2/6] 📄 Kiểm tra và thiết lập các tệp cấu hình môi trường (.env)...
echo ------------------------------------------------------------------------------

if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" > nul
        echo  [+] Đã khởi tạo: backend\.env (từ backend\.env.example)
    ) else (
        echo  [!] Không tìm thấy template backend\.env.example
    )
) else (
    echo  [=] backend\.env đã tồn tại. Giữ nguyên cấu hình hiện tại.
)

if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env" > nul
        echo  [+] Đã khởi tạo: frontend\.env (từ frontend\.env.example)
    ) else (
        echo  [!] Không tìm thấy template frontend\.env.example
    )
) else (
    echo  [=] frontend\.env đã tồn tại. Giữ nguyên cấu hình hiện tại.
)

echo.

:: ==============================================================================
:: BƯỚC 3: CÀI ĐẶT PACKAGES & DEPENDENCIES TOÀN BỘ MONOREPO
:: ==============================================================================
echo [3/6] 📦 Cài đặt thư viện dependencies cho toàn bộ hệ thống...
echo ------------------------------------------------------------------------------

echo ⏳ [1/4] Cài đặt Root Orchestrator packages (concurrently, typescript)...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Lỗi khi cài đặt root dependencies!
    pause
    exit /b 1
)

echo ⏳ [2/4] Cài đặt & Build gói Shared Contracts (@snote/shared)...
call npm install --prefix packages/shared
call npm run build --prefix packages/shared

echo ⏳ [3/4] Cài đặt Backend dependencies (Express, Prisma, Zod, JWT, Pino)...
call npm install --prefix backend

echo ⏳ [4/4] Cài đặt Frontend dependencies (React 19, Vite, Lucide, Router)...
call npm install --prefix frontend

echo.
echo ✅ Cài đặt thư viện thành công!
echo.

:: ==============================================================================
:: BƯỚC 4: KHỞI ĐỘNG CƠ SỞ DỮ LIỆU POSTGRESQL
:: ==============================================================================
echo [4/6] 🗄️ Khởi động & kiểm tra Cơ sở dữ liệu PostgreSQL...
echo ------------------------------------------------------------------------------

if !DOCKER_DAEMON_RUNNING! equ 1 (
    echo 🐳 Đang khởi chạy PostgreSQL container qua Docker Compose...
    docker compose up -d postgres_db
    echo ⏳ Đợi 3 giây để PostgreSQL sẵn sàng tiếp nhận kết nối...
    timeout /t 3 /nobreak > nul
    echo ✅ PostgreSQL container đang hoạt động tại cổng 5432.
) else (
    echo ℹ️ Bỏ qua Docker. Hệ thống sẽ kết nối trực tiếp đến PostgreSQL tại 127.0.0.1:5432.
)

echo.

:: ==============================================================================
:: BƯỚC 5: SINH PRISMA CLIENT & MIGRATION DATABASE
:: ==============================================================================
echo [5/6] ⚙️ Sinh Prisma Client & Đồng bộ CSDL (Migration ^& Seed)...
echo ------------------------------------------------------------------------------

echo ⏳ Đang sinh Prisma Client...
call npm run prisma:generate --prefix backend

echo ⏳ Đang áp dụng database schema migrations...
call npm run prisma:migrate --prefix backend
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ CẢNH BÁO: Lệnh migrate chưa thể kết nối đến PostgreSQL.
    echo 👉 Nếu bạn dùng Docker: Hãy đảm bảo Docker Desktop đã bật và chạy lại setup.bat.
    echo 👉 Nếu bạn dùng PostgreSQL cài trên máy: Hãy đảm bảo service PostgreSQL đang Start ở cổng 5432.
    echo.
) else (
    echo ⏳ Đang nạp dữ liệu mẫu sinh viên và admin (Seed Data)...
    call npm run prisma:seed --prefix backend
)

echo.

:: ==============================================================================
:: BƯỚC 6: HOÀN TẤT & HƯỚNG DẪN KHỞI CHẠY
:: ==============================================================================
echo ==============================================================================
echo 🎉 THIẾT LẬP DỰ ÁN SNOTE THÀNH CÔNG 100%!
echo ==============================================================================
echo.
echo 🚀 ĐỂ BẮT ĐẦU SỬ DỤNG, HÃY CHẠY LỆNH:
echo    npm run dev
echo.
echo 🌐 CÁC ĐỊA CHỈ TRUY CẬP:
echo    • Frontend SPA:   http://localhost:5173
echo    • Backend API:    http://localhost:4000/api
echo    • Health Check:   http://localhost:4000/health
echo    • Prisma Studio:  npm run db:studio (Xem CSDL trực quan tại http://localhost:5555)
echo.
echo 🔑 TÀI KHOẢN MẪU ĐÃ CÓ SẴN TRONG CSDL:
echo    🎓 Sinh viên:    sinhvien@snote.edu.vn  /  Mật khẩu: Student@123456
echo    👑 Quản trị:     admin@snote.edu.vn     /  Mật khẩu: Admin@123456
echo.
echo ==============================================================================
pause
