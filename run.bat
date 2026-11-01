@echo off
chcp 65001 > nul
title SNOTE - Khoi dong he thong
echo ========================================================
echo        HE THONG QUAN LY HOC TAP SNOTE (DEV RUNNER)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/5] Giai phong cac cong bi treo (5173, 4000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [2/5] Kiem tra Database PostgreSQL (Docker)...
docker start ainote_postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [i] Dang khoi tao PostgreSQL container qua Docker Compose...
    docker compose up -d >nul 2>&1 || docker-compose up -d >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [i] Docker Desktop chua bat, dang khoi dong Docker Desktop...
        start "" "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
        timeout /t 12 /nobreak > nul
        docker compose up -d >nul 2>&1 || docker-compose up -d >nul 2>&1
    )
)

echo [3/5] Kiem tra file moi truong (.env)...
if not exist "backend\.env" (
    echo [i] Tu dong tao backend\.env tu file mau .env.example...
    copy "backend\.env.example" "backend\.env" >nul
)
if not exist "frontend\.env" (
    echo [i] Tu dong tao frontend\.env tu file mau .env.example...
    copy "frontend\.env.example" "frontend\.env" >nul
)

if not exist "node_modules" (
    echo [i] Phat hien may moi chua cai dat thu vien, dang tu dong cai dat (npm run setup)...
    call npm.cmd run setup
) else (
    echo [OK] Thu vien va moi truong da san sang!
)

echo.
echo [4/5] Khoi dong Backend (Port 4000) va Frontend (Port 5173)...
echo.
echo [5/5] Tu dong mo trinh duyet vao SNOTE...
start http://localhost:5173

echo ========================================================
echo   SNOTE DANG CHAY TAI: http://localhost:5173
echo   (Nhan Ctrl + C de dung he thong bat ky luc nao)
echo ========================================================
echo.

npm.cmd run dev
pause
