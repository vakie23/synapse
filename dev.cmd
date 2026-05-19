@echo off
REM Run the app without PowerShell script policy (uses npm.cmd, not npm.ps1)
cd /d "%~dp0"

if not exist ".env" copy /Y ".env.example" ".env" >nul

echo Installing dependencies...
call npm.cmd install
if errorlevel 1 exit /b 1

echo.
echo Starting API (4000), Web (3000), Admin (3200)...
echo Open http://localhost:3000 in your browser.
echo Press Ctrl+C to stop.
call npm.cmd run dev
