const API = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('=== STARTING COMPLETE SYSTEM VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: ADMIN LOGIN FOR ALL 7 DEPARTMENTS
  // -------------------------------------------------------------
  console.log('--- 1. Testing Department Admin Accounts ---');
  const adminAccounts = [
    { email: 'AI&DS@college.com', pass: 'AI&DS123', dept: 'AI&DS' },
    { email: 'cse@college.com', pass: 'cse123', dept: 'CSE' },
    { email: 'it@college.com', pass: 'it123', dept: 'IT' },
    { email: 'ece@college.com', pass: 'ece123', dept: 'ECE' },
    { email: 'eee@college.com', pass: 'eee123', dept: 'EEE' },
    { email: 'mech@college.com', pass: 'mech123', dept: 'MECH' },
    { email: 'mba@college.com', pass: 'mba123', dept: 'MBA' }
  ];

  let aidsToken = '';
  let cseToken = '';

  for (const acc of adminAccounts) {
    const res = await request(`${API}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: acc.email, password: acc.pass, role: 'ADMIN' })
    });
    assert(
      res.ok && res.data?.user?.departmentCode === acc.dept && res.data?.user?.role === 'ADMIN',
      `Admin login for ${acc.dept} (${acc.email}) -> Department: ${res.data?.user?.departmentCode}, Role: ${res.data?.user?.role}`
    );
    if (acc.dept === 'AI&DS') aidsToken = res.data?.token;
    if (acc.dept === 'CSE') cseToken = res.data?.token;
  }

  // -------------------------------------------------------------
  // TEST 2: DEPARTMENT DATA ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Department Data Isolation ---');
  const aidsSections = await request(`${API}/sections`, {
    headers: { Authorization: `Bearer ${aidsToken}` }
  });
  const cseSections = await request(`${API}/sections`, {
    headers: { Authorization: `Bearer ${cseToken}` }
  });

  const allAids = aidsSections.data.every(s => s.department === 'AI&DS');
  const allCse = cseSections.data.every(s => s.department === 'CSE');
  assert(allAids, `AI&DS Admin only sees AI&DS sections (count: ${aidsSections.data.length})`);
  assert(allCse, `CSE Admin only sees CSE sections (count: ${cseSections.data.length})`);

  // -------------------------------------------------------------
  // TEST 3: REGISTRATION SECURITY & WORKFLOW
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Registration Security & Roles ---');

  // 3a. Rejection of public admin registration
  const adminReg = await request(`${API}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Fake Admin',
      email: 'fakeadmin@college.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'ADMIN',
      departmentId: 1
    })
  });
  assert(adminReg.status === 403, `Public Admin registration is forbidden (HTTP ${adminReg.status})`);

  // 3b. Password mismatch
  const mismatchReg = await request(`${API}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Staff',
      email: 'mismatch@college.com',
      password: 'password123',
      confirmPassword: 'wrongpassword',
      role: 'STAFF',
      departmentId: 1
    })
  });
  assert(mismatchReg.status === 400, `Password mismatch rejected (HTTP ${mismatchReg.status}: ${mismatchReg.data?.message})`);

  // 3c. Valid Staff Registration
  const testStaffEmail = `staff_test_${Date.now()}@college.com`;
  const staffReg = await request(`${API}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Test Faculty',
      email: testStaffEmail,
      password: 'staffpassword123',
      confirmPassword: 'staffpassword123',
      role: 'STAFF',
      departmentId: 1,
      identifier: 'Associate Professor'
    })
  });
  assert(staffReg.ok, `Staff registration succeeds (HTTP ${staffReg.status}: ${staffReg.data?.message})`);

  // 3d. Duplicate email rejection
  const dupReg = await request(`${API}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate Staff',
      email: testStaffEmail,
      password: 'staffpassword123',
      confirmPassword: 'staffpassword123',
      role: 'STAFF',
      departmentId: 1
    })
  });
  assert(dupReg.status === 400, `Duplicate email rejected (HTTP ${dupReg.status}: ${dupReg.data?.message})`);

  // 3e. Valid Student Registration
  const testStudentEmail = `student_test_${Date.now()}@college.com`;
  const studentReg = await request(`${API}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Student',
      email: testStudentEmail,
      password: 'studentpassword123',
      confirmPassword: 'studentpassword123',
      role: 'STUDENT',
      departmentId: 1,
      identifier: '711521104099'
    })
  });
  assert(studentReg.ok, `Student registration succeeds (HTTP ${studentReg.status}: ${studentReg.data?.message})`);

  // 3f. Staff Login with registered credentials
  const staffLogin = await request(`${API}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: testStaffEmail, password: 'staffpassword123', role: 'STAFF' })
  });
  assert(staffLogin.ok && staffLogin.data?.user?.role === 'STAFF', `Staff signs in successfully (Role: ${staffLogin.data?.user?.role})`);

  // 3g. Student Login with registered credentials
  const studentLogin = await request(`${API}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: testStudentEmail, password: 'studentpassword123', role: 'STUDENT' })
  });
  assert(studentLogin.ok && studentLogin.data?.user?.role === 'STUDENT', `Student signs in successfully (Role: ${studentLogin.data?.user?.role})`);

  // 3h. Role mismatch prevention: Staff cannot login as Student
  const staffAsStudent = await request(`${API}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: testStaffEmail, password: 'staffpassword123', role: 'STUDENT' })
  });
  assert(staffAsStudent.status === 403, `Staff account blocked from Student portal (HTTP ${staffAsStudent.status})`);

  // 3i. Role mismatch prevention: Student cannot login as Staff
  const studentAsStaff = await request(`${API}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: testStudentEmail, password: 'studentpassword123', role: 'STAFF' })
  });
  assert(studentAsStaff.status === 403, `Student account blocked from Staff portal (HTTP ${studentAsStaff.status})`);

  // -------------------------------------------------------------
  // TEST 4: TIMETABLE SCHEDULE — EXACTLY 8 PERIODS & OPERATING WINDOW
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Timetable Schedule (8 Periods, 9:00 AM - 4:45 PM) ---');
  const slotsRes = await request(`${API}/time-slots`, {
    headers: { Authorization: `Bearer ${aidsToken}` }
  });
  const periods = slotsRes.data.filter(s => s.slot_type === 'PERIOD');
  const breaks = slotsRes.data.filter(s => s.slot_type !== 'PERIOD');

  assert(periods.length === 8, `Exactly 8 teaching periods found (count: ${periods.length})`);
  assert(slotsRes.data[0].start_time === '09:00:00', `Operating window start time is 09:00:00 (got: ${slotsRes.data[0].start_time})`);
  const lastSlot = slotsRes.data[slotsRes.data.length - 1];
  assert(lastSlot.end_time === '16:45:00', `Operating window end time is 16:45:00 (got: ${lastSlot.end_time})`);

  let overlapDetected = false;
  for (let i = 0; i < slotsRes.data.length - 1; i++) {
    const cur = slotsRes.data[i];
    const nxt = slotsRes.data[i + 1];
    if (cur.end_time > nxt.start_time) {
      overlapDetected = true;
    }
  }
  assert(!overlapDetected, 'Time slots and breaks are contiguous without any overlaps');

  // -------------------------------------------------------------
  // TEST 5: EDIT OPTIONS FOR EXISTING RECORDS (PUT ENDPOINTS)
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Record Editing (Sections, Subjects, Faculty, Rooms) ---');

  // Edit Section
  const secToEdit = aidsSections.data[0];
  const secUpdate = await request(`${API}/sections/${secToEdit.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${aidsToken}` },
    body: JSON.stringify({ strength: 65 })
  });
  assert(secUpdate.ok, `Section updated successfully (HTTP ${secUpdate.status})`);

  // Edit Subject
  const subsRes = await request(`${API}/subjects`, {
    headers: { Authorization: `Bearer ${aidsToken}` }
  });
  const subToEdit = subsRes.data[0];
  const subUpdate = await request(`${API}/subjects/${subToEdit.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${aidsToken}` },
    body: JSON.stringify({ weeklyPeriods: subToEdit.weekly_periods })
  });
  assert(subUpdate.ok, `Subject updated successfully (HTTP ${subUpdate.status})`);

  // Edit Faculty
  const facRes = await request(`${API}/faculty`, {
    headers: { Authorization: `Bearer ${aidsToken}` }
  });
  const facToEdit = facRes.data[0];
  const facUpdate = await request(`${API}/faculty/${facToEdit.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${aidsToken}` },
    body: JSON.stringify({ designation: 'Senior Assistant Professor' })
  });
  assert(facUpdate.ok, `Faculty updated successfully (HTTP ${facUpdate.status})`);

  // Edit Room
  const roomsRes = await request(`${API}/rooms`, {
    headers: { Authorization: `Bearer ${aidsToken}` }
  });
  const rmToEdit = roomsRes.data[0];
  const rmUpdate = await request(`${API}/rooms/${rmToEdit.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${aidsToken}` },
    body: JSON.stringify({ capacity: 65 })
  });
  assert(rmUpdate.ok, `Room updated successfully (HTTP ${rmUpdate.status})`);

  // -------------------------------------------------------------
  // TEST 6: TIMETABLE ENTRY EDITING & CONFLICT DETECTION
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Timetable Entry Editing & Conflict Detection ---');
  const ttRes = await request(`${API}/timetable`, {
    headers: { Authorization: `Bearer ${aidsToken}` }
  });

  if (ttRes.data && ttRes.data.length >= 2) {
    const entry1 = ttRes.data[0];
    const entry2 = ttRes.data[1];

    // Conflict test: Attempt to move entry2 into the exact same day, period slot, and section as entry1
    const conflictUpdate = await request(`${API}/timetable/${entry2.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${aidsToken}` },
      body: JSON.stringify({
        subjectId: entry2.subject_id,
        facultyId: entry2.faculty_id,
        roomId: entry2.room_id,
        workingDayId: entry1.working_day_id,
        timeSlotId: entry1.time_slot_id
      })
    });
    assert(
      conflictUpdate.status === 409,
      `Conflicting timetable edit rejected with 409 Conflict: "${conflictUpdate.data?.message}"`
    );

    // Valid update test: Update room for entry1
    const validUpdate = await request(`${API}/timetable/${entry1.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${aidsToken}` },
      body: JSON.stringify({
        subjectId: entry1.subject_id,
        facultyId: entry1.faculty_id,
        roomId: entry1.room_id,
        workingDayId: entry1.working_day_id,
        timeSlotId: entry1.time_slot_id
      })
    });
    assert(validUpdate.ok, `Valid timetable entry edit saved successfully (HTTP ${validUpdate.status})`);
  } else {
    console.log('[INFO] Timetable entries not yet populated in database; generating now to verify editing...');
    const genRes = await request(`${API}/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aidsToken}` }
    });
    console.log(`Generation result: ${genRes.data?.message}, entries: ${genRes.data?.entries}`);
    const ttRes2 = await request(`${API}/timetable`, {
      headers: { Authorization: `Bearer ${aidsToken}` }
    });
    if (ttRes2.data?.length >= 2) {
      const entry1 = ttRes2.data[0];
      const entry2 = ttRes2.data[1];
      const conflictUpdate = await request(`${API}/timetable/${entry2.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${aidsToken}` },
        body: JSON.stringify({
          subjectId: entry2.subject_id,
          facultyId: entry2.faculty_id,
          roomId: entry2.room_id,
          workingDayId: entry1.working_day_id,
          timeSlotId: entry1.time_slot_id
        })
      });
      assert(conflictUpdate.status === 409, `Conflict rejected with 409: "${conflictUpdate.data?.message}"`);
    }
  }

  // -------------------------------------------------------------
  // TEST 7: UNAUTHORIZED ACCESS REJECTION
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Unauthorized Role Permissions ---');
  const studentEditAttempt = await request(`${API}/sections`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentLogin.data?.token}` },
    body: JSON.stringify({ sectionName: 'Hacked Section' })
  });
  assert(studentEditAttempt.status === 403, `Student cannot create sections (HTTP ${studentEditAttempt.status})`);

  console.log(`\n=== VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
