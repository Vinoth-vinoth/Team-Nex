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
import { DEFAULT_AIDS_TIMETABLE } from './defaultAidsTimetable.js';
import { setupDepartmentAccounts } from './setupDepartmentAccounts.js';
import { runMigrations } from './migrate.js';

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

// Public departments list for registration form
app.get('/api/public/departments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, code, name FROM departments ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Public sections list for registration form (filtered by department)
app.get('/api/public/sections/:deptId', async (req, res) => {
  try {
    const { deptId } = req.params;
    const [rows] = await pool.query(
      `SELECT s.id, s.section_name, y.year_name
       FROM sections s
       JOIN academic_years y ON y.id = s.academic_year_id
       WHERE s.department_id = ?
       ORDER BY y.id, s.section_name`,
      [deptId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Staff and Student registration (Public registration CANNOT create Admin accounts)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, departmentId, identifier, sectionId } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Role is required.' });
    }

    const normalizedRole = String(role).toUpperCase();
    if (normalizedRole === 'ADMIN') {
      return res.status(403).json({ message: 'Public registration is not permitted for Admin accounts.' });
    }

    if (normalizedRole !== 'STAFF' && normalizedRole !== 'STUDENT') {
      return res.status(400).json({ message: 'Invalid role for registration. Only Staff and Student may register.' });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'College email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = String(email).trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'Password and Confirm Password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and Confirm Password do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (!departmentId) {
      return res.status(400).json({ message: 'Please select your department.' });
    }

    // Verify department exists
    const [deptRows] = await pool.query('SELECT id, name, code FROM departments WHERE id = ?', [departmentId]);
    if (!deptRows.length) {
      return res.status(400).json({ message: 'Selected department does not exist.' });
    }

    // Verify section if student and provided
    if (normalizedRole === 'STUDENT' && sectionId) {
      const [secRows] = await pool.query('SELECT id FROM sections WHERE id = ? AND department_id = ?', [sectionId, departmentId]);
      if (!secRows.length) {
        return res.status(400).json({ message: 'Selected class/section does not exist in this department.' });
      }
    }

    // Reject duplicate email
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length) {
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const cleanIdentifier = identifier ? String(identifier).trim() : null;
    const validSectionId = (normalizedRole === 'STUDENT' && sectionId) ? Number(sectionId) : null;

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, identifier, section_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [String(name).trim(), cleanEmail, passwordHash, normalizedRole, Number(departmentId), cleanIdentifier, validSectionId]
    );

    // If staff, ensure entry in faculty table
    if (normalizedRole === 'STAFF') {
      const [facRows] = await pool.query('SELECT id FROM faculty WHERE email = ?', [cleanEmail]);
      if (!facRows.length) {
        await pool.query(
          `INSERT INTO faculty (department_id, name, email, designation, max_periods_per_day)
           VALUES (?, ?, ?, ?, ?)`,
          [Number(departmentId), String(name).trim(), cleanEmail, cleanIdentifier || 'Assistant Professor', 6]
        );
      }
    }

    res.json({
      ok: true,
      message: `Registration successful! You may now sign in as ${normalizedRole === 'STAFF' ? 'Staff' : 'Student'} with your email and password.`
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const [rows] = await pool.query(
      `SELECT u.*, d.code AS department_code, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.email = ?`,
      [email]
    );

    if (
      !rows.length ||
      !(await bcrypt.compare(password, rows[0].password_hash))
    ) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const u = rows[0];

    // Verify that the selected role matches the authenticated account's actual role
    if (role && u.role.toUpperCase() !== String(role).toUpperCase()) {
      return res.status(403).json({
        message: `Account role mismatch: This account has '${u.role}' privileges, not '${role}' privileges. Please select the correct login portal.`
      });
    }

    const token = jwt.sign(
      {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        departmentId: u.department_id,
        departmentCode: u.department_code,
        departmentName: u.department_name
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
        departmentId: u.department_id,
        departmentCode: u.department_code,
        departmentName: u.department_name
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Validate a persisted frontend session before opening the protected dashboard.
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id,
              d.code AS department_code, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(401).json({ message: 'User not found' });
    const u = rows[0];
    res.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        departmentId: u.department_id,
        departmentCode: u.department_code,
        departmentName: u.department_name
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
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
    const deptId = req.user?.departmentId;
    const query = deptId
      ? 'SELECT * FROM departments WHERE id = ? ORDER BY id'
      : 'SELECT * FROM departments ORDER BY id';
    const [rows] = deptId ? await pool.query(query, [deptId]) : await pool.query(query);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/departments', auth, roles('ADMIN'), async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) return res.status(400).json({ message: 'Code and name are required' });
    await pool.query('INSERT INTO departments (code, name) VALUES (?, ?)', [code, name]);
    res.json({ message: 'Department added' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.delete('/api/departments/:id', auth, roles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;
    if (userDeptId && Number(id) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot delete other departments' });
    }
    await pool.query('DELETE FROM departments WHERE id = ?', [id]);
    res.json({ message: 'Department deleted' });
  } catch (e) {
    res.status(400).json({ message: e.message });
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
    const deptId = req.user?.departmentId;
    const query = `
      SELECT s.*, d.code department, y.year_name
      FROM sections s
      JOIN departments d ON d.id = s.department_id
      JOIN academic_years y ON y.id = s.academic_year_id
      ${deptId ? 'WHERE s.department_id = ?' : ''}
      ORDER BY d.id, y.id, s.section_name
    `;
    const [rows] = deptId ? await pool.query(query, [deptId]) : await pool.query(query);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/sections', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const userDeptId = req.user?.departmentId;
    const { departmentId, academicYearId, sectionName, strength } = req.body;
    if (userDeptId && departmentId && Number(departmentId) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot create sections for other departments' });
    }
    const targetDeptId = userDeptId || departmentId;

    await pool.query(
      `INSERT INTO sections(department_id,academic_year_id,section_name,strength)
       VALUES(?,?,?,?)`,
      [targetDeptId, academicYearId, sectionName, strength || 60]
    );
    res.json({ message: 'Section added' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.put('/api/sections/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;
    const { departmentId, academicYearId, sectionName, strength } = req.body;

    const [existing] = await pool.query('SELECT * FROM sections WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Section not found' });

    if (userDeptId && Number(existing[0].department_id) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot edit sections belonging to other departments' });
    }

    const targetDeptId = userDeptId || departmentId || existing[0].department_id;
    const targetYearId = academicYearId || existing[0].academic_year_id;
    const targetName = sectionName || existing[0].section_name;
    const targetStrength = strength !== undefined ? strength : existing[0].strength;

    await pool.query(
      `UPDATE sections
       SET department_id = ?, academic_year_id = ?, section_name = ?, strength = ?
       WHERE id = ?`,
      [targetDeptId, targetYearId, targetName, targetStrength, id]
    );

    res.json({ ok: true, message: 'Section updated successfully' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.delete('/api/sections/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;
    if (userDeptId) {
      const [sec] = await pool.query('SELECT department_id FROM sections WHERE id = ?', [id]);
      if (!sec.length) return res.status(404).json({ message: 'Section not found' });
      if (Number(sec[0].department_id) !== Number(userDeptId)) {
        return res.status(403).json({ message: 'Access denied: cannot delete sections belonging to other departments' });
      }
    }
    await pool.query('DELETE FROM timetable_entries WHERE section_id = ?', [id]);
    await pool.query('DELETE FROM sections WHERE id = ?', [id]);
    res.json({ message: 'Section deleted' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Subjects
app.get('/api/subjects', auth, async (req, res) => {
  try {
    const deptId = req.user?.departmentId;
    const query = `
      SELECT s.*, d.code department, y.year_name
      FROM subjects s
      JOIN departments d ON d.id = s.department_id
      JOIN academic_years y ON y.id = s.year_id
      ${deptId ? 'WHERE s.department_id = ?' : ''}
      ORDER BY d.id, y.id, s.name
    `;
    const [rows] = deptId ? await pool.query(query, [deptId]) : await pool.query(query);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/subjects', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const userDeptId = req.user?.departmentId;
    const {
      departmentId, yearId, code, name, subjectType,
      weeklyPeriods, totalHours, labPeriods
    } = req.body;

    if (userDeptId && departmentId && Number(departmentId) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot create subjects for other departments' });
    }
    const targetDeptId = userDeptId || departmentId;

    await pool.query(
      `INSERT INTO subjects
       (department_id,year_id,code,name,subject_type,weekly_periods,total_hours,lab_periods)
       VALUES(?,?,?,?,?,?,?,?)`,
      [
        targetDeptId, yearId, code, name, subjectType,
        weeklyPeriods, totalHours || null, labPeriods || 0
      ]
    );
    res.json({ message: 'Subject added' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.put('/api/subjects/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;
    const { departmentId, yearId, code, name, subjectType, weeklyPeriods, totalHours, labPeriods } = req.body;

    const [existing] = await pool.query('SELECT * FROM subjects WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Subject not found' });

    if (userDeptId && Number(existing[0].department_id) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot edit subjects belonging to other departments' });
    }

    const targetDeptId = userDeptId || departmentId || existing[0].department_id;
    const targetYearId = yearId || existing[0].year_id;
    const targetCode = code || existing[0].code;
    const targetName = name || existing[0].name;
    const targetType = subjectType || existing[0].subject_type;
    const targetWeekly = weeklyPeriods !== undefined ? weeklyPeriods : existing[0].weekly_periods;
    const targetHours = totalHours !== undefined ? totalHours : existing[0].total_hours;
    const targetLab = labPeriods !== undefined ? labPeriods : existing[0].lab_periods;

    await pool.query(
      `UPDATE subjects
       SET department_id = ?, year_id = ?, code = ?, name = ?, subject_type = ?,
           weekly_periods = ?, total_hours = ?, lab_periods = ?
       WHERE id = ?`,
      [targetDeptId, targetYearId, targetCode, targetName, targetType, targetWeekly, targetHours, targetLab, id]
    );

    res.json({ ok: true, message: 'Subject updated successfully' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.delete('/api/subjects/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;

    if (userDeptId) {
      const [sub] = await pool.query('SELECT department_id FROM subjects WHERE id = ?', [id]);
      if (!sub.length) return res.status(404).json({ message: 'Subject not found' });
      if (Number(sub[0].department_id) !== Number(userDeptId)) {
        return res.status(403).json({ message: 'Access denied: cannot delete subjects belonging to other departments' });
      }
    }

    await pool.query('DELETE FROM timetable_entries WHERE subject_id = ?', [id]);
    await pool.query('DELETE FROM faculty_subjects WHERE subject_id = ?', [id]);
    await pool.query('DELETE FROM subjects WHERE id = ?', [id]);
    res.json({ message: 'Subject deleted' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Faculty
app.get('/api/faculty', auth, async (req, res) => {
  try {
    const deptId = req.user?.departmentId;
    const query = `
      SELECT f.*, d.code department
      FROM faculty f
      JOIN departments d ON d.id = f.department_id
      ${deptId ? 'WHERE f.department_id = ?' : ''}
      ORDER BY d.id, f.name
    `;
    const [rows] = deptId ? await pool.query(query, [deptId]) : await pool.query(query);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/faculty', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const userDeptId = req.user?.departmentId;
    const { departmentId, name, email, designation, maxPeriodsPerDay } = req.body;

    if (userDeptId && departmentId && Number(departmentId) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot create faculty for other departments' });
    }
    const targetDeptId = userDeptId || departmentId;

    await pool.query(
      `INSERT INTO faculty
       (department_id,name,email,designation,max_periods_per_day)
       VALUES(?,?,?,?,?)`,
      [targetDeptId, name, email || null, designation || null, maxPeriodsPerDay || 6]
    );
    res.json({ message: 'Faculty added' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.put('/api/faculty/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;
    const { departmentId, name, email, designation, maxPeriodsPerDay } = req.body;

    const [existing] = await pool.query('SELECT * FROM faculty WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Faculty member not found' });

    if (userDeptId && Number(existing[0].department_id) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot edit faculty belonging to other departments' });
    }

    const targetDeptId = userDeptId || departmentId || existing[0].department_id;
    const targetName = name || existing[0].name;
    const targetEmail = email !== undefined ? email : existing[0].email;
    const targetDesignation = designation !== undefined ? designation : existing[0].designation;
    const targetMax = maxPeriodsPerDay !== undefined ? maxPeriodsPerDay : existing[0].max_periods_per_day;

    await pool.query(
      `UPDATE faculty
       SET department_id = ?, name = ?, email = ?, designation = ?, max_periods_per_day = ?
       WHERE id = ?`,
      [targetDeptId, targetName, targetEmail, targetDesignation, targetMax, id]
    );

    res.json({ ok: true, message: 'Faculty updated successfully' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.delete('/api/faculty/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;

    if (userDeptId) {
      const [fac] = await pool.query('SELECT department_id FROM faculty WHERE id = ?', [id]);
      if (!fac.length) return res.status(404).json({ message: 'Faculty not found' });
      if (Number(fac[0].department_id) !== Number(userDeptId)) {
        return res.status(403).json({ message: 'Access denied: cannot delete faculty belonging to other departments' });
      }
    }

    await pool.query('DELETE FROM timetable_entries WHERE faculty_id = ?', [id]);
    await pool.query('DELETE FROM faculty_subjects WHERE faculty_id = ?', [id]);
    await pool.query('DELETE FROM faculty_availability WHERE faculty_id = ?', [id]);
    await pool.query('DELETE FROM faculty WHERE id = ?', [id]);
    res.json({ message: 'Faculty deleted' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Rooms
app.get('/api/rooms', auth, async (req, res) => {
  try {
    const deptId = req.user?.departmentId;
    const query = deptId
      ? 'SELECT * FROM rooms WHERE department_id IS NULL OR department_id = ? ORDER BY room_type, room_code'
      : 'SELECT * FROM rooms ORDER BY room_type, room_code';
    const [rows] = deptId ? await pool.query(query, [deptId]) : await pool.query(query);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/rooms', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const userDeptId = req.user?.departmentId;
    const { departmentId, roomCode, roomType, capacity } = req.body;
    const targetDeptId = userDeptId || departmentId || null;
    await pool.query(
      `INSERT INTO rooms(department_id,room_code,room_type,capacity)
       VALUES(?,?,?,?)`,
      [targetDeptId, roomCode, roomType, capacity || 60]
    );
    res.json({ message: 'Room/Lab added' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.put('/api/rooms/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;
    const { departmentId, roomCode, roomType, capacity, isAvailable } = req.body;

    const [existing] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Room not found' });

    if (userDeptId && existing[0].department_id !== null && Number(existing[0].department_id) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot edit rooms of another department' });
    }

    const targetCode = roomCode || existing[0].room_code;
    const targetType = roomType || existing[0].room_type;
    const targetCapacity = capacity !== undefined ? capacity : existing[0].capacity;
    const targetAvail = isAvailable !== undefined ? (isAvailable ? 1 : 0) : existing[0].is_available;
    const targetDept = departmentId !== undefined ? (departmentId || null) : existing[0].department_id;

    await pool.query(
      `UPDATE rooms
       SET department_id = ?, room_code = ?, room_type = ?, capacity = ?, is_available = ?
       WHERE id = ?`,
      [targetDept, targetCode, targetType, targetCapacity, targetAvail, id]
    );

    res.json({ ok: true, message: 'Room updated successfully' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.delete('/api/rooms/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;
    if (userDeptId) {
      const [rm] = await pool.query('SELECT department_id FROM rooms WHERE id = ?', [id]);
      if (!rm.length) return res.status(404).json({ message: 'Room not found' });
      if (rm[0].department_id === null || Number(rm[0].department_id) !== Number(userDeptId)) {
        return res.status(403).json({ message: 'Access denied: cannot delete shared or other department rooms' });
      }
    }
    await pool.query('DELETE FROM timetable_entries WHERE room_id = ?', [id]);
    await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    res.json({ message: 'Room deleted' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Faculty-Subject mappings
app.get('/api/faculty-subjects', auth, async (req, res) => {
  try {
    const deptId = req.user?.departmentId;
    const query = `
      SELECT fs.faculty_id, fs.subject_id, f.name AS faculty_name, f.designation,
             s.code AS subject_code, s.name AS subject_name, d.code AS department
      FROM faculty_subjects fs
      JOIN faculty f ON f.id = fs.faculty_id
      JOIN subjects s ON s.id = fs.subject_id
      LEFT JOIN departments d ON d.id = s.department_id
      ${deptId ? 'WHERE s.department_id = ?' : ''}
      ORDER BY s.code, f.name
    `;
    const [rows] = deptId ? await pool.query(query, [deptId]) : await pool.query(query);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/faculty-subjects', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const userDeptId = req.user?.departmentId;
    const rawFac = req.body.facultyId ?? req.body.faculty_id ?? req.body.faculty;
    const rawSub = req.body.subjectId ?? req.body.subject_id ?? req.body.subject;
    const facultyId = Number(rawFac);
    const subjectId = Number(rawSub);

    if (!facultyId || !subjectId) {
      return res.status(400).json({ message: 'Valid facultyId and subjectId are required' });
    }

    const [fac] = await pool.query('SELECT id, name, department_id FROM faculty WHERE id = ?', [facultyId]);
    if (!fac.length) return res.status(404).json({ message: 'Faculty member not found' });

    const [sub] = await pool.query('SELECT id, code, name, department_id FROM subjects WHERE id = ?', [subjectId]);
    if (!sub.length) return res.status(404).json({ message: 'Subject not found' });

    if (userDeptId && (Number(sub[0].department_id) !== Number(userDeptId) || Number(fac[0].department_id) !== Number(userDeptId))) {
      return res.status(403).json({ message: 'Access denied: cannot assign faculty/subjects from other departments' });
    }

    const [existing] = await pool.query(
      'SELECT * FROM faculty_subjects WHERE faculty_id = ? AND subject_id = ?',
      [facultyId, subjectId]
    );

    if (existing.length) {
      return res.json({
        message: `${fac[0].name} is already assigned to ${sub[0].code} (${sub[0].name})`,
        alreadyExists: true
      });
    }

    await pool.query(
      'INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES (?, ?)',
      [facultyId, subjectId]
    );

    res.json({
      message: `Successfully assigned ${fac[0].name} to ${sub[0].code} (${sub[0].name})`
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.delete('/api/faculty-subjects/:facultyId/:subjectId', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { facultyId, subjectId } = req.params;
    const userDeptId = req.user?.departmentId;

    if (userDeptId) {
      const [sub] = await pool.query('SELECT department_id FROM subjects WHERE id = ?', [subjectId]);
      if (!sub.length || Number(sub[0].department_id) !== Number(userDeptId)) {
        return res.status(403).json({ message: 'Access denied: cannot remove assignment from other department' });
      }
    }

    await pool.query(
      'DELETE FROM faculty_subjects WHERE faculty_id = ? AND subject_id = ?',
      [facultyId, subjectId]
    );
    res.json({ message: 'Assignment removed' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// View timetable
app.get('/api/timetable', auth, async (req, res) => {
  try {
    const deptId = req.user?.departmentId;
    const query = `
      SELECT t.id, t.section_id, t.subject_id, t.faculty_id, t.room_id,
      t.working_day_id, t.time_slot_id,
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
      ${deptId ? 'WHERE s.department_id = ?' : ''}
      ORDER BY s.id, w.id, ts.period_number
    `;
    const [rows] = deptId ? await pool.query(query, [deptId]) : await pool.query(query);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Edit timetable entry with full conflict detection & constraint validation
app.put('/api/timetable/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;
    const { subjectId, facultyId, roomId, workingDayId, timeSlotId } = req.body;

    const [entryRows] = await pool.query(
      `SELECT t.*, s.department_id, s.section_name
       FROM timetable_entries t
       JOIN sections s ON s.id = t.section_id
       WHERE t.id = ?`,
      [id]
    );
    if (!entryRows.length) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    const current = entryRows[0];
    if (userDeptId && Number(current.department_id) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot edit timetable entry belonging to another department' });
    }

    const targetSubjectId = subjectId ? Number(subjectId) : current.subject_id;
    const targetFacultyId = facultyId ? Number(facultyId) : current.faculty_id;
    const targetRoomId = roomId ? Number(roomId) : current.room_id;
    const targetDayId = workingDayId ? Number(workingDayId) : current.working_day_id;
    const targetSlotId = timeSlotId ? Number(timeSlotId) : current.time_slot_id;

    // Validate subject exists
    const [sub] = await pool.query('SELECT * FROM subjects WHERE id = ?', [targetSubjectId]);
    if (!sub.length) return res.status(400).json({ message: 'Selected subject does not exist' });
    const isLab = sub[0].subject_type === 'PRACTICAL';

    // Validate faculty exists
    const [fac] = await pool.query('SELECT * FROM faculty WHERE id = ?', [targetFacultyId]);
    if (!fac.length) return res.status(400).json({ message: 'Selected faculty does not exist' });

    // Validate room exists
    const [room] = await pool.query('SELECT * FROM rooms WHERE id = ?', [targetRoomId]);
    if (!room.length) return res.status(400).json({ message: 'Selected room/lab does not exist' });

    if (isLab && room[0].room_type !== 'LAB') {
      return res.status(409).json({
        message: `Conflict: Practical subject '${sub[0].name}' (${sub[0].code}) requires a Laboratory room, but '${room[0].room_code}' is a Classroom.`
      });
    }

    // Validate slot is a PERIOD slot
    const [slot] = await pool.query('SELECT * FROM time_slots WHERE id = ?', [targetSlotId]);
    if (!slot.length || slot[0].slot_type !== 'PERIOD') {
      return res.status(400).json({ message: 'Timetable entries can only be placed in teaching periods, not breaks or lunch.' });
    }

    // Validate working day
    const [day] = await pool.query('SELECT * FROM working_days WHERE id = ?', [targetDayId]);
    if (!day.length) return res.status(400).json({ message: 'Selected working day does not exist' });

    // CONFLICT CHECK 1: Section conflict (duplicate section assignment at same day/slot)
    const [secClash] = await pool.query(
      `SELECT t.id, sub.code, ts.slot_name, w.day_name
       FROM timetable_entries t
       JOIN subjects sub ON sub.id = t.subject_id
       JOIN time_slots ts ON ts.id = t.time_slot_id
       JOIN working_days w ON w.id = t.working_day_id
       WHERE t.section_id = ? AND t.working_day_id = ? AND t.time_slot_id = ? AND t.id != ?`,
      [current.section_id, targetDayId, targetSlotId, id]
    );
    if (secClash.length) {
      return res.status(409).json({
        message: `Conflict: Section '${current.section_name}' already has '${secClash[0].code}' scheduled on ${secClash[0].day_name} at ${secClash[0].slot_name}.`
      });
    }

    // CONFLICT CHECK 2: Faculty conflict (faculty double-booking at same day/slot)
    const [facClash] = await pool.query(
      `SELECT t.id, sec.section_name, sub.code, ts.slot_name, w.day_name
       FROM timetable_entries t
       JOIN sections sec ON sec.id = t.section_id
       JOIN subjects sub ON sub.id = t.subject_id
       JOIN time_slots ts ON ts.id = t.time_slot_id
       JOIN working_days w ON w.id = t.working_day_id
       WHERE t.faculty_id = ? AND t.working_day_id = ? AND t.time_slot_id = ? AND t.id != ?`,
      [targetFacultyId, targetDayId, targetSlotId, id]
    );
    if (facClash.length) {
      return res.status(409).json({
        message: `Conflict: Faculty member '${fac[0].name}' is already assigned to Section '${facClash[0].section_name}' (${facClash[0].code}) on ${facClash[0].day_name} at ${facClash[0].slot_name}.`
      });
    }

    // CONFLICT CHECK 3: Room conflict (room occupied at same day/slot)
    const [roomClash] = await pool.query(
      `SELECT t.id, sec.section_name, sub.code, r.room_code, ts.slot_name, w.day_name
       FROM timetable_entries t
       JOIN sections sec ON sec.id = t.section_id
       JOIN subjects sub ON sub.id = t.subject_id
       JOIN rooms r ON r.id = t.room_id
       JOIN time_slots ts ON ts.id = t.time_slot_id
       JOIN working_days w ON w.id = t.working_day_id
       WHERE t.room_id = ? AND t.working_day_id = ? AND t.time_slot_id = ? AND t.id != ?`,
      [targetRoomId, targetDayId, targetSlotId, id]
    );
    if (roomClash.length) {
      return res.status(409).json({
        message: `Conflict: Room '${roomClash[0].room_code}' is already booked for Section '${roomClash[0].section_name}' (${roomClash[0].code}) on ${roomClash[0].day_name} at ${roomClash[0].slot_name}.`
      });
    }

    // All validation passed, update database
    await pool.query(
      `UPDATE timetable_entries
       SET subject_id = ?, faculty_id = ?, room_id = ?, working_day_id = ?, time_slot_id = ?, is_lab = ?
       WHERE id = ?`,
      [targetSubjectId, targetFacultyId, targetRoomId, targetDayId, targetSlotId, isLab ? 1 : 0, id]
    );

    res.json({ ok: true, message: 'Timetable entry updated successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create new timetable entry for empty period cell
app.post('/api/timetable', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const userDeptId = req.user?.departmentId;
    const { sectionId, subjectId, facultyId, roomId, workingDayId, timeSlotId } = req.body;

    if (!sectionId || !subjectId || !facultyId || !roomId || !workingDayId || !timeSlotId) {
      return res.status(400).json({ message: 'Missing required fields: sectionId, subjectId, facultyId, roomId, workingDayId, and timeSlotId are required.' });
    }

    const [secRows] = await pool.query('SELECT * FROM sections WHERE id = ?', [sectionId]);
    if (!secRows.length) {
      return res.status(404).json({ message: 'Selected section not found.' });
    }
    const sec = secRows[0];
    if (userDeptId && Number(sec.department_id) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot add timetable entries for other departments.' });
    }

    const targetSubjectId = Number(subjectId);
    const targetFacultyId = Number(facultyId);
    const targetRoomId = Number(roomId);
    const targetDayId = Number(workingDayId);
    const targetSlotId = Number(timeSlotId);

    // Validate subject exists
    const [sub] = await pool.query('SELECT * FROM subjects WHERE id = ?', [targetSubjectId]);
    if (!sub.length) return res.status(400).json({ message: 'Selected subject does not exist.' });
    const isLab = sub[0].subject_type === 'PRACTICAL';

    // Validate faculty exists
    const [fac] = await pool.query('SELECT * FROM faculty WHERE id = ?', [targetFacultyId]);
    if (!fac.length) return res.status(400).json({ message: 'Selected faculty does not exist.' });

    // Validate room exists
    const [room] = await pool.query('SELECT * FROM rooms WHERE id = ?', [targetRoomId]);
    if (!room.length) return res.status(400).json({ message: 'Selected room/lab does not exist.' });

    if (isLab && room[0].room_type !== 'LAB') {
      return res.status(409).json({
        message: `Conflict: Practical subject '${sub[0].name}' (${sub[0].code}) requires a Laboratory room, but '${room[0].room_code}' is a Classroom.`
      });
    }

    // Validate slot is a PERIOD slot
    const [slot] = await pool.query('SELECT * FROM time_slots WHERE id = ?', [targetSlotId]);
    if (!slot.length || slot[0].slot_type !== 'PERIOD') {
      return res.status(400).json({ message: 'Timetable entries can only be placed in teaching periods (P1 to P8), not breaks or lunch.' });
    }

    // Validate working day
    const [day] = await pool.query('SELECT * FROM working_days WHERE id = ?', [targetDayId]);
    if (!day.length) return res.status(400).json({ message: 'Selected working day does not exist.' });

    // CONFLICT CHECK 1: Section conflict (duplicate section assignment at same day/slot)
    const [secClash] = await pool.query(
      `SELECT t.id, sub.code, ts.slot_name, w.day_name
       FROM timetable_entries t
       JOIN subjects sub ON sub.id = t.subject_id
       JOIN time_slots ts ON ts.id = t.time_slot_id
       JOIN working_days w ON w.id = t.working_day_id
       WHERE t.section_id = ? AND t.working_day_id = ? AND t.time_slot_id = ?`,
      [sectionId, targetDayId, targetSlotId]
    );
    if (secClash.length) {
      return res.status(409).json({
        message: `Conflict: Section '${sec.section_name}' already has '${secClash[0].code}' scheduled on ${secClash[0].day_name} at ${secClash[0].slot_name}.`
      });
    }

    // CONFLICT CHECK 2: Faculty conflict (faculty double-booking at same day/slot)
    const [facClash] = await pool.query(
      `SELECT t.id, sec.section_name, sub.code, ts.slot_name, w.day_name
       FROM timetable_entries t
       JOIN sections sec ON sec.id = t.section_id
       JOIN subjects sub ON sub.id = t.subject_id
       JOIN time_slots ts ON ts.id = t.time_slot_id
       JOIN working_days w ON w.id = t.working_day_id
       WHERE t.faculty_id = ? AND t.working_day_id = ? AND t.time_slot_id = ?`,
      [targetFacultyId, targetDayId, targetSlotId]
    );
    if (facClash.length) {
      return res.status(409).json({
        message: `Conflict: Faculty member '${fac[0].name}' is already assigned to Section '${facClash[0].section_name}' (${facClash[0].code}) on ${facClash[0].day_name} at ${facClash[0].slot_name}.`
      });
    }

    // CONFLICT CHECK 3: Room conflict (room occupied at same day/slot)
    const [roomClash] = await pool.query(
      `SELECT t.id, sec.section_name, sub.code, r.room_code, ts.slot_name, w.day_name
       FROM timetable_entries t
       JOIN sections sec ON sec.id = t.section_id
       JOIN subjects sub ON sub.id = t.subject_id
       JOIN rooms r ON r.id = t.room_id
       JOIN time_slots ts ON ts.id = t.time_slot_id
       JOIN working_days w ON w.id = t.working_day_id
       WHERE t.room_id = ? AND t.working_day_id = ? AND t.time_slot_id = ?`,
      [targetRoomId, targetDayId, targetSlotId]
    );
    if (roomClash.length) {
      return res.status(409).json({
        message: `Conflict: Room '${roomClash[0].room_code}' is already booked for Section '${roomClash[0].section_name}' (${roomClash[0].code}) on ${roomClash[0].day_name} at ${roomClash[0].slot_name}.`
      });
    }

    // Insert new entry into timetable_entries
    const [insertResult] = await pool.query(
      `INSERT INTO timetable_entries
       (section_id, subject_id, faculty_id, room_id, working_day_id, time_slot_id, is_lab)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sectionId, targetSubjectId, targetFacultyId, targetRoomId, targetDayId, targetSlotId, isLab ? 1 : 0]
    );

    res.json({ ok: true, message: 'Timetable entry added successfully', id: insertResult.insertId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Delete timetable entry
app.delete('/api/timetable/:id', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    const userDeptId = req.user?.departmentId;
    const [entryRows] = await pool.query(
      `SELECT t.*, s.department_id FROM timetable_entries t JOIN sections s ON s.id = t.section_id WHERE t.id = ?`,
      [id]
    );
    if (!entryRows.length) return res.status(404).json({ message: 'Timetable entry not found' });
    if (userDeptId && Number(entryRows[0].department_id) !== Number(userDeptId)) {
      return res.status(403).json({ message: 'Access denied: cannot delete timetable entry belonging to another department' });
    }
    await pool.query('DELETE FROM timetable_entries WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Timetable entry removed successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Automatic timetable generator
app.post('/api/generate', auth, roles('ADMIN', 'STAFF'), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const deptId = req.user?.departmentId;

    const [sections] = deptId
      ? await connection.query('SELECT * FROM sections WHERE department_id = ?', [deptId])
      : await connection.query('SELECT * FROM sections');

    const [subjects] = deptId
      ? await connection.query('SELECT * FROM subjects WHERE department_id = ?', [deptId])
      : await connection.query('SELECT * FROM subjects');

    const [faculty] = deptId
      ? await connection.query('SELECT * FROM faculty WHERE department_id = ?', [deptId])
      : await connection.query('SELECT * FROM faculty');

    const [rooms] = await connection.query(
      deptId
        ? 'SELECT * FROM rooms WHERE is_available = 1 AND (department_id IS NULL OR department_id = ?)'
        : 'SELECT * FROM rooms WHERE is_available = 1',
      deptId ? [deptId] : []
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

    // Pre-populate usedFaculty and usedRoom from other departments to prevent collisions on shared resources
    if (deptId) {
      const [otherEntries] = await connection.query(
        `SELECT t.faculty_id, t.room_id, t.working_day_id, t.time_slot_id
         FROM timetable_entries t
         JOIN sections s ON s.id = t.section_id
         WHERE s.department_id != ?`,
        [deptId]
      );
      for (const entry of otherEntries) {
        usedFaculty.add(key(entry.faculty_id, entry.working_day_id, entry.time_slot_id));
        usedRoom.add(key(entry.room_id, entry.working_day_id, entry.time_slot_id));
      }
    }

    for (const section of sections) {
      const matchingSubjects = subjects.filter(
        s => s.department_id === section.department_id &&
          s.year_id === section.academic_year_id
      );

      for (const subject of matchingSubjects) {
        let need = Number(subject.weekly_periods);
        const isLab = subject.subject_type === 'PRACTICAL';
        const requiredRoomType = isLab ? 'LAB' : 'CLASSROOM';
        const facultyIds = facultyForSubject.get(subject.id) || [];
        const suitableRooms = rooms.filter(
          r => r.room_type === requiredRoomType &&
            Number(r.capacity) >= Number(section.strength)
        );

        if (!suitableRooms.length || !facultyIds.length) {
          conflicts.push(`${section.section_name}: ${subject.code} has no suitable ${requiredRoomType.toLowerCase()} or assigned faculty.`);
          continue;
        }

        const chosen = [];
        const dayCount = new Map();

        // Pass 1: Try to distribute across different days (max 1 per day for theory)
        for (const day of days) {
          if (need <= 0) break;
          for (const slot of slots) {
            if (need <= 0) break;
            const currentDayCount = dayCount.get(day.id) || 0;
            if (!isLab && currentDayCount >= 1 && need > 1) {
              continue;
            }

            let foundCandidate = null;
            for (const fId of facultyIds) {
              const teacher = faculty.find(f => f.id === fId);
              if (!teacher) continue;
              const kTeacher = key(teacher.id, day.id, slot.id);
              if (usedFaculty.has(kTeacher)) continue;

              for (const room of suitableRooms) {
                const kRoom = key(room.id, day.id, slot.id);
                const kSec = key(section.id, day.id, slot.id);
                if (usedRoom.has(kRoom) || usedSection.has(kSec)) continue;

                foundCandidate = { day, slot, teacher, room };
                break;
              }
              if (foundCandidate) break;
            }

            if (foundCandidate) {
              chosen.push(foundCandidate);
              usedSection.add(key(section.id, day.id, slot.id));
              usedFaculty.add(key(foundCandidate.teacher.id, day.id, slot.id));
              usedRoom.add(key(foundCandidate.room.id, day.id, slot.id));
              dayCount.set(day.id, currentDayCount + 1);
              need--;
            }
          }
        }

        // Pass 2: Secondary pass if need > 0 (allowing 2nd period on same day)
        if (need > 0) {
          for (const day of days) {
            if (need <= 0) break;
            for (const slot of slots) {
              if (need <= 0) break;
              const currentDayCount = dayCount.get(day.id) || 0;
              if (currentDayCount >= 2) continue;

              let foundCandidate = null;
              for (const fId of facultyIds) {
                const teacher = faculty.find(f => f.id === fId);
                if (!teacher) continue;
                const kTeacher = key(teacher.id, day.id, slot.id);
                if (usedFaculty.has(kTeacher)) continue;

                for (const room of suitableRooms) {
                  const kRoom = key(room.id, day.id, slot.id);
                  const kSec = key(section.id, day.id, slot.id);
                  if (usedRoom.has(kRoom) || usedSection.has(kSec)) continue;

                  foundCandidate = { day, slot, teacher, room };
                  break;
                }
                if (foundCandidate) break;
              }

              if (foundCandidate) {
                chosen.push(foundCandidate);
                usedSection.add(key(section.id, day.id, slot.id));
                usedFaculty.add(key(foundCandidate.teacher.id, day.id, slot.id));
                usedRoom.add(key(foundCandidate.room.id, day.id, slot.id));
                dayCount.set(day.id, currentDayCount + 1);
                need--;
              }
            }
          }
        }

        if (need > 0) {
          conflicts.push(`${section.section_name}: ${subject.code} could not fit ${need} more period(s)`);
        }

        for (const candidate of chosen) {
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

    // Replace the previous generated timetable for this department only
    if (deptId) {
      await connection.query(
        `DELETE t FROM timetable_entries t
         JOIN sections s ON s.id = t.section_id
         WHERE s.department_id = ?`,
        [deptId]
      );
    } else {
      await connection.query('DELETE FROM timetable_entries');
    }

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
const here = path.dirname(fileURLToPath(import.meta.url));
const aidsFilePath = path.resolve(here, 'aids_timetable.json');

app.get('/api/aids-timetable', (req, res) => {
  try {
    if (fs.existsSync(aidsFilePath)) {
      const content = fs.readFileSync(aidsFilePath, 'utf-8');
      return res.json(JSON.parse(content));
    }
    return res.json(DEFAULT_AIDS_TIMETABLE);
  } catch (e) {
    return res.json(DEFAULT_AIDS_TIMETABLE);
  }
});

app.post('/api/aids-timetable', (req, res) => {
  try {
    const updated = req.body;
    fs.writeFileSync(aidsFilePath, JSON.stringify(updated, null, 2), 'utf-8');
    return res.json({ ok: true, message: 'Timetable saved successfully', data: updated });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

app.post('/api/aids-timetable/reset', (req, res) => {
  try {
    if (fs.existsSync(aidsFilePath)) {
      fs.unlinkSync(aidsFilePath);
    }
    return res.json({ ok: true, message: 'Timetable reset to default', data: DEFAULT_AIDS_TIMETABLE });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});



// ---------------------------------------------------------------------------
// Web app
// ---------------------------------------------------------------------------
// The built React app (frontend/dist) is served from the same origin as the
// API, so opening http://<pc-ip>:5000 on a phone shows the real application
// instead of a bare "backend is running" page.
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
        <head><title>Info Institute of Engineering — Timetable System</title></head>
        <body style="font-family:Arial;text-align:center;padding:60px;background:#101827;color:white">
          <h1>Info Institute of Engineering</h1>
          <p>Intelligent Timetable & Scheduling System — Backend Running</p>
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

  runMigrations().catch(err => {
    console.error('Failed to run migrations on startup:', err);
  });

  setupDepartmentAccounts().catch(err => {
    console.error('Failed to run setupDepartmentAccounts on startup:', err);
  });

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

