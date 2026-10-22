@echo off
setlocal
cd /d "%~dp0"
if not exist ".pg\bin.txt" (
  echo No built-in database was started from this folder.
  pause
  exit /b 0
)
set /p PGBIN=<".pg\bin.txt"
"%PGBIN%\pg_ctl.exe" -D "%~dp0.pg\data" stop
pause
