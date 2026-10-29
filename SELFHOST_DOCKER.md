# Chạy toàn bộ SNOTE bằng Docker trên máy cá nhân

`docker-compose.selfhost.yml` chạy ba container: `frontend` (Nginx phục vụ React và chuyển `/api` sang backend), `backend` (Express và Prisma), `postgres_db` (PostgreSQL). Không mount mã nguồn hoặc `node_modules` từ Windows vào container. Chỉ cổng web `127.0.0.1:8080` được mở trên máy; API và database chỉ giao tiếp trong mạng Docker.

## Khởi chạy

Yêu cầu Docker Desktop ở chế độ Linux containers, engine đang chạy. Tại thư mục gốc dự án:

Trên máy hiện tại, Docker Desktop đang báo `stopped` và log ghi `no virtualization available` dù CPU đã bật virtualization trong firmware. Hãy mở PowerShell bằng **Run as administrator**, chạy `wsl --install --no-distribution`, khởi động lại Windows, rồi mở Docker Desktop và chờ trạng thái Running trước khi chạy Compose. Docker Desktop không yêu cầu cài thêm Ubuntu; nếu WSL 2 đã được cài đầy đủ, kiểm tra lại Windows Features `Virtual Machine Platform` và `Windows Subsystem for Linux` theo [hướng dẫn Docker Desktop](https://docs.docker.com/desktop/features/wsl/).

```powershell
docker compose --env-file .env.selfhost -f docker-compose.selfhost.yml up -d --build
docker compose --env-file .env.selfhost -f docker-compose.selfhost.yml ps
```

Tệp `.env.selfhost` cần chứa `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN=http://localhost:8080` và tùy chọn `SNOTE_PORT=8080`. Giữ tệp này riêng trên máy, không đưa lên Git hoặc gửi qua chat. Truy cập `http://localhost:8080`; kiểm tra database qua `http://localhost:8080/health/ready`.

Khi đưa website ra Internet qua HTTPS tunnel, đặt `CORS_ORIGIN` thành đúng URL công khai (ví dụ `https://ten-may.ten-mang.ts.net`), rồi chạy lại lệnh `up -d`. Frontend luôn gọi `/api` trên cùng origin nên không cần sửa URL API cho mỗi môi trường.

## Gắn tên miền riêng qua Cloudflare Tunnel

Bạn cần sở hữu một tên miền và đưa DNS của nó lên Cloudflare. Trong Cloudflare Dashboard, tạo Tunnel rồi thêm **Published application** với hostname mong muốn, chẳng hạn `snote.example.com`. Đặt **Service URL** là `http://frontend:80` vì `cloudflared` sẽ chạy cùng mạng Compose với frontend. Sao chép token của Tunnel vào `.env.selfhost` dưới tên `CLOUDFLARE_TUNNEL_TOKEN`; đổi `CORS_ORIGIN` thành `https://snote.example.com`. Không gửi token hoặc commit tệp này.

```powershell
docker compose --env-file .env.selfhost -f docker-compose.selfhost.yml -f docker-compose.tunnel.yml up -d --build
docker compose --env-file .env.selfhost -f docker-compose.selfhost.yml -f docker-compose.tunnel.yml ps
```

Cloudflare cấp HTTPS ở địa chỉ công khai; chỉ frontend được chuyển tiếp. Khi dừng cả hệ thống đã bật Tunnel, dùng cùng hai tùy chọn `-f` và `down` để dừng cả container tunnel. Không cần trỏ bản ghi A vào IP nhà hoặc mở cổng trên router. Cloudflare yêu cầu một tên miền trong tài khoản để xuất bản ứng dụng bằng Tunnel; tên miền thường có phí đăng ký riêng. Xem [Cloudflare Tunnel setup](https://developers.cloudflare.com/tunnel/get-started/).

## Dừng và dọn dẹp

```powershell
# Dừng và xóa container cùng mạng của riêng SNOTE; giữ nguyên dữ liệu PostgreSQL.
docker compose --env-file .env.selfhost -f docker-compose.selfhost.yml down

# Xóa cả image do Compose build để lấy lại dung lượng; vẫn giữ database.
docker compose --env-file .env.selfhost -f docker-compose.selfhost.yml down --rmi local
```

Dữ liệu PostgreSQL nằm trong volume `snote-selfhost_postgres_data`, độc lập với vòng đời container. **Không dùng `down -v` khi còn cần dữ liệu:** lệnh đó xóa luôn volume database. Docker images, volume và cache vẫn chiếm dung lượng trên máy cho đến khi bạn chủ động xóa; Docker giúp cô lập chúng khỏi thư mục mã nguồn chứ không tự xóa mọi thứ.

## Sao lưu trước khi xóa dữ liệu

Chạy `pg_dump` trong container rồi sao chép file backup ra máy:

```powershell
$dbContainer = docker compose --env-file .env.selfhost -f docker-compose.selfhost.yml ps -q postgres_db
docker exec $dbContainer pg_dump -U snote_user -d snote -Fc -f /tmp/snote.dump
docker cp "${dbContainer}:/tmp/snote.dump" .\snote-backup.dump
```

Giữ file backup ở nơi an toàn ngoài thư mục dự án. Chỉ xóa volume sau khi đã kiểm tra backup.

## Giới hạn khi dùng máy cá nhân làm server

Máy phải bật liên tục, không ngủ và có Internet. Nếu dùng Tailscale Funnel, chỉ đưa cổng web `8080` ra ngoài; không công khai cổng PostgreSQL hay API. Với dữ liệu sinh viên thật, kiểm tra phương án truy cập và sao lưu trước khi mở cho nhiều người dùng.
