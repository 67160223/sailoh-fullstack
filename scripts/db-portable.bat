@echo off
setlocal
for %%I in ("%~dp0..") do set "ROOT=%%~fI"
set "PGDIR=%ROOT%\.pg"
set "PGDATA=%PGDIR%\data"
set "PGPORT_APP=5433"
set PGCLIENTENCODING=UTF8

REM ---- 1. find PostgreSQL programs (no install, no password needed) ----
set "PGBIN="
if exist "%PGDIR%\bin.txt" set /p PGBIN=<"%PGDIR%\bin.txt"
if defined PGBIN if not exist "%PGBIN%\pg_ctl.exe" set "PGBIN="
if not defined PGBIN if exist "%PGDIR%\pgsql\bin\pg_ctl.exe" set "PGBIN=%PGDIR%\pgsql\bin"
if not defined PGBIN for /d %%P in ("C:\Program Files\PostgreSQL\*") do if exist "%%P\bin\initdb.exe" set "PGBIN=%%P\bin"
if defined PGBIN goto :have_bin

echo No PostgreSQL programs found. Downloading portable PostgreSQL, about 300 MB, first time only...
if not exist "%PGDIR%" mkdir "%PGDIR%"
curl.exe -L --fail -o "%PGDIR%\pg.zip" "https://sbp.enterprisedb.com/getfile.jsp?fileid=1260616"
if errorlevel 1 goto :download_failed
tar -xf "%PGDIR%\pg.zip" -C "%PGDIR%"
if errorlevel 1 goto :download_failed
del "%PGDIR%\pg.zip" >nul 2>nul
if not exist "%PGDIR%\pgsql\bin\pg_ctl.exe" goto :download_failed
set "PGBIN=%PGDIR%\pgsql\bin"

:have_bin
if not exist "%PGDIR%" mkdir "%PGDIR%"
echo %PGBIN%> "%PGDIR%\bin.txt"

REM ---- 2. create the data folder once (local only, user sailoh, no password) ----
if exist "%PGDATA%\PG_VERSION" goto :start_db
echo Creating the local database folder...
"%PGBIN%\initdb.exe" -D "%PGDATA%" -U sailoh -A trust -E UTF8 --locale=C > "%PGDIR%\initdb.log" 2>&1
if errorlevel 1 (
  type "%PGDIR%\initdb.log"
  echo ERROR: initdb failed. See the message above.
  exit /b 1
)

REM ---- 3. start it on port 5433 if it is not running ----
:start_db
"%PGBIN%\pg_ctl.exe" -D "%PGDATA%" status >nul 2>nul
if not errorlevel 1 goto :make_db
echo Starting the local database on port %PGPORT_APP%...
"%PGBIN%\pg_ctl.exe" -D "%PGDATA%" -l "%PGDIR%\pg.log" -o "-p %PGPORT_APP%" -w start
if errorlevel 1 (
  echo ERROR: the database did not start. Last lines of the log:
  powershell -NoProfile -Command "Get-Content -Tail 15 '%PGDIR%\pg.log'"
  echo If port %PGPORT_APP% is used by another program, close that program and try again.
  exit /b 1
)

REM ---- 4. create database sailoh if missing ----
:make_db
"%PGBIN%\psql.exe" -h localhost -p %PGPORT_APP% -U sailoh -d postgres -tAc "select 1 from pg_database where datname='sailoh'" 2>nul | find "1" >nul
if not errorlevel 1 exit /b 0
"%PGBIN%\createdb.exe" -h localhost -p %PGPORT_APP% -U sailoh sailoh
if errorlevel 1 (
  echo ERROR: could not create database sailoh.
  exit /b 1
)
exit /b 0

:download_failed
echo.
echo ERROR: could not download portable PostgreSQL.
echo Easy fix: install PostgreSQL from https://www.postgresql.org/download/windows/ and run start.bat again.
echo You do NOT need to remember its password - this project only uses its program files.
exit /b 1
