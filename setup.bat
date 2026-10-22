@echo off
title Intelligent Timetable Generator Setup
cd /d "%~dp0"
echo ==============================================
echo Intelligent Timetable Generator - Setup
echo ==============================================
where py >nul 2>nul
if errorlevel 1 (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python was not found on this laptop.
    echo Open https://www.python.org/downloads/windows/
    echo Download Python 3.12 or newer and IMPORTANT: tick "Add python.exe to PATH".
    echo Then close this window and double-click setup.bat again.
    pause
    exit /b 1
  ) else (
    set PYTHON=python
  )
) else (
  set PYTHON=py
)
%PYTHON% -m venv .venv
if errorlevel 1 goto fail
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if errorlevel 1 goto fail
echo.
echo Setup complete. Now double-click run.bat
pause
exit /b 0
:fail
echo Setup failed. Check internet connection and Python installation.
pause
exit /b 1
