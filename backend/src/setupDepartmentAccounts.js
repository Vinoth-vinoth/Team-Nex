import bcrypt from 'bcryptjs';
import { pool } from './db.js';

export async function setupDepartmentAccounts() {
  console.log('--- Starting Department Accounts & Subject Setup ---');

  // 1. UPDATE SUBJECT (CHANGE 1)
  // Find record: Code: OET356 / LIW / Basics of Integrated Water Resource Management (or OBT356 / Lifestyle Diseases)
  // Replace with: Code: OBT356, Abbreviation: LD, Subject Name: Lifestyle Diseases, Faculty Name: Mr. T. R. Vignesh, AP/AI&DS, Periods: 5
  const [existingSubs] = await pool.query(
    "SELECT * FROM subjects WHERE code IN ('OET356', 'OBT356') OR name LIKE '%Water Resource%' OR name LIKE '%Lifestyle%'"
  );

  let subId = null;
  if (existingSubs.length > 0) {
    subId = existingSubs[0].id;
    console.log(`Found existing subject (id: ${subId}, code: ${existingSubs[0].code}, name: ${existingSubs[0].name}). Updating to OBT356 / Lifestyle Diseases (5 periods)...`);
    await pool.query(
      `UPDATE subjects 
       SET code = 'OBT356', name = 'Lifestyle Diseases', weekly_periods = 5, total_hours = 50 
       WHERE id = ?`,
      [subId]
    );
  } else {
    const [aidsDept] = await pool.query("SELECT id FROM departments WHERE code = 'AI&DS'");
    const [year3] = await pool.query("SELECT id FROM academic_years WHERE year_name = '3RD' OR id = 3");
    const deptId = aidsDept[0]?.id || 1;
    const yrId = year3[0]?.id || 3;
    console.log('Subject not found. Inserting OBT356 / Lifestyle Diseases...');
    const [ins] = await pool.query(
      `INSERT INTO subjects (department_id, year_id, code, name, subject_type, weekly_periods, total_hours, lab_periods)
       VALUES (?, ?, 'OBT356', 'Lifestyle Diseases', 'THEORY', 5, 50, 0)`,
      [deptId, yrId]
    );
    subId = ins.insertId;
  }

  // Ensure Mr. T. R. Vignesh is in faculty table
  const [vigneshFac] = await pool.query("SELECT id FROM faculty WHERE name LIKE '%Vignesh%'");
  let vigneshId = null;
  if (vigneshFac.length > 0) {
    vigneshId = vigneshFac[0].id;
    console.log(`Found faculty member Mr. T. R. Vignesh (id: ${vigneshId})`);
  } else {
    const [aidsDept] = await pool.query("SELECT id FROM departments WHERE code = 'AI&DS'");
    const deptId = aidsDept[0]?.id || 1;
    console.log('Inserting Mr. T. R. Vignesh into faculty table...');
    const [facIns] = await pool.query(
      `INSERT INTO faculty (department_id, name, email, designation, max_periods_per_day)
       VALUES (?, 'Mr. T. R. Vignesh', 'vignesh.aids@college.com', 'AP/AI&DS', 5)`,
      [deptId]
    );
    vigneshId = facIns.insertId;
  }

  // Ensure faculty_subjects mapping for Vignesh and OBT356 exists
  if (subId && vigneshId) {
    const [map] = await pool.query(
      "SELECT * FROM faculty_subjects WHERE faculty_id = ? AND subject_id = ?",
      [vigneshId, subId]
    );
    if (!map.length) {
      console.log(`Linking Mr. T. R. Vignesh (id: ${vigneshId}) to subject OBT356 (id: ${subId})`);
      await pool.query(
        "INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES (?, ?)",
        [vigneshId, subId]
      );
    }
  }

  // 2. SETUP 7 DEPARTMENT ACCOUNTS (CHANGE 2)
  const departmentAccounts = [
    { code: 'AI&DS', email: 'AI&DS@college.com', pass: 'AI&DS123', name: 'AI&DS Department' },
    { code: 'CSE', email: 'cse@college.com', pass: 'cse123', name: 'CSE Department' },
    { code: 'IT', email: 'it@college.com', pass: 'it123', name: 'IT Department' },
    { code: 'ECE', email: 'ece@college.com', pass: 'ece123', name: 'ECE Department' },
    { code: 'EEE', email: 'eee@college.com', pass: 'eee123', name: 'EEE Department' },
    { code: 'MECH', email: 'mech@college.com', pass: 'mech123', name: 'MECH Department' },
    { code: 'MBA', email: 'mba@college.com', pass: 'mba123', name: 'MBA Department' },
  ];

  // Fetch actual department IDs from departments table
  const [departments] = await pool.query("SELECT id, code, name FROM departments");
  const deptMap = new Map();
  for (const d of departments) {
    deptMap.set(d.code.toUpperCase(), d.id);
  }

  // Handle AI&DS first
  const aidsDeptId = deptMap.get('AI&DS') || 1;
  const aidsHash = await bcrypt.hash('AI&DS123', 10);

  const [adminUser] = await pool.query("SELECT * FROM users WHERE email = 'admin@college.com'");
  const [existingAids] = await pool.query("SELECT * FROM users WHERE email = 'AI&DS@college.com'");

  if (existingAids.length > 0) {
    console.log(`Updating existing AI&DS account (id: ${existingAids[0].id})...`);
    await pool.query(
      "UPDATE users SET name = 'AI&DS Department', email = 'AI&DS@college.com', password_hash = ?, role = 'ADMIN', department_id = ? WHERE id = ?",
      [aidsHash, aidsDeptId, existingAids[0].id]
    );
    if (adminUser.length > 0 && adminUser[0].id !== existingAids[0].id) {
      await pool.query("DELETE FROM users WHERE email = 'admin@college.com'");
      console.log("Removed obsolete admin@college.com account.");
    }
  } else if (adminUser.length > 0) {
    console.log(`Updating previous admin@college.com (id: ${adminUser[0].id}) to AI&DS@college.com...`);
    await pool.query(
      "UPDATE users SET name = 'AI&DS Department', email = 'AI&DS@college.com', password_hash = ?, role = 'ADMIN', department_id = ? WHERE id = ?",
      [aidsHash, aidsDeptId, adminUser[0].id]
    );
  } else {
    console.log("Inserting new AI&DS@college.com account...");
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role, department_id) VALUES ('AI&DS Department', 'AI&DS@college.com', ?, 'ADMIN', ?)",
      [aidsHash, aidsDeptId]
    );
  }

  // Handle remaining 6 departments
  for (const acc of departmentAccounts) {
    if (acc.code === 'AI&DS') continue;
    const dId = deptMap.get(acc.code.toUpperCase());
    if (!dId) {
      console.warn(`Warning: Department code ${acc.code} not found in departments table!`);
      continue;
    }

    const hash = await bcrypt.hash(acc.pass, 10);
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [acc.email]);

    if (existing.length > 0) {
      console.log(`Updating account for ${acc.code} (${acc.email})...`);
      await pool.query(
        "UPDATE users SET name = ?, password_hash = ?, role = 'ADMIN', department_id = ? WHERE id = ?",
        [acc.name, hash, dId, existing[0].id]
      );
    } else {
      console.log(`Creating account for ${acc.code} (${acc.email})...`);
      await pool.query(
        "INSERT INTO users (name, email, password_hash, role, department_id) VALUES (?, ?, ?, 'ADMIN', ?)",
        [acc.name, acc.email, hash, dId]
      );
    }
  }

  console.log('--- Department Accounts & Subject Setup Complete ---');
}

// Allow running standalone: node src/setupDepartmentAccounts.js
if (process.argv[1]?.includes('setupDepartmentAccounts')) {
  setupDepartmentAccounts()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}
