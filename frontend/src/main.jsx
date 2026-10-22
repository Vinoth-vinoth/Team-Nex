import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './styles.css';

const API_PORT = import.meta.env.VITE_API_PORT || '5000';
const API_BASE_KEY = 'timetable_api_base';

// The Android WebView reports its own hostname as "localhost", so the API host
// can never be derived from window.location on a phone. Resolution order:
// 1) address saved in the app (localStorage) -> survives IP changes without a rebuild
// 2) VITE_API_BASE_URL baked in at build time
// 3) VITE_LAN_IP baked in at build time
// 4) the host the page was opened with (works for desktop/browser use)
function resolveApiBase() {
  const saved = (localStorage.getItem(API_BASE_KEY) || '').trim();
  if (saved) return saved.replace(/\/+$/, '');

  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) return configured.replace(/\/+$/, '');

  const lanIp = (import.meta.env.VITE_LAN_IP || '').trim();
  if (lanIp) return `http://${lanIp}:${API_PORT}/api`;

  return `http://${window.location.hostname || 'localhost'}:${API_PORT}/api`;
}

const api = axios.create({ baseURL: resolveApiBase() });

function formatTime(time) {
  const [hourText, minute = '00'] = String(time || '').slice(0, 5).split(':');
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return String(time || '');
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${minute} ${period}`;
}

function formatTimeRange(slot) {
  return `${formatTime(slot.start_time)} to ${formatTime(slot.end_time)}`;
}

api.interceptors.request.use(config => {
  // Re-resolved on every request so a saved server address applies immediately.
  config.baseURL = resolveApiBase();
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 1. LOGIN COMPONENT WITH 1-CLICK DEMO ACCOUNT BUTTONS
function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@college.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showServer, setShowServer] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => resolveApiBase());
  const [serverSaved, setServerSaved] = useState(false);

  const fillCredentials = (e, p) => {
    setEmail(e);
    setPassword(p);
    setError('');
  };

  const saveServer = () => {
    const value = serverUrl.trim().replace(/\/+$/, '');
    if (!value) {
      localStorage.removeItem(API_BASE_KEY);
    } else {
      localStorage.setItem(API_BASE_KEY, value);
    }
    setServerUrl(resolveApiBase());
    setServerSaved(true);
    setError('');
    setTimeout(() => setServerSaved(false), 2500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response
        ? err.response.data?.message || `Sign-in failed (HTTP ${err.response.status}).`
        : `Cannot reach the backend at ${resolveApiBase()}. Open this app using your PC's network IP and make sure the backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">📅</div>
          <div>
            <h2>Intelligent Timetable</h2>
            <p>Department Timetable Scheduling System</p>
          </div>
        </div>

        <div className="demo-pill-group">
          <span>Quick Demo Logins (Click to fill)</span>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-demo-role"
              onClick={() => fillCredentials('admin@college.com', 'admin123')}
            >
              👑 Admin
            </button>
            <button
              type="button"
              className="btn-demo-role"
              onClick={() => fillCredentials('staff@college.com', 'staff123')}
            >
              👨‍🏫 Staff
            </button>
            <button
              type="button"
              className="btn-demo-role"
              onClick={() => fillCredentials('student@college.com', 'student123')}
            >
              🎓 Student
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. admin@college.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>

          {error && <div className="login-error">{error}</div>}
        </form>

        <div className="server-settings">
          <button
            type="button"
            className="server-toggle"
            onClick={() => setShowServer(value => !value)}
          >
            {showServer ? '▾' : '▸'} Server: {resolveApiBase()}
          </button>

          {showServer && (
            <div className="server-panel">
              <label htmlFor="server-url">Backend address</label>
              <input
                id="server-url"
                className="form-input"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                placeholder={`http://192.168.1.5:${API_PORT}/api`}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <div className="server-actions">
                <button type="button" className="btn-demo-role" onClick={saveServer}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn-demo-role"
                  onClick={() => {
                    localStorage.removeItem(API_BASE_KEY);
                    setServerUrl(resolveApiBase());
                    setServerSaved(false);
                  }}
                >
                  Reset
                </button>
                {serverSaved && <span className="server-saved">Saved</span>}
              </div>
              <p className="server-hint">
                Use your PC&apos;s Wi-Fi IP address (not localhost). Press Reset to go back to
                the built-in default.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. MAIN APPLICATION COMPONENT
function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [page, setPage] = useState('Dashboard');
  const [data, setData] = useState({
    departments: [],
    years: [],
    sections: [],
    subjects: [],
    faculty: [],
    rooms: [],
    facultySubjects: [],
    days: [],
    slots: [],
    rules: [],
    tt: []
  });
  const [notification, setNotification] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  // Only restore a saved user after the backend confirms the stored token.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    let active = true;

    const validateSession = async () => {
      if (!token || !savedUser) {
        setUser(null);
        setCheckingSession(false);
        return;
      }

      try {
        JSON.parse(savedUser);
        const response = await api.get('/auth/me');
        if (active) setUser(response.data.user);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (active) setUser(null);
      } finally {
        if (active) setCheckingSession(false);
      }
    };

    validateSession();
    return () => { active = false; };
  }, []);

  // Fetch all master data when user logs in or page changes
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, page]);

  const loadData = async () => {
    try {
      const [depts, yrs, sects, subs, facs, rms, dys, slts, tt] = await Promise.all([
        api.get('/departments'),
        api.get('/years'),
        api.get('/sections'),
        api.get('/subjects'),
        api.get('/faculty'),
        api.get('/rooms'),
        api.get('/working-days'),
        api.get('/time-slots'),
        api.get('/timetable')
      ]);

      const timetableEntries = Array.isArray(tt.data) ? tt.data : [];

      setData({
        departments: depts.data,
        years: yrs.data,
        sections: sects.data,
        subjects: subs.data,
        faculty: facs.data,
        rooms: rms.data,
        facultySubjects: [],
        days: dys.data,
        slots: slts.data,
        rules: [],
        tt: timetableEntries
      });
    } catch (err) {
      const requestPath = err.config?.url || 'the API';
      setNotification({
        type: 'error',
        text: err.response
          ? err.response.data?.message || `${requestPath} returned HTTP ${err.response.status}. Check that the backend route and database are available.`
          : `Cannot reach the backend at ${resolveApiBase()}. Check that the backend is running on port ${API_PORT}, the PC firewall allows access, and the phone is on the same network.`
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setNotification({ type: 'info', text: 'Executing intelligent timetable scheduler algorithm...' });
    try {
      const res = await api.post('/generate');
      setConflicts(res.data.conflicts || []);
      setNotification({
        type: res.data.conflicts?.length ? 'error' : 'success',
        text: `Generation complete: Scheduled ${res.data.entries} period entries. ${res.data.conflicts?.length ? `${res.data.conflicts.length} scheduling warning(s) need review.` : 'All constraints fulfilled!'
          }`
      });
      await loadData();
      setPage('Timetable');
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.response?.data?.message || 'Generation failed. Check server logs.'
      });
    } finally {
      setGenerating(false);
    }
  };

  if (checkingSession) {
    return <div className="auth-loading" role="status">Checking your session…</div>;
  }

  if (!user) {
    return <Login onLogin={u => setUser(u)} />;
  }

  const isStudent = user.role === 'STUDENT';
  const canEdit = !isStudent;

  const navItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Departments', icon: '🏛️' },
    { name: 'Sections', icon: '👥' },
    { name: 'Subjects', icon: '📚' },
    { name: 'Faculty', icon: '👨‍🏫' },
    { name: 'Rooms & Labs', icon: '🏢' },
    { name: 'Faculty Links', icon: '🔗' },
    { name: 'Timetable', icon: '📅' },
    { name: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">📅</div>
          <div className="brand-info">
            <h2>ITTS Engine</h2>
            <span>College MVP</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user.name ? user.name[0] : 'U'}</div>
          <div className="user-meta">
            <div className="user-name">{user.name}</div>
            <span
              className={`user-role-badge ${user.role === 'ADMIN' ? 'role-admin' : user.role === 'STAFF' ? 'role-staff' : 'role-student'
                }`}
            >
              {user.role}
            </span>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map(item => (
            <button
              key={item.name}
              className={`nav-item ${page === item.name ? 'active' : ''}`}
              onClick={() => {
                setPage(item.name);
                setNotification(null);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          {canEdit && (
            <button className="btn-generate" onClick={handleGenerate} disabled={generating}>
              {generating ? '⏳ Generating...' : '⚡ Generate Timetable'}
            </button>
          )}
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{page}</h1>
            <p>Intelligent Timetable Generator & Conflict Resolver</p>
          </div>
          <div className="topbar-badges">
            <span className={`status-badge ${isStudent ? 'badge-view-only' : 'badge-admin-mode'}`}>
              {isStudent ? '🔒 VIEW-ONLY MODE (STUDENT)' : '✏️ EDIT & GENERATE ENABLED'}
            </span>
          </div>
        </header>

        {notification && (
          <div className={`notification-banner banner-${notification.type}`}>
            <span>{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="content-body">
          {page === 'Dashboard' && <Dashboard data={data} canEdit={canEdit} onGenerate={handleGenerate} setPage={setPage} />}
          {page === 'Departments' && <DepartmentsView data={data} reload={loadData} canEdit={user.role === 'ADMIN'} />}
          {page === 'Sections' && <SectionsView data={data} reload={loadData} canEdit={canEdit} />}
          {page === 'Subjects' && <SubjectsView data={data} reload={loadData} canEdit={canEdit} />}
          {page === 'Faculty' && <FacultyView data={data} reload={loadData} canEdit={canEdit} />}
          {page === 'Rooms & Labs' && <RoomsView data={data} reload={loadData} canEdit={canEdit} />}
          {page === 'Faculty Links' && <FacultySubjectsView data={data} reload={loadData} canEdit={canEdit} />}
          {page === 'Timetable' && (
            <TimetableView data={data} conflicts={conflicts} onGenerate={handleGenerate} canEdit={canEdit} />
          )}
          {page === 'Settings' && (
            <SettingsView
              user={user}
              canEdit={canEdit}
              setPage={setPage}
              onLogout={handleLogout}
              onGenerate={handleGenerate}
              generating={generating}
            />
          )}
        </div>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Primary navigation">
        {[
          { name: 'Dashboard', label: 'Home', icon: '⌂' },
          { name: 'Timetable', label: 'Timetable', icon: '▦' },
          { name: 'Faculty', label: 'Faculty', icon: '♙' },
          { name: 'Settings', label: 'Settings', icon: '⚙' }
        ].map(item => (
          <button
            key={item.name}
            type="button"
            className={`mobile-nav-item ${page === item.name ? 'active' : ''}`}
            aria-current={page === item.name ? 'page' : undefined}
            onClick={() => {
              setPage(item.name);
              setNotification(null);
            }}
          >
            <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function SettingsView({ user, canEdit, setPage, onLogout, onGenerate, generating }) {
  const shortcuts = [
    { name: 'Departments', icon: '🏛️', description: 'Browse departments and programs' },
    { name: 'Sections', icon: '👥', description: 'Review class sections and strength' },
    { name: 'Subjects', icon: '📚', description: 'View the subject catalog' },
    { name: 'Rooms & Labs', icon: '🏢', description: 'Browse classrooms and laboratories' },
    { name: 'Faculty Links', icon: '🔗', description: 'View faculty subject assignments' }
  ];

  return (
    <div className="settings-page">
      <section className="panel settings-account-card">
        <div className="settings-account-avatar">{user.name?.[0] || 'U'}</div>
        <div className="settings-account-details">
          <span className="settings-eyebrow">SIGNED IN AS</span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <span className="settings-role">{user.role}</span>
      </section>

      {canEdit && (
        <section className="settings-action-card">
          <div>
            <span className="settings-eyebrow">SCHEDULING TOOLS</span>
            <h2>Keep your schedule up to date</h2>
            <p>Run the timetable generator using the current academic data.</p>
          </div>
          <button className="btn-primary" onClick={onGenerate} disabled={generating}>
            {generating ? '⏳ Generating…' : '⚡ Generate timetable'}
          </button>
        </section>
      )}

      <section className="panel settings-shortcuts">
        <div className="panel-header"><h2>More sections</h2></div>
        <div className="settings-shortcut-list">
          {shortcuts.map(item => (
            <button key={item.name} className="settings-shortcut" onClick={() => setPage(item.name)}>
              <span className="settings-shortcut-icon">{item.icon}</span>
              <span className="settings-shortcut-copy">
                <strong>{item.name}</strong>
                <small>{item.description}</small>
              </span>
              <span className="settings-shortcut-arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </section>

      <button className="settings-logout" onClick={onLogout}>↪ Sign out</button>
    </div>
  );
}

// 3. DASHBOARD VIEW
function Dashboard({ data, canEdit, onGenerate, setPage }) {
  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-blue">🏛️</div>
          <div className="stat-details">
            <h3>{data.departments.length}</h3>
            <p>Departments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-indigo">👥</div>
          <div className="stat-details">
            <h3>{data.sections.length}</h3>
            <p>Sections</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-emerald">📚</div>
          <div className="stat-details">
            <h3>{data.subjects.length}</h3>
            <p>Subjects</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-purple">👨‍🏫</div>
          <div className="stat-details">
            <h3>{data.faculty.length}</h3>
            <p>Faculty</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-amber">🏢</div>
          <div className="stat-details">
            <h3>{data.rooms.length}</h3>
            <p>Rooms & Labs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-rose">📅</div>
          <div className="stat-details">
            <h3>{data.tt.length}</h3>
            <p>Scheduled Periods</p>
          </div>
        </div>
      </div>

      <div className="two-col-layout">
        <div className="panel">
          <div className="panel-header">
            <h2>🏆 Academic Rules & Hard Constraints</h2>
          </div>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', fontSize: '13.5px', color: '#334155' }}>
            <li><b>Period Duration:</b> 45 Minutes per academic period (8 periods daily).</li>
            <li><b>Schedule Timing:</b> 9:00 AM to 4:45 PM.</li>
            <li><b>Required Breaks:</b> Morning Break (10:40 AM to 10:55 AM), Lunch (12:35 PM to 1:15 PM), Evening Break (2:50 PM to 3:00 PM).</li>
            <li><b>Theory Requirements:</b> 4 weekly periods, distributed across different days.</li>
            <li><b>Practical / Lab Component:</b> Block-scheduled in 2 contiguous periods.</li>
            <li><b>Zero Conflict Engine:</b> Strict hard checks against section clash, room overlap, and faculty double-booking.</li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>🚀 Quick Actions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {canEdit ? (
              <button
                className="btn-primary"
                style={{ padding: '14px', fontSize: '14px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={onGenerate}
              >
                ⚡ Run Intelligent Timetable Generation
              </button>
            ) : (
              <p style={{ fontSize: '13.5px', color: '#64748b' }}>
                You are currently viewing in student read-only mode.
              </p>
            )}

            <button
              className="btn-primary"
              style={{ background: '#3b82f6', padding: '12px' }}
              onClick={() => setPage('Timetable')}
            >
              📅 View Master Day × Period Timetable Matrix
            </button>

            <button
              className="btn-primary"
              style={{ background: '#6366f1', padding: '12px' }}
              onClick={() => setPage('Faculty Links')}
            >
              🔗 Manage Faculty-to-Subject Assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. DEPARTMENTS VIEW
function DepartmentsView({ data, reload, canEdit }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', { code, name });
      setCode('');
      setName('');
      setMsg('Department added successfully!');
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding department');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting department');
    }
  };

  return (
    <div className="two-col-layout">
      {canEdit && (
        <div className="panel">
          <div className="panel-header">
            <h2>Add Department</h2>
          </div>
          {msg && <div style={{ color: '#16a34a', marginBottom: '10px', fontSize: '13px' }}>{msg}</div>}
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Department Code</label>
              <input
                className="form-input"
                placeholder="e.g. AI&DS, CSE"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                className="form-input"
                placeholder="e.g. Artificial Intelligence"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Save Department
            </button>
          </form>
        </div>
      )}

      <div className="panel" style={{ gridColumn: canEdit ? 'span 1' : 'span 2' }}>
        <div className="panel-header">
          <h2>Active Departments ({data.departments.length})</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Department Name</th>
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {data.departments.map(d => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td><b>{d.code}</b></td>
                  <td>{d.name}</td>
                  {canEdit && (
                    <td>
                      <button className="btn-danger-outline" onClick={() => handleDelete(d.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 5. SECTIONS VIEW
function SectionsView({ data, reload, canEdit }) {
  const [departmentId, setDepartmentId] = useState(data.departments[0]?.id || '');
  const [academicYearId, setAcademicYearId] = useState(data.years[0]?.id || '');
  const [sectionName, setSectionName] = useState('');
  const [strength, setStrength] = useState(60);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sections', { departmentId, academicYearId, sectionName, strength });
      setSectionName('');
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving section');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await api.delete(`/sections/${id}`);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting section');
    }
  };

  return (
    <div className="two-col-layout">
      {canEdit && (
        <div className="panel">
          <div className="panel-header">
            <h2>Add Section</h2>
          </div>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Department</label>
              <select
                className="form-select"
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
              >
                {data.departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Academic Year</label>
              <select
                className="form-select"
                value={academicYearId}
                onChange={e => setAcademicYearId(e.target.value)}
              >
                {data.years.map(y => (
                  <option key={y.id} value={y.id}>{y.year_name} Year</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Section Name</label>
              <input
                className="form-input"
                placeholder="e.g. AI&DS-2ND-A"
                value={sectionName}
                onChange={e => setSectionName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Student Strength</label>
              <input
                type="number"
                className="form-input"
                value={strength}
                onChange={e => setStrength(+e.target.value)}
                min="1"
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Add Section
            </button>
          </form>
        </div>
      )}

      <div className="panel" style={{ gridColumn: canEdit ? 'span 1' : 'span 2' }}>
        <div className="panel-header">
          <h2>Existing Sections ({data.sections.length})</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Year</th>
                <th>Section</th>
                <th>Strength</th>
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {data.sections.map(s => (
                <tr key={s.id}>
                  <td><b>{s.department}</b></td>
                  <td>{s.year_name}</td>
                  <td>{s.section_name}</td>
                  <td>{s.strength} students</td>
                  {canEdit && (
                    <td>
                      <button className="btn-danger-outline" onClick={() => handleDelete(s.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 6. SUBJECTS VIEW
function SubjectsView({ data, reload, canEdit }) {
  const [departmentId, setDepartmentId] = useState(data.departments[0]?.id || '');
  const [yearId, setYearId] = useState(data.years[0]?.id || '');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [subjectType, setSubjectType] = useState('THEORY');
  const [weeklyPeriods, setWeeklyPeriods] = useState(4);
  const [totalHours, setTotalHours] = useState(60);
  const [labPeriods, setLabPeriods] = useState(0);

  const handleTypeChange = (type) => {
    setSubjectType(type);
    if (type === 'PRACTICAL') {
      setWeeklyPeriods(2);
      setLabPeriods(2);
      setTotalHours(30);
    } else {
      setWeeklyPeriods(4);
      setLabPeriods(0);
      setTotalHours(60);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjects', {
        departmentId,
        yearId,
        code,
        name,
        subjectType,
        weeklyPeriods,
        totalHours,
        labPeriods
      });
      setCode('');
      setName('');
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving subject');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting subject');
    }
  };

  return (
    <div className="two-col-layout">
      {canEdit && (
        <div className="panel">
          <div className="panel-header">
            <h2>Add Subject</h2>
          </div>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Department</label>
              <select
                className="form-select"
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
              >
                {data.departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Academic Year</label>
              <select
                className="form-select"
                value={yearId}
                onChange={e => setYearId(e.target.value)}
              >
                {data.years.map(y => (
                  <option key={y.id} value={y.id}>{y.year_name} Year</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject Code & Name</label>
              <input
                className="form-input"
                placeholder="Code (e.g. AIDS201)"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
              <input
                className="form-input"
                style={{ marginTop: '8px' }}
                placeholder="Name (e.g. Data Structures)"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Subject Type</label>
              <select
                className="form-select"
                value={subjectType}
                onChange={e => handleTypeChange(e.target.value)}
              >
                <option value="THEORY">THEORY (Classroom)</option>
                <option value="PRACTICAL">PRACTICAL (Laboratory)</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Weekly Periods</label>
                <input
                  type="number"
                  className="form-input"
                  value={weeklyPeriods}
                  onChange={e => setWeeklyPeriods(+e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Total Hours</label>
                <input
                  type="number"
                  className="form-input"
                  value={totalHours}
                  onChange={e => setTotalHours(+e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Save Subject
            </button>
          </form>
        </div>
      )}

      <div className="panel" style={{ gridColumn: canEdit ? 'span 1' : 'span 2' }}>
        <div className="panel-header">
          <h2>Subject Catalog ({data.subjects.length})</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dept</th>
                <th>Year</th>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Type</th>
                <th>Periods/Wk</th>
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {data.subjects.map(s => (
                <tr key={s.id}>
                  <td><b>{s.department}</b></td>
                  <td>{s.year_name}</td>
                  <td><b>{s.code}</b></td>
                  <td>{s.name}</td>
                  <td>
                    <span className={`pill-badge ${s.subject_type === 'PRACTICAL' ? 'pill-practical' : 'pill-theory'}`}>
                      {s.subject_type}
                    </span>
                  </td>
                  <td>{s.weekly_periods} periods</td>
                  {canEdit && (
                    <td>
                      <button className="btn-danger-outline" onClick={() => handleDelete(s.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 7. FACULTY VIEW
function FacultyView({ data, reload, canEdit }) {
  const [departmentId, setDepartmentId] = useState(data.departments[0]?.id || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [maxPeriodsPerDay, setMaxPeriodsPerDay] = useState(6);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/faculty', { departmentId, name, email, designation, maxPeriodsPerDay });
      setName('');
      setEmail('');
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving faculty');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this faculty?')) return;
    try {
      await api.delete(`/faculty/${id}`);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting faculty');
    }
  };

  return (
    <div className="two-col-layout">
      {canEdit && (
        <div className="panel">
          <div className="panel-header">
            <h2>Add Faculty</h2>
          </div>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Department</label>
              <select
                className="form-select"
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
              >
                {data.departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Faculty Name</label>
              <input
                className="form-input"
                placeholder="e.g. Dr. Rajesh Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. rajesh@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input
                className="form-input"
                placeholder="Assistant Professor / HoD"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Max Periods / Day</label>
              <input
                type="number"
                className="form-input"
                value={maxPeriodsPerDay}
                onChange={e => setMaxPeriodsPerDay(+e.target.value)}
                min="1"
                max="8"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Add Faculty
            </button>
          </form>
        </div>
      )}

      <div className="panel" style={{ gridColumn: canEdit ? 'span 1' : 'span 2' }}>
        <div className="panel-header">
          <h2>Teaching Faculty ({data.faculty.length})</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Max / Day</th>
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {data.faculty.map(f => (
                <tr key={f.id}>
                  <td><b>{f.department}</b></td>
                  <td><b>{f.name}</b></td>
                  <td>{f.designation}</td>
                  <td>{f.email || '—'}</td>
                  <td>{f.max_periods_per_day}</td>
                  {canEdit && (
                    <td>
                      <button className="btn-danger-outline" onClick={() => handleDelete(f.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 8. ROOMS VIEW
function RoomsView({ data, reload, canEdit }) {
  const [roomCode, setRoomCode] = useState('');
  const [roomType, setRoomType] = useState('CLASSROOM');
  const [capacity, setCapacity] = useState(60);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rooms', { roomCode, roomType, capacity });
      setRoomCode('');
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving room');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting room');
    }
  };

  return (
    <div className="two-col-layout">
      {canEdit && (
        <div className="panel">
          <div className="panel-header">
            <h2>Add Classroom / Lab</h2>
          </div>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Room / Lab Code</label>
              <input
                className="form-input"
                placeholder="e.g. R104 or LAB103"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Room Type</label>
              <select
                className="form-select"
                value={roomType}
                onChange={e => setRoomType(e.target.value)}
              >
                <option value="CLASSROOM">CLASSROOM (Theory)</option>
                <option value="LAB">LAB (Practical Laboratory)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Capacity (Seats)</label>
              <input
                type="number"
                className="form-input"
                value={capacity}
                onChange={e => setCapacity(+e.target.value)}
                min="1"
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Save Room
            </button>
          </form>
        </div>
      )}

      <div className="panel" style={{ gridColumn: canEdit ? 'span 1' : 'span 2' }}>
        <div className="panel-header">
          <h2>Campus Classrooms & Labs ({data.rooms.length})</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Code</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Status</th>
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {data.rooms.map(r => (
                <tr key={r.id}>
                  <td><b>{r.room_code}</b></td>
                  <td>
                    <span className={`pill-badge ${r.room_type === 'LAB' ? 'pill-lab' : 'pill-room'}`}>
                      {r.room_type}
                    </span>
                  </td>
                  <td>{r.capacity} seats</td>
                  <td>{r.is_available ? '✅ Available' : '❌ In Maintenance'}</td>
                  {canEdit && (
                    <td>
                      <button className="btn-danger-outline" onClick={() => handleDelete(r.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 9. FACULTY-SUBJECT ASSIGNMENTS VIEW
function FacultySubjectsView({ data, reload, canEdit }) {
  const [facultyId, setFacultyId] = useState(data.faculty[0]?.id || '');
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id || '');

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/faculty-subjects', { facultyId, subjectId });
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning faculty');
    }
  };

  const handleUnassign = async (fId, sId) => {
    if (!confirm('Unassign this faculty member from this subject?')) return;
    try {
      await api.delete(`/faculty-subjects/${fId}/${sId}`);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing assignment');
    }
  };

  return (
    <div className="two-col-layout">
      {canEdit && (
        <div className="panel">
          <div className="panel-header">
            <h2>Assign Faculty to Subject</h2>
          </div>
          <form onSubmit={handleAssign}>
            <div className="form-group">
              <label>Select Faculty Member</label>
              <select
                className="form-select"
                value={facultyId}
                onChange={e => setFacultyId(e.target.value)}
              >
                {data.faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Subject</label>
              <select
                className="form-select"
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
              >
                {data.subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name} ({s.department})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Link Faculty to Subject
            </button>
          </form>
        </div>
      )}

      <div className="panel" style={{ gridColumn: canEdit ? 'span 1' : 'span 2' }}>
        <div className="panel-header">
          <h2>Active Faculty Assignments ({data.facultySubjects.length})</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Faculty</th>
                <th>Designation</th>
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {data.facultySubjects.map((fs, idx) => (
                <tr key={`${fs.faculty_id}-${fs.subject_id}-${idx}`}>
                  <td><b>{fs.department}</b></td>
                  <td><b>{fs.subject_code}</b></td>
                  <td>{fs.subject_name}</td>
                  <td>{fs.faculty_name}</td>
                  <td>{fs.designation}</td>
                  {canEdit && (
                    <td>
                      <button
                        className="btn-danger-outline"
                        onClick={() => handleUnassign(fs.faculty_id, fs.subject_id)}
                      >
                        Unassign
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 10. DAY x PERIOD TIMETABLE MATRIX VIEW (THE HERO DEMO SCREEN)
function TimetableView({ data, conflicts, onGenerate, canEdit }) {
  const sectionMatchesEntry = (section, entry) =>
    (String(entry.section_id) === String(section.id) || entry.section_name === section.section_name) &&
    (!entry.department || entry.department === section.department) &&
    (!entry.year_name || entry.year_name === section.year_name);

  // The timetable API returns section names; support IDs too for compatible deployments.
  const scheduledSections = data.sections.filter(section =>
    data.tt.some(entry => sectionMatchesEntry(section, entry))
  );
  const scheduledSectionIds = scheduledSections.map(section => section.id);
  const defaultSec = scheduledSections[0]?.id
    ? String(scheduledSections[0].id)
    : (data.sections[0]?.id ? String(data.sections[0].id) : '');

  const [selectedSectionId, setSelectedSectionId] = useState(defaultSec);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');

  useEffect(() => {
    if (!selectedSectionId && data.sections.length > 0) {
      setSelectedSectionId(String(data.sections[0].id));
    }
  }, [data.sections]);

  // Filter sections by department if requested
  const visibleSections = data.sections.filter(
    s => selectedDepartment === 'ALL' || s.department === selectedDepartment
  );

  const selectedSectionObj = data.sections.find(s => String(s.id) === String(selectedSectionId));
  // Filter entries using either the identifiers or names supplied by the API.
  const sectionEntries = data.tt.filter(t =>
    selectedSectionObj
      ? sectionMatchesEntry(selectedSectionObj, t)
      : String(t.section_id) === String(selectedSectionId)
  );

  // Time slots in order
  const orderedSlots = [...data.slots].sort((a, b) =>
    String(a.start_time).localeCompare(String(b.start_time)) || a.id - b.id
  );
  const workingDays = [...data.days].filter(d => d.is_working);

  return (
    <div>
      {/* Conflicts Banner if any */}
      {conflicts.length > 0 && (
        <div className="conflict-alert-box">
          <h4>⚠️ Scheduler Conflict Warnings:</h4>
          <ul>
            {conflicts.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="timetable-filter-bar">
        <div className="filter-group">
          <label>Department:</label>
          <select
            value={selectedDepartment}
            onChange={e => {
              setSelectedDepartment(e.target.value);
              const firstSec = data.sections.find(
                s => e.target.value === 'ALL' || s.department === e.target.value
              );
              if (firstSec) setSelectedSectionId(String(firstSec.id));
            }}
          >
            <option value="ALL">All Departments</option>
            {data.departments.map(d => (
              <option key={d.id} value={d.code}>{d.code}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Select Section:</label>
          <select
            value={selectedSectionId}
            onChange={e => setSelectedSectionId(e.target.value)}
          >
            {visibleSections.map(s => {
              const hasEntries = scheduledSectionIds.includes(s.id);
              return (
                <option key={s.id} value={s.id}>
                  {s.section_name} ({s.department} · {s.year_name}) {hasEntries ? '✓' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            style={{ background: '#475569', padding: '8px 14px' }}
            onClick={() => window.print()}
          >
            🖨️ Print / PDF
          </button>
          {canEdit && (
            <button
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '8px 14px' }}
              onClick={onGenerate}
            >
              ⚡ Re-generate
            </button>
          )}
        </div>
      </div>

      {/* Selected Section Header */}
      {selectedSectionObj && (
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px' }}>
            {selectedSectionObj.section_name} — {selectedSectionObj.department} ({selectedSectionObj.year_name} Year)
          </h3>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Class Strength: <b>{selectedSectionObj.strength}</b> Students · Scheduled Periods: <b>{sectionEntries.length}</b>
          </span>
        </div>
      )}

      {/* Mobile-friendly schedule cards */}
      {sectionEntries.length > 0 && (
        <div className="timetable-mobile-list">
          {workingDays.map(day => {
            const dayItems = orderedSlots.flatMap(slot => {
              if (slot.slot_type !== 'PERIOD') return [{ slot, entry: null }];
              const entry = sectionEntries.find(item =>
                (String(item.working_day_id) === String(day.id) || item.day_name === day.day_name) &&
                (String(item.time_slot_id) === String(slot.id) || item.slot_name === slot.slot_name)
              );
              return [{ slot, entry }];
            });

            return (
              <section className="timetable-day-card" key={day.id}>
                <div className="timetable-day-heading">
                  <h3>{day.day_name}</h3>
                  <span>{dayItems.filter(item => item.entry).length} {dayItems.filter(item => item.entry).length === 1 ? 'class' : 'classes'}</span>
                </div>
                <div className="timetable-mobile-periods">
                  {dayItems.map(({ slot, entry }) => slot.slot_type !== 'PERIOD' ? (
                    <article className={`timetable-mobile-break ${slot.slot_type === 'LUNCH' ? 'is-lunch' : ''}`} key={slot.id}>
                      <strong>{slot.slot_name}</strong>
                      <span>{formatTimeRange(slot)}</span>
                    </article>
                  ) : entry ? (
                    <article className={`timetable-mobile-period ${entry.is_lab ? 'is-lab' : ''}`} key={`${slot.slot_name}-${entry.id}`}>
                      <div className="mobile-period-time">
                        <strong>{slot.slot_name}</strong>
                        <span>{formatTimeRange(slot)}</span>
                      </div>
                      <div className="mobile-period-details">
                        <strong>{entry.subject_code || entry.subject_name}</strong>
                        {entry.subject_code && <span>{entry.subject_name}</span>}
                        <small>👨‍🏫 {entry.faculty || 'Faculty TBA'}</small>
                      </div>
                      <span className="mobile-period-room">{entry.room_code || 'Room TBA'}</span>
                    </article>
                  ) : (
                    <article className="timetable-mobile-period is-empty" key={slot.id}>
                      <div className="mobile-period-time">
                        <strong>{slot.slot_name}</strong>
                        <span>{formatTimeRange(slot)}</span>
                      </div>
                      <div className="mobile-period-details">
                        <strong>Free period</strong>
                        <span>No class scheduled</span>
                      </div>
                      <span className="mobile-period-room" aria-hidden="true">—</span>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* DAY x PERIOD GRID TABLE */}
      {sectionEntries.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>📅</div>
          <h3>No timetable entries generated yet for this section</h3>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>
            {canEdit
              ? 'Click the "⚡ Generate Timetable" button to run the intelligent scheduler.'
              : 'The timetable has not been generated by the administrator yet.'}
          </p>
          {canEdit && (
            <button
              className="btn-primary"
              style={{ marginTop: '16px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
              onClick={onGenerate}
            >
              ⚡ Generate Timetable Now
            </button>
          )}
        </div>
      ) : (
        <div className="timetable-grid-container">
          <table className="timetable-grid">
            <thead>
              <tr>
                <th className="day-header-cell">DAY / TIME</th>
                {orderedSlots.map(slot => (
                  <th key={slot.id}>
                    <div>{slot.slot_name}</div>
                    <span className="slot-time">
                      {formatTimeRange(slot)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workingDays.map(day => (
                <tr key={day.id}>
                  <td className="day-header-cell">{day.day_name}</td>
                  {orderedSlots.map(slot => {
                    if (slot.slot_type === 'BREAK') {
                      return (
                        <td key={slot.id} className="break-cell">
                          BREAK
                        </td>
                      );
                    }
                    if (slot.slot_type === 'LUNCH') {
                      return (
                        <td key={slot.id} className="lunch-cell">
                          LUNCH
                        </td>
                      );
                    }

                    // Find if there is an entry for this day and slot
                    const entry = sectionEntries.find(e =>
                      (String(e.working_day_id) === String(day.id) || e.day_name === day.day_name) &&
                      (String(e.time_slot_id) === String(slot.id) || e.slot_name === slot.slot_name)
                    );

                    if (!entry) {
                      return (
                        <td key={slot.id} className="period-cell empty">
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        </td>
                      );
                    }

                    return (
                      <td key={slot.id} className="period-cell">
                        <div className={`period-card ${entry.is_lab ? 'card-practical' : ''}`}>
                          <div>
                            <div className="card-subject-code">{entry.subject_code}</div>
                            <div className="card-subject-name" title={entry.subject_name}>
                              {entry.subject_name}
                            </div>
                          </div>
                          <div className="card-meta">
                            <span className="card-faculty" title={entry.faculty}>
                              {entry.faculty}
                            </span>
                            <span className="card-room-pill">{entry.room_code}</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Render React App to DOM
createRoot(document.getElementById('root')).render(<App />);
