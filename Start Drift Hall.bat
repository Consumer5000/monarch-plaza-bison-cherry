@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto nonode
node scripts\start-local.mjs %*
if errorlevel 1 pause
exit /b %errorlevel%

:nonode
echo.
echo Drift Hall needs Node.js, one time.
echo.
echo 1. Open https://nodejs.org
echo 2. Download the LTS installer and run it. The usual choices are fine.
echo 3. Double-click this file again.
echo.
pause
exit /b 1
