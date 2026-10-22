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
     http://10.205.98.119:5000
   ```

2. **Open the firewall port once** — double-click `open_firewall_port.bat`
   and accept the administrator prompt. (Windows may also show a "Windows
   Defender Firewall has blocked some features" popup the first time Node
   listens — tick **Private networks** and press *Allow access*.)

3. **Verify from the phone browser** — open `http://10.205.98.119:5000`.
   You should see the green *"Backend server is running successfully"* page.

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
   "Cannot reach the backend". Open the app and tap **Server: ...** under the
   Sign In button, then type the new address, for example
   `http://10.205.98.119:5000/api`, and press **Save**.
   You can also edit `frontend/.env` and run `build_android.bat` again.

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
