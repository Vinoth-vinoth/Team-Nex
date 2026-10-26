const API_URL = 'http://localhost:5000/api';

async function req(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // not json
  }

  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('   TIMETABLE PERIOD EDITING VERIFICATION SUITE       ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as AI&DS Admin
    console.log('--- Test 1: Authentication & Role Authorization ---');
    const adminLogin = await req('POST', '/auth/login', {
      email: 'AI&DS@college.com',
      password: 'AI&DS123'
    });
    const adminToken = adminLogin.data?.token;
    assert(!!adminToken, `Authorized Admin logged in successfully (${adminLogin.data?.user?.email})`);

    // Verify Student cannot edit or create timetable entries
    let studentToken = null;
    const studentLogin = await req('POST', '/auth/login', {
      email: 'student@college.com',
      password: 'student123'
    });
    if (studentLogin.ok) {
      studentToken = studentLogin.data?.token;
    } else {
      const reg = await req('POST', '/auth/register', {
        name: 'Test Student',
        email: `student_verif_${Date.now()}@college.com`,
        password: 'student123',
        role: 'STUDENT',
        departmentId: 1,
        sectionId: 1
      });
      if (reg.ok && reg.data?.token) studentToken = reg.data.token;
    }

    if (studentToken) {
      const studentAttempt = await req('POST', '/timetable', {
        sectionId: 1,
        subjectId: 1,
        facultyId: 1,
        roomId: 1,
        workingDayId: 1,
        timeSlotId: 1
      }, studentToken);
      assert(studentAttempt.status === 403, `Unauthorized user (STUDENT) blocked with HTTP 403`);
    }

    // 2. Master Data inspection
    console.log('\n--- Test 2: Period Timings & Break Slots Inspection ---');
    const [daysRes, slotsRes, subjectsRes, facultyRes, roomsRes, sectionsRes] = await Promise.all([
      req('GET', '/working-days', null, adminToken),
      req('GET', '/time-slots', null, adminToken),
      req('GET', '/subjects', null, adminToken),
      req('GET', '/faculty', null, adminToken),
      req('GET', '/rooms', null, adminToken),
      req('GET', '/sections', null, adminToken)
    ]);

    const days = daysRes.data.filter(d => d.is_working);
    const periodSlots = slotsRes.data.filter(s => s.slot_type === 'PERIOD').sort((a, b) => a.id - b.id);
    const breakSlots = slotsRes.data.filter(s => s.slot_type !== 'PERIOD');
    const subjects = subjectsRes.data;
    const faculty = facultyRes.data;
    const rooms = roomsRes.data;
    const sections = sectionsRes.data;

    assert(periodSlots.length === 8, `System contains all 8 periods: ${periodSlots.map(p => p.slot_name).join(', ')}`);
    assert(breakSlots.length >= 3, `Breaks preserved without edit capabilities: ${breakSlots.map(b => b.slot_name).join(', ')}`);

    const monday = days.find(d => d.day_name === 'MONDAY') || days[0];
    const aidsSection = sections.find(s => s.section_name === 'AI&DS-4TH-A') || sections[0];
    const emptySection = sections.find(s => s.section_name === 'AI&DS-2ND-A') || sections[1];

    // 3. Test Editing Occupied Period P1
    console.log('\n--- Test 3: Edit Occupied Cell (P1) ---');
    const initialTt = await req('GET', '/timetable', null, adminToken);
    let p1Entry = initialTt.data.find(e =>
      Number(e.section_id) === Number(aidsSection.id) &&
      Number(e.working_day_id) === Number(monday.id) &&
      e.slot_name === 'P1'
    );

    if (!p1Entry) {
      const p1Slot = periodSlots.find(p => p.slot_name === 'P1');
      const createP1 = await req('POST', '/timetable', {
        sectionId: aidsSection.id,
        subjectId: subjects[0].id,
        facultyId: faculty[0].id,
        roomId: rooms[0].id,
        workingDayId: monday.id,
        timeSlotId: p1Slot.id
      }, adminToken);
      const ttAfter = await req('GET', '/timetable', null, adminToken);
      p1Entry = ttAfter.data.find(e => e.id === createP1.data?.id);
    }

    assert(!!p1Entry, `Occupied P1 entry identified (ID: ${p1Entry.id}, Subject: ${p1Entry.subject_code})`);

    // Update P1 entry
    const altRoom = rooms.find(r => r.room_type === 'CLASSROOM' && r.id !== p1Entry.room_id) || rooms[1];
    const updateP1 = await req('PUT', `/timetable/${p1Entry.id}`, {
      subjectId: p1Entry.subject_id,
      facultyId: p1Entry.faculty_id,
      roomId: altRoom.id,
      workingDayId: p1Entry.working_day_id,
      timeSlotId: p1Entry.time_slot_id
    }, adminToken);

    assert(updateP1.status === 200, `P1 occupied entry updated successfully (Room switched to ${altRoom.room_code})`);

    // 4. Test Editing Empty Cells across all remaining periods (P2 to P8)
    console.log('\n--- Test 4: Edit Empty Cells across All Periods (P2 to P8) ---');
    const addedEntries = [];

    // Clear any existing entries for P2-P8 in aidsSection on Monday before testing
    for (const entry of initialTt.data) {
      if (Number(entry.section_id) === Number(aidsSection.id) && Number(entry.working_day_id) === Number(monday.id) && entry.slot_name !== 'P1') {
        await req('DELETE', `/timetable/${entry.id}`, null, adminToken);
      }
    }

    const classrooms = rooms.filter(r => r.room_type === 'CLASSROOM');

    for (const slot of periodSlots) {
      if (slot.slot_name === 'P1') continue;

      let scheduled = null;
      // Find an available classroom and faculty for this period slot
      for (const r of classrooms) {
        for (const f of faculty) {
          const tryAdd = await req('POST', '/timetable', {
            sectionId: aidsSection.id,
            subjectId: subjects[0].id,
            facultyId: f.id,
            roomId: r.id,
            workingDayId: monday.id,
            timeSlotId: slot.id
          }, adminToken);

          if (tryAdd.status === 200 && tryAdd.data?.id) {
            scheduled = { entryId: tryAdd.data.id, room: r, faculty: f };
            break;
          }
        }
        if (scheduled) break;
      }

      assert(!!scheduled, `Empty cell ${slot.slot_name} editable — new entry created (ID: ${scheduled?.entryId})`);
      if (scheduled?.entryId) {
        addedEntries.push(scheduled.entryId);

        // Test updating this newly added period with another theory subject
        const altTheorySubject = subjects.find(s => s.subject_type === 'THEORY' && s.id !== subjects[0].id) || subjects[0];
        const editRes = await req('PUT', `/timetable/${scheduled.entryId}`, {
          subjectId: altTheorySubject.id,
          facultyId: scheduled.faculty.id,
          roomId: scheduled.room.id,
          workingDayId: monday.id,
          timeSlotId: slot.id
        }, adminToken);
        assert(editRes.status === 200, `Period ${slot.slot_name} entry updated successfully (Subject: ${altTheorySubject.name})`);
      }
    }

    // 5. Test adding to empty cell P1 in emptySection
    console.log('\n--- Test 5: Edit Empty Cell P1 in another section ---');
    for (const entry of initialTt.data) {
      if (Number(entry.section_id) === Number(emptySection.id) && Number(entry.working_day_id) === Number(monday.id) && entry.slot_name === 'P1') {
        await req('DELETE', `/timetable/${entry.id}`, null, adminToken);
      }
    }

    const p1Slot = periodSlots.find(p => p.slot_name === 'P1');
    let scheduledEmptyP1 = null;
    for (const r of classrooms) {
      for (const f of faculty) {
        const tryP1 = await req('POST', '/timetable', {
          sectionId: emptySection.id,
          subjectId: subjects.find(s => s.department_id === emptySection.department_id)?.id || subjects[0].id,
          facultyId: f.id,
          roomId: r.id,
          workingDayId: monday.id,
          timeSlotId: p1Slot.id
        }, adminToken);

        if (tryP1.status === 200 && tryP1.data?.id) {
          scheduledEmptyP1 = tryP1.data.id;
          break;
        }
      }
      if (scheduledEmptyP1) break;
    }

    assert(!!scheduledEmptyP1, `Empty cell P1 in ${emptySection.section_name} scheduled successfully (ID: ${scheduledEmptyP1})`);
    if (scheduledEmptyP1) addedEntries.push(scheduledEmptyP1);

    // 6. Verify Persistence after page refresh
    console.log('\n--- Test 6: Verify Database Persistence (Simulating Page Reload) ---');
    const persistedTt = await req('GET', '/timetable', null, adminToken);
    const sectionMondayEntries = persistedTt.data.filter(
      e => Number(e.section_id) === Number(aidsSection.id) && Number(e.working_day_id) === Number(monday.id)
    );
    assert(sectionMondayEntries.length === 8, `All 8 periods (P1 to P8) persisted in database on page reload (${sectionMondayEntries.length} periods active)`);

    // 7. Conflict Detection Checks
    console.log('\n--- Test 7: Conflict Detection & Validation ---');

    // Section Conflict
    const secConflict = await req('POST', '/timetable', {
      sectionId: aidsSection.id,
      subjectId: subjects[0].id,
      facultyId: faculty[0].id,
      roomId: rooms[0].id,
      workingDayId: monday.id,
      timeSlotId: p1Slot.id
    }, adminToken);
    assert(secConflict.status === 409, `Section duplicate clash rejected with 409: "${secConflict.data?.message}"`);

    // Faculty double-booking Conflict
    const facConflict = await req('POST', '/timetable', {
      sectionId: sections[2]?.id || 22,
      subjectId: subjects[0].id,
      facultyId: p1Entry.faculty_id,
      roomId: rooms[2]?.id || 3,
      workingDayId: monday.id,
      timeSlotId: p1Slot.id
    }, adminToken);
    assert(facConflict.status === 409, `Faculty double-booking clash rejected with 409: "${facConflict.data?.message}"`);

    // Room double-booking Conflict
    const roomConflict = await req('POST', '/timetable', {
      sectionId: sections[2]?.id || 22,
      subjectId: subjects[0].id,
      facultyId: faculty[3]?.id || faculty[0].id,
      roomId: altRoom.id,
      workingDayId: monday.id,
      timeSlotId: p1Slot.id
    }, adminToken);
    assert(roomConflict.status === 409, `Room double-booking clash rejected with 409: "${roomConflict.data?.message}"`);

    // 8. Break Cells Immutability
    console.log('\n--- Test 8: Break Cells Immutability ---');
    for (const bSlot of breakSlots) {
      const breakAttempt = await req('POST', '/timetable', {
        sectionId: aidsSection.id,
        subjectId: subjects[0].id,
        facultyId: faculty[0].id,
        roomId: rooms[0].id,
        workingDayId: monday.id,
        timeSlotId: bSlot.id
      }, adminToken);
      assert(breakAttempt.status === 400, `Break slot (${bSlot.slot_name}) cannot be scheduled: "${breakAttempt.data?.message}"`);
    }

    // 9. Department Data Isolation
    console.log('\n--- Test 9: Department Data Isolation ---');
    const cseLogin = await req('POST', '/auth/login', {
      email: 'cse@college.com',
      password: 'cse123'
    });
    const cseToken = cseLogin.data?.token;
    assert(!!cseToken, `CSE Department admin authenticated (${cseLogin.data?.user?.email})`);

    const crossDeptEdit = await req('PUT', `/timetable/${p1Entry.id}`, {
      subjectId: subjects[0].id,
      facultyId: faculty[0].id,
      roomId: rooms[0].id,
      workingDayId: monday.id,
      timeSlotId: p1Slot.id
    }, cseToken);
    assert(crossDeptEdit.status === 403, `Cross-department edit forbidden with HTTP 403: "${crossDeptEdit.data?.message}"`);

    // 10. Existing Timetable Generator
    console.log('\n--- Test 10: Automatic Timetable Generator ---');
    const genRes = await req('POST', '/generate', {}, adminToken);
    assert(genRes.status === 200 && (genRes.data?.message || genRes.data?.entries), `Automated timetable generator executed successfully (${genRes.data?.message})`);

    // Clean up temporary test entries
    for (const id of addedEntries) {
      await req('DELETE', `/timetable/${id}`, null, adminToken);
    }

    // Restore P1 room to R101 for neat state
    await req('PUT', `/timetable/${p1Entry.id}`, {
      subjectId: p1Entry.subject_id,
      facultyId: p1Entry.faculty_id,
      roomId: p1Entry.room_id,
      workingDayId: p1Entry.working_day_id,
      timeSlotId: p1Entry.time_slot_id
    }, adminToken);

  } catch (err) {
    console.error('Unexpected error during testing:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
