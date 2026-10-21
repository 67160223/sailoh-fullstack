@echo off
setlocal
echo ============================================
echo   Sai Lek - First-time setup
echo   Needs: Node.js and PostgreSQL installed
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js not found. Install the LTS version from https://nodejs.org and run this again.
  goto :fail
)

where psql >nul 2>nul
if errorlevel 1 for /d %%P in ("C:\Program Files\PostgreSQL\*") do if exist "%%P\bin\psql.exe" set "PATH=%%P\bin;%PATH%"
where psql >nul 2>nul
if errorlevel 1 (
  echo ERROR: psql not found. Install PostgreSQL, or add its bin folder to PATH, e.g.
  echo   set PATH=C:\Program Files\PostgreSQL\17\bin;%%PATH%%
  goto :fail
)

set PGCLIENTENCODING=UTF8
set /p PGPW=Password of the postgres user (the one you set when installing PostgreSQL): 
set "PGPASSWORD=%PGPW%"

echo.
echo [1/3] Creating database...
psql -U postgres -h localhost -c "select 1" >nul 2>nul
if errorlevel 1 (
  echo ERROR: cannot connect as postgres. Wrong password, or the PostgreSQL service is not running.
  goto :fail
)
REM "already exists" errors are fine when running this a second time
psql -U postgres -h localhost -c "CREATE USER sailoh WITH PASSWORD 'sailoh_secret';" 2>nul
psql -U postgres -h localhost -c "CREATE DATABASE sailoh OWNER sailoh;" 2>nul

echo.
echo [2/3] Setting up backend...
cd /d "%~dp0backend"
if not exist .env (
  echo DATABASE_URL=postgresql://sailoh:sailoh_secret@localhost:5432/sailoh?schema=public> .env
  echo PORT=4000>> .env
  echo NODE_ENV=development>> .env
  echo JWT_ACCESS_SECRET=c1a3c70584fff69b1096d49b6c6dd54e414cfd51725287b5c97f33f1c08fd08e>> .env
  echo JWT_REFRESH_SECRET=800966f980bf1886ce506f5b001ebf1cdd16ed8424cec22b1f0ca4d382c517>> .env
  echo JWT_RESET_SECRET=0e3d44d88c8103fcf9d8c1fdc7571b998b2f55c383051dc4eaee9fd06cb3425>> .env
  echo JWT_ACCESS_EXPIRES=15m>> .env
  echo JWT_REFRESH_EXPIRES_DAYS=30>> .env
  echo JWT_RESET_EXPIRES=15m>> .env
  echo CORS_ORIGIN=http://localhost:5173>> .env
)
call npm install
if errorlevel 1 goto :fail
call npx prisma generate
if errorlevel 1 goto :fail
call npx prisma migrate deploy
if errorlevel 1 goto :fail
call npx prisma db seed
if errorlevel 1 goto :fail
REM needs internet; if it fails the map falls back to straight lines between stops
call npm run fetch:geometry
if errorlevel 1 echo WARNING: fetch:geometry failed (no internet?). You can run "npm run fetch:geometry" in backend later.

echo.
echo [3/3] Setting up frontend...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 goto :fail

echo.
echo ============================================
echo   Setup complete! Now run start.bat
echo ============================================
pause
exit /b 0

:fail
echo.
echo SETUP FAILED - read the message above.
pause
exit /b 1
