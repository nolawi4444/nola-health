@echo off
title NOLA HEALTH
cd /d "%~dp0"
set PORT=8642
echo.
echo   NOLA HEALTH - starting on http://localhost:%PORT%/
echo   Keep this window open while you use the app. Close it to stop.
echo.

rem 1) Python (real install, not the Microsoft Store stub)
python --version >nul 2>nul
if %errorlevel%==0 (
  start "" /min cmd /c "python -m http.server %PORT% --bind 127.0.0.1"
  goto open
)
py -3 --version >nul 2>nul
if %errorlevel%==0 (
  start "" /min cmd /c "py -3 -m http.server %PORT% --bind 127.0.0.1"
  goto open
)

rem 2) Built-in Windows PowerShell tiny server (no install needed)
where powershell >nul 2>nul
if %errorlevel%==0 (
  start "" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port %PORT%
  goto open
)

rem 3) Last resort: open the file directly (works, but offline install/service worker is disabled)
echo   No local server available - opening index.html directly.
start "" "%~dp0index.html"
goto end

:open
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PORT%/"
echo   Opened NOLA HEALTH in your browser.
echo   If the page does not load, double-click index.html instead.
:end
timeout /t 5 >nul
