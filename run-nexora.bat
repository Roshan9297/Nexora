@echo off
title NEXORA AI - Autonomous Multi-Agent Platform
color 0b

echo ================================================================
echo                   WELCOME TO NEXORA AI
echo        Autonomous Multi-Agent AI (100%% Subscription-Free)
echo ================================================================
echo.
echo [1/3] Starting NEXORA Backend Microservices (FastAPI on Port 8000)...
start "NEXORA Backend" /min cmd /c "cd /d %~dp0backend && py -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [2/3] Waiting 3 seconds for Backend to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Launching NEXORA AI Frontend on http://localhost:3000...
cd /d %~dp0frontend
start http://localhost:3000
npm run dev

pause
