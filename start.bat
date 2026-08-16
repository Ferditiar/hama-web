@echo off
title Hama Web Launcher
cd /d "%~dp0"

echo ============================================
echo   Deteksi Hama Tanaman - Launcher
echo ============================================
echo.
echo  [1/3] Menjalankan Backend (FastAPI)...
start "Hama Backend" cmd /k "cd /d %~dp0backend && C:\Users\mreza\anaconda3\envs\hama_env\python.exe -m uvicorn main:app --port 8000"

echo  [2/3] Menjalankan Frontend (Next.js)...
start "Hama Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo  [3/3] Membuka browser...
timeout /t 10 /nobreak >nul
start "" http://localhost:3000

echo.
echo  Selesai! Backend di http://localhost:8000
echo  Web kamu di http://localhost:3000