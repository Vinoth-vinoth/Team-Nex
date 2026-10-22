@echo off
title Intelligent Timetable - Flask MVP (separate from the Android app)
cd /d "%~dp0"

echo ==============================================
echo Flask MVP server
echo ==============================================
echo NOTE: This uses port 5000 as well, so stop the
echo Node backend (run.bat) before starting this one.
echo The Android app talks to the Node backend only.
echo.

if not exist ".venv\Scripts\activate.bat" (
  echo Run setup.bat first.
  pause
  exit /b 1
)
call .venv\Scripts\activate.bat
python app.py
pause
