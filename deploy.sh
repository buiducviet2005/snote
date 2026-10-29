#!/usr/bin/env bash

# ==============================================================================
# 🚀 SNOTE – KỊCH BẢN TRIỂN KHAI TỰ ĐỘNG LÊN GCP COMPUTE ENGINE (VM)
# Phương án 1: GCP Compute Engine (VM) + Docker Compose + Nginx Reverse Proxy
# ==============================================================================

set -e

DOMAIN_OR_IP="${1:-}"

echo "=============================================================================="
echo "🚀 BẮT ĐẦU QUY TRÌNH TRIỂN KHAI SNOTE LÊN GCP COMPUTE ENGINE"
echo "=============================================================================="

# 1. Kiểm tra quyền root / sudo
if [ "$EUID" -ne 0 ]; then
  echo "❌ Lỗi: Vui lòng chạy kịch bản này với quyền sudo:"
  echo "   sudo bash deploy.sh [domain_cua_ban]"
  exit 1
fi

CURRENT_DIR=$(pwd)

# 2. Cập nhật hệ điều hành & cài đặt gói cơ bản
echo "[1/6] 🔄 Cập nhật hệ điều hành và cài đặt các công cụ cần thiết..."
apt-get update -qq
apt-get install -y -qq curl git ufw nginx openssl

# 3. Cài đặt Docker & Docker Compose nếu chưa có
if ! command -v docker &> /dev/null; then
    echo "[2/6] 🐳 Đang cài đặt Docker Engine và Docker Compose..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh
else
    echo "[2/6] 🐳 Docker đã được cài đặt: $(docker --version)"
fi

# 4. Xác định IP Public hoặc Domain
if [ -z "$DOMAIN_OR_IP" ]; then
    echo "🔍 Đang tự động phát hiện External IP của GCP VM..."
    DETECTED_IP=$(curl -s -m 5 https://ifconfig.me || curl -s -m 5 https://api.ipify.org || echo "127.0.0.1")
    DOMAIN_OR_IP="$DETECTED_IP"
fi

echo "🌐 Địa chỉ truy cập mục tiêu: $DOMAIN_OR_IP"

# 5. Khởi tạo tệp .env Production cho Docker Compose nếu chưa có
echo "[3/6] 📄 Kiểm tra và cấu hình tệp .env..."
if [ ! -f ".env" ]; then
    RANDOM_DB_PASS=$(openssl rand -hex 12)
    RANDOM_JWT_SEC=$(openssl rand -hex 32)
    RANDOM_REF_SEC=$(openssl rand -hex 32)
    
    PROTOCOL="http"
    if [[ "$DOMAIN_OR_IP" =~ \. ]]; then
        # Nếu có domain thực tế
        if [[ ! "$DOMAIN_OR_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            PROTOCOL="https"
        fi
    fi

    cat <<EOF > .env
POSTGRES_USER=snote_prod_user
POSTGRES_PASSWORD=${RANDOM_DB_PASS}
POSTGRES_DB=snote_prod_db

JWT_SECRET=${RANDOM_JWT_SEC}
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=${RANDOM_REF_SEC}
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=${PROTOCOL}://${DOMAIN_OR_IP}
EOF
    echo " [+] Đã tự động tạo tệp .env với mật khẩu và JWT Secret bảo mật."
else
    echo " [=] Tệp .env đã tồn tại, giữ nguyên cấu hình hiện tại."
fi

# 6. Build Frontend Production Bundle bằng Docker Node runner
echo "[4/6] ⚡ Biên dịch Frontend SPA tối ưu (Production Build)..."
docker run --rm \
  -v "${CURRENT_DIR}:/app" \
  -w /app/frontend \
  node:24-alpine \
  sh -c "npm ci && npm run build"

# 7. Khởi chạy cụm dịch vụ CSDL & Backend qua Docker Compose
echo "[5/6] 🚢 Khởi chạy PostgreSQL & Backend API qua Docker Compose..."
docker compose -f docker-compose.prod.yml up -d --build

# Chờ Backend khởi động và vượt qua Health Check
echo "⏳ Đang đợi Backend hoàn tất Migrate Database và khởi động (tối đa 45s)..."
for i in {1..45}; do
    if curl -s http://127.0.0.1:4000/health | grep -q "ok"; then
        echo " ✅ Backend API đã sẵn sàng và kết nối CSDL thành công!"
        break
    fi
    sleep 1
    if [ "$i" -eq 45 ]; then
        echo " ⚠️ Cảnh báo: Backend chưa phản hồi /health sau 45s. Kiểm tra log:"
        docker compose -f docker-compose.prod.yml logs --tail=20 backend
    fi
done

# 8. Cấu hình Nginx Reverse Proxy trên Host
echo "[6/6] 🛡️ Thiết lập Nginx Reverse Proxy và Tường lửa UFW..."
cat <<EOF > /etc/nginx/sites-available/snote
server {
    listen 80;
    server_name ${DOMAIN_OR_IP};
    root ${CURRENT_DIR}/frontend/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /health {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host \$host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/snote /etc/nginx/sites-enabled/snote
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# 9. Bật Tường lửa UFW
ufw allow OpenSSH > /dev/null 2>&1 || ufw allow 22/tcp > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1 || ufw allow 80/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1

echo ""
echo "=============================================================================="
echo "🎉 TRIỂN KHAI THÀNH CÔNG HỆ THỐNG SNOTE TRÊN GCP COMPUTE ENGINE!"
echo "=============================================================================="
echo "📍 Địa chỉ ứng dụng: http://${DOMAIN_OR_IP}"
echo "🔍 Kiểm tra trạng thái Backend: http://${DOMAIN_OR_IP}/health"
echo ""
echo "💡 Gợi ý cấu hình SSL HTTPS miễn phí (nếu đã trỏ Domain):"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d ${DOMAIN_OR_IP}"
echo "=============================================================================="
