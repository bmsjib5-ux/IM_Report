@echo off
title IM Report Dashboard
cd /d "%~dp0"
echo ========================================
echo   IM Report Dashboard
echo   กำลังเปิดระบบ...
echo ========================================
echo.

:: ตรวจสอบว่ามี node_modules หรือยัง
if not exist "node_modules" (
    echo กำลังติดตั้ง dependencies...
    npm install
    echo.
)

:: เปิดเบราว์เซอร์หลังจาก 3 วินาที
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: เริ่ม dev server
npm run dev
