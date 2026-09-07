# 🌐 HƯỚNG DẪN TRIỂN KHAI PRODUCTION, CHI PHÍ VẬN HÀNH & DI CHUYỂN VPS (SNOTE)

Tài liệu này tổng hợp toàn diện:

1. **Quy trình triển khai hệ thống SNOTE lên Cloud Server / VPS thực tế (Từ A đến Z)**.
2. **Bảng dự toán & tối ưu chi phí vận hành hàng tháng**.
3. **Quy trình di chuyển hệ thống sang VPS khác nhanh chóng (Server Migration trong 5 phút)**.
4. **Cơ chế sao lưu CSDL tự động hàng ngày (Auto-Backup Cron Job)**.

---

## 🏗️ 1. MÔ HÌNH KIẾN TRÚC MẠNG PRODUCTION

```mermaid
graph TD
    User["👨‍🎓 Người dùng (Web Browser / Mobile)"] -->|HTTPS (Port 443)| Cloudflare["Cloudflare / DNS"]
    Cloudflare -->|SSL Traffic| Nginx["Nginx Reverse Proxy (VPS Server)"]
    
    subgraph "Máy chủ Ubuntu / Debian VPS"
        Nginx -->|Phục vụ File tĩnh SPA| FrontendStatic["/var/www/snote/frontend/dist<br>(HTML, CSS, JS)"]
        Nginx -->|Reverse Proxy /api/ & /health| BackendNode["Backend Node.js (Port 4000)<br>Express 5 + Prisma (PM2)"]
        BackendNode -->|Network nội bộ| PostgresDB[("🐘 PostgreSQL 16 (Port 5432)<br>Docker Container")]
    end
```



---



## 💰 2. BẢNG DỰ TOÁN & TỐI ƯU CHI PHÍ VẬN HÀNH


| Hạng mục                  | Dịch vụ đề xuất                                                            | Chi phí ước tính (VNĐ / Tháng)               | Ghi chú & Đặc điểm                                                                 |
| ------------------------- | -------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Máy chủ VPS**           | DigitalOcean, Hetzner, Vultr hoặc VPS Việt Nam (Viettel IDC, VNPT, BKHOST) | **100.000 – 150.000 đ** *(~$4 – $6 / tháng)* | Cấu hình 1 vCPU, 2GB RAM, 25GB SSD đủ phục vụ đồng thời **500 – 1.000 sinh viên**. |
| **Tên miền (Domain)**     | Namecheap, Cloudflare, Pavietnam                                           | **~20.000 – 25.000 đ** *(~250.000 đ / năm)*  | Tên miền `.com` hoặc `.net`. *(Dùng domain trường: **0 đồng**)*.                   |
| **Cơ sở dữ liệu**         | PostgreSQL 16 chạy trên Docker VPS                                         | **0 đ**                                      | Mã nguồn mở 100%, không tốn phí bản quyền CSDL.                                    |
| **Trí tuệ nhân tạo (AI)** | Google Gemini API (Gemini 2.0 / 1.5 Flash)                                 | **0 đ – 50.000 đ**                           | **Free Tier miễn phí** 15 req/phút & 1 triệu token/ngày.                           |
| **Chứng chỉ SSL (HTTPS)** | Let's Encrypt (Certbot)                                                    | **0 đ**                                      | Miễn phí 100% vĩnh viễn, tự động gia hạn.                                          |
| **CDN & Chống DDoS**      | Cloudflare Free Tier                                                       | **0 đ**                                      | Tăng tốc độ tải trang toàn cầu và bảo vệ website.                                  |


> 👉 **Kịch bản Tiêu chuẩn:** Tổng chi phí trọn gói chỉ khoảng **~150.000 VNĐ / tháng** *(Rẻ và tiết kiệm tối đa cho đồ án / sản phẩm thực tế)*.  
> 👉 **Kịch bản Miễn phí 0đ:** Deploy Frontend lên Vercel + Backend lên Render + CSDL lên Neon.tech / Supabase (0đ/tháng).

---



## 🚀 3. QUY TRÌNH 6 BƯỚC TRIỂN KHAI LÊN VPS MỚI (TỪ A ĐẾN Z)



### Bước 1: Cấu hình DNS Tên miền

Vào trang quản lý tên miền (hoặc Cloudflare) và tạo bản ghi:

- **Type:** `A`
- **Name:** `@` (hoặc `snote`)
- **Value (IP):** `Địa chỉ IPv4 của VPS`
- **TTL:** `Auto` (hoặc `300s`)

---



### Bước 2: Kết nối VPS & Cài đặt Môi trường

Mở Terminal trên máy tính và kết nối SSH vào VPS:

```bash
ssh root@<IP_CUA_VPS>
```

Cập nhật hệ điều hành và cài đặt các công cụ:

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt Git, Nginx, Certbot SSL và tường lửa UFW
sudo apt install -y git curl ufw nginx certbot python3-certbot-nginx

# 3. Cài đặt Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Cài đặt Node.js 24 LTS & PM2 (Process Manager)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---



### Bước 3: Tải Mã Nguồn & Cấu hình Biến Môi trường

```bash
sudo mkdir -p /var/www/snote
sudo git clone https://github.com/naverisme/snote.git /var/www/snote
cd /var/www/snote
```

Tạo cấu hình biến môi trường Production:

#### 📄 `backend/.env`:

```bash
nano backend/.env
```

*Dán nội dung cấu hình:*

```env
PORT=4000
NODE_ENV=production
DATABASE_URL="postgresql://snote_prod_user:MatKhauManh2026@127.0.0.1:5432/snote_prod_db?schema=public"

# Sinh khóa ngẫu nhiên: openssl rand -hex 32
JWT_SECRET="c4a8f93e7b1a2d5f8c6e9a0b3d5f7e1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="f1e3d5c7b9a1f3e5d7c9b1a3f5e7d9c1b3a5f7e9d1c3b5a7f9e1d3c5b7a9f1e3"
JWT_REFRESH_EXPIRES_IN="7d"

# Tên miền chính thức của bạn
CORS_ORIGIN="https://snote.yourdomain.com"
```



#### 📄 `frontend/.env`:

```bash
nano frontend/.env
```

*Dán nội dung cấu hình:*

```env
VITE_API_BASE_URL=https://snote.yourdomain.com/api
```

---



### Bước 4: Khởi chạy CSDL & Triển khai Backend API

```bash
# 1. Cài đặt dependencies toàn bộ Monorepo
npm run install:all

# 2. Khởi động PostgreSQL Production Container
docker compose -f docker-compose.prod.yml up -d postgres_db

# 3. Đồng bộ CSDL & Nạp dữ liệu mẫu ban đầu
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
npm run prisma:seed --prefix backend

# 4. Build Backend và chạy ngầm 24/7 với PM2
npm run build --prefix backend
pm2 start backend/dist/server.js --name "snote-backend"
pm2 save
pm2 startup
```

---



### Bước 5: Build Frontend & Cấu hình Nginx Virtual Host

```bash
# 1. Build Frontend thành file tĩnh tối ưu
npm run build --prefix frontend

# 2. Tạo Virtual Host Nginx từ mẫu có sẵn
sudo cp nginx.conf.example /etc/nginx/sites-available/snote
```

Mở file để đổi `snote.yourdomain.com` thành tên miền thật của bạn:

```bash
sudo nano /etc/nginx/sites-available/snote
```

Kích hoạt cấu hình Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/snote /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---



### Bước 6: Cài đặt Chứng chỉ SSL HTTPS Miễn phí & Bật Tường lửa

```bash
# 1. Tự động lấy chứng chỉ SSL HTTPS từ Let's Encrypt
sudo certbot --nginx -d snote.yourdomain.com

# 2. Bật tường lửa bảo vệ máy chủ (Chỉ mở cổng 22, 80, 443)
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

👉 **Hoàn tất!** Ứng dụng đã chạy chính thức tại: `https://snote.yourdomain.com`.

---



## ⚡ 4. QUY TRÌNH DI CHUYỂN SANG VPS KHÁC (SERVER MIGRATION TRONG 5 PHÚT)

Khi bạn muốn đổi sang một VPS mới (nâng cấp máy chủ hoặc đổi nhà cung cấp), bạn **không cần cấu hình lại từ đầu**:

```mermaid
graph LR
    A["1. VPS Cũ<br>Chạy lệnh pg_dump ra file .sql"] -->|Tải file sang| B["2. VPS Mới<br>Git Clone & Chạy ./setup.sh<br>Nạp lại file .sql"]
    B -->|Đổi IP| C["3. DNS Domain<br>Sửa Record A sang IP mới"]
```





### 1️⃣ Bước 1 (Trên VPS cũ): Xuất CSDL ra 1 tệp duy nhất

```bash
docker exec -t snote_prod_postgres pg_dump -U snote_prod_user snote_prod_db > snote_backup.sql
```



### 2️⃣ Bước 2 (Trên VPS mới): Tự động thiết lập & Nạp dữ liệu

```bash
# 1. Kéo mã nguồn từ GitHub
git clone https://github.com/naverisme/snote.git /var/www/snote
cd /var/www/snote

# 2. Chạy script tự động 1-Click
chmod +x setup.sh && ./setup.sh

# 3. Nạp lại toàn bộ dữ liệu CSDL cũ vào VPS mới
cat snote_backup.sql | docker exec -i snote_prod_postgres psql -U snote_prod_user snote_prod_db
```



### 3️⃣ Bước 3 (Trên DNS Domain): Đổi IP sang VPS mới

Sửa bản ghi `A Record` sang địa chỉ IP của VPS mới và chạy lại lệnh `sudo certbot --nginx -d snote.yourdomain.com`.

---



## ⏰ 5. TỰ ĐỘNG HÓA SAO LƯU CSDL HÀNG NGÀY (CRON JOB)

Để đảm bảo an toàn dữ liệu 100%, bạn có thể tạo Cron Job trên VPS để tự động xuất bản sao CSDL mỗi đêm lúc 02:00 sáng:

1. Mở bảng lập lịch:
  ```bash
   crontab -e 
  ```
2. Thêm dòng sau vào cuối file:
  ```cron
   0 2 * * * docker exec -t snote_prod_postgres pg_dump -U snote_prod_user snote_prod_db > /var/backups/snote_$(date +\%Y\%m\%d).sql
  ```

---



## 🔄 6. LỆNH CẬP NHẬT KHI CÓ CODE MỚI TỪ GITHUB

Mỗi khi bạn đẩy tính năng mới lên GitHub, trên VPS bạn chỉ cần chạy:

```bash
cd /var/www/snote
git pull origin main
npm run install:all
npm run build
pm2 restart snote-backend
```

