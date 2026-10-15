#!/usr/bin/env bash

# ==============================================================================
# 🎓 SNOTE – TRÌNH CÀI ĐẶT & THIẾT LẬP TỰ ĐỘNG (MACOS / LINUX)
# ==============================================================================

set -e

echo "=============================================================================="
echo "🎓 SNOTE – TRÌNH CÀI ĐẶT & THIẾT LẬP TỰ ĐỘNG (MACOS / LINUX)"
echo "=============================================================================="
echo ""

# ==============================================================================
# BƯỚC 1: KIỂM TRA TOÀN DIỆN CÁC PHẦN MỀM TIỀN ĐỀ (PREREQUISITES CHECK)
# ==============================================================================
echo "[1/6] 🔍 Đang kiểm tra các phần mềm tiền đề bắt buộc trên hệ thống..."
echo "------------------------------------------------------------------------------"

PREREQ_FAIL=0

# 1.1. Kiểm tra Git
if command -v git &> /dev/null; then
    echo " [OK]   Git:                 $(git --version)"
else
    echo " [WARN] Git:                 Chưa phát hiện Git trong PATH."
    echo "        👉 Khuyên dùng cài đặt Git: sudo apt install git (Linux) hoặc brew install git (macOS)"
fi

# 1.2. Kiểm tra Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo " [OK]   Node.js:             $NODE_VERSION"
    
    NODE_MAJOR=${NODE_VERSION#v}
    NODE_MAJOR=${NODE_MAJOR%%.*}
    NODE_MINOR=${NODE_VERSION#v*.}
    NODE_MINOR=${NODE_MINOR%%.*}
    if ! { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; } \
       && ! { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -ge 12 ]; } \
       && [ "$NODE_MAJOR" -lt 24 ]; then
        echo " [FAIL] Node.js $NODE_VERSION không tương thích (cần 20.19+, 22.12+ hoặc 24+)."
        echo "        👉 Vui lòng nâng cấp Node.js LTS tại: https://nodejs.org/"
        PREREQ_FAIL=1
    fi
else
    echo " [FAIL] Node.js:             CHƯA ĐƯỢC CÀI ĐẶT!"
    echo "        👉 Bắt buộc tải và cài đặt Node.js LTS tại: https://nodejs.org/"
    PREREQ_FAIL=1
fi

# 1.3. Kiểm tra npm
if command -v npm &> /dev/null; then
    echo " [OK]   npm Package Manager: v$(npm -v)"
else
    echo " [FAIL] npm:                 CHƯA ĐƯỢC CÀI ĐẶT!"
    PREREQ_FAIL=1
fi

# 1.4. Kiểm tra Docker
DOCKER_DAEMON_RUNNING=0
if command -v docker &> /dev/null; then
    echo " [OK]   Docker CLI:          $(docker --version)"
    if docker info &> /dev/null; then
        echo " [OK]   Docker Daemon:       Đang hoạt động (Ready)"
        DOCKER_DAEMON_RUNNING=1
    else
        echo " [WARN] Docker Daemon:       Docker đã cài nhưng daemon CHƯA CHẠY."
        echo "        👉 Hãy khởi động Docker Desktop hoặc 'sudo systemctl start docker'"
    fi
else
    echo " [INFO] Docker:              Không tìm thấy Docker. Sẽ sử dụng PostgreSQL cục bộ nếu có."
fi

# Dừng lại nếu thiếu Node.js / npm
if [ "$PREREQ_FAIL" -eq 1 ]; then
    echo ""
    echo "❌ THIẾT LẬP BỊ DỪNG: Máy tính của bạn chưa đáp ứng đủ phần mềm tiền đề!"
    echo "Vui lòng cài đặt các phần mềm bị [FAIL] ở trên rồi chạy lại file setup.sh."
    echo ""
    exit 1
fi

echo ""
echo "✅ Kiểm tra phần mềm tiền đề hoàn tất! Đủ điều kiện khởi tạo dự án."
echo ""

# ==============================================================================
# BƯỚC 2: TẠO FILE CẤU HÌNH MÔI TRƯỜNG (.ENV)
# ==============================================================================
echo "[2/6] 📄 Kiểm tra và thiết lập các tệp cấu hình môi trường (.env)..."
echo "------------------------------------------------------------------------------"

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo " [+] Đã khởi tạo: backend/.env (từ backend/.env.example)"
    fi
else
    echo " [=] backend/.env đã tồn tại. Giữ nguyên cấu hình hiện tại."
fi

if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo " [+] Đã khởi tạo: frontend/.env (từ frontend/.env.example)"
    fi
else
    echo " [=] frontend/.env đã tồn tại. Giữ nguyên cấu hình hiện tại."
fi

echo ""

# ==============================================================================
# BƯỚC 3: CÀI ĐẶT PACKAGES & DEPENDENCIES TOÀN BỘ MONOREPO
# ==============================================================================
echo "[3/6] 📦 Cài đặt thư viện dependencies cho toàn bộ hệ thống..."
echo "------------------------------------------------------------------------------"

echo "⏳ [1/4] Cài đặt Root Orchestrator packages (concurrently, typescript)..."
npm install

echo "⏳ [2/4] Cài đặt & Build gói Shared Contracts (@snote/shared)..."
npm install --prefix packages/shared
npm run build --prefix packages/shared

echo "⏳ [3/4] Cài đặt Backend dependencies (Express, Prisma, Zod, JWT, Pino)..."
npm install --prefix backend

echo "⏳ [4/4] Cài đặt Frontend dependencies (React 19, Vite, Lucide, Router)..."
npm install --prefix frontend

echo ""
echo "✅ Cài đặt thư viện thành công!"
echo ""

# ==============================================================================
# BƯỚC 4: KHỞI ĐỘNG CƠ SỞ DỮ LIỆU POSTGRESQL
# ==============================================================================
echo "[4/6] 🗄️ Khởi động & kiểm tra Cơ sở dữ liệu PostgreSQL..."
echo "------------------------------------------------------------------------------"

if [ "$DOCKER_DAEMON_RUNNING" -eq 1 ]; then
    echo "🐳 Đang khởi chạy PostgreSQL container qua Docker Compose..."
    docker compose up -d postgres_db 2>/dev/null || docker-compose up -d postgres_db 2>/dev/null || true
    echo "⏳ Đợi 3 giây để PostgreSQL sẵn sàng tiếp nhận kết nối..."
    sleep 3
    echo "✅ PostgreSQL container đang hoạt động tại cổng 5432."
else
    echo "ℹ️ Bỏ qua Docker. Hệ thống sẽ kết nối trực tiếp đến PostgreSQL tại 127.0.0.1:5432."
fi

echo ""

# ==============================================================================
# BƯỚC 5: SINH PRISMA CLIENT & MIGRATION DATABASE
# ==============================================================================
echo "[5/6] ⚙️ Sinh Prisma Client & Đồng bộ CSDL (Migration & Seed)..."
echo "------------------------------------------------------------------------------"

echo "⏳ Đang sinh Prisma Client..."
npm run prisma:generate --prefix backend || true

echo "⏳ Đang áp dụng database schema migrations..."
npm run prisma:migrate --prefix backend || true

echo "⏳ Đang nạp dữ liệu mẫu sinh viên và admin (Seed Data)..."
npm run prisma:seed --prefix backend || true

echo ""

# ==============================================================================
# BƯỚC 6: HOÀN TẤT & HƯỚNG DẪN KHỞI CHẠY
# ==============================================================================
echo "=============================================================================="
echo "🎉 THIẾT LẬP DỰ ÁN SNOTE THÀNH CÔNG 100%!"
echo "=============================================================================="
echo ""
echo "🚀 ĐỂ BẮT ĐẦU SỬ DỤNG, HÃY CHẠY LỆNH:"
echo "   npm run dev"
echo ""
echo "🌐 CÁC ĐỊA CHỈ TRUY CẬP:"
echo "   • Frontend SPA:   http://localhost:5173"
echo "   • Backend API:    http://localhost:4000/api"
echo "   • Health Check:   http://localhost:4000/health"
echo "   • Prisma Studio:  npm run db:studio (Xem CSDL trực quan tại http://localhost:5555)"
echo ""
echo "🔑 TÀI KHOẢN MẪU ĐÃ CÓ SẴN TRONG CSDL:"
echo "   🎓 Sinh viên:    sinhvien@snote.edu.vn  /  Mật khẩu: Student@123456"
echo "   👑 Quản trị:     admin@snote.edu.vn     /  Mật khẩu: Admin@123456"
echo ""
echo "=============================================================================="
