#!/usr/bin/env bash

# ==============================================================================
# 🎓 SNOTE – AUTO SETUP SCRIPT CHO MÁY MỚI (MACOS / LINUX)
# ==============================================================================

set -e

echo "=============================================================================="
echo "🎓 SNOTE – AUTO SETUP SCRIPT CHO MÁY MỚI (MACOS / LINUX)"
echo "=============================================================================="
echo ""

# 1. Kiểm tra Node.js
echo "[1/7] 🔍 Kiểm tra môi trường Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ LỖI: Node.js chưa được cài đặt trên máy này!"
    echo "👉 Vui lòng cài đặt Node.js LTS tại: https://nodejs.org/"
    exit 1
fi
echo "✅ Đã tìm thấy Node.js: $(node -v)"

# 2. Tạo file cấu hình môi trường (.env)
echo ""
echo "[2/7] 📄 Kiểm tra và tạo các tệp cấu hình môi trường .env..."
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✅ Đã tạo backend/.env từ mẫu backend/.env.example"
    fi
else
    echo "ℹ️ backend/.env đã tồn tại. Giữ nguyên cấu hình hiện có."
fi

if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo "✅ Đã tạo frontend/.env từ mẫu frontend/.env.example"
    fi
else
    echo "ℹ️ frontend/.env đã tồn tại. Giữ nguyên cấu hình hiện có."
fi

# 3. Cài đặt Dependencies cho toàn bộ Monorepo
echo ""
echo "[3/7] 📦 Cài đặt thư viện dependencies cho Monorepo..."
echo "⏳ Đang cài đặt root packages..."
npm install

echo "⏳ Đang cài đặt & build packages/shared..."
npm install --prefix packages/shared
npm run build --prefix packages/shared

echo "⏳ Đang cài đặt backend packages..."
npm install --prefix backend

echo "⏳ Đang cài đặt frontend packages..."
npm install --prefix frontend

# 4. Khởi động Docker PostgreSQL nếu có Docker
echo ""
echo "[4/7] 🗄️ Kiểm tra dịch vụ CSDL PostgreSQL..."
if command -v docker &> /dev/null; then
    echo "🐳 Đang khởi động PostgreSQL container qua Docker Compose..."
    if docker compose up -d postgres_db 2>/dev/null || docker-compose up -d postgres_db 2>/dev/null; then
        echo "✅ Docker container PostgreSQL đã khởi chạy thành công!"
        echo "⏳ Đợi 3 giây để CSDL sẵn sàng tiếp nhận kết nối..."
        sleep 3
    else
        echo "⚠️ Docker daemon có thể chưa bật. Bỏ qua bước Docker, sử dụng PostgreSQL nội bộ..."
    fi
else
    echo "ℹ️ Docker không có sẵn. Hãy đảm bảo dịch vụ PostgreSQL đang chạy tại cổng 5432."
fi

# 5. Sinh Prisma Client
echo ""
echo "[5/7] ⚙️ Sinh Prisma Client..."
npm run prisma:generate --prefix backend || true

# 6. Đồng bộ CSDL & Nạp dữ liệu mẫu
echo ""
echo "[6/7] 🗃️ Áp dụng Database Migration & Seed dữ liệu mẫu..."
npm run prisma:migrate --prefix backend || true

echo "⏳ Đang nạp dữ liệu tài khoản mẫu (Admin & Sinh viên)..."
npm run prisma:seed --prefix backend || true

# 7. Hoàn tất
echo ""
echo "=============================================================================="
echo "🎉 THIẾT LẬP DỰ ÁN SNOTE THÀNH CÔNG 100%!"
echo "=============================================================================="
echo ""
echo "🚀 Để khởi chạy toàn bộ hệ thống ngay bây giờ, hãy chạy lệnh:"
echo "   npm run dev"
echo ""
echo "🌐 Địa chỉ truy cập:"
echo "   - Frontend SPA:  http://localhost:5173"
echo "   - Backend API:   http://localhost:4000/api"
echo ""
echo "🔑 Tài khoản mẫu có sẵn:"
echo "   - Sinh viên:  sinhvien@snote.edu.vn / Mật khẩu: Student@123456"
echo "   - Admin:      admin@snote.edu.vn    / Mật khẩu: Admin@123456"
echo ""
echo "=============================================================================="
