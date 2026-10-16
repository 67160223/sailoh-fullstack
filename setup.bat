@echo off
echo ============================================
echo   Sai Lek - First-time setup
echo   (requires Node.js and PostgreSQL already installed)
echo ============================================
echo.

echo [1/3] Creating database (you may be asked for the postgres password)...
psql -U postgres -c "CREATE USER sailoh WITH PASSWORD 'sailoh_secret';"
psql -U postgres -c "CREATE DATABASE sailoh OWNER sailoh;"

echo.
echo [2/3] Setting up backend...
cd /d %~dp0backend
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
call npx prisma generate
call npx prisma migrate deploy
call npx prisma db seed
call npm run fetch:geometry

echo.
echo [3/3] Setting up frontend...
cd /d %~dp0frontend
call npm install

echo.
echo ============================================
echo   Setup complete! You can now run start.bat
echo ============================================
pause
