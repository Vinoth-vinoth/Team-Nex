@echo off
title Allow the Timetable backend through Windows Firewall
cd /d "%~dp0"

echo ==============================================
echo Opening TCP port 5000 for inbound traffic
echo ==============================================
echo This lets a phone on the same Wi-Fi reach the
echo backend at http://YOUR-PC-IP:5000
echo.

net session >nul 2>nul
if errorlevel 1 (
  echo Requesting administrator rights...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b 0
)

netsh advfirewall firewall delete rule name="Timetable Backend (TCP 5000)" >nul 2>nul
netsh advfirewall firewall add rule name="Timetable Backend (TCP 5000)" dir=in action=allow protocol=TCP localport=5000 profile=any

echo.
echo Done. You can close this window.
pause
