@echo off
setlocal
cd /d "%~dp0"
echo ============================================
echo   Sai Lek
echo   First run sets everything up by itself.
echo   Needs: Git and Node.js (LTS). No password.
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js not found. Install the LTS version from https://nodejs.org and run start.bat again.
  goto :fail
)

set "FIRST_RUN=0"
if not exist "backend\.env" set "FIRST_RUN=1"
if not exist "backend\node_modules" set "FIRST_RUN=1"
if not exist "frontend\node_modules" set "FIRST_RUN=1"
if exist ".setup-pending" set "FIRST_RUN=1"

REM Use the built-in portable PostgreSQL when it already exists here,
REM or on a brand new clone (no backend\.env yet).
REM If backend\.env already points to your own PostgreSQL it is left alone.
set "USE_PORTABLE=0"
if exist ".pg\data\PG_VERSION" set "USE_PORTABLE=1"
if not exist "backend\.env" set "USE_PORTABLE=1"

if "%USE_PORTABLE%"=="1" call "%~dp0scripts\db-portable.bat"
if errorlevel 1 goto :fail

if "%FIRST_RUN%"=="1" call :first_run
if errorlevel 1 goto :fail

echo Starting Sai Lek (backend + frontend)...
start "Backend (API)" cmd /k "cd /d %~dp0backend && npm run dev"
start "Frontend (Web)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Waiting for the servers to be ready...
timeout /t 8 /nobreak >nul
start http://localhost:5173

echo.
echo Both servers are running in separate windows.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo Admin login: admin / Admin@1234
echo To stop the built-in database later, run stop-db.bat
exit /b 0

:first_run
echo.
echo First run: installing packages and preparing data. This takes a few minutes...
echo pending> "%~dp0.setup-pending"
if not exist "%~dp0backend\.env" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\write-env.ps1" -DbUrl "postgresql://sailoh@localhost:5433/sailoh?schema=public" -OutFile "%~dp0backend\.env"
  if errorlevel 1 exit /b 1
)
cd /d "%~dp0backend"
call npm install
if errorlevel 1 exit /b 1
call npx prisma generate
if errorlevel 1 exit /b 1
call npx prisma migrate deploy
if errorlevel 1 exit /b 1
call npx prisma db seed
if errorlevel 1 exit /b 1
REM needs internet; if it fails the map falls back to straight lines between stops
call npm run fetch:geometry
if errorlevel 1 echo WARNING: fetch:geometry failed - no internet? Run "npm run fetch:geometry" in backend later.
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 exit /b 1
cd /d "%~dp0"
del ".setup-pending" >nul 2>nul
exit /b 0

:fail
echo.
echo START FAILED - read the message above.
pause
exit /b 1
