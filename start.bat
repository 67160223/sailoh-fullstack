@echo off
echo Starting Sai Lek (backend + frontend)...

start "Backend (API)" cmd /k "cd /d %~dp0backend && npm run dev"
start "Frontend (Web)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Waiting for the servers to be ready...
timeout /t 8 /nobreak >nul
start http://localhost:5173

echo Both servers are running in separate windows.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
