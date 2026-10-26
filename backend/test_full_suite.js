const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('==================================================');
  console.log('       TIMETABLE SYSTEM FULL VERIFICATION SUITE   ');
  console.log('==================================================\n');

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

  // 1. TEST AI&DS LOGIN WITH UPDATED CREDENTIALS
  console.log('--- TEST 1: AI&DS Authentication ---');
  let aidsToken = null;
  let aidsUser = null;
  try {
    const res = await req(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'AI&DS@college.com',
        password: 'AI&DS123'
      })
    });
    aidsToken = res.data?.token;
    aidsUser = res.data?.user;
    assert(res.status === 200, 'AI&DS login returns HTTP 200');
    assert(aidsUser?.email === 'AI&DS@college.com', 'AI&DS email matches');
    assert(aidsUser?.departmentId === 1, 'AI&DS department ID is 1');
    assert(aidsUser?.departmentCode === 'AI&DS', 'AI&DS departmentCode is AI&DS');
    assert(Boolean(aidsToken), 'AI&DS JWT token issued');
  } catch (err) {
    assert(false, `AI&DS login failed: ${err.message}`);
  }

  // 2. TEST NEGATIVE LOGIN (OLD & INCORRECT CREDENTIALS)
  console.log('\n--- TEST 2: Negative Authentication (Must Be Rejected) ---');
  {
    const res = await req(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.com', password: 'admin123' })
    });
    assert(res.status === 401, 'Obsolete admin@college.com / admin123 rejected with 401');
  }

  {
    const res = await req(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'AI&DS@college.com', password: 'WrongPassword123' })
    });
    assert(res.status === 401, 'AI&DS with wrong password rejected with 401');
  }

  {
    const res = await req(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'AI&DS@college.com', password: 'admin123' })
    });
    assert(res.status === 401, 'AI&DS with old password admin123 rejected with 401');
  }

  // 3. TEST OTHER 6 DEPARTMENT ACCOUNTS
  console.log('\n--- TEST 3: Other 6 Department Accounts ---');
  const otherDepts = [
    { code: 'CSE', email: 'cse@college.com', pass: 'cse123', expectedDeptId: 2 },
    { code: 'IT', email: 'it@college.com', pass: 'it123', expectedDeptId: 6 },
    { code: 'ECE', email: 'ece@college.com', pass: 'ece123', expectedDeptId: 4 },
    { code: 'EEE', email: 'eee@college.com', pass: 'eee123', expectedDeptId: 3 },
    { code: 'MECH', email: 'mech@college.com', pass: 'mech123', expectedDeptId: 5 },
    { code: 'MBA', email: 'mba@college.com', pass: 'mba123', expectedDeptId: 7 }
  ];

  const deptTokens = {};
  for (const dept of otherDepts) {
    try {
      const res = await req(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dept.email, password: dept.pass })
      });
      deptTokens[dept.code] = res.data?.token;
      assert(res.status === 200, `${dept.code} login (${dept.email}) succeeded`);
      assert(res.data?.user?.departmentId === dept.expectedDeptId, `${dept.code} departmentId is ${dept.expectedDeptId}`);
      assert(res.data?.user?.departmentCode === dept.code, `${dept.code} departmentCode is ${dept.code}`);
    } catch (err) {
      assert(false, `${dept.code} login failed: ${err.message}`);
    }
  }

  // 4. TEST /api/auth/me
  console.log('\n--- TEST 4: /api/auth/me Session Verification ---');
  try {
    const meRes = await req(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${aidsToken}` }
    });
    assert(meRes.status === 200, '/api/auth/me returns 200 for AI&DS token');
    assert(meRes.data?.user?.departmentCode === 'AI&DS', '/api/auth/me returns departmentCode AI&DS');
  } catch (err) {
    assert(false, `/api/auth/me failed: ${err.message}`);
  }

  // 5. TEST SUBJECT UPDATE (OBT356 / Lifestyle Diseases / 5 Periods)
  console.log('\n--- TEST 5: Subject Update & Integrity Check ---');
  try {
    const subsRes = await req(`${BASE_URL}/subjects`, {
      headers: { Authorization: `Bearer ${aidsToken}` }
    });
    const subjects = subsRes.data;
    const obt356 = subjects.find(s => s.code === 'OBT356');
    const oet356 = subjects.find(s => s.code === 'OET356');

    assert(Boolean(obt356), 'Subject OBT356 exists in AI&DS subject list');
    if (obt356) {
      assert(obt356.name === 'Lifestyle Diseases', `Subject name is "${obt356.name}" (expected "Lifestyle Diseases")`);
      assert(Number(obt356.weekly_periods) === 5, `Weekly periods is ${obt356.weekly_periods} (expected 5)`);
    }
    assert(!oet356, 'Old subject code OET356 is no longer in subjects');

    const duplicates = subjects.filter(s => s.code === 'OBT356');
    assert(duplicates.length === 1, `OBT356 has exactly 1 record (found: ${duplicates.length})`);

    // Verify Faculty Link
    const facSubRes = await req(`${BASE_URL}/faculty-subjects`, {
      headers: { Authorization: `Bearer ${aidsToken}` }
    });
    const link = facSubRes.data.find(fs => fs.subject_code === 'OBT356');
    assert(Boolean(link), 'OBT356 is linked to a faculty member');
    if (link) {
      assert(link.faculty_name.includes('Vignesh'), `Faculty name is "${link.faculty_name}" (expected Mr. T. R. Vignesh)`);
    }
  } catch (err) {
    assert(false, `Subject verification failed: ${err.message}`);
  }

  // 6. TEST DEPARTMENT DATA ISOLATION
  console.log('\n--- TEST 6: Department Data Isolation ---');
  try {
    const cseToken = deptTokens['CSE'];

    // Sections isolation
    const aidsSections = (await req(`${BASE_URL}/sections`, {
      headers: { Authorization: `Bearer ${aidsToken}` }
    })).data;
    const cseSections = (await req(`${BASE_URL}/sections`, {
      headers: { Authorization: `Bearer ${cseToken}` }
    })).data;

    assert(aidsSections.every(s => s.department_id === 1 && s.department === 'AI&DS'),
      `All ${aidsSections.length} sections for AI&DS login belong to AI&DS`);
    assert(cseSections.every(s => s.department_id === 2 && s.department === 'CSE'),
      `All ${cseSections.length} sections for CSE login belong to CSE`);

    // Subjects isolation
    const aidsSubjects = (await req(`${BASE_URL}/subjects`, {
      headers: { Authorization: `Bearer ${aidsToken}` }
    })).data;
    const cseSubjects = (await req(`${BASE_URL}/subjects`, {
      headers: { Authorization: `Bearer ${cseToken}` }
    })).data;

    assert(aidsSubjects.every(s => s.department_id === 1 && s.department === 'AI&DS'),
      `All ${aidsSubjects.length} subjects for AI&DS login belong to AI&DS`);
    assert(cseSubjects.every(s => s.department_id === 2 && s.department === 'CSE'),
      `All ${cseSubjects.length} subjects for CSE login belong to CSE`);

    // Cross-department tamper protection
    const illegalPost = await req(`${BASE_URL}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cseToken}`
      },
      body: JSON.stringify({
        departmentId: 1, // trying to add to AI&DS
        academicYearId: 1,
        sectionName: 'ILLEGAL-CROSS-SECTION',
        strength: 50
      })
    });
    assert(illegalPost.status === 403, 'Cross-department section creation blocked with 403 Forbidden');

    if (aidsSections.length > 0) {
      const illegalDelete = await req(`${BASE_URL}/sections/${aidsSections[0].id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cseToken}` }
      });
      assert(illegalDelete.status === 403, 'Cross-department section deletion blocked with 403 Forbidden');
    }

    // Shared rooms access
    const aidsRooms = (await req(`${BASE_URL}/rooms`, {
      headers: { Authorization: `Bearer ${aidsToken}` }
    })).data;
    const cseRooms = (await req(`${BASE_URL}/rooms`, {
      headers: { Authorization: `Bearer ${cseToken}` }
    })).data;
    assert(aidsRooms.length > 0 && cseRooms.length > 0, 'Shared rooms are accessible to both departments');
  } catch (err) {
    assert(false, `Data isolation test failed: ${err.message}`);
  }

  // 7. TEST TIMETABLE GENERATION
  console.log('\n--- TEST 7: Department Timetable Generation ---');
  try {
    const aidsGen = await req(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aidsToken}` }
    });
    assert(aidsGen.status === 200, `AI&DS timetable generation succeeded (Entries: ${aidsGen.data.entries})`);

    const aidsTt = (await req(`${BASE_URL}/timetable`, {
      headers: { Authorization: `Bearer ${aidsToken}` }
    })).data;
    assert(aidsTt.every(t => t.department === 'AI&DS'), 'All AI&DS timetable entries belong exclusively to AI&DS');
  } catch (err) {
    assert(false, `Timetable generation failed: ${err.message}`);
  }

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
