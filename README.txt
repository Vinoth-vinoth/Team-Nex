INTELLIGENT TIMETABLE GENERATOR — QUICK SETUP
=============================================

>> The React/Android app and the Node backend are the main product.
>> See README.md for the phone setup (ERR_CONNECTION_TIMED_OUT fix).
>> This file describes the older Flask MVP (run_flask_mvp.bat).

WHAT YOU NEED
- MySQL Server running (your screenshot shows 127.0.0.1:3306)
- Database named intelligent_timetable
- Python 3.12+ (setup.bat will tell you if it is missing)
- Internet connection for first-time Python package installation

1. INSTALL PYTHON IF NEEDED
   Double-click setup.bat.
   If it says Python was not found, open:
   https://www.python.org/downloads/windows/
   Download Python for Windows. During installation, tick:
   [x] Add python.exe to PATH
   Finish installation, then double-click setup.bat again.

2. CONFIGURE MYSQL
   Open config.py in Notepad.
   Set "password" to your MySQL root password, for example:
   "password": "your_actual_password"
   Save the file.
   Do not share your password with anyone.

3. CHECK DATABASE
   In MySQL Workbench, run:
   USE intelligent_timetable;
   SELECT COUNT(*) FROM faculty;
   SELECT COUNT(*) FROM subjects;
   SELECT COUNT(*) FROM sections;
   SELECT COUNT(*) FROM rooms;
   SELECT COUNT(*) FROM faculty_subjects;
   SELECT COUNT(*) FROM time_slots;
   SELECT COUNT(*) FROM working_days;

   If rooms is zero, open the app's Rooms page and add real rooms.
   Do not use the sample room data for a real timetable unless it matches your college.

4. INSTALL APP PACKAGES
   Double-click setup.bat and wait until it says Setup complete.

5. START APP
   Double-click run_flask_mvp.bat (Flask MVP only).
   Open your browser at:
   http://127.0.0.1:5000

   For the React web app and the Android app, use run.bat instead -
   that starts the Node backend the phone connects to.

FEATURES
- Dashboard with table counts
- Add rooms
- Greedy timetable generation from existing database data
- Prevents same section, faculty or room being assigned twice at the same day/time
- Timetable view

IMPORTANT LIMITATIONS
- This is a starter version. It assumes timetable_entries has:
  section_id, subject_id, faculty_id, room_id, working_day_id, time_slot_id, is_lab.
- The timetable display assumes columns named section_name, subject_name, faculty_name,
  day_name, start_time and end_time. If your database uses different names, the dashboard
  and generator can still work but the timetable view may need column-name adjustment.
- The generator schedules each subject once per section by default. If subjects has a
  weekly_hours / hours_per_week / periods_per_week / weekly_periods column, it uses it.
- It uses faculty_subjects mappings. It does not yet enforce all possible college-specific
  rules such as faculty availability, lab duration, department restrictions, lunch breaks,
  or room type compatibility.
- Always test the generated timetable before using it officially.
