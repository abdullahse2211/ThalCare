@echo off
title ThalCare Frontend Server
echo ==========================================
echo   ThalCare Frontend - Phase 7
echo   Starting on http://localhost:5173
echo ==========================================
echo.
echo NOTE: Make sure backend is already running on port 8000!
echo.

cd /d "d:\FYP MOHID\frontend\frontend"

:: Check node_modules exists
if not exist "node_modules" (
    echo [INFO] node_modules not found. Running npm install first...
    npm install
)

echo [OK] Starting React dev server...
echo.

npm run dev

pause
