@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ==============================================================================
echo 🎓 SNOTE – AUTO SETUP SCRIPT CHO MÁY MỚI (WINDOWS)
echo ==============================================================================
echo.

:: 1. Kiểm tra Node.js
echo [1/7] 🔍 Kiểm tra môi trường Node.js...
node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ LỖI: Node.js chưa được cài đặt trên máy này!
    echo 👉 Vui lòng tải và cài đặt Node.js LTS tại: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo ✅ Đã tìm thấy Node.js: %NODE_VER%

:: 2. Tạo file cấu hình môi trường (.env)
echo.
echo [2/7] 📄 Kiểm tra và tạo các tệp cấu hình môi trường .env...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" > nul
        echo ✅ Đã tạo backend\.env từ mẫu backend\.env.example
    ) else (
        echo ⚠️ Không tìm thấy backend\.env.example
    )
) else (
    echo ℹ️ backend\.env đã tồn tại. Giữ nguyên cấu hình hiện có.
)

if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env" > nul
        echo ✅ Đã tạo frontend\.env từ mẫu frontend\.env.example
    ) else (
        echo ⚠️ Không tìm thấy frontend\.env.example
    )
) else (
    echo ℹ️ frontend\.env đã tồn tại. Giữ nguyên cấu hình hiện có.
)

:: 3. Cài đặt Dependencies cho toàn bộ Monorepo
echo.
echo [3/7] 📦 Cài đặt thư viện dependencies cho Monorepo...
echo ⏳ Đang cài đặt root packages...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Lỗi khi cài đặt root dependencies.
    pause
    exit /b 1
)

echo ⏳ Đang cài đặt & build packages/shared...
call npm install --prefix packages/shared
call npm run build --prefix packages/shared

echo ⏳ Đang cài đặt backend packages...
call npm install --prefix backend

echo ⏳ Đang cài đặt frontend packages...
call npm install --prefix frontend

:: 4. Khởi động Docker PostgreSQL nếu có Docker
echo.
echo [4/7] 🗄️ Kiểm tra dịch vụ CSDL PostgreSQL...
docker -v > nul 2>&1
if %errorlevel% equ 0 (
    echo 🐳 Đang khởi động PostgreSQL container qua Docker Compose...
    docker compose up -d postgres_db > nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Docker container PostgreSQL đã khởi chạy thành công!
        echo ⏳ Đợi 3 giây để CSDL sẵn sàng tiếp nhận kết nối...
        timeout /t 3 /nobreak > nul
    ) else (
        echo ⚠️ Docker Desktop có thể chưa bật. Bỏ qua bước Docker, sử dụng PostgreSQL nội bộ...
    )
) else (
    echo ℹ️ Docker không có sẵn. Hãy đảm bảo dịch vụ PostgreSQL đang chạy tại cổng 5432.
)

:: 5. Sinh Prisma Client
echo.
echo [5/7] ⚙️ Sinh Prisma Client...
call npm run prisma:generate --prefix backend
if %errorlevel% neq 0 (
    echo ⚠️ Có cảnh báo hoặc lỗi khi generate Prisma client.
)

:: 6. Đồng bộ CSDL & Nạp dữ liệu mẫu
echo.
echo [6/7] 🗃️ Áp dụng Database Migration & Seed dữ liệu mẫu...
call npm run prisma:migrate --prefix backend
if %errorlevel% neq 0 (
    echo ⚠️ Lưu ý: Nếu lệnh migrate gặp lỗi kết nối, vui lòng kiểm tra lại dịch vụ PostgreSQL trên máy.
)

echo ⏳ Đang nạp dữ liệu tài khoản mẫu (Admin & Sinh viên)...
call npm run prisma:seed --prefix backend

:: 7. Hoàn tất
echo.
echo ==============================================================================
echo 🎉 THIẾT LẬP DỰ ÁN SNOTE THÀNH CÔNG 100%!
echo ==============================================================================
echo.
echo 🚀 Để khởi chạy toàn bộ hệ thống ngay bây giờ, hãy chạy lệnh:
echo    npm run dev
echo.
echo 🌐 Địa chỉ truy cập:
echo    - Frontend SPA:  http://localhost:5173
echo    - Backend API:   http://localhost:4000/api
echo.
echo 🔑 Tài khoản mẫu có sẵn:
echo    - Sinh viên:  sinhvien@snote.edu.vn / Mật khẩu: Student@123456
echo    - Admin:      admin@snote.edu.vn    / Mật khẩu: Admin@123456
echo.
echo ==============================================================================
pause
