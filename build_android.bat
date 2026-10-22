@echo off
title Build the Android app
cd /d "%~dp0frontend"

echo ==============================================
echo 1/3 Building the web app
echo ==============================================
call npm run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

echo.
echo ==============================================
echo 2/3 Syncing web assets into the Android project
echo ==============================================
call npx cap sync android
if errorlevel 1 (
  echo Capacitor sync failed.
  pause
  exit /b 1
)

echo.
echo ==============================================
echo 3/3 Building the APK
echo ==============================================
cd /d "%~dp0frontend\android"
call gradlew.bat assembleDebug assembleRelease --no-daemon
if errorlevel 1 (
  echo.
  echo APK build failed.
  echo.
  echo If the message is "Unsupported class file major version 69",
  echo Gradle ran on Java 25. Point it at a JDK 21 by adding this line to
  echo   %%USERPROFILE%%\.gradle\gradle.properties
  echo   org.gradle.java.home=C:\\Users\\you\\AppData\\Local\\Programs\\jdk-21
  echo and see the README for the full instructions.
  pause
  exit /b 1
)

echo.
echo Copying the APKs to the apk folder...
if not exist "%~dp0apk" mkdir "%~dp0apk"
copy /y "app\build\outputs\apk\release\app-release.apk" "%~dp0apk\IntelligentTimetable-release.apk" >nul
copy /y "app\build\outputs\apk\debug\app-debug.apk" "%~dp0apk\IntelligentTimetable-debug.apk" >nul

echo.
echo ==============================================
echo Done.
echo ==============================================
echo   apk\IntelligentTimetable-release.apk   <- install this one
echo   apk\IntelligentTimetable-debug.apk
echo.
echo Copy the release APK to your phone, tap it, and allow
echo "Install unknown apps" when Android asks.
echo.
echo Remember: the phone and this PC must be on the same Wi-Fi,
echo and the backend must be running (run.bat).
pause
