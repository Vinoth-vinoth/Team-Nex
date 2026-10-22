import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { auth, roles } from './auth.js';

dotenv.config();

const app = express();
const WORKING_DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const WORKING_DAY_SQL_LIST = WORKING_DAY_NAMES.map(day => `'${day}'`).join(', ');

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (
      !rows.length ||
      !(await bcrypt.compare(password, rows[0].password_hash))
    ) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const u = rows[0];
    const token = jwt.sign(
      {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        departmentId: u.department_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        departmentId: u.department_id
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Validate a persisted frontend session before opening the protected dashboard.
app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// Create user
app.post('/api/auth/create-user', auth, roles('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users(name,email,password_hash,role,department_id)
       VALUES(?,?,?,?,?)`,
      [name, email, hash, role, departmentId || null]
    );

    res.json({ message: 'User created' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Departments
app.get('/api/departments', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Academic years
app.get('/api/years', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM academic_years ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Working days for the Monday-Friday timetable.
app.get('/api/working-days', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, day_name, is_working
      FROM working_days
      WHERE is_working = 1 AND day_name IN (${WORKING_DAY_SQL_LIST})
      ORDER BY FIELD(day_name, ${WORKING_DAY_SQL_LIST})
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Time slots include the configured period, lunch, and break display times.
app.get('/api/time-slots', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM time_slots ORDER BY start_time, id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Sections
app.get('/api/sections', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, d.code department, y.year_name
      FROM sections s
      JOIN departments d ON d.id = s.department_id
      JOIN academic_years y ON y.id = s.academic_year_id
      ORDER BY d.id, y.id, s.section_name
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/sections', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { departmentId, academicYearId, sectionName, strength } = req.body;
    await pool.query(
      `INSERT INTO sections(department_id,academic_year_id,section_name,strength)
       VALUES(?,?,?,?)`,
      [departmentId, academicYearId, sectionName, strength || 60]
    );
    res.json({ message: 'Section added' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Subjects
app.get('/api/subjects', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, d.code department, y.year_name
      FROM subjects s
      JOIN departments d ON d.id = s.department_id
      JOIN academic_years y ON y.id = s.year_id
      ORDER BY d.id, y.id, s.name
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/subjects', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const {
      departmentId, yearId, code, name, subjectType,
      weeklyPeriods, totalHours, labPeriods
    } = req.body;

    await pool.query(
      `INSERT INTO subjects
       (department_id,year_id,code,name,subject_type,weekly_periods,total_hours,lab_periods)
       VALUES(?,?,?,?,?,?,?,?)`,
      [
        departmentId, yearId, code, name, subjectType,
        weeklyPeriods, totalHours || null, labPeriods || 0
      ]
    );
    res.json({ message: 'Subject added' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Faculty
app.get('/api/faculty', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, d.code department
      FROM faculty f
      JOIN departments d ON d.id = f.department_id
      ORDER BY d.id, f.name
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/faculty', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { departmentId, name, email, designation, maxPeriodsPerDay } = req.body;
    await pool.query(
      `INSERT INTO faculty
       (department_id,name,email,designation,max_periods_per_day)
       VALUES(?,?,?,?,?)`,
      [departmentId, name, email || null, designation || null, maxPeriodsPerDay || 6]
    );
    res.json({ message: 'Faculty added' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Rooms
app.get('/api/rooms', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rooms ORDER BY room_type, room_code');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/rooms', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { departmentId, roomCode, roomType, capacity } = req.body;
    await pool.query(
      `INSERT INTO rooms(department_id,room_code,room_type,capacity)
       VALUES(?,?,?,?)`,
      [departmentId || null, roomCode, roomType, capacity || 60]
    );
    res.json({ message: 'Room/Lab added' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// View timetable
app.get('/api/timetable', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.section_id, t.working_day_id, t.time_slot_id,
      d.code department, y.year_name, s.section_name,
      sub.code subject_code, sub.name subject_name, sub.subject_type,
      f.name faculty, r.room_code, r.room_type, w.day_name,
      ts.slot_name, ts.start_time, ts.end_time, t.is_lab
      FROM timetable_entries t
      JOIN sections s ON s.id = t.section_id
      JOIN departments d ON d.id = s.department_id
      JOIN academic_years y ON y.id = s.academic_year_id
      JOIN subjects sub ON sub.id = t.subject_id
      JOIN faculty f ON f.id = t.faculty_id
      JOIN rooms r ON r.id = t.room_id
      JOIN working_days w ON w.id = t.working_day_id
      JOIN time_slots ts ON ts.id = t.time_slot_id
      ORDER BY s.id, w.id, ts.period_number
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Automatic timetable generator
app.post('/api/generate', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [sections] = await connection.query('SELECT * FROM sections');
    const [subjects] = await connection.query('SELECT * FROM subjects');
    const [faculty] = await connection.query('SELECT * FROM faculty');
    const [rooms] = await connection.query(
      'SELECT * FROM rooms WHERE is_available = 1'
    );
    const [days] = await connection.query(`
      SELECT * FROM working_days
      WHERE is_working = 1 AND day_name IN (${WORKING_DAY_SQL_LIST})
      ORDER BY FIELD(day_name, ${WORKING_DAY_SQL_LIST})
    `);
    const [slots] = await connection.query(
      `SELECT * FROM time_slots
       WHERE slot_type = 'PERIOD'
       ORDER BY period_number`
    );
    const [links] = await connection.query('SELECT * FROM faculty_subjects');

    if (!sections.length || !subjects.length || !faculty.length ||
      !rooms.length || !days.length || !slots.length) {
      return res.status(400).json({
        message: 'Required data is missing. Check sections, subjects, faculty, rooms, days and periods.'
      });
    }

    if (slots.length !== 8 || slots.some((slot, index) => Number(slot.period_number) !== index + 1)) {
      return res.status(400).json({
        message: 'The timetable must be configured with exactly eight numbered teaching periods before generation.'
      });
    }

    const facultyForSubject = new Map();

    for (const link of links) {
      if (!facultyForSubject.has(link.subject_id)) {
        facultyForSubject.set(link.subject_id, []);
      }
      facultyForSubject.get(link.subject_id).push(link.faculty_id);
    }

    // Fallback to faculty in the same department if no assignment exists.
    for (const subject of subjects) {
      if (!facultyForSubject.has(subject.id)) {
        facultyForSubject.set(
          subject.id,
          faculty.filter(f => f.department_id === subject.department_id).map(f => f.id)
        );
      }
    }

    const usedSection = new Set();
    const usedFaculty = new Set();
    const usedRoom = new Set();
    const result = [];
    const conflicts = [];
    const key = (a, b, c) => `${a}-${b}-${c}`;

    for (const section of sections) {
      const matchingSubjects = subjects.filter(
        s => s.department_id === section.department_id &&
          s.year_id === section.academic_year_id
      );

      for (const subject of matchingSubjects) {
        let need = Number(subject.weekly_periods);
        const candidates = [];

        for (const day of days) {
          for (const slot of slots) {
            const facultyIds = facultyForSubject.get(subject.id) || [];
            const requiredRoomType =
              subject.subject_type === 'PRACTICAL' ? 'LAB' : 'CLASSROOM';

            const suitableRooms = rooms.filter(
              r => r.room_type === requiredRoomType &&
                Number(r.capacity) >= Number(section.strength)
            );

            for (const facultyId of facultyIds) {
              const teacher = faculty.find(f => f.id === facultyId);
              if (!teacher) continue;

              for (const room of suitableRooms) {
                const k1 = key(section.id, day.id, slot.id);
                const k2 = key(teacher.id, day.id, slot.id);
                const k3 = key(room.id, day.id, slot.id);

                if (usedSection.has(k1) || usedFaculty.has(k2) ||
                  usedRoom.has(k3)) continue;

                candidates.push({ day, slot, teacher, room });
              }
            }
          }
        }

        candidates.sort(
          (a, b) => a.day.id - b.day.id ||
            a.slot.period_number - b.slot.period_number
        );

        const chosen = [];
        const dayCount = new Map();

        for (const candidate of candidates) {
          if (need <= 0) break;
          const count = dayCount.get(candidate.day.id) || 0;
          if (count >= 2) continue;
          chosen.push(candidate);
          dayCount.set(candidate.day.id, count + 1);
          need--;
        }

        for (const candidate of candidates) {
          if (need <= 0) break;
          if (chosen.includes(candidate)) continue;
          chosen.push(candidate);
          need--;
        }

        if (need > 0) {
          conflicts.push(
            `${section.section_name}: ${subject.code} could not fit ${need} more period(s)`
          );
          continue;
        }

        for (const candidate of chosen) {
          usedSection.add(key(section.id, candidate.day.id, candidate.slot.id));
          usedFaculty.add(key(candidate.teacher.id, candidate.day.id, candidate.slot.id));
          usedRoom.add(key(candidate.room.id, candidate.day.id, candidate.slot.id));

          result.push([
            section.id,
            subject.id,
            candidate.teacher.id,
            candidate.room.id,
            candidate.day.id,
            candidate.slot.id,
            subject.subject_type === 'PRACTICAL'
          ]);
        }
      }
    }

    await connection.beginTransaction();

    // Replace the previous generated timetable only after new results are ready.
    await connection.query('DELETE FROM timetable_entries');

    if (result.length) {
      await connection.query(
        `INSERT INTO timetable_entries
         (section_id,subject_id,faculty_id,room_id,working_day_id,time_slot_id,is_lab)
         VALUES ?`,
        [result]
      );
    }

    await connection.commit();

    res.json({
      message: result.length
        ? 'Timetable generation finished'
        : 'No timetable entries could be generated',
      entries: result.length,
      conflicts
    });
  } catch (e) {
    await connection.rollback().catch(() => { });
    res.status(500).json({ message: e.message });
  } finally {
    connection.release();
  }
});

// ---------------------------------------------------------------------------
// Web app
// ---------------------------------------------------------------------------
// The built React app (frontend/dist) is served from the same origin as the
// API, so opening http://<pc-ip>:5000 on a phone shows the real application
// instead of a bare "backend is running" page.
const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, '..', '..', 'frontend', 'dist');

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));

  // SPA fallback: any non-API GET returns the app shell.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  // No build present - still answer the root so the server is not a dead end.
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head><title>Intelligent Timetable Generator</title></head>
        <body style="font-family:Arial;text-align:center;padding:60px;background:#101827;color:white">
          <h1>Intelligent Timetable Generator</h1>
          <p>Backend server is running successfully.</p>
          <p style="color:#9ca3af">The web app has not been built yet.<br>
             Run <code>npm run build</code> inside the <code>frontend</code> folder.</p>
          <p>API Health: <a style="color:#7ee787" href="/api/health">Check API</a></p>
        </body>
      </html>
    `);
  });
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT) || 5000;
// Bind to every interface so a phone on the same Wi-Fi can reach the API.
// "127.0.0.1" here is the usual cause of ERR_CONNECTION_TIMED_OUT on the device.
const HOST = process.env.HOST || '0.0.0.0';

// Collect the LAN addresses of this machine so the phone can be pointed at them.
function lanAddresses() {
  const found = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        found.push(entry.address);
      }
    }
  }
  return found;
}

const server = app.listen(PORT, HOST);

// Only report success once the socket is really bound, so a failed start
// never prints a URL that does not work.
server.on('listening', () => {
  console.log(`Backend: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);

  const addresses = lanAddresses();
  if (addresses.length) {
    console.log('Open on your phone (same Wi-Fi):');
    for (const address of addresses) {
      console.log(`  http://${address}:${PORT}`);
    }
  } else {
    console.log('No LAN address found - connect the PC to Wi-Fi/Ethernet.');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the other process or set PORT in backend/.env.`);
  } else {
    console.error('Backend failed to start:', err.message);
  }
  process.exit(1);
});

