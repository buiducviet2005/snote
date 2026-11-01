@echo off
chcp 65001 > nul
set "OUT=%USERPROFILE%\Desktop\snote_env_backup"
mkdir "%OUT%" 2>nul
copy "%~dp0backend\.env" "%OUT%\backend.env" >nul
copy "%~dp0frontend\.env" "%OUT%\frontend.env" >nul
echo ========================================================
echo [OK] Da sao chep 2 file .env ra Desktop thanh cong!
echo Duong dan: %OUT%
echo Ban co the gui thu muc nay qua Zalo / USB sang may moi.
echo ========================================================
pause

