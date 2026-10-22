@echo off
title Intelligent Timetable - Backend (Node / Express)
cd /d "%~dp0backend"

echo ==============================================
echo Starting backend on port 5000
echo ==============================================

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 18+ from https://nodejs.org/ then run this again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies, please wait...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Check your internet connection.
    pause
    exit /b 1
  )
)

node src/server.js
pause
