@echo off
echo Starting Sai Lek (backend + frontend)...

start "Backend (API)" cmd /k "cd /d %~dp0backend && npm run dev"
start "Frontend (Web)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both servers are starting in separate windows.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
