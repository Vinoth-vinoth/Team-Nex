import React, { useState, useEffect } from 'react';
import { AppIcon } from './icons.jsx';

const STORAGE_KEY = 'info_aids_sem7_timetable_v1';

// The API stores timings as { period: 1 | 'BREAK_1' }, while the view renders
// { periodNum } and uses an id as the React key. Normalise once on load so the
// same component works with default data, cached data and server data.
function normalizeAidsData(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_AIDS_DATA;

  const timings = Array.isArray(raw.timings) && raw.timings.length
    ? raw.timings.map((timing, index) => ({
        ...timing,
        id: timing.id || `${timing.isBreak ? 'break' : 'period'}-${timing.period ?? index + 1}`,
        periodNum: timing.periodNum ?? timing.period,
        label: timing.label || `Period ${index + 1}`,
        time: timing.time || '',
        isBreak: Boolean(timing.isBreak)
      }))
    : DEFAULT_AIDS_DATA.timings;

  const schedule = raw.schedule && typeof raw.schedule === 'object' ? raw.schedule : {};
  const days = Array.isArray(raw.days) && raw.days.length
    ? raw.days
    : Object.keys(schedule).length
      ? Object.keys(schedule)
      : DEFAULT_AIDS_DATA.days;

  return {
    ...DEFAULT_AIDS_DATA,
    ...raw,
    institution: { ...DEFAULT_AIDS_DATA.institution, ...(raw.institution || {}) },
    days,
    timings,
    subjects: Array.isArray(raw.subjects) && raw.subjects.length ? raw.subjects : DEFAULT_AIDS_DATA.subjects,
    activities: Array.isArray(raw.activities) && raw.activities.length ? raw.activities : DEFAULT_AIDS_DATA.activities,
    schedule: Object.keys(schedule).length ? schedule : DEFAULT_AIDS_DATA.schedule
  };
}

const DEFAULT_AIDS_DATA = {
  institution: {
    name: 'INFO INSTITUTE OF ENGINEERING',
    affiliation: 'Autonomous / Affiliated to Anna University',
    department: 'Department of Artificial Intelligence & Data Science (AI&DS)',
    departmentCode: 'AI&DS',
    semester: 'VII',
    academicYear: '2026–2027',
    effectiveDate: '16-07-2026',
    classroom: 'B 316'
  },
  timings: [
    { id: 'P1', periodNum: 1, label: 'Period 1', time: '9:00 AM – 9:50 AM', isBreak: false },
    { id: 'P2', periodNum: 2, label: 'Period 2', time: '9:50 AM – 10:40 AM', isBreak: false },
    { id: 'MB', periodNum: 'MB', label: 'Morning Break', time: '10:40 AM – 10:55 AM', isBreak: true },
    { id: 'P3', periodNum: 3, label: 'Period 3', time: '10:55 AM – 11:45 AM', isBreak: false },
    { id: 'P4', periodNum: 4, label: 'Period 4', time: '11:45 AM – 12:35 PM', isBreak: false },
    { id: 'LB', periodNum: 'LB', label: 'Lunch Break', time: '12:35 PM – 1:15 PM', isBreak: true },
    { id: 'P5', periodNum: 5, label: 'Period 5', time: '1:15 PM – 2:05 PM', isBreak: false },
    { id: 'P6', periodNum: 6, label: 'Period 6', time: '2:05 PM – 2:55 PM', isBreak: false },
    { id: 'EB', periodNum: 'EB', label: 'Evening Break', time: '2:55 PM – 3:05 PM', isBreak: true },
    { id: 'P7', periodNum: 7, label: 'Period 7', time: '3:05 PM – 3:55 PM', isBreak: false },
    { id: 'P8', periodNum: 8, label: 'Period 8', time: '3:55 PM – 4:45 PM', isBreak: false }
  ],
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  subjects: [
    {
      code: 'AI8701',
      abbrev: 'HVE',
      name: 'Human Values and Ethics',
      faculty: 'Faculty In-charge (Please Verify)',
      periods: 4,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#fcd34d'
    },
    {
      code: 'AI8702',
      abbrev: 'ITA',
      name: 'IT in Agricultural System',
      faculty: 'Faculty In-charge (Please Verify)',
      periods: 4,
      color: '#10b981',
      bgColor: '#ecfdf5',
      borderColor: '#6ee7b7'
    },
    {
      code: 'AI8703',
      abbrev: 'HRM',
      name: 'Human Resource Management',
      faculty: 'Faculty In-charge (Please Verify)',
      periods: 4,
      color: '#06b6d4',
      bgColor: '#ecfeff',
      borderColor: '#67e8f9'
    },
    {
      code: 'AI8704',
      abbrev: 'RET',
      name: 'Renewable Energy Technologies',
      faculty: 'Faculty In-charge (Please Verify)',
      periods: 4,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      borderColor: '#c4b5fd'
    },
    {
      code: 'AI8711',
      abbrev: 'PP (KT)',
      name: 'Project Preparation',
      faculty: 'Dr. K. T. (Please Verify)',
      periods: 3,
      color: '#4f46e5',
      bgColor: '#eef2ff',
      borderColor: '#a5b4fc'
    },
    {
      code: 'AI8712',
      abbrev: 'PP (TRV)',
      name: 'Project Preparation',
      faculty: 'Dr. T. R. V. (Please Verify)',
      periods: 3,
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#93c5fd'
    }
  ],
  activities: [
    {
      activity: 'Placement & Soft Skill Development',
      faculty: 'Training & Placement Officer / Aptitude Trainer (Please Verify)',
      periods: 4,
      timing: 'Wed P5-P6, Thu P7-P8, Sat P5',
      color: '#f43f5e',
      bgColor: '#fff1f2',
      borderColor: '#fda4af'
    },
    {
      activity: 'Soft Skills Development',
      faculty: 'Soft Skills Trainer (Please Verify)',
      periods: 2,
      timing: 'Tue P7-P8, Sat P6',
      color: '#d946ef',
      bgColor: '#fdf4ff',
      borderColor: '#f0abfc'
    },
    {
      activity: 'Library (LIB)',
      faculty: 'Librarian / Staff In-charge (Please Verify)',
      periods: 1,
      timing: 'Mon P7, Sat P8',
      color: '#0284c7',
      bgColor: '#f0f9ff',
      borderColor: '#7dd3fc'
    },
    {
      activity: 'Project Preparation (PP)',
      faculty: 'Dr. K. T. & Dr. T. R. V. (Please Verify)',
      periods: 6,
      timing: 'Mon P5-P6, Tue P5-P6, Thu P5-P6',
      color: '#6366f1',
      bgColor: '#eef2ff',
      borderColor: '#a5b4fc'
    },
    {
      activity: 'Mentor Hour',
      faculty: 'Class Mentor / Advisor (Please Verify)',
      periods: 1,
      timing: 'Mon P8, Sat P8',
      color: '#ea580c',
      bgColor: '#fff7ed',
      borderColor: '#fdba74'
    },
    {
      activity: 'Value Added Course (VAC)',
      faculty: 'Industry Expert / Faculty In-charge (Please Verify)',
      periods: 3,
      timing: 'Wed P7-P8, Fri P5-P6',
      color: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#6ee7b7'
    },
    {
      activity: 'Club Activities',
      faculty: 'AI&DS Technical Club Coordinator (Please Verify)',
      periods: 2,
      timing: 'Fri P7-P8',
      color: '#0d9488',
      bgColor: '#f0fdfa',
      borderColor: '#5eead4'
    }
  ],
  schedule: {
    Monday: {
      1: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      2: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      3: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      4: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      5: { subject: 'PP (KT)', name: 'Project Preparation', faculty: 'Dr. K. T. (Please Verify)', room: 'B 316' },
      6: { subject: 'PP (KT)', name: 'Project Preparation', faculty: 'Dr. K. T. (Please Verify)', room: 'B 316' },
      7: { subject: 'LIB', name: 'Library', faculty: 'Librarian (Please Verify)', room: 'B 316' },
      8: { subject: 'Mentor', name: 'Mentoring Hour', faculty: 'Class Mentor (Please Verify)', room: 'B 316' }
    },
    Tuesday: {
      1: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      2: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      3: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      4: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      5: { subject: 'PP (TRV)', name: 'Project Preparation', faculty: 'Dr. T. R. V. (Please Verify)', room: 'B 316' },
      6: { subject: 'PP (TRV)', name: 'Project Preparation', faculty: 'Dr. T. R. V. (Please Verify)', room: 'B 316' },
      7: { subject: 'Soft Skills', name: 'Soft Skills Development', faculty: 'Trainer (Please Verify)', room: 'B 316' },
      8: { subject: 'Soft Skills', name: 'Soft Skills Development', faculty: 'Trainer (Please Verify)', room: 'B 316' }
    },
    Wednesday: {
      1: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      2: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      3: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      4: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      5: { subject: 'Placement', name: 'Placement & Aptitude Training', faculty: 'Placement Cell (Please Verify)', room: 'B 316' },
      6: { subject: 'Placement', name: 'Placement & Aptitude Training', faculty: 'Placement Cell (Please Verify)', room: 'B 316' },
      7: { subject: 'Value Added Course', name: 'Value Added Course', faculty: 'Coordinator (Please Verify)', room: 'B 316' },
      8: { subject: 'Value Added Course', name: 'Value Added Course', faculty: 'Coordinator (Please Verify)', room: 'B 316' }
    },
    Thursday: {
      1: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      2: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      3: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      4: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      5: { subject: 'PP (KT)', name: 'Project Preparation', faculty: 'Dr. K. T. (Please Verify)', room: 'B 316' },
      6: { subject: 'PP (TRV)', name: 'Project Preparation', faculty: 'Dr. T. R. V. (Please Verify)', room: 'B 316' },
      7: { subject: 'Placement', name: 'Placement Training', faculty: 'Placement Cell (Please Verify)', room: 'B 316' },
      8: { subject: 'Placement', name: 'Placement Training', faculty: 'Placement Cell (Please Verify)', room: 'B 316' }
    },
    Friday: {
      1: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      2: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      3: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      4: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      5: { subject: 'Value Added Course', name: 'Value Added Course', faculty: 'Coordinator (Please Verify)', room: 'B 316' },
      6: { subject: 'Value Added Course', name: 'Value Added Course', faculty: 'Coordinator (Please Verify)', room: 'B 316' },
      7: { subject: 'Club Activities', name: 'Technical & Club Activities', faculty: 'Club In-charge (Please Verify)', room: 'B 316' },
      8: { subject: 'Club Activities', name: 'Technical & Club Activities', faculty: 'Club In-charge (Please Verify)', room: 'B 316' }
    },
    Saturday: {
      1: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      2: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      3: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      4: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Faculty In-charge (Please Verify)', room: 'B 316' },
      5: { subject: 'Placement', name: 'Placement & Aptitude Test', faculty: 'Placement Cell (Please Verify)', room: 'B 316' },
      6: { subject: 'Soft Skills', name: 'Soft Skills / Mock Interview', faculty: 'Trainer (Please Verify)', room: 'B 316' },
      7: { subject: 'PP (KT)', name: 'Project Preparation Seminar', faculty: 'Dr. K. T. (Please Verify)', room: 'B 316' },
      8: { subject: 'LIB', name: 'Library & Mentoring Hour', faculty: 'Librarian / Mentor (Please Verify)', room: 'B 316' }
    }
  }
};

export function AidsTimetableView({ api, user }) {
  const canEdit = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const [data, setData] = useState(DEFAULT_AIDS_DATA);
  const [editingSlot, setEditingSlot] = useState(null); // { day, period, current }
  const [editingSubject, setEditingSubject] = useState(null); // subject object or null
  const [editingActivity, setEditingActivity] = useState(null); // activity object or null
  const [showPromptRef, setShowPromptRef] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeMobileDay, setActiveMobileDay] = useState('Monday');

  // Load from API or local storage
  useEffect(() => {
    let loaded = false;
    // 1. Try local storage first for instant response
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setData(normalizeAidsData(JSON.parse(saved)));
        loaded = true;
      }
    } catch (e) {
      // fallback
    }

    // 2. Fetch from backend API
    api.get('/aids-timetable')
      .then(res => {
        if (res.data && res.data.schedule) {
          const normalized = normalizeAidsData(res.data);
          setData(normalized);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }
      })
      .catch(() => {
        // Backend offline or error - keep local storage or default
      });
  }, [api]);

  const showToast = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Save changes to localStorage and Backend
  const handleSave = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      await api.post('/aids-timetable', data);
      showToast('Timetable & subject details saved successfully to system and storage!');
    } catch (e) {
      // Even if network fails, localStorage saved
      showToast('Saved locally in browser storage (Backend sync offline)', 'warning');
    }
  };

  // Reset to default
  const handleReset = async () => {
    if (!window.confirm('Reset the AI&DS timetable back to original institutional defaults? Any custom edits will be reverted.')) {
      return;
    }
    setData(DEFAULT_AIDS_DATA);
    localStorage.removeItem(STORAGE_KEY);
    try {
      await api.post('/aids-timetable/reset');
    } catch (e) {
      // ignore
    }
    showToast('Timetable restored to original college defaults');
  };

  // Print timetable
  const handlePrint = () => {
    window.print();
  };

  // Export to PDF
  const handleExportPdf = () => {
    window.print();
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = () => {
    const promptText = `Institution Details:
- Institution: INFO Institute of Engineering
- Department: AI&DS
- Semester: VII
- Academic Year: 2026–2027
- Effective Date: 16-07-2026
- Classroom: B 316

1. Weekly Timetable
Monday, Tuesday, Wednesday, Thursday, Friday, and Saturday as rows, and 8 periods as columns.
Period timings:
1. 9:00 AM – 9:50 AM
2. 9:50 AM – 10:40 AM
3. 10:55 AM – 11:45 AM
4. 11:45 AM – 12:35 PM
5. 1:15 PM – 2:05 PM
6. 2:05 PM – 2:55 PM
7. 3:05 PM – 3:55 PM
8. 3:55 PM – 4:45 PM

Include the following subjects and activities:
- HVE – Human Values and Ethics
- ITA – IT in Agricultural System
- HRM – Human Resource Management
- RET – Renewable Energy Technologies
- PP (KT) – Project Preparation
- LIB – Library
- Mentor
- Soft Skills
- PP (TRV) – Project Preparation
- Placement
- Value Added Course
- Club Activities`;

    navigator.clipboard.writeText(promptText);
    showToast('Official timetable prompt copied to clipboard!');
  };

  // Get the accent colour for a subject or activity.
  const getSubjectColorStyle = (abbrev) => {
    const s = data.subjects.find(sub => sub.abbrev.toLowerCase() === (abbrev || '').toLowerCase()) ||
      data.activities.find(act => act.activity.toLowerCase().includes((abbrev || '').toLowerCase()));

    return { '--slot-accent': (s && s.color) || '#a855f7' };
  };

  // Update a slot
  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;

    const { day, period } = editingSlot;
    const form = e.target;
    const updatedSlot = {
      subject: form.subject.value.trim(),
      name: form.name.value.trim(),
      faculty: form.faculty.value.trim(),
      room: form.room.value.trim() || 'B 316'
    };

    const newSchedule = {
      ...data.schedule,
      [day]: {
        ...data.schedule[day],
        [period]: updatedSlot
      }
    };

    const updatedData = { ...data, schedule: newSchedule };
    setData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    setEditingSlot(null);
    showToast(`Updated ${day} Period ${period}: ${updatedSlot.subject}`);
    try {
      await api.post('/aids-timetable', updatedData);
    } catch (err) {
      console.warn('Backend sync failed:', err);
    }
  };

  // Clear slot
  const handleClearSlot = async () => {
    if (!editingSlot) return;
    const { day, period } = editingSlot;
    const newSchedule = {
      ...data.schedule,
      [day]: {
        ...data.schedule[day],
        [period]: { subject: '—', name: 'Free Period / Self-Study', faculty: '—', room: 'B 316' }
      }
    };
    const updatedData = { ...data, schedule: newSchedule };
    setData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    setEditingSlot(null);
    showToast(`Cleared ${day} Period ${period}`);
    try {
      await api.post('/aids-timetable', updatedData);
    } catch (err) {
      console.warn('Backend sync failed:', err);
    }
  };

  // Update subject details in table
  const handleSaveSubject = (e) => {
    e.preventDefault();
    const form = e.target;
    const updatedSubject = {
      code: form.code.value.trim(),
      abbrev: form.abbrev.value.trim(),
      name: form.name.value.trim(),
      faculty: form.faculty.value.trim(),
      periods: Number(form.periods.value) || 4,
      color: form.color.value || '#3b82f6'
    };

    let newSubjects;
    if (editingSubject && editingSubject.code) {
      newSubjects = data.subjects.map(s => s.code === editingSubject.code ? updatedSubject : s);
    } else {
      newSubjects = [...data.subjects, updatedSubject];
    }

    const updatedData = { ...data, subjects: newSubjects };
    setData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    setEditingSubject(null);
    showToast(`Subject ${updatedSubject.abbrev} updated successfully`);
  };

  // Update activity details
  const handleSaveActivity = (e) => {
    e.preventDefault();
    const form = e.target;
    const updatedActivity = {
      activity: form.activity.value.trim(),
      faculty: form.faculty.value.trim(),
      periods: Number(form.periods.value) || 2,
      timing: form.timing.value.trim(),
      color: form.color.value || '#f43f5e'
    };

    let newActivities;
    if (editingActivity && editingActivity.activity) {
      newActivities = data.activities.map(a => a.activity === editingActivity.activity ? updatedActivity : a);
    } else {
      newActivities = [...data.activities, updatedActivity];
    }

    const updatedData = { ...data, activities: newActivities };
    setData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    setEditingActivity(null);
    showToast(`Activity ${updatedActivity.activity} updated`);
  };

  return (
    <div className="aids-page-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification-banner banner-${notification.type}`} role="alert">
          <span>{notification.text}</span>
          <button
            type="button"
            className="banner-close"
            aria-label="Dismiss notification"
            onClick={() => setNotification(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* INSTITUTIONAL HEADER CARD */}
      <section className="aids-header-card">
        <div className="aids-header-top">
          <img
            src="/info_institute_logo.jpg"
            alt="Info Institute Logo"
            className="aids-header-logo"
          />
          <div className="aids-header-text">
            <h1>INFO INSTITUTE OF ENGINEERING</h1>
            <h2>DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE (AI&DS)</h2>
            <div className="aids-header-meta">
              <span className="aids-meta-pill highlight">
                🎓 Semester: {data.institution.semester}
              </span>
              <span className="aids-meta-pill">
                📅 Academic Year: {data.institution.academicYear}
              </span>
              <span className="aids-meta-pill classroom">
                🏛️ Classroom: {data.institution.classroom}
              </span>
              <span className="aids-meta-pill">
                🕒 Effective Date: {data.institution.effectiveDate}
              </span>
              <span className="badge-tag-official">Official Schedule</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="aids-toolbar">
          <div className="aids-toolbar-left">
            {canEdit ? (
              <>
                <AppIcon name="edit" size={16} />
                <span>Interactive Mode: Click any slot or subject row to edit details.</span>
              </>
            ) : (
              <span>Viewing Department Schedule · Read-only Student Access</span>
            )}
          </div>
          <div className="aids-toolbar-actions">
            {canEdit && (
              <button className="aids-btn aids-btn-save" onClick={handleSave} title="Save to Browser and Server">
                <AppIcon name="save" size={16} />
                <span>Save Changes</span>
              </button>
            )}
            <button className="aids-btn aids-btn-print" onClick={handlePrint} title="Print Official Timetable">
              <AppIcon name="print" size={16} />
              <span>Print Timetable</span>
            </button>
            <button className="aids-btn aids-btn-pdf" onClick={handleExportPdf} title="Export to PDF">
              <AppIcon name="pdf" size={16} />
              <span>Export to PDF</span>
            </button>
            <button
              className="aids-btn aids-btn-prompt"
              onClick={() => setShowPromptRef(!showPromptRef)}
              title="View Timetable Prompt & Specification"
            >
              <AppIcon name="info" size={16} />
              <span>{showPromptRef ? 'Hide Specs' : 'Timetable Prompt'}</span>
            </button>
            {canEdit && (
              <button className="aids-btn aids-btn-reset" onClick={handleReset} title="Restore College Defaults">
                <AppIcon name="reset" size={16} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Prompt Reference Box (Collapsible) */}
      {showPromptRef && (
        <section className="aids-prompt-box">
          <div className="aids-prompt-box-header">
            <span>📋 Timetable Prompt & Academic Requirements Specification</span>
            <button className="aids-copy-btn" onClick={handleCopyPrompt}>
              <AppIcon name="copy" size={14} style={{ marginRight: '4px' }} />
              Copy Prompt
            </button>
          </div>
          <p style={{ marginBottom: '8px' }}>
            <b>Institution:</b> INFO Institute of Engineering · <b>Department:</b> AI&DS · <b>Semester:</b> VII · <b>AY:</b> 2026–2027 · <b>Effective:</b> 16-07-2026 · <b>Classroom:</b> B 316
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
            <div>
              <b>Core Subjects:</b> HVE (Human Values & Ethics), ITA (IT in Agricultural System), HRM (Human Resource Management), RET (Renewable Energy Technologies), PP (KT) & PP (TRV) (Project Preparation).
            </div>
            <div>
              <b>Academic Activities:</b> Placement & Soft Skill Development, Library (LIB), Project Preparation, Mentoring Hour, Value Added Course (VAC), Club Activities.
            </div>
          </div>
        </section>
      )}

      {/* MOBILE DAY SELECTOR TABS */}
      <div className="mobile-day-tabs" role="tablist" aria-label="Select timetable day">
        {data.days.map(d => (
          <button
            key={d}
            type="button"
            className={`mobile-day-tab ${activeMobileDay === d ? 'is-active' : ''}`}
            aria-pressed={activeMobileDay === d}
            onClick={() => setActiveMobileDay(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {/* 1. WEEKLY TIMETABLE GRID TABLE */}
      <section className="aids-grid-wrapper">
        <table className="aids-table">
          <thead>
            <tr>
              <th className="day-col">
                <div>DAY / TIME</div>
                <small className="aids-th-sub">6 Days</small>
              </th>
              {data.timings.map(t => (
                <th key={t.id} className={t.isBreak ? 'break-th' : ''}>
                  <div>{t.label}</div>
                  <span className="aids-time-label">{t.time}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.days.map(day => (
              <tr key={day}>
                <td className="day-label">{day}</td>
                {data.timings.map(t => {
                  if (t.isBreak) {
                    return (
                      <td key={t.id} className="aids-break-cell" title={`${t.label}: ${t.time}`}>
                        {t.id === 'MB' ? 'TEA BREAK' : t.id === 'LB' ? 'LUNCH' : 'BREAK'}
                      </td>
                    );
                  }

                  const periodNum = t.periodNum;
                  const slot = (data.schedule[day] && data.schedule[day][periodNum]) || {
                    subject: '—',
                    name: 'Free Period',
                    faculty: '—',
                    room: 'B 316'
                  };

                  const colorStyle = getSubjectColorStyle(slot.subject);

                  return (
                    <td key={t.id}>
                      <div
                        className="aids-slot-card"
                        onClick={() => canEdit && setEditingSlot({ day, period: periodNum, current: slot })}
                        title={canEdit ? `Click to edit ${day} Period ${periodNum}` : `${day} Period ${periodNum}`}
                        style={{ ...colorStyle, cursor: canEdit ? 'pointer' : 'default' }}
                      >
                        <div className="aids-slot-header">
                          <span className="aids-slot-code">{slot.subject}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="aids-slot-room">{slot.room || 'B 316'}</span>
                            {canEdit && (
                              <button
                                type="button"
                                className="btn-edit-period"
                                title={`Edit ${day} Period ${periodNum}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSlot({ day, period: periodNum, current: slot });
                                }}
                                style={{
                                  background: 'rgba(168, 85, 247, 0.2)',
                                  border: '1px solid rgba(168, 85, 247, 0.5)',
                                  borderRadius: '6px',
                                  color: '#f3e8ff',
                                  padding: '2px 6px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                ✏️ Edit
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="aids-slot-title">{slot.name}</div>
                        <div className={`aids-slot-faculty ${slot.faculty.includes('Verify') ? 'unverified' : ''}`}>
                          <span>👨‍🏫 {slot.faculty}</span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 2 & 3. SUBJECT INFORMATION & OTHER ACTIVITIES TABLES */}
      <section className="aids-tables-grid">
        {/* Subject Information Table */}
        <div className="aids-card-table">
          <div className="aids-card-table-header">
            <h3>
              <AppIcon name="subjects" size={18} />
              <span>Subject Information Table</span>
            </h3>
            <button
              className="aids-btn aids-btn-save"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setEditingSubject({ code: '', abbrev: '', name: '', faculty: 'Please Verify', periods: 4, color: '#3b82f6' })}
            >
              <AppIcon name="plus" size={14} /> Add Subject
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="aids-data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Abbrev</th>
                  <th>Subject Name</th>
                  <th>Faculty Name</th>
                  <th style={{ textAlign: 'center' }}>Periods</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((sub, i) => (
                  <tr key={sub.code || i}>
                    <td><b>{sub.code}</b></td>
                    <td>
                      <span className="aids-subject-tag" style={{ '--tag-color': sub.color || '#a855f7' }}>
                        {sub.abbrev}
                      </span>
                    </td>
                    <td>{sub.name}</td>
                    <td>
                      <span>{sub.faculty}</span>
                      {sub.faculty.includes('Verify') && (
                        <span className="aids-badge-unverified">Verify</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="aids-badge-periods">{sub.periods}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => setEditingSubject(sub)}
                        aria-label={`Edit ${sub.abbrev}`}
                        title="Edit Subject"
                      >
                        <AppIcon name="edit" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Other Academic Activities Table */}
        <div className="aids-card-table">
          <div className="aids-card-table-header">
            <h3>
              <AppIcon name="sparkle" size={18} />
              <span>Other Academic Activities</span>
            </h3>
            <button
              className="aids-btn aids-btn-save"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setEditingActivity({ activity: '', faculty: 'Please Verify', periods: 2, timing: 'Allotted slots', color: '#f43f5e' })}
            >
              <AppIcon name="plus" size={14} /> Add Activity
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="aids-data-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>In-Charge Faculty</th>
                  <th style={{ textAlign: 'center' }}>Periods</th>
                  <th>Scheduled Timing</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.activities.map((act, i) => (
                  <tr key={act.activity || i}>
                    <td><b>{act.activity}</b></td>
                    <td>
                      <span>{act.faculty}</span>
                      {act.faculty.includes('Verify') && (
                        <span className="aids-badge-unverified">Verify</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="aids-badge-periods">{act.periods}</span>
                    </td>
                    <td className="aids-activity-timing">{act.timing}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => setEditingActivity(act)}
                        aria-label={`Edit ${act.activity}`}
                        title="Edit Activity"
                      >
                        <AppIcon name="edit" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRINT SIGNATURE FOOTER */}
      <div className="aids-print-signatures">
        <div className="aids-signature-block">
          Class Advisor / Mentor
        </div>
        <div className="aids-signature-block">
          Head of Department (AI&DS)
        </div>
        <div className="aids-signature-block">
          Principal / Dean Academics
        </div>
      </div>

      {/* SLOT EDIT MODAL */}
      {editingSlot && (
        <div className="aids-modal-backdrop" onClick={() => setEditingSlot(null)}>
          <div className="aids-modal-card" onClick={e => e.stopPropagation()}>
            <div className="aids-modal-header">
              <h3>Edit Period: {editingSlot.day} — Period {editingSlot.period}</h3>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="modal-close"
                aria-label="Close period editor"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateSlot} className="aids-modal-form">
              <div>
                <label>
                  Quick Pick Subject / Activity:
                </label>
                <select
                  className="form-input"
                  onChange={e => {
                    const picked = data.subjects.find(s => s.abbrev === e.target.value);
                    if (picked) {
                      e.target.form.subject.value = picked.abbrev;
                      e.target.form.name.value = picked.name;
                      e.target.form.faculty.value = picked.faculty;
                    } else {
                      const pickedAct = data.activities.find(a => a.activity === e.target.value);
                      if (pickedAct) {
                        e.target.form.subject.value = pickedAct.activity;
                        e.target.form.name.value = pickedAct.activity;
                        e.target.form.faculty.value = pickedAct.faculty;
                      }
                    }
                  }}
                >
                  <option value="">-- Choose Preset or Type Custom Below --</option>
                  <optgroup label="Academic Subjects">
                    {data.subjects.map(s => (
                      <option key={s.abbrev} value={s.abbrev}>{s.abbrev} — {s.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Academic Activities">
                    {data.activities.map(a => (
                      <option key={a.activity} value={a.activity}>{a.activity}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label>
                  Subject / Activity Abbreviation:
                </label>
                <input
                  type="text"
                  name="subject"
                  defaultValue={editingSlot.current.subject}
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label>
                  Full Subject Name:
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingSlot.current.name}
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label>
                  Faculty Name:
                </label>
                <input
                  type="text"
                  name="faculty"
                  defaultValue={editingSlot.current.faculty}
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label>
                  Classroom / Lab:
                </label>
                <input
                  type="text"
                  name="room"
                  defaultValue={editingSlot.current.room || 'B 316'}
                  className="form-input"
                />
              </div>

              <div className="aids-modal-actions">
                <button
                  type="submit"
                  className="aids-btn aids-btn-save">
                  <AppIcon name="check" size={16} /> Update Slot
                </button>
                <button
                  type="button"
                  className="aids-btn aids-btn-danger"
                  onClick={handleClearSlot}
                >
                  Clear Period
                </button>
                <button
                  type="button"
                  className="aids-btn aids-btn-cancel"
                  onClick={() => setEditingSlot(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBJECT EDIT MODAL */}
      {editingSubject && (
        <div className="aids-modal-backdrop" onClick={() => setEditingSubject(null)}>
          <div className="aids-modal-card" onClick={e => e.stopPropagation()}>
            <div className="aids-modal-header">
              <h3>{editingSubject.code ? `Edit Subject: ${editingSubject.abbrev}` : 'Add New Subject'}</h3>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="modal-close"
                aria-label="Close subject editor"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="aids-modal-form">
              <div>
                <label>
                  Subject Code:
                </label>
                <input
                  type="text"
                  name="code"
                  defaultValue={editingSubject.code}
                  required
                  placeholder="e.g. AI8701"
                  className="form-input"
                />
              </div>

              <div>
                <label>
                  Abbreviation:
                </label>
                <input
                  type="text"
                  name="abbrev"
                  defaultValue={editingSubject.abbrev}
                  required
                  placeholder="e.g. HVE"
                  className="form-input"
                />
              </div>

              <div>
                <label>
                  Subject Name:
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingSubject.name}
                  required
                  placeholder="e.g. Human Values and Ethics"
                  className="form-input"
                />
              </div>

              <div>
                <label>
                  Faculty Name:
                </label>
                <input
                  type="text"
                  name="faculty"
                  defaultValue={editingSubject.faculty}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div>
                  <label>
                    Number of Periods:
                  </label>
                  <input
                    type="number"
                    name="periods"
                    defaultValue={editingSubject.periods || 4}
                    min="1"
                    max="10"
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label>
                    Color Tag:
                  </label>
                  <input
                    type="color"
                    name="color"
                    defaultValue={editingSubject.color || '#3b82f6'}
                    className="form-input form-color"
                  />
                </div>
              </div>

              <div className="aids-modal-actions">
                <button
                  type="submit"
                  className="aids-btn aids-btn-save">
                  <AppIcon name="check" size={16} /> Save Subject
                </button>
                <button
                  type="button"
                  className="aids-btn aids-btn-cancel"
                  onClick={() => setEditingSubject(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVITY EDIT MODAL */}
      {editingActivity && (
        <div className="aids-modal-backdrop" onClick={() => setEditingActivity(null)}>
          <div className="aids-modal-card" onClick={e => e.stopPropagation()}>
            <div className="aids-modal-header">
              <h3>{editingActivity.activity ? `Edit Activity: ${editingActivity.activity}` : 'Add Academic Activity'}</h3>
              <button
                type="button"
                onClick={() => setEditingActivity(null)}
                className="modal-close"
                aria-label="Close activity editor"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveActivity} className="aids-modal-form">
              <div>
                <label>
                  Activity Name:
                </label>
                <input
                  type="text"
                  name="activity"
                  defaultValue={editingActivity.activity}
                  required
                  placeholder="e.g. Placement & Soft Skill Development"
                  className="form-input"
                />
              </div>

              <div>
                <label>
                  In-Charge Faculty:
                </label>
                <input
                  type="text"
                  name="faculty"
                  defaultValue={editingActivity.faculty}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div>
                  <label>
                    Number of Periods:
                  </label>
                  <input
                    type="number"
                    name="periods"
                    defaultValue={editingActivity.periods || 2}
                    min="1"
                    max="10"
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label>
                    Color Tag:
                  </label>
                  <input
                    type="color"
                    name="color"
                    defaultValue={editingActivity.color || '#f43f5e'}
                    className="form-input form-color"
                  />
                </div>
              </div>

              <div>
                <label>
                  Scheduled Timing / Slots:
                </label>
                <input
                  type="text"
                  name="timing"
                  defaultValue={editingActivity.timing}
                  placeholder="e.g. Wed P5-P6, Thu P7-P8"
                  className="form-input"
                />
              </div>

              <div className="aids-modal-actions">
                <button
                  type="submit"
                  className="aids-btn aids-btn-save">
                  <AppIcon name="check" size={16} /> Save Activity
                </button>
                <button
                  type="button"
                  className="aids-btn aids-btn-cancel"
                  onClick={() => setEditingActivity(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
