-- Migration: Add Period 7 and Period 8 to existing time_slots table
-- Run this on your EXISTING database. Do NOT reset or drop tables.
-- Only inserts missing slots; does not delete existing data.

USE intelligent_timetable;

-- Ensure P7 and P8 exist (insert only if missing)
INSERT INTO time_slots (slot_name, start_time, end_time, slot_type, period_number)
SELECT * FROM (SELECT 'P7' AS slot_name, '15:00:00' AS start_time, '15:45:00' AS end_time, 'PERIOD' AS slot_type, 7 AS period_number) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM time_slots WHERE period_number = 7);

INSERT INTO time_slots (slot_name, start_time, end_time, slot_type, period_number)
SELECT * FROM (SELECT 'P8' AS slot_name, '15:45:00' AS start_time, '16:30:00' AS end_time, 'PERIOD' AS slot_type, 8 AS period_number) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM time_slots WHERE period_number = 8);

-- Ensure Lunch slot exists with correct timing (12:35 PM to 1:15 PM)
INSERT INTO time_slots (slot_name, start_time, end_time, slot_type, period_number)
SELECT * FROM (SELECT 'Lunch' AS slot_name, '12:35:00' AS start_time, '13:15:00' AS end_time, 'LUNCH' AS slot_type, NULL AS period_number) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM time_slots WHERE slot_type = 'LUNCH');

-- Ensure Evening Break slot exists with correct timing (2:50 PM to 3:00 PM)
INSERT INTO time_slots (slot_name, start_time, end_time, slot_type, period_number)
SELECT * FROM (SELECT 'Evening Break' AS slot_name, '14:50:00' AS start_time, '15:00:00' AS end_time, 'BREAK' AS slot_type, NULL AS period_number) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM time_slots WHERE slot_name = 'Evening Break');

-- Update any existing slots that have wrong timings to match the required schedule
UPDATE time_slots SET start_time = '09:00:00', end_time = '09:45:00' WHERE period_number = 1;
UPDATE time_slots SET start_time = '09:45:00', end_time = '10:30:00' WHERE period_number = 2;
UPDATE time_slots SET start_time = '10:55:00', end_time = '11:40:00' WHERE period_number = 3;
UPDATE time_slots SET start_time = '11:40:00', end_time = '12:25:00' WHERE period_number = 4;
UPDATE time_slots SET start_time = '13:15:00', end_time = '14:00:00' WHERE period_number = 5;
UPDATE time_slots SET start_time = '14:00:00', end_time = '14:45:00' WHERE period_number = 6;
UPDATE time_slots SET start_time = '15:00:00', end_time = '15:45:00' WHERE period_number = 7;
UPDATE time_slots SET start_time = '15:45:00', end_time = '16:30:00' WHERE period_number = 8;

-- Verify: exactly 8 numbered teaching periods should now exist
SELECT id, slot_name, start_time, end_time, slot_type, period_number
FROM time_slots
ORDER BY period_number, start_time;
