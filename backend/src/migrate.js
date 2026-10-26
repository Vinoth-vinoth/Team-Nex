import { pool } from './db.js';

export async function runMigrations() {
  console.log('--- Checking & Running Database Migrations ---');

  // 1. Check & Add identifier and section_id columns to users table
  const [userCols] = await pool.query('DESCRIBE users');
  const userColNames = userCols.map(c => c.Field);

  if (!userColNames.includes('identifier')) {
    console.log('Adding column identifier to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN identifier VARCHAR(50) NULL');
  }

  if (!userColNames.includes('section_id')) {
    console.log('Adding column section_id to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN section_id INT NULL');
  }

  // 2. Configure exactly 8 teaching periods fitting 9:00 AM - 4:45 PM
  // P1: 09:00-09:50
  // P2: 09:50-10:40
  // Morning Break: 10:40-10:55
  // P3: 10:55-11:45
  // P4: 11:45-12:35
  // Lunch: 12:35-13:15
  // P5: 13:15-14:05
  // P6: 14:05-14:55
  // Evening Break: 14:55-15:05
  // P7: 15:05-15:55
  // P8: 15:55-16:45

  const targetSlots = [
    { id: 1, slot_name: 'P1', start: '09:00:00', end: '09:50:00', type: 'PERIOD', num: 1 },
    { id: 2, slot_name: 'P2', start: '09:50:00', end: '10:40:00', type: 'PERIOD', num: 2 },
    { id: 4, slot_name: 'Morning Break', start: '10:40:00', end: '10:55:00', type: 'BREAK', num: null },
    { id: 3, slot_name: 'P3', start: '10:55:00', end: '11:45:00', type: 'PERIOD', num: 3 },
    { id: 5, slot_name: 'P4', start: '11:45:00', end: '12:35:00', type: 'PERIOD', num: 4 },
    { id: 7, slot_name: 'Lunch', start: '12:35:00', end: '13:15:00', type: 'LUNCH', num: null },
    { id: 6, slot_name: 'P5', start: '13:15:00', end: '14:05:00', type: 'PERIOD', num: 5 },
    { id: 8, slot_name: 'P6', start: '14:05:00', end: '14:55:00', type: 'PERIOD', num: 6 },
    { id: 10, slot_name: 'Evening Break', start: '14:55:00', end: '15:05:00', type: 'BREAK', num: null },
    { id: 9, slot_name: 'P7', start: '15:05:00', end: '15:55:00', type: 'PERIOD', num: 7 },
    { id: 11, slot_name: 'P8', start: '15:55:00', end: '16:45:00', type: 'PERIOD', num: 8 },
  ];

  for (const slot of targetSlots) {
    const [existing] = await pool.query('SELECT id FROM time_slots WHERE id = ?', [slot.id]);
    if (existing.length) {
      await pool.query(
        'UPDATE time_slots SET slot_name = ?, start_time = ?, end_time = ?, slot_type = ?, period_number = ? WHERE id = ?',
        [slot.slot_name, slot.start, slot.end, slot.type, slot.num, slot.id]
      );
    } else {
      await pool.query(
        'INSERT INTO time_slots (id, slot_name, start_time, end_time, slot_type, period_number) VALUES (?, ?, ?, ?, ?, ?)',
        [slot.id, slot.slot_name, slot.start, slot.end, slot.type, slot.num]
      );
    }
  }

  console.log('--- Database Migrations Completed Successfully ---');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('migrate.js')) {
  runMigrations().then(() => process.exit(0)).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
