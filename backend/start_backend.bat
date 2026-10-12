@echo off
title ThalCare Backend Server
echo ==========================================
echo   ThalCare Backend - Phase 7
echo   Starting on http://localhost:8000
echo ==========================================
echo.

:: Change to backend directory (works from anywhere)
cd /d "E:\FYP MOHID\backend"

:: Check if venv exists
if not exist "venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found at venv\Scripts\python.exe
    echo Please run: python -m venv venv
    echo Then run: venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

:: Activate venv explicitly and run uvicorn using venv python directly
:: This avoids the PowerShell vs CMD activation issue entirely
echo [OK] Virtual environment found
echo [OK] Starting uvicorn with venv Python...
echo.
echo API Docs available at: http://localhost:8000/docs
echo Health check at:       http://localhost:8000/api/v1/health
echo.

"E:\FYP MOHID\backend\venv\Scripts\python.exe" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
