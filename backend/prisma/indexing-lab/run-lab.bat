@echo off
setlocal
REM Indexing experiment inside a SEPARATE schema named "lab" of the sailoh database.
REM It uses the app user (sailoh) so the postgres password is NOT needed.
REM Real tables in schema "public" are never touched (search_path is forced to "lab").
REM Requires psql (auto-detected from C:\Program Files\PostgreSQL).
set PGPASSWORD=sailoh_secret
set PGCLIENTENCODING=UTF8
set /p PGPASSWORD=Password of user sailoh [Enter = sailoh_secret]: 
if "%PGPASSWORD%"=="" set PGPASSWORD=sailoh_secret
where psql >nul 2>nul
if errorlevel 1 for /d %%P in ("C:\Program Files\PostgreSQL\*") do if exist "%%P\bin\psql.exe" set "PATH=%%P\bin;%PATH%"
where psql >nul 2>nul
if errorlevel 1 (
  echo ERROR: psql not found. Add the PostgreSQL bin folder to PATH, e.g.
  echo   set PATH=C:\Program Files\PostgreSQL\17\bin;%%PATH%%
  goto :fail
)
set PSQL=psql -U sailoh -h localhost -d sailoh -v ON_ERROR_STOP=1 -q
set HERE=%~dp0
set MIG=%HERE%..\migrations
if not exist "%HERE%results" mkdir "%HERE%results"

echo [1/5] Re-creating schema lab ...
%PSQL% -c "DROP SCHEMA IF EXISTS lab CASCADE" -c "CREATE SCHEMA lab"
if errorlevel 1 goto :fail
set PGOPTIONS=-c search_path=lab

echo [2/5] Creating tables from migrations 00-07 (not 08 yet) ...
for /d %%D in ("%MIG%\*") do call :apply "%%D" "%%~nxD"
if errorlevel 1 goto :fail

echo [3/5] Seeding ~2.3 million rows (about 1-3 minutes) ...
%PSQL% -f "%HERE%01_seed.sql"
if errorlevel 1 goto :fail

echo [4/5] BEFORE measurements  --^>  results\before.txt
psql -U sailoh -h localhost -d sailoh -f "%HERE%02_queries.sql" > "%HERE%results\before.txt" 2>&1

echo [5/5] Applying migration 08, then AFTER measurements  --^>  results\after.txt
%PSQL% -f "%MIG%\00000000000008_performance_indexes\migration.sql"
if errorlevel 1 goto :fail
%PSQL% -c "ANALYZE users, refresh_tokens, wallet_transactions, tickets"
psql -U sailoh -h localhost -d sailoh -f "%HERE%02_queries.sql" > "%HERE%results\after.txt" 2>&1
psql -U sailoh -h localhost -d sailoh -f "%HERE%03_write_cost.sql" > "%HERE%results\write_cost.txt" 2>&1
psql -U sailoh -h localhost -d sailoh -f "%HERE%04_index_size.sql" > "%HERE%results\index_size.txt" 2>&1

echo.
echo Done. Open the files in the "results" folder and compare before vs after.
echo Look at "Execution Time" and the scan type (Seq Scan vs Bitmap Index Scan).
echo To delete the experiment data afterwards:  DROP SCHEMA lab CASCADE;
pause
exit /b 0

:fail
echo.
echo FAILED - see the message above. Nothing was changed in schema public.
pause
exit /b 1

:apply
if /i "%~2"=="00000000000008_performance_indexes" exit /b 0
%PSQL% -f "%~1\migration.sql" >nul
exit /b %errorlevel%
