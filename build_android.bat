@echo off
title Build the Android app
cd /d "%~dp0frontend"

echo ==============================================
echo 1/2 Building the web app
echo ==============================================
call npm run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

echo.
echo ==============================================
echo 2/2 Syncing web assets into the Android project
echo ==============================================
call npx cap sync android
if errorlevel 1 (
  echo Capacitor sync failed.
  pause
  exit /b 1
)

echo.
echo Done. The updated web app is now inside:
echo   frontend\android\app\src\main\assets\public
echo.
echo Next step - build and install the APK:
echo   cd frontend\android
echo   gradlew assembleDebug
echo   (install the APK from app\build\outputs\apk\debug\)
echo   on the phone, or run it from Android Studio)
echo.
echo Remember: the phone and this PC must be on the same Wi-Fi,
echo and the backend must be running (run.bat).
pause
