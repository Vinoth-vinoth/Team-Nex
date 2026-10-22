@echo off
title Intelligent Timetable Generator
cd /d "%~dp0"

echo ==============================================
echo Intelligent Timetable Generator
echo ==============================================
echo This starts the Node/Express backend that the
echo React web app and the Android app connect to.
echo It listens on 0.0.0.0:5000 so your phone can
echo reach it at http://YOUR-PC-IP:5000
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 18+ from https://nodejs.org/ then run this again.
  pause
  exit /b 1
)

if not exist "backend\node_modules" (
  echo Installing backend dependencies, please wait...
  pushd backend
  call npm install
  popd
  if errorlevel 1 (
    echo npm install failed. Check your internet connection.
    pause
    exit /b 1
  )
)

pushd backend
node src/server.js
popd
pause
