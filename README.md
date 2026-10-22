# Intelligent Department Timetable Scheduler

## Stack
Frontend: React + Vite (packaged for Android with Capacitor)
Backend: Node.js + Express
Database: MySQL

---

## Running it on your phone (fixing ERR_CONNECTION_TIMED_OUT)

`net::ERR_CONNECTION_TIMED_OUT` on `http://<PC-IP>:5000/` means the phone could not
reach the backend on your PC. There are four things that must all be true:

| # | Requirement | How to check / fix |
|---|-------------|-------------------|
| 1 | The backend is running | Run `run.bat` (or `start_backend.bat`). It must print `Backend: http://localhost:5000` |
| 2 | It listens on the LAN, not only localhost | `backend/src/server.js` binds `HOST=0.0.0.0` by default |
| 3 | The phone and PC are on the same Wi-Fi | The phone must be on `OPPO Reno16 5G t2xh 48`, not mobile data |
| 4 | Windows Firewall allows inbound TCP 5000 | Run `open_firewall_port.bat` once as administrator |

### Step by step

1. **Start the backend** — double-click `run.bat`.
   It prints the exact address to use on the phone:

   ```
   Backend: http://localhost:5000
   Health check: http://localhost:5000/api/health
   Open on your phone (same Wi-Fi):
     http://10.128.220.119:5000
   ```

2. **Open the firewall port once** — double-click `open_firewall_port.bat`
   and accept the administrator prompt. (Windows may also show a "Windows
   Defender Firewall has blocked some features" popup the first time Node
   listens — tick **Private networks** and press *Allow access*.)

3. **Verify from the phone browser** — open the address the backend printed,
   e.g. `http://10.128.220.119:5000`. The backend now serves the **actual web
   app** from that address, so you should see the Sign In screen (not a plain
   "backend is running" page). `http://<ip>:5000/api/health` still returns
   `{"ok":true,...}`.

4. **Build the Android app** — double-click `build_android.bat`.
   It rebuilds the web app and copies it into `frontend/android`.
   Then build the APK:

   ```
   cd frontend\android
   gradlew assembleDebug
   ```

   The APK lands in `frontend\android\app\build\outputs\apk\debug\`.
   Install it on the phone (or press Run in Android Studio).

5. **If your PC's IP changes** (new Wi-Fi, DHCP renewal) the app will show
   "Cannot reach the backend". The app probes the addresses it knows about
   automatically and picks the one that answers `/api/health`, so it often
   recovers on its own. If it does not, tap **Server: ...** under the
   Sign In button, type the new address, for example
   `http://10.128.220.119:5000/api`, and press **Save**.
   Press **Test** to check the address without leaving the app.
   You can also edit `frontend/.env` and run `build_android.bat` again.

---

## Installing the app on the phone (release APK)

The signed release APK is the one to install for normal use:

```
frontend\android\app\build\outputs\apk\release\app-release.apk
```

**On the phone**

1. Copy `app-release.apk` to the phone (USB cable, Google Drive, WhatsApp
   file transfer, …).
2. Tap the file in the phone's file manager.
3. Android will ask *"Install unknown apps"* — allow it for the app you are
   opening the APK from (Files / Chrome / WhatsApp).
4. Install, then open **Intelligent Timetable**.

**On the PC**

```
cd frontend\android
gradlew assembleRelease
```

The APK is signed with the keystore described by
`frontend\android\keystore.properties` (see `keystore.properties.example`).
Because the key is fixed, Android will let you *upgrade* over an older
install of the same app. If you lose the keystore you must uninstall the app
before installing a differently signed build.

> If you ever change `keystore.properties` and the install fails with
> *"App not installed"*, uninstall the previous copy first:
> `adb uninstall com.college.timetable`.

---

## Building the Android app — JDK note

The build fails with

```
BUG! exception in phase 'semantic analysis' in source unit '_BuildScript_'
Unsupported class file major version 69
```

when Gradle runs on **Java 25** (the current Android Studio JBR). Gradle
8.14.3 cannot read Java 25 class files. Fix it by pointing Gradle at a
JDK 21:

1. Download a JDK 21 (Temurin) and unpack it, e.g. to
   `C:\Users\<you>\AppData\Local\Programs\jdk-21.0.12.1+1`.
2. Add it to `C:\Users\<you>\.gradle\gradle.properties` (not the project one —
   the path is machine-specific):

   ```
   org.gradle.java.home=C:\\Users\\<you>\\AppData\\Local\\Programs\\jdk-21.0.12.1+1
   ```

3. Stop any running Gradle daemons: `gradlew --stop`
4. Build again: `gradlew assembleRelease`

---

## The backend also serves the web app

`backend/src/server.js` serves the built React app from `frontend/dist` on the
same port as the API:

| URL | What you get |
|-----|--------------|
| `http://<pc-ip>:5000/` | The full web application (Sign In screen) |
| `http://<pc-ip>:5000/api/health` | `{"ok":true,"message":"Backend is running"}` |
| `http://<pc-ip>:5000/<anything-else>` | The app again (SPA fallback) |

That means the phone browser and the Android app talk to exactly the same
backend, and the API base is relative (`/api`) when the app is opened through
the browser — no IP to type.

## Working offline

The app keeps the last timetable it loaded in the phone's local storage. If
the backend cannot be reached it shows that saved data with an
**"OFFLINE - SAVED DATA"** badge instead of an empty screen, and the saved
login session is kept (only a genuine `401` signs the user out). The app
re-checks the backend every time it starts.

---

## Quick start (development)

1. Install Node.js 18+ and MySQL.
2. In MySQL Workbench run `database/schema.sql`.
3. Copy `backend/.env.example` to `backend/.env` and set your MySQL password.
4. Terminal 1 — backend:
   ```
   cd backend
   npm install
   npm run dev
   ```
5. Terminal 2 — frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
6. Open the Vite URL, normally http://localhost:5173

## Demo users
After the database script, these accounts are available:
- Admin: admin@college.com / admin123
- Staff: staff@college.com / staff123
- Student: student@college.com / student123

The database script contains bcrypt hashes for these demo passwords.

## MVP features
- Admin / Staff / Student login
- Role-based edit/view permissions
- 7 departments
- 2nd / 3rd / 4th year
- Subjects: Theory / Practical
- Faculty
- Classrooms and labs
- Working days and time slots
- Competition break rules
- Faculty availability
- Automatic timetable generation using hard constraints
- Conflict report
- Student view-only mode

---

## Notes on the two backends

This folder contains two servers and **both want port 5000**:

| Script | Server | Used by |
|--------|--------|---------|
| `run.bat` / `start_backend.bat` | Node / Express (`backend/src/server.js`) | The React web app and the **Android app** |
| `run_flask_mvp.bat` | Flask (`app.py`) | The older standalone MVP pages in `templates/` |

Stop one before starting the other. The Android app only works with the
Node backend.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ERR_CONNECTION_TIMED_OUT` on the phone | Backend not running, wrong IP, or firewall | Run `run.bat`, check the printed IP, run `open_firewall_port.bat` |
| `ERR_CONNECTION_REFUSED` | Nothing is listening on that IP/port | The backend crashed or bound to `127.0.0.1` — check `backend/.env` `HOST` |
| `net::ERR_CLEARTEXT_NOT_PERMITTED` | Android 9+ blocked plain HTTP | `android:usesCleartextTraffic="true"` is set in `frontend/android/app/src/main/AndroidManifest.xml` |
| `Cannot reach the backend at http://localhost:5000/api` | App is using the WebView's own hostname | Set the address in the app under **Server: ...** or in `frontend/.env` |
| `EADDRINUSE` in the backend log | Another process owns port 5000 | Stop the other server, or set a different `PORT` in `backend/.env` |
| `java.io.IOException: Invalid file path` during the Android build | `local.properties` has a malformed `sdk.dir` | Use forward slashes: `sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk` (see `frontend/android/local.properties.example`) |
| `Unsupported class file major version 69` during the Android build | Gradle is running on Java 25 | Point `org.gradle.java.home` at a JDK 21 in `~/.gradle/gradle.properties` (see **Building the Android app — JDK note**) |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` when installing the APK | The new APK is signed with a different key than the installed one | Uninstall the old app first (`adb uninstall com.college.timetable`) |
| App shows "Cannot reach the backend" but the browser on the same phone works | The app still has an old server address saved | Tap **Server: ...** → **Test** to re-detect, or type the address and press **Save** |
