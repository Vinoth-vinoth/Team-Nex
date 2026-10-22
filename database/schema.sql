
CREATE DATABASE IF NOT EXISTS intelligent_timetable;
USE intelligent_timetable;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS timetable_entries, faculty_availability, faculty_subjects,
rooms, subjects, sections, faculty, time_slots, working_days,
academic_years, users, departments, scheduling_rules;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE departments (
 id INT PRIMARY KEY AUTO_INCREMENT,
 code VARCHAR(20) UNIQUE NOT NULL,
 name VARCHAR(120) NOT NULL
);

CREATE TABLE academic_years (
 id INT PRIMARY KEY AUTO_INCREMENT,
 year_name ENUM('2ND','3RD','4TH') UNIQUE NOT NULL
);

CREATE TABLE users (
 id INT PRIMARY KEY AUTO_INCREMENT,
 name VARCHAR(100) NOT NULL,
 email VARCHAR(150) UNIQUE NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('ADMIN','STAFF','STUDENT') NOT NULL,
 department_id INT NULL,
 FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE sections (
 id INT PRIMARY KEY AUTO_INCREMENT,
 department_id INT NOT NULL,
 academic_year_id INT NOT NULL,
 section_name VARCHAR(30) NOT NULL,
 strength INT DEFAULT 60,
 FOREIGN KEY (department_id) REFERENCES departments(id),
 FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE subjects (
 id INT PRIMARY KEY AUTO_INCREMENT,
 department_id INT NOT NULL,
 year_id INT NOT NULL,
 code VARCHAR(30) NOT NULL,
 name VARCHAR(150) NOT NULL,
 subject_type ENUM('THEORY','PRACTICAL') NOT NULL,
 weekly_periods INT NOT NULL,
 total_hours INT DEFAULT NULL,
 lab_periods INT DEFAULT 0,
 FOREIGN KEY (department_id) REFERENCES departments(id),
 FOREIGN KEY (year_id) REFERENCES academic_years(id)
);

CREATE TABLE faculty (
 id INT PRIMARY KEY AUTO_INCREMENT,
 department_id INT NOT NULL,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(150),
 designation VARCHAR(100),
 max_periods_per_day INT DEFAULT 8,
 FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE faculty_subjects (
 faculty_id INT NOT NULL,
 subject_id INT NOT NULL,
 PRIMARY KEY (faculty_id, subject_id),
 FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
 FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE rooms (
 id INT PRIMARY KEY AUTO_INCREMENT,
 department_id INT NULL,
 room_code VARCHAR(30) UNIQUE NOT NULL,
 room_type ENUM('CLASSROOM','LAB') NOT NULL,
 capacity INT DEFAULT 60,
 is_available BOOLEAN DEFAULT TRUE,
 FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE working_days (
 id INT PRIMARY KEY AUTO_INCREMENT,
 day_name ENUM('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY') UNIQUE NOT NULL,
 is_working BOOLEAN DEFAULT TRUE
);

CREATE TABLE time_slots (
 id INT PRIMARY KEY AUTO_INCREMENT,
 slot_name VARCHAR(30) NOT NULL,
 start_time TIME NOT NULL,
 end_time TIME NOT NULL,
 slot_type ENUM('PERIOD','BREAK','LUNCH') NOT NULL,
 period_number INT NULL
);

CREATE TABLE faculty_availability (
 id INT PRIMARY KEY AUTO_INCREMENT,
 faculty_id INT NOT NULL,
 working_day_id INT NOT NULL,
 time_slot_id INT NOT NULL,
 available BOOLEAN DEFAULT TRUE,
 UNIQUE(faculty_id, working_day_id, time_slot_id),
 FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
 FOREIGN KEY (working_day_id) REFERENCES working_days(id),
 FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
);

CREATE TABLE timetable_entries (
 id INT PRIMARY KEY AUTO_INCREMENT,
 section_id INT NOT NULL,
 subject_id INT NOT NULL,
 faculty_id INT NOT NULL,
 room_id INT NOT NULL,
 working_day_id INT NOT NULL,
 time_slot_id INT NOT NULL,
 is_lab BOOLEAN DEFAULT FALSE,
 FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
 FOREIGN KEY (subject_id) REFERENCES subjects(id),
 FOREIGN KEY (faculty_id) REFERENCES faculty(id),
 FOREIGN KEY (room_id) REFERENCES rooms(id),
 FOREIGN KEY (working_day_id) REFERENCES working_days(id),
 FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
);

CREATE TABLE scheduling_rules (
 id INT PRIMARY KEY AUTO_INCREMENT,
 rule_name VARCHAR(100) UNIQUE NOT NULL,
 rule_value VARCHAR(255) NOT NULL,
 is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO departments(code,name) VALUES
('AI&DS','Artificial Intelligence & Data Science'),
('CSE','Computer Science & Engineering'),
('EEE','Electrical & Electronics Engineering'),
('ECE','Electronics & Communication Engineering'),
('MECH','Mechanical Engineering'),
('IT','Information Technology'),
('MBA','Master of Business Administration');

INSERT INTO academic_years(year_name) VALUES ('2ND'),('3RD'),('4TH');

INSERT INTO working_days(day_name,is_working) VALUES
('MONDAY',1),('TUESDAY',1),('WEDNESDAY',1),('THURSDAY',1),('FRIDAY',1),('SATURDAY',0);

-- Eight 45-minute teaching periods fit around the fixed breaks from 09:00 to 16:45.
INSERT INTO time_slots(slot_name,start_time,end_time,slot_type,period_number) VALUES
('P1','09:00:00','09:45:00','PERIOD',1),
('P2','09:45:00','10:30:00','PERIOD',2),
('Morning Break','10:40:00','10:55:00','BREAK',NULL),
('P3','10:55:00','11:40:00','PERIOD',3),
('P4','11:40:00','12:25:00','PERIOD',4),
('Lunch','12:35:00','13:15:00','LUNCH',NULL),
('P5','13:15:00','14:00:00','PERIOD',5),
('P6','14:00:00','14:45:00','PERIOD',6),
('Evening Break','14:50:00','15:00:00','BREAK',NULL),
('P7','15:00:00','15:45:00','PERIOD',7),
('P8','15:45:00','16:30:00','PERIOD',8);

INSERT INTO scheduling_rules(rule_name,rule_value) VALUES
('PERIOD_DURATION_MINUTES','45'),
('THEORY_WEEKLY_PERIODS','4'),
('THEORY_TOTAL_HOURS','45'),
('THEORY_PRACTICAL_WEEKLY_PERIODS','5'),
('THEORY_PRACTICAL_TOTAL_HOURS','75'),
('LAB_COMPONENT_PERIODS','3'),
('MORNING_BREAK','10:40-10:55'),
('LUNCH','12:35 PM to 1:15 PM'),
('EVENING_BREAK','2:50 PM to 3:00 PM');

-- Demo users. Passwords: admin123, staff123, student123
INSERT INTO users(name,email,password_hash,role,department_id) VALUES
('System Admin','admin@college.com','$2b$10$z.qzgtUTs4Anyct7l3Ogt.gt1/BU5vR0k4bF2pJs9pOo2FXHB1tqm','ADMIN',NULL),
('Demo Staff','staff@college.com','$2b$10$JXFAYFH/O2qmj.l19gDZGuuVLNTkELQ8RhhgGumyf9NrsWwSg/3e2','STAFF',1),
('Demo Student','student@college.com','$2b$10$12on.9HbJvwlxZYYAOGWUO7gesA1s029TUvywGeA6zI/aU0fDxbim','STUDENT',1);
-- For a guaranteed demo login if the hashes above are changed by your MySQL setup,
-- use the backend /api/auth/create-user route after starting the server.
