import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './styles.css';
import { AppIcon } from './icons.jsx';
import { AidsTimetableView } from './AidsTimetableView.jsx';

const API_PORT = import.meta.env.VITE_API_PORT || '5000';
const API_BASE_KEY = 'timetable_api_base';
const LAST_API_KEY = 'timetable_last_api';
const DATA_CACHE_KEY = 'timetable_cached_data';

const stripSlash = value => value.replace(/\/+$/, '');

// The Android WebView reports its own hostname as "localhost", so the API host
// can never be derived from window.location on a phone. Resolution order:
// 1) address saved in the app (localStorage) -> survives IP changes without a rebuild
// 2) the page was served by the backend itself -> same origin, no host needed
// 3) VITE_API_BASE_URL baked in at build time
// 4) VITE_LAN_IP baked in at build time
// 5) the host the page was opened with (works for desktop/browser use)
function configuredApiBase() {
  const saved = (localStorage.getItem(API_BASE_KEY) || '').trim();
  if (saved) return stripSlash(saved);

  // Loaded from http://<host>:5000 -> the API lives on the same origin.
  if (window.location.port === API_PORT) return '/api';

  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) return stripSlash(configured);

  const lanIp = (import.meta.env.VITE_LAN_IP || '').trim();
  if (lanIp) return `http://${lanIp}:${API_PORT}/api`;

  return `http://${window.location.hostname || 'localhost'}:${API_PORT}/api`;
}

// Best guess right now; replaced by discoverApiBase() once we know what answers.
let activeApiBase = configuredApiBase();

function resolveApiBase() {
  return activeApiBase;
}

// Every address we are willing to try, best guess first.
function candidateApiBases() {
  const list = [];
  const push = value => {
    const trimmed = (value || '').trim();
    if (trimmed && !list.includes(stripSlash(trimmed))) list.push(stripSlash(trimmed));
  };

  push(localStorage.getItem(API_BASE_KEY));
  push(localStorage.getItem(LAST_API_KEY));
  if (window.location.port === API_PORT) push('/api');
  push(import.meta.env.VITE_API_BASE_URL);
  if ((import.meta.env.VITE_LAN_IP || '').trim()) {
    push(`http://${import.meta.env.VITE_LAN_IP.trim()}:${API_PORT}/api`);
  }
  push(`http://${window.location.hostname || 'localhost'}:${API_PORT}/api`);

  return list;
}

// The PC's Wi-Fi IP changes (DHCP / hotspot reconnect), so probe the known
// addresses and use the first one that answers /api/health.
async function discoverApiBase() {
  for (const candidate of candidateApiBases()) {
    // Same origin - always reachable, no need to probe.
    if (candidate.startsWith('/')) {
      activeApiBase = candidate;
      api.defaults.baseURL = candidate;
      return candidate;
    }

    const healthUrl = candidate.endsWith('/api') ? `${candidate}/health` : `${candidate}/api/health`;
    try {
      await axios.get(healthUrl, { timeout: 1500 });
      activeApiBase = candidate;
      api.defaults.baseURL = candidate;
      localStorage.setItem(LAST_API_KEY, candidate);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  // Nothing answered - keep the current guess so the app can still try.
  return null;
}

const api = axios.create({ baseURL: activeApiBase, timeout: 5000 });

// Read the last successfully loaded copy of the data (used when offline).
function readCachedData() {
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.tt) ? parsed : null;
  } catch {
    return null;
  }
}

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

// 1. LANDING PAGE + LOGIN
const MOCK_WEEK = [
  { day: 'Mon', classes: ['HVE', 'ITA', 'HRM', 'RET', 'PP'] },
  { day: 'Tue', classes: ['ITA', 'HRM', 'RET', 'HVE', 'PP'] },
  { day: 'Wed', classes: ['HRM', 'RET', 'HVE', 'ITA', 'PLACE'] },
  { day: 'Thu', classes: ['RET', 'HVE', 'ITA', 'HRM', 'PP'] },
  { day: 'Fri', classes: ['ITA', 'HRM', 'RET', 'HVE', 'VAC'] }
];

function BrandMark({ small = false }) {
  return (
    <span className={small ? 'landing-brand-mark' : 'landing-brand-mark'} aria-hidden="true">
      <img src="/info_institute_logo.jpg" alt="" loading="lazy" />
    </span>
  );
}

function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <span className="ambient-glow ambient-glow-1" />
      <span className="ambient-glow ambient-glow-2" />
      <span className="ambient-glow ambient-glow-3" />
      <span className="ambient-line ambient-line-1" />
      <span className="ambient-line ambient-line-2" />
      <span className="ambient-line ambient-line-3" />
      <span className="sphere sphere-a" />
      <span className="sphere sphere-b" />
      <span className="sphere sphere-c" />
      <span className="sphere sphere-d" />
      <span className="sphere sphere-e" />
      <span className="sphere sphere-f" />
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="hero-visual">
      <span className="hero-aura" aria-hidden="true" />
      <span className="sphere hero-sphere-lg" aria-hidden="true" />
      <span className="sphere hero-sphere-sm" aria-hidden="true" />
      <div className="mock-parallax">
        <div className="product-mockup" role="img" aria-label="Preview of the intelligent timetable dashboard with a conflict-free weekly schedule">
          <div className="mock-window">
            <div className="mock-chrome" aria-hidden="true">
              <span className="mock-dots"><i /><i /><i /></span>
              <span className="mock-address">info-timetable / dashboard</span>
              <span className="mock-live"><span />Generated</span>
            </div>
            <div className="mock-body">
              <aside className="mock-sidebar" aria-hidden="true">
                <div className="mock-brand">
                  <span className="mock-brand-mark">II</span>
                  <span>Info Timetable</span>
                </div>
                <div className="mock-nav">
                  {['Dashboard', 'Timetable', 'Faculty', 'Rooms', 'Settings'].map((item, index) => (
                    <span key={item} className={index === 0 ? 'is-active' : ''}>
                      <i />
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mock-sidebar-note">
                  <span>AI&amp;DS · Semester VII</span>
                  <strong>Classroom B 316</strong>
                </div>
              </aside>
              <div className="mock-main">
                <div className="mock-head">
                  <div>
                    <span className="mock-eyebrow">Semester overview</span>
                    <strong>Academic week</strong>
                  </div>
                  <span className="mock-chip">2026–27</span>
                </div>
                <div className="mock-metrics">
                  <div><span>Periods</span><strong>48</strong></div>
                  <div><span>Faculty</span><strong>12</strong></div>
                  <div><span>Conflicts</span><strong className="mock-good">0</strong></div>
                </div>
                <div className="mock-schedule">
                  <div className="mock-schedule-head">
                    <span />
                    {['P1', 'P2', 'P3', 'P4', 'P5'].map(period => <span key={period}>{period}</span>)}
                  </div>
                  {MOCK_WEEK.map(row => (
                    <div className="mock-row" key={row.day}>
                      <span className="mock-day">{row.day}</span>
                      {row.classes.map((subject, index) => (
                        <span className={`mock-slot tone-${(index + row.day.length) % 5}`} key={`${row.day}-${index}`}>
                          {subject}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mock-foot">
                  <span><i />Conflict-aware generation</span>
                  <span>Auto-balanced</span>
                </div>
              </div>
            </div>
          </div>
          <div className="float-chip float-chip-top">
            <span className="chip-icon" aria-hidden="true">✦</span>
            <span><strong>AI scheduler</strong><small>All constraints satisfied</small></span>
          </div>
          <div className="float-chip float-chip-bottom">
            <span className="chip-icon" aria-hidden="true">✓</span>
            <span><strong>Zero conflicts</strong><small>Section · faculty · room</small></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('ADMIN'); // 'ADMIN' | 'STAFF' | 'STUDENT'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('AI&DS@college.com');
  const [password, setPassword] = useState('AI&DS123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showServer, setShowServer] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => resolveApiBase());
  const [serverSaved, setServerSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Registration state for Staff and Student
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDeptId, setRegDeptId] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regSectionId, setRegSectionId] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Load public departments for registration dropdown
  useEffect(() => {
    api.get('/public/departments')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length) {
          setDepartmentsList(res.data);
          if (!regDeptId) {
            setRegDeptId(String(res.data[0].id));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Load sections when department changes in registration
  useEffect(() => {
    if (regDeptId) {
      api.get(`/public/sections/${regDeptId}`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setSectionsList(res.data);
            if (res.data.length) {
              setRegSectionId(String(res.data[0].id));
            } else {
              setRegSectionId('');
            }
          }
        })
        .catch(() => setSectionsList([]));
    }
  }, [regDeptId]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    setRegSuccess('');
    // Public registration is only available for Staff and Student
    if (role === 'ADMIN') {
      setAuthMode('login');
      setEmail('AI&DS@college.com');
      setPassword('AI&DS123');
    } else if (role === 'STAFF') {
      setEmail('staff@college.com');
      setPassword('staff123');
    } else if (role === 'STUDENT') {
      setEmail('student@college.com');
      setPassword('student123');
    }
  };

  const saveServer = () => {
    const value = serverUrl.trim().replace(/\/+$/, '');
    if (!value) {
      localStorage.removeItem(API_BASE_KEY);
    } else {
      localStorage.setItem(API_BASE_KEY, value);
    }
    activeApiBase = configuredApiBase();
    api.defaults.baseURL = activeApiBase;
    setServerUrl(activeApiBase);
    setServerSaved(true);
    setError('');
    setTimeout(() => setServerSaved(false), 2500);
  };

  // Probe the saved address, then every other known address.
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const found = await discoverApiBase();
    setTestResult(
      found
        ? { ok: true, text: `Connected to ${found}` }
        : { ok: false, text: 'No backend answered. Check the PC is running run.bat and the IP is correct.' }
    );
    setServerUrl(activeApiBase);
    setTesting(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRegSuccess('');

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
        role: selectedRole
      });

      // Strict client-side validation against server-returned role
      if (res.data.user.role.toUpperCase() !== selectedRole.toUpperCase()) {
        setError(`Access denied: This account has ${res.data.user.role} privileges, not ${selectedRole} privileges.`);
        return;
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');

    if (!regName.trim() || !regEmail.trim() || !regPassword || !regConfirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setError('Please enter a valid college email address.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!regDeptId) {
      setError('Please select your department.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
        role: selectedRole,
        departmentId: Number(regDeptId),
        identifier: regIdentifier.trim() || null,
        sectionId: selectedRole === 'STUDENT' && regSectionId ? Number(regSectionId) : null
      });

      setRegSuccess(res.data.message || 'Registration completed successfully! Please sign in with your email and password.');
      setEmail(regEmail.trim());
      setPassword('');
      setAuthMode('login');
      setRegName('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegIdentifier('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="login-page login-page-standalone" id="top">
      <AmbientBackground />
      <main className="login-main-viewport">
        <section className="signin-section" id="signin" aria-labelledby="signin-title">
          <div className="signin-copy is-visible">
            <span className="section-eyebrow">Secure access</span>
            <h2>
              Your timetable<br />
              <span className="heading-gradient">command center.</span>
            </h2>
            <p>
              Sign in to generate the master schedule, manage sections, subjects, faculty and
              spaces, or open the official departmental timetable.
            </p>
            <div className="module-chips">
              {['Dashboard', 'Timetable', 'Departments', 'Sections', 'Subjects', 'Faculty', 'Rooms & Labs', 'Faculty Links'].map(module => (
                <span className="module-chip" key={module}>{module}</span>
              ))}
            </div>
            <div className="signin-proof">
              <span className="proof-icon" aria-hidden="true">✓</span>
              <div>
                <strong>Role-based, session-protected access</strong>
                <span>Select Admin, Staff, or Student to access your workspace.</span>
              </div>
            </div>
          </div>

          <div className="login-card is-visible" role="region" aria-labelledby="signin-title">
            <div className="login-brand">
              <div className="login-brand-icon">
                <img src="/info_institute_logo.jpg" alt="Info Institute of Engineering logo" loading="lazy" />
              </div>
              <div>
                <h2 id="signin-title">
                  {authMode === 'register'
                    ? `Register New ${selectedRole === 'STAFF' ? 'Faculty Member' : 'Student'}`
                    : 'Sign in to your workspace'}
                </h2>
                <p>Intelligent Timetable &amp; Scheduling System</p>
              </div>
            </div>

            {/* THREE ROLE OPTIONS: Admin Login, Staff Login, Student Login */}
            <div className="login-role-selector" role="tablist" aria-label="Login Options">
              <button
                type="button"
                role="tab"
                id="tab-admin"
                aria-selected={selectedRole === 'ADMIN'}
                className={`btn-role-tab ${selectedRole === 'ADMIN' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('ADMIN')}
              >
                👑 Admin Login
              </button>
              <button
                type="button"
                role="tab"
                id="tab-staff"
                aria-selected={selectedRole === 'STAFF'}
                className={`btn-role-tab ${selectedRole === 'STAFF' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('STAFF')}
              >
                👨‍🏫 Staff {authMode === 'register' && selectedRole === 'STAFF' ? 'Register' : 'Login'}
              </button>
              <button
                type="button"
                role="tab"
                id="tab-student"
                aria-selected={selectedRole === 'STUDENT'}
                className={`btn-role-tab ${selectedRole === 'STUDENT' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('STUDENT')}
              >
                🎓 Student {authMode === 'register' && selectedRole === 'STUDENT' ? 'Register' : 'Login'}
              </button>
            </div>

            {/* Registration vs Login mode switch for Staff and Student */}
            {selectedRole !== 'ADMIN' && (
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '14px',
                background: 'rgba(255,255,255,0.04)',
                padding: '4px',
                borderRadius: '10px'
              }}>
                <button
                  type="button"
                  className={`btn-role-tab ${authMode === 'login' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '7px 12px', fontSize: '13px' }}
                  onClick={() => { setAuthMode('login'); setError(''); }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`btn-role-tab ${authMode === 'register' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '7px 12px', fontSize: '13px' }}
                  onClick={() => { setAuthMode('register'); setError(''); setRegSuccess(''); }}
                >
                  Register as {selectedRole === 'STAFF' ? 'Staff' : 'Student'}
                </button>
              </div>
            )}

            <div className="role-context-hint" role="status">
              {selectedRole === 'ADMIN' && (
                <span>Admin portal: Sign in with your approved department administrator credentials.</span>
              )}
              {selectedRole === 'STAFF' && authMode === 'login' && (
                <span>Staff portal: Sign in with your registered faculty credentials.</span>
              )}
              {selectedRole === 'STAFF' && authMode === 'register' && (
                <span>Staff registration: Create your faculty account to access schedules.</span>
              )}
              {selectedRole === 'STUDENT' && authMode === 'login' && (
                <span>Student portal: Sign in with your registered student credentials.</span>
              )}
              {selectedRole === 'STUDENT' && authMode === 'register' && (
                <span>Student registration: Create your student account to access class schedules.</span>
              )}
            </div>

            {regSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#6ee7b7',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: '1.4'
              }} role="status">
                ✓ {regSuccess}
              </div>
            )}

            {authMode === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} aria-busy={loading}>
                <div className="form-group">
                  <label htmlFor="login-email">
                    {selectedRole === 'ADMIN' ? 'Admin Email Address' : selectedRole === 'STAFF' ? 'Staff Email Address' : 'Student Email Address'}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'ADMIN'
                        ? 'e.g. AI&DS@college.com, cse@college.com'
                        : selectedRole === 'STAFF'
                        ? 'e.g. staff@college.com'
                        : 'e.g. student@college.com'
                    }
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? (
                    <><span className="btn-spinner" aria-hidden="true" />Authenticating…</>
                  ) : (
                    selectedRole === 'ADMIN'
                      ? 'Sign in as Admin'
                      : selectedRole === 'STAFF'
                      ? 'Sign in as Staff'
                      : 'Sign in as Student'
                  )}
                </button>

                {error && <div className="login-error" role="alert">{error}</div>}

                {selectedRole !== 'ADMIN' && (
                  <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: '#94a3b8' }}>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                      onClick={() => { setAuthMode('register'); setError(''); }}
                    >
                      Register as {selectedRole === 'STAFF' ? 'Staff' : 'Student'}
                    </button>
                  </div>
                )}
              </form>
            ) : (
              /* REGISTRATION FORM (STAFF & STUDENT) */
              <form onSubmit={handleRegister} aria-busy={regLoading}>
                <div className="form-group">
                  <label htmlFor="reg-name">Full Name *</label>
                  <input
                    id="reg-name"
                    type="text"
                    className="form-input"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reg-email">College Email Address *</label>
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="e.g. name@college.com"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label htmlFor="reg-password">Password *</label>
                    <input
                      id="reg-password"
                      type="password"
                      className="form-input"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-confirm-password">Confirm Password *</label>
                    <input
                      id="reg-confirm-password"
                      type="password"
                      className="form-input"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-department">Department *</label>
                  <select
                    id="reg-department"
                    className="form-input"
                    value={regDeptId}
                    onChange={e => setRegDeptId(e.target.value)}
                    required
                    style={{ background: 'rgba(15, 12, 34, 0.9)', color: '#fff' }}
                  >
                    {departmentsList.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole === 'STAFF' ? (
                  <div className="form-group">
                    <label htmlFor="reg-identifier">Staff Designation / ID (Optional)</label>
                    <input
                      id="reg-identifier"
                      type="text"
                      className="form-input"
                      value={regIdentifier}
                      onChange={e => setRegIdentifier(e.target.value)}
                      placeholder="e.g. Assistant Professor or Staff ID"
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label htmlFor="reg-identifier">Student Register Number / ID (Optional)</label>
                      <input
                        id="reg-identifier"
                        type="text"
                        className="form-input"
                        value={regIdentifier}
                        onChange={e => setRegIdentifier(e.target.value)}
                        placeholder="e.g. 711521104001"
                      />
                    </div>
                    {sectionsList.length > 0 && (
                      <div className="form-group">
                        <label htmlFor="reg-section">Class / Section</label>
                        <select
                          id="reg-section"
                          className="form-input"
                          value={regSectionId}
                          onChange={e => setRegSectionId(e.target.value)}
                          style={{ background: 'rgba(15, 12, 34, 0.9)', color: '#fff' }}
                        >
                          {sectionsList.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.section_name} ({s.year_name} Year)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <button type="submit" className="login-submit-btn" disabled={regLoading}>
                  {regLoading ? (
                    <><span className="btn-spinner" aria-hidden="true" />Registering Account…</>
                  ) : (
                    `Complete ${selectedRole === 'STAFF' ? 'Staff' : 'Student'} Registration`
                  )}
                </button>

                {error && <div className="login-error" role="alert">{error}</div>}

                <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: '#94a3b8' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                    onClick={() => { setAuthMode('login'); setError(''); }}
                  >
                    Sign in here
                  </button>
                </div>
              </form>
            )}

            <div className="login-trust" aria-hidden="true">
              <span>🔒 Session protected</span>
              <span>↻ Offline-ready</span>
            </div>

            <div className="server-settings">
              <button
                type="button"
                className="server-toggle"
                aria-expanded={showServer}
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
                    <button type="button" className="btn-demo-role" onClick={testConnection} disabled={testing}>
                      {testing ? 'Testing…' : 'Test'}
                    </button>
                    <button
                      type="button"
                      className="btn-demo-role"
                      onClick={() => {
                        localStorage.removeItem(API_BASE_KEY);
                        localStorage.removeItem(LAST_API_KEY);
                        activeApiBase = configuredApiBase();
                        api.defaults.baseURL = activeApiBase;
                        setServerUrl(activeApiBase);
                        setServerSaved(false);
                        setTestResult(null);
                      }}
                    >
                      Reset
                    </button>
                    {serverSaved && <span className="server-saved">Saved</span>}
                  </div>
                  {testResult && (
                    <p className={`server-hint ${testResult.ok ? 'server-test-ok' : 'server-test-fail'}`}>
                      {testResult.text}
                    </p>
                  )}
                  <p className="server-hint">
                    Use your PC&apos;s Wi-Fi IP address (not localhost). The app also probes the known
                    addresses automatically, so a changed IP is usually picked up on its own.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Route mappings and role dashboard helpers
const ROUTE_PAGE_MAP = {
  '/dashboard': 'Dashboard',
  '/timetable': 'Timetable',
  '/departments': 'Departments',
  '/sections': 'Sections',
  '/subjects': 'Subjects',
  '/faculty': 'Faculty',
  '/rooms': 'Rooms & Labs',
  '/rooms-labs': 'Rooms & Labs',
  '/faculty-links': 'Faculty Links',
  '/settings': 'Settings'
};

const PAGE_ROUTE_MAP = {
  'Dashboard': '/dashboard',
  'Timetable': '/timetable',
  'AI&DS Timetable': '/timetable',
  'Departments': '/departments',
  'Sections': '/sections',
  'Subjects': '/subjects',
  'Faculty': '/faculty',
  'Rooms & Labs': '/rooms',
  'Faculty Links': '/faculty-links',
  'Settings': '/settings'
};

function getDashboardForRole(role) {
  if (role === 'STUDENT') return 'Timetable';
  return 'Dashboard';
}

function getDashboardRouteForRole(role) {
  if (role === 'STUDENT') return '/timetable';
  return '/dashboard';
}

function normalizePath(pathname = window.location.pathname) {
  if (!pathname || pathname === '/' || pathname === '/index.html' || pathname === '/login') {
    return '/';
  }
  return pathname.replace(/\/+$/, '');
}

// 2. MAIN APPLICATION COMPONENT
function App() {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      return null;
    }
    return null;
  });

  const [checkingSession, setCheckingSession] = useState(() => {
    // If no token exists, there is no session to wait for: show Login immediately
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    return Boolean(token && savedUser);
  });

  const [page, setPage] = useState(() => {
    const path = normalizePath();
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    let currentUser = null;
    try {
      if (token && savedUser) currentUser = JSON.parse(savedUser);
    } catch {
      currentUser = null;
    }

    if (!currentUser) {
      return 'Login';
    }

    if (path === '/') {
      return getDashboardForRole(currentUser.role);
    }

    return ROUTE_PAGE_MAP[path] || getDashboardForRole(currentUser.role);
  });

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
  const [offline, setOffline] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Drawer behaviour: lock background scroll, close on Escape.
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const handleKeyDown = event => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Each page starts at the top, and navigating closes the drawer.
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page]);

  // Browser Back / Forward button navigation support
  useEffect(() => {
    const handlePopState = () => {
      const path = normalizePath();
      if (!user) {
        if (path !== '/') {
          window.history.replaceState({}, '', '/');
        }
        setPage('Login');
        return;
      }

      if (path === '/') {
        const defaultPage = getDashboardForRole(user.role);
        const defaultRoute = getDashboardRouteForRole(user.role);
        window.history.replaceState({}, '', defaultRoute);
        setPage(defaultPage);
        return;
      }

      const matchedPage = ROUTE_PAGE_MAP[path];
      if (matchedPage) {
        setPage(matchedPage);
      } else {
        const fallbackPage = getDashboardForRole(user.role);
        const fallbackRoute = getDashboardRouteForRole(user.role);
        window.history.replaceState({}, '', fallbackRoute);
        setPage(fallbackPage);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // URL route synchronization and access protection
  useEffect(() => {
    if (checkingSession) return;

    const path = normalizePath();

    if (!user) {
      // Unauthenticated: visiting any protected page redirects to '/'
      if (path !== '/') {
        window.history.replaceState({}, '', '/');
      }
      setPage('Login');
    } else {
      // Authenticated: visiting '/' redirects to appropriate dashboard based on role
      if (path === '/') {
        const targetPage = getDashboardForRole(user.role);
        const targetRoute = getDashboardRouteForRole(user.role);
        window.history.replaceState({}, '', targetRoute);
        setPage(targetPage);
      } else {
        const matchedPage = ROUTE_PAGE_MAP[path];
        if (matchedPage) {
          setPage(matchedPage);
        } else {
          const targetPage = getDashboardForRole(user.role);
          const targetRoute = getDashboardRouteForRole(user.role);
          window.history.replaceState({}, '', targetRoute);
          setPage(targetPage);
        }
      }
    }
  }, [user, checkingSession]);

  const navigate = name => {
    const targetRoute = PAGE_ROUTE_MAP[name] || '/dashboard';
    if (window.location.pathname !== targetRoute) {
      window.history.pushState({}, '', targetRoute);
    }
    setPage(name);
    setNotification(null);
    setMobileMenuOpen(false);
  };

  // Only restore a saved user after the backend confirms the stored token.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      setUser(null);
      setCheckingSession(false);
      return;
    }

    let active = true;

    // Hard safety timeout: never block the user on "Checking session..." for more than 2.5s
    const safetyTimer = setTimeout(() => {
      if (active) {
        setCheckingSession(false);
      }
    }, 2500);

    const validateSession = async () => {
      try {
        await Promise.race([
          discoverApiBase(),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);

        try {
          JSON.parse(savedUser);
          const response = await api.get('/auth/me');
          if (active) setUser(response.data.user);
        } catch (err) {
          if (err.response && err.response.status === 401) {
            // The server answered but rejected us - session expired/invalid.
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (active) {
              setUser(null);
              window.history.replaceState({}, '', '/');
            }
          } else {
            // No answer or network glitch - keep saved session for offline capability
            try {
              if (active) setUser(JSON.parse(savedUser));
            } catch {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              if (active) setUser(null);
            }
          }
        }
      } finally {
        clearTimeout(safetyTimer);
        if (active) setCheckingSession(false);
      }
    };

    validateSession();
    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Fetch all master data when user logs in or page changes
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, page]);

  const loadData = async () => {
    try {
      const [depts, yrs, sects, subs, facs, rms, dys, slts, tt, facSubs] = await Promise.all([
        api.get('/departments'),
        api.get('/years'),
        api.get('/sections'),
        api.get('/subjects'),
        api.get('/faculty'),
        api.get('/rooms'),
        api.get('/working-days'),
        api.get('/time-slots'),
        api.get('/timetable'),
        api.get('/faculty-subjects').catch(() => ({ data: [] }))
      ]);

      const timetableEntries = Array.isArray(tt.data) ? tt.data : [];

      const fresh = {
        departments: depts.data,
        years: yrs.data,
        sections: sects.data,
        subjects: subs.data,
        faculty: facs.data,
        rooms: rms.data,
        facultySubjects: Array.isArray(facSubs?.data) ? facSubs.data : [],
        days: dys.data,
        slots: slts.data,
        rules: [],
        tt: timetableEntries
      };

      setData(fresh);
      setOffline(false);
      // Keep the last good copy so the app still shows something if the
      // backend goes away.
      try {
        localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(fresh));
      } catch {
        // Storage full - not fatal, the cache is only a convenience.
      }
    } catch (err) {
      const cached = readCachedData();
      if (cached) {
        setData(cached);
        setOffline(true);
        setNotification({
          type: 'info',
          text: 'Standalone mode - displaying cached timetable data.'
        });
        return;
      }

      // Standalone Default Mock Data (zero backend required)
      const mockDefault = {
        departments: [
          { id: 1, code: 'AI&DS', name: 'Artificial Intelligence & Data Science' },
          { id: 2, code: 'CSE', name: 'Computer Science & Engineering' },
          { id: 3, code: 'ECE', name: 'Electronics & Communication Engineering' },
          { id: 4, code: 'EEE', name: 'Electrical & Electronics Engineering' },
          { id: 5, code: 'MECH', name: 'Mechanical Engineering' },
          { id: 6, code: 'IT', name: 'Information Technology' }
        ],
        years: [
          { id: 1, year_name: '1st Year' },
          { id: 2, year_name: '2nd Year' },
          { id: 3, year_name: '3rd Year' },
          { id: 4, year_name: '4th Year' }
        ],
        sections: [
          { id: 1, department_id: 1, department: 'AI&DS', academic_year_id: 4, year_name: '4th Year', section_name: 'AI&DS - VII', strength: 60 },
          { id: 2, department_id: 2, department: 'CSE', academic_year_id: 4, year_name: '4th Year', section_name: 'CSE - A', strength: 60 },
          { id: 3, department_id: 3, department: 'ECE', academic_year_id: 3, year_name: '3rd Year', section_name: 'ECE - A', strength: 55 }
        ],
        subjects: [
          { id: 1, department_id: 1, year_id: 4, code: 'AI8701', name: 'Human Values and Ethics', subject_type: 'THEORY', weekly_periods: 4, total_hours: 45, lab_periods: 0 },
          { id: 2, department_id: 1, year_id: 4, code: 'AI8702', name: 'IT in Agricultural System', subject_type: 'THEORY', weekly_periods: 4, total_hours: 45, lab_periods: 0 },
          { id: 3, department_id: 1, year_id: 4, code: 'AI8703', name: 'Human Resource Management', subject_type: 'THEORY', weekly_periods: 4, total_hours: 45, lab_periods: 0 },
          { id: 4, department_id: 1, year_id: 4, code: 'AI8704', name: 'Renewable Energy Technologies', subject_type: 'THEORY', weekly_periods: 4, total_hours: 45, lab_periods: 0 },
          { id: 5, department_id: 1, year_id: 4, code: 'AI8705', name: 'Placement Preparation', subject_type: 'THEORY', weekly_periods: 4, total_hours: 45, lab_periods: 0 },
          { id: 6, department_id: 1, year_id: 4, code: 'AI8711', name: 'AI & Analytics Laboratory', subject_type: 'PRACTICAL', weekly_periods: 4, total_hours: 60, lab_periods: 2 }
        ],
        faculty: [
          { id: 1, department_id: 1, department: 'AI&DS', name: 'Dr. Vinoth Kumar', email: 'vinoth@gmail.com', designation: 'Professor & Head', max_periods_per_day: 5 },
          { id: 2, department_id: 1, department: 'AI&DS', name: 'Dr. K. Priya', email: 'priya@college.com', designation: 'Associate Professor', max_periods_per_day: 6 },
          { id: 3, department_id: 1, department: 'AI&DS', name: 'Prof. M. Suresh', email: 'suresh@college.com', designation: 'Assistant Professor', max_periods_per_day: 6 }
        ],
        rooms: [
          { id: 1, department_id: 1, room_code: 'B 316', room_type: 'CLASSROOM', capacity: 70 },
          { id: 2, department_id: 1, room_code: 'LAB 103 (AI Lab)', room_type: 'LAB', capacity: 65 }
        ],
        facultySubjects: [
          { faculty_id: 1, subject_id: 1, faculty_name: 'Dr. Vinoth Kumar', subject_code: 'AI8701', subject_name: 'Human Values and Ethics', department: 'AI&DS' }
        ],
        days: [
          { id: 1, day_name: 'Monday', is_working: true },
          { id: 2, day_name: 'Tuesday', is_working: true },
          { id: 3, day_name: 'Wednesday', is_working: true },
          { id: 4, day_name: 'Thursday', is_working: true },
          { id: 5, day_name: 'Friday', is_working: true }
        ],
        slots: [
          { id: 1, slot_name: 'Period 1', start_time: '09:00:00', end_time: '09:50:00', slot_type: 'PERIOD', period_number: 1 },
          { id: 2, slot_name: 'Period 2', start_time: '09:50:00', end_time: '10:40:00', slot_type: 'PERIOD', period_number: 2 },
          { id: 3, slot_name: 'Morning Break', start_time: '10:40:00', end_time: '10:55:00', slot_type: 'BREAK', period_number: null },
          { id: 4, slot_name: 'Period 3', start_time: '10:55:00', end_time: '11:45:00', slot_type: 'PERIOD', period_number: 3 },
          { id: 5, slot_name: 'Period 4', start_time: '11:45:00', end_time: '12:35:00', slot_type: 'PERIOD', period_number: 4 },
          { id: 6, slot_name: 'Lunch Break', start_time: '12:35:00', end_time: '13:15:00', slot_type: 'LUNCH', period_number: null },
          { id: 7, slot_name: 'Period 5', start_time: '13:15:00', end_time: '14:05:00', slot_type: 'PERIOD', period_number: 5 },
          { id: 8, slot_name: 'Period 6', start_time: '14:05:00', end_time: '14:55:00', slot_type: 'PERIOD', period_number: 6 },
          { id: 9, slot_name: 'Evening Break', start_time: '14:55:00', end_time: '15:05:00', slot_type: 'BREAK', period_number: null },
          { id: 10, slot_name: 'Period 7', start_time: '15:05:00', end_time: '15:55:00', slot_type: 'PERIOD', period_number: 7 },
          { id: 11, slot_name: 'Period 8', start_time: '15:55:00', end_time: '16:45:00', slot_type: 'PERIOD', period_number: 8 }
        ],
        rules: [],
        tt: [
          { id: 1, section_id: 1, department: 'AI&DS', year_name: '4th Year', section_name: 'AI&DS - VII', subject_id: 1, subject_code: 'AI8701', subject_name: 'Human Values and Ethics', faculty: 'Dr. Vinoth Kumar', room_code: 'B 316', day_name: 'Monday', slot_name: 'Period 1', is_lab: false },
          { id: 2, section_id: 1, department: 'AI&DS', year_name: '4th Year', section_name: 'AI&DS - VII', subject_id: 2, subject_code: 'AI8702', subject_name: 'IT in Agricultural System', faculty: 'Dr. K. Priya', room_code: 'B 316', day_name: 'Monday', slot_name: 'Period 2', is_lab: false },
          { id: 3, section_id: 1, department: 'AI&DS', year_name: '4th Year', section_name: 'AI&DS - VII', subject_id: 3, subject_code: 'AI8703', subject_name: 'Human Resource Management', faculty: 'Prof. M. Suresh', room_code: 'B 316', day_name: 'Monday', slot_name: 'Period 3', is_lab: false },
          { id: 4, section_id: 1, department: 'AI&DS', year_name: '4th Year', section_name: 'AI&DS - VII', subject_id: 4, subject_code: 'AI8704', subject_name: 'Renewable Energy Technologies', faculty: 'Dr. Vinoth Kumar', room_code: 'B 316', day_name: 'Monday', slot_name: 'Period 4', is_lab: false },
          { id: 5, section_id: 1, department: 'AI&DS', year_name: '4th Year', section_name: 'AI&DS - VII', subject_id: 6, subject_code: 'AI8711', subject_name: 'AI & Analytics Laboratory', faculty: 'Dr. Vinoth Kumar', room_code: 'LAB 103', day_name: 'Monday', slot_name: 'Period 5', is_lab: true },
          { id: 6, section_id: 1, department: 'AI&DS', year_name: '4th Year', section_name: 'AI&DS - VII', subject_id: 6, subject_code: 'AI8711', subject_name: 'AI & Analytics Laboratory', faculty: 'Dr. Vinoth Kumar', room_code: 'LAB 103', day_name: 'Monday', slot_name: 'Period 6', is_lab: true }
        ]
      };

      setData(mockDefault);
      setOffline(true);
      setNotification({
        type: 'info',
        text: 'Standalone mode active — full UI and sample timetable loaded.'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.history.replaceState({}, '', '/');
    setPage('Login');
  };

  const handleLoginSuccess = loggedInUser => {
    setUser(loggedInUser);
    const targetPage = getDashboardForRole(loggedInUser.role);
    const targetRoute = getDashboardRouteForRole(loggedInUser.role);
    window.history.pushState({}, '', targetRoute);
    setPage(targetPage);
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
      navigate('Timetable');
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
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <span className="loader-orbit" aria-hidden="true" />
        <span>Checking your session…</span>
        <button
          type="button"
          onClick={() => setCheckingSession(false)}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '999px',
            color: '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Skip to sign in / server settings ›
        </button>
      </div>
    );
  }

  if (!user || page === 'Login') {
    return <Login onLogin={handleLoginSuccess} />;
  }

  const isStudent = user.role === 'STUDENT';
  const canEdit = !isStudent;

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard' },
    { name: 'Timetable', icon: 'timetable', badge: 'Official' },
    { name: 'Departments', icon: 'departments' },
    { name: 'Sections', icon: 'sections' },
    { name: 'Subjects', icon: 'subjects' },
    { name: 'Faculty', icon: 'faculty' },
    { name: 'Rooms & Labs', icon: 'rooms' },
    { name: 'Faculty Links', icon: 'facultyLinks' },
    { name: 'Settings', icon: 'settings' }
  ];

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <img src="/info_institute_logo.jpg" alt="Info Institute of Engineering logo" />
          </div>
          <div className="brand-info">
            <h2>Info Institute</h2>
            <span>of Engineering</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar" aria-hidden="true">{user.name ? user.name[0] : 'U'}</div>
          <div className="user-meta">
            <div className="user-name">{user.name}</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
              <span
                className={`user-role-badge ${user.role === 'ADMIN' ? 'role-admin' : user.role === 'STAFF' ? 'role-staff' : 'role-student'
                  }`}
              >
                {user.role}
              </span>
              {user.departmentCode && (
                <span className="badge-tag-official" style={{ fontSize: '10px', padding: '1px 5px' }}>
                  {user.departmentCode}
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map(item => (
            <button
              key={item.name}
              type="button"
              className={`nav-item ${page === item.name ? 'active' : ''}`}
              aria-current={page === item.name ? 'page' : undefined}
              onClick={() => navigate(item.name)}
            >
              <span className="nav-icon">
                <AppIcon name={item.icon} size={20} />
              </span>
              <span>{item.name}</span>
              {item.badge && <span className="badge-tag-official">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          {canEdit && (
            <button type="button" className="btn-generate" onClick={handleGenerate} disabled={generating}>
              {generating ? '⏳ Generating...' : '⚡ Generate Timetable'}
            </button>
          )}
          <button type="button" className="btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-heading-group">
            <button
              type="button"
              className="mobile-menu-btn"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="topbar-title">
              <h1>{page}</h1>
              <p>Info Institute of Engineering — Intelligent Timetable Scheduler</p>
            </div>
          </div>
          <div className="topbar-badges">
            {offline && (
              <span className="status-badge badge-offline">
                📴 OFFLINE - SAVED DATA
              </span>
            )}
            {isStudent ? (
              <span className="status-badge badge-view-only">
                🔒 VIEW-ONLY MODE (STUDENT)
              </span>
            ) : (
              <button
                type="button"
                className="status-badge badge-admin-mode"
                onClick={handleGenerate}
                disabled={generating}
                title="Click to generate timetable"
              >
                {generating ? '⏳ GENERATING...' : '✏️ EDIT & GENERATE ENABLED'}
              </button>
            )}
          </div>
        </header>

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

        <div className="content-body" id="main-content">
          <div className="page-transition" key={page}>
            {page === 'Dashboard' && <Dashboard data={data} canEdit={canEdit} onGenerate={handleGenerate} setPage={navigate} user={user} />}
            {(page === 'Timetable' || page === 'AI&DS Timetable') && (
              user?.departmentCode === 'AI&DS' ? (
                <AidsTimetableView api={api} user={user} />
              ) : (
                <TimetableView
                  data={data}
                  conflicts={conflicts}
                  onGenerate={handleGenerate}
                  canEdit={canEdit}
                  generating={generating}
                  reload={loadData}
                  api={api}
                  user={user}
                />
              )
            )}
            {page === 'Departments' && <DepartmentsView data={data} reload={loadData} canEdit={user.role === 'ADMIN'} />}
            {page === 'Sections' && <SectionsView data={data} reload={loadData} canEdit={canEdit} />}
            {page === 'Subjects' && <SubjectsView data={data} reload={loadData} canEdit={canEdit} />}
            {page === 'Faculty' && <FacultyView data={data} reload={loadData} canEdit={canEdit} />}
            {page === 'Rooms & Labs' && <RoomsView data={data} reload={loadData} canEdit={canEdit} />}
            {page === 'Faculty Links' && <FacultySubjectsView data={data} reload={loadData} canEdit={canEdit} />}
            {page === 'Settings' && (
              <SettingsView
                user={user}
                canEdit={canEdit}
                setPage={navigate}
                onLogout={handleLogout}
                onGenerate={handleGenerate}
                generating={generating}
              />
            )}
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="mobile-drawer-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="mobile-drawer"
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="mobile-drawer-head">
              <div>
                <strong>Info Institute</strong>
                <span>Intelligent Timetable</span>
              </div>
              <button
                type="button"
                className="mobile-drawer-close"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobile-drawer-user">
              <div className="user-avatar" aria-hidden="true">{user.name ? user.name[0] : 'U'}</div>
              <div className="user-meta">
                <div className="user-name">{user.name}</div>
                <span className="user-role-badge">{user.role}</span>
              </div>
            </div>

            <nav className="mobile-drawer-nav" aria-label="All pages">
              {navItems.map(item => (
                <button
                  key={item.name}
                  type="button"
                  className={`nav-item ${page === item.name ? 'active' : ''}`}
                  aria-current={page === item.name ? 'page' : undefined}
                  onClick={() => navigate(item.name)}
                >
                  <span className="nav-icon">
                    <AppIcon name={item.icon} size={20} />
                  </span>
                  <span>{item.name}</span>
                  {item.badge && <span className="badge-tag-official">{item.badge}</span>}
                </button>
              ))}
            </nav>

            <div className="mobile-drawer-actions">
              {canEdit && (
                <button type="button" className="btn-generate" onClick={handleGenerate} disabled={generating}>
                  {generating ? '⏳ Generating...' : '⚡ Generate Timetable'}
                </button>
              )}
              <button type="button" className="btn-logout" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          </aside>
        </>
      )}

      <nav className="mobile-bottom-nav" aria-label="Primary navigation">
        {[
          { name: 'Dashboard', label: 'Home', icon: 'dashboard' },
          { name: 'Timetable', label: 'Timetable', icon: 'timetable' },
          { name: 'Faculty', label: 'Faculty', icon: 'faculty' },
          { name: 'Settings', label: 'Settings', icon: 'settings' }
        ].map(item => (
          <button
            key={item.name}
            type="button"
            className={`mobile-nav-item ${page === item.name ? 'active' : ''}`}
            aria-current={page === item.name ? 'page' : undefined}
            onClick={() => navigate(item.name)}
          >
            <span className="mobile-nav-icon" aria-hidden="true">
              <AppIcon name={item.icon} size={20} />
            </span>
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
function Dashboard({ data, canEdit, onGenerate, setPage, user }) {
  const isAids = !user?.departmentCode || user?.departmentCode === 'AI&DS';
  const deptTitle = isAids
    ? 'INFO Institute of Engineering — AI&DS Semester VII Digital Timetable'
    : `INFO Institute of Engineering — ${user?.departmentCode || 'Department'} Timetable`;
  const roomLabel = isAids ? 'Classroom: B 316 · Sem VII' : `Department: ${user?.departmentCode || 'Authorized'}`;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-blue">
            <AppIcon name="departments" size={24} />
          </div>
          <div className="stat-details">
            <h3>{data.departments.length}</h3>
            <p>Departments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-indigo">
            <AppIcon name="sections" size={24} />
          </div>
          <div className="stat-details">
            <h3>{data.sections.length}</h3>
            <p>Sections</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-emerald">
            <AppIcon name="subjects" size={24} />
          </div>
          <div className="stat-details">
            <h3>{data.subjects.length}</h3>
            <p>Subjects</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-purple">
            <AppIcon name="faculty" size={24} />
          </div>
          <div className="stat-details">
            <h3>{data.faculty.length}</h3>
            <p>Faculty</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-amber">
            <AppIcon name="rooms" size={24} />
          </div>
          <div className="stat-details">
            <h3>{data.rooms.length}</h3>
            <p>Rooms & Labs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-rose">
            <AppIcon name="timetable" size={24} />
          </div>
          <div className="stat-details">
            <h3>{data.tt.length}</h3>
            <p>Scheduled Periods</p>
          </div>
        </div>
      </div>

      {/* FEATURED BANNER */}
      <section className="dashboard-feature" aria-labelledby="dashboard-feature-title">
        <span className="dashboard-feature-orb" aria-hidden="true" />
        <div className="dashboard-feature-main">
          <div className="dashboard-feature-brand">
            <img className="dashboard-feature-logo" src="/info_institute_logo.jpg" alt="Info Institute of Engineering logo" />
            <div className="dashboard-feature-copy">
              <div className="dashboard-feature-labels">
                <span className="badge-tag-official">Institutional Timetable</span>
                <span className="feature-room-label">{roomLabel}</span>
              </div>
              <h3 id="dashboard-feature-title">{deptTitle}</h3>
              <p>Academic Year 2026–2027 · Effective Date: 16-07-2026 · 6 Working Days × 8 Periods</p>
            </div>
          </div>
          <div className="dashboard-feature-actions">
            <button type="button" className="aids-btn aids-btn-save" onClick={() => setPage('Timetable')}>
              <AppIcon name="timetable" size={18} /> Open Timetable
            </button>
            <button
              type="button"
              className="aids-btn aids-btn-print"
              onClick={() => {
                setPage('Timetable');
                setTimeout(() => window.print(), 500);
              }}
            >
              <AppIcon name="print" size={18} /> Print Official Copy
            </button>
          </div>
        </div>
      </section>

      <div className="two-col-layout">
        <section className="panel">
          <div className="panel-header">
            <h2>🏆 Academic Rules &amp; Hard Constraints</h2>
          </div>
          <ul className="rules-list">
            <li><b>Period Duration:</b> 45 Minutes per academic period (8 periods daily).</li>
            <li><b>Schedule Timing:</b> 9:00 AM to 4:45 PM.</li>
            <li><b>Required Breaks:</b> Morning Break (10:40 AM to 10:55 AM), Lunch (12:35 PM to 1:15 PM), Evening Break (2:50 PM to 3:00 PM).</li>
            <li><b>Theory Requirements:</b> 4 weekly periods, distributed across different days.</li>
            <li><b>Practical / Lab Component:</b> Block-scheduled in 2 contiguous periods.</li>
            <li><b>Zero Conflict Engine:</b> Strict hard checks against section clash, room overlap, and faculty double-booking.</li>
          </ul>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>🚀 Quick Actions</h2>
          </div>
          <div className="quick-actions">
            {canEdit ? (
              <button type="button" className="btn-primary btn-generate-action" onClick={onGenerate}>
                ⚡ Run Intelligent Timetable Generation
              </button>
            ) : (
              <p className="quick-actions-note">
                You are currently viewing in student read-only mode.
              </p>
            )}

            <button type="button" className="btn-primary btn-secondary-action" onClick={() => setPage('Timetable')}>
              📅 View Master Day × Period Timetable Matrix
            </button>

            <button type="button" className="btn-primary btn-tertiary-action" onClick={() => setPage('Faculty Links')}>
              🔗 Manage Faculty-to-Subject Assignments
            </button>
          </div>
        </section>
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
          {msg && <div className="inline-feedback feedback-success" role="status">{msg}</div>}
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
  const [departmentId, setDepartmentId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [strength, setStrength] = useState(60);
  const [editingId, setEditingId] = useState(null);

  const selectedDeptId = departmentId || data.departments[0]?.id || '';
  const selectedYearId = academicYearId || data.years[0]?.id || '';

  const startEdit = (s) => {
    setEditingId(s.id);
    setDepartmentId(s.department_id ? String(s.department_id) : '');
    setAcademicYearId(s.academic_year_id ? String(s.academic_year_id) : '');
    setSectionName(s.section_name || '');
    setStrength(s.strength || 60);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSectionName('');
    setStrength(60);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/sections/${editingId}`, {
          departmentId: selectedDeptId,
          academicYearId: selectedYearId,
          sectionName,
          strength
        });
        setEditingId(null);
      } else {
        await api.post('/sections', {
          departmentId: selectedDeptId,
          academicYearId: selectedYearId,
          sectionName,
          strength
        });
      }
      setSectionName('');
      setStrength(60);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving section');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await api.delete(`/sections/${id}`);
      if (editingId === id) cancelEdit();
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
            <h2>{editingId ? 'Edit Section' : 'Add Section'}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Department</label>
              <select
                className="form-select"
                value={selectedDeptId}
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
                value={selectedYearId}
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
              {editingId ? 'Update Section' : 'Add Section'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={cancelEdit}
                style={{ width: '100%', marginTop: '8px' }}
              >
                Cancel Edit
              </button>
            )}
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
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="btn-edit-outline" onClick={() => startEdit(s)}>
                          ✏️ Edit
                        </button>
                        <button className="btn-danger-outline" onClick={() => handleDelete(s.id)}>
                          Delete
                        </button>
                      </div>
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
  const [departmentId, setDepartmentId] = useState('');
  const [yearId, setYearId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [subjectType, setSubjectType] = useState('THEORY');
  const [weeklyPeriods, setWeeklyPeriods] = useState(4);
  const [totalHours, setTotalHours] = useState(60);
  const [labPeriods, setLabPeriods] = useState(0);
  const [editingId, setEditingId] = useState(null);

  const selectedDeptId = departmentId || data.departments[0]?.id || '';
  const selectedYearId = yearId || data.years[0]?.id || '';

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

  const startEdit = (s) => {
    setEditingId(s.id);
    setDepartmentId(s.department_id ? String(s.department_id) : '');
    setYearId(s.year_id ? String(s.year_id) : '');
    setCode(s.code || '');
    setName(s.name || '');
    setSubjectType(s.subject_type || 'THEORY');
    setWeeklyPeriods(s.weekly_periods || 4);
    setTotalHours(s.total_hours || 60);
    setLabPeriods(s.lab_periods || 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setSubjectType('THEORY');
    setWeeklyPeriods(4);
    setTotalHours(60);
    setLabPeriods(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/subjects/${editingId}`, {
          departmentId: selectedDeptId,
          yearId: selectedYearId,
          code,
          name,
          subjectType,
          weeklyPeriods,
          totalHours,
          labPeriods
        });
        setEditingId(null);
      } else {
        await api.post('/subjects', {
          departmentId: selectedDeptId,
          yearId: selectedYearId,
          code,
          name,
          subjectType,
          weeklyPeriods,
          totalHours,
          labPeriods
        });
      }
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
      if (editingId === id) cancelEdit();
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
            <h2>{editingId ? 'Edit Subject' : 'Add Subject'}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Department</label>
              <select
                className="form-select"
                value={selectedDeptId}
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
                value={selectedYearId}
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
              {editingId ? 'Update Subject' : 'Save Subject'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={cancelEdit}
                style={{ width: '100%', marginTop: '8px' }}
              >
                Cancel Edit
              </button>
            )}
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
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="btn-edit-outline" onClick={() => startEdit(s)}>
                          ✏️ Edit
                        </button>
                        <button className="btn-danger-outline" onClick={() => handleDelete(s.id)}>
                          Delete
                        </button>
                      </div>
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
  const [departmentId, setDepartmentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [maxPeriodsPerDay, setMaxPeriodsPerDay] = useState(6);
  const [editingId, setEditingId] = useState(null);

  const selectedDeptId = departmentId || data.departments[0]?.id || '';

  const startEdit = (f) => {
    setEditingId(f.id);
    setDepartmentId(f.department_id ? String(f.department_id) : '');
    setName(f.name || '');
    setEmail(f.email || '');
    setDesignation(f.designation || 'Assistant Professor');
    setMaxPeriodsPerDay(f.max_periods_per_day || 6);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setDesignation('Assistant Professor');
    setMaxPeriodsPerDay(6);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/faculty/${editingId}`, {
          departmentId: selectedDeptId,
          name,
          email,
          designation,
          maxPeriodsPerDay
        });
        setEditingId(null);
      } else {
        await api.post('/faculty', {
          departmentId: selectedDeptId,
          name,
          email,
          designation,
          maxPeriodsPerDay
        });
      }
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
      if (editingId === id) cancelEdit();
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
            <h2>{editingId ? 'Edit Faculty Member' : 'Add Faculty'}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Department</label>
              <select
                className="form-select"
                value={selectedDeptId}
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
              {editingId ? 'Update Faculty' : 'Add Faculty'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={cancelEdit}
                style={{ width: '100%', marginTop: '8px' }}
              >
                Cancel Edit
              </button>
            )}
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
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="btn-edit-outline" onClick={() => startEdit(f)}>
                          ✏️ Edit
                        </button>
                        <button className="btn-danger-outline" onClick={() => handleDelete(f.id)}>
                          Delete
                        </button>
                      </div>
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
  const [isAvailable, setIsAvailable] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const startEdit = (r) => {
    setEditingId(r.id);
    setRoomCode(r.room_code || '');
    setRoomType(r.room_type || 'CLASSROOM');
    setCapacity(r.capacity || 60);
    setIsAvailable(Boolean(r.is_available));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRoomCode('');
    setRoomType('CLASSROOM');
    setCapacity(60);
    setIsAvailable(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/rooms/${editingId}`, {
          roomCode,
          roomType,
          capacity,
          isAvailable
        });
        setEditingId(null);
      } else {
        await api.post('/rooms', { roomCode, roomType, capacity });
      }
      setRoomCode('');
      setCapacity(60);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving room');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      if (editingId === id) cancelEdit();
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
            <h2>{editingId ? 'Edit Classroom / Lab' : 'Add Classroom / Lab'}</h2>
          </div>
          <form onSubmit={handleSubmit}>
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
            {editingId && (
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="room-available"
                  checked={isAvailable}
                  onChange={e => setIsAvailable(e.target.checked)}
                />
                <label htmlFor="room-available" style={{ margin: 0, cursor: 'pointer' }}>Is Available for Scheduling</label>
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {editingId ? 'Update Room' : 'Save Room'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={cancelEdit}
                style={{ width: '100%', marginTop: '8px' }}
              >
                Cancel Edit
              </button>
            )}
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
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="btn-edit-outline" onClick={() => startEdit(r)}>
                          ✏️ Edit
                        </button>
                        <button className="btn-danger-outline" onClick={() => handleDelete(r.id)}>
                          Delete
                        </button>
                      </div>
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
  const [facultyId, setFacultyId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const selectedFacId = facultyId || data.faculty[0]?.id || '';
  const selectedSubId = subjectId || data.subjects[0]?.id || '';

  const isAlreadyLinked = data.facultySubjects?.some(
    fs => String(fs.faculty_id) === String(selectedFacId) && String(fs.subject_id) === String(selectedSubId)
  );

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedFacId || !selectedSubId) {
      setFeedback({ type: 'error', text: 'Please select both a faculty member and a subject.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.post('/faculty-subjects', {
        facultyId: Number(selectedFacId),
        subjectId: Number(selectedSubId)
      });
      setFeedback({
        type: res.data?.alreadyExists ? 'warning' : 'success',
        text: res.data?.message || 'Faculty member successfully assigned to subject!'
      });
      await reload();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error assigning faculty. Check server connection.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (fId, sId) => {
    if (!confirm('Unassign this faculty member from this subject?')) return;
    try {
      const res = await api.delete(`/faculty-subjects/${fId}/${sId}`);
      setFeedback({
        type: 'success',
        text: res.data?.message || 'Assignment removed successfully.'
      });
      await reload();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error removing assignment.'
      });
    }
  };

  return (
    <div className="two-col-layout">
      {canEdit && (
        <div className="panel">
          <div className="panel-header">
            <h2>Assign Faculty to Subject</h2>
          </div>

          {feedback && (
            <div className={`inline-feedback feedback-${feedback.type}`} role="status">
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleAssign}>
            <div className="form-group">
              <label>Select Faculty Member</label>
              <select
                className="form-select"
                value={selectedFacId}
                onChange={e => {
                  setFacultyId(e.target.value);
                  setFeedback(null);
                }}
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
                value={selectedSubId}
                onChange={e => {
                  setSubjectId(e.target.value);
                  setFeedback(null);
                }}
              >
                {data.subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name} ({s.department})</option>
                ))}
              </select>
            </div>

            {isAlreadyLinked && (
              <div className="inline-feedback feedback-warning" role="status">
                ℹ️ This faculty member is currently already linked to this subject.
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '10px 16px' }}
              disabled={submitting}
            >
              {submitting ? '⏳ Linking Faculty...' : '🔗 Link Faculty to Subject'}
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
function TimetableView({ data, conflicts, onGenerate, canEdit, generating, reload, api, user }) {
  const [editingEntry, setEditingEntry] = useState(null);
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editFacultyId, setEditFacultyId] = useState('');
  const [editRoomId, setEditRoomId] = useState('');
  const [editDayId, setEditDayId] = useState('');
  const [editSlotId, setEditSlotId] = useState('');
  const [editConflict, setEditConflict] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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
    const currentHasEntries = data.tt.some(t =>
      selectedSectionObj ? sectionMatchesEntry(selectedSectionObj, t) : String(t.section_id) === String(selectedSectionId)
    );
    if (!currentHasEntries && scheduledSectionIds.length > 0) {
      setSelectedSectionId(String(scheduledSectionIds[0]));
    } else if (!selectedSectionId && data.sections.length > 0) {
      setSelectedSectionId(String(data.sections[0].id));
    }
  }, [data.tt, data.sections]);

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

  // Available subjects & faculty filtered for editing
  const currentDeptId = selectedSectionObj?.department_id;
  const availableSubjects = data.subjects.filter(
    s => !currentDeptId || s.department_id === currentDeptId
  );
  const availableFaculty = data.faculty.filter(
    f => !currentDeptId || f.department_id === currentDeptId
  );

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEditSubjectId(String(entry.subject_id || ''));
    setEditFacultyId(String(entry.faculty_id || ''));
    setEditRoomId(String(entry.room_id || ''));
    setEditDayId(String(entry.working_day_id || ''));
    setEditSlotId(String(entry.time_slot_id || ''));
    setEditConflict('');
    setEditSuccess('');
  };

  const openAddModal = (day, slot) => {
    setEditingEntry({
      id: null,
      section_id: selectedSectionObj?.id || selectedSectionId,
      working_day_id: day.id,
      time_slot_id: slot.id,
      day_name: day.day_name,
      slot_name: slot.slot_name
    });
    const firstSub = availableSubjects[0]?.id ? String(availableSubjects[0].id) : '';
    setEditSubjectId(firstSub);
    const firstFac = availableFaculty[0]?.id ? String(availableFaculty[0].id) : '';
    setEditFacultyId(firstFac);
    const availableRoom = data.rooms.find(r => r.is_available)?.id || data.rooms[0]?.id || '';
    setEditRoomId(String(availableRoom));
    setEditDayId(String(day.id));
    setEditSlotId(String(slot.id));
    setEditConflict('');
    setEditSuccess('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditConflict('');
    setEditSuccess('');

    try {
      if (!editSubjectId || !editFacultyId || !editRoomId || !editDayId || !editSlotId) {
        setEditConflict('Please select a subject, faculty, room, day, and period slot.');
        setSavingEdit(false);
        return;
      }

      let res;
      if (editingEntry?.id) {
        res = await api.put(`/timetable/${editingEntry.id}`, {
          subjectId: Number(editSubjectId),
          facultyId: Number(editFacultyId),
          roomId: Number(editRoomId),
          workingDayId: Number(editDayId),
          timeSlotId: Number(editSlotId)
        });
      } else {
        res = await api.post('/timetable', {
          sectionId: Number(selectedSectionObj?.id || selectedSectionId),
          subjectId: Number(editSubjectId),
          facultyId: Number(editFacultyId),
          roomId: Number(editRoomId),
          workingDayId: Number(editDayId),
          timeSlotId: Number(editSlotId)
        });
      }

      setEditSuccess(res.data.message || 'Timetable entry saved successfully!');
      setTimeout(() => {
        setEditingEntry(null);
        setEditSuccess('');
        if (reload) reload();
      }, 700);
    } catch (err) {
      setEditConflict(err.response?.data?.message || 'Error saving entry. A scheduling conflict was detected.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!editingEntry?.id) return;
    if (!window.confirm('Are you sure you want to clear this timetable entry?')) return;
    setSavingEdit(true);
    try {
      await api.delete(`/timetable/${editingEntry.id}`);
      setEditSuccess('Timetable entry cleared successfully!');
      setTimeout(() => {
        setEditingEntry(null);
        setEditSuccess('');
        if (reload) reload();
      }, 700);
    } catch (err) {
      setEditConflict(err.response?.data?.message || 'Error clearing entry.');
    } finally {
      setSavingEdit(false);
    }
  };

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
              disabled={generating}
            >
              {generating ? '⏳ Generating…' : '⚡ Re-generate'}
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span className="mobile-period-room">{entry.room_code || 'Room TBA'}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(entry)}
                          style={{
                            background: 'rgba(168, 85, 247, 0.2)',
                            border: '1px solid rgba(168, 85, 247, 0.5)',
                            borderRadius: '6px',
                            color: '#f3e8ff',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                      <span className="mobile-period-room" aria-hidden="true">—</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openAddModal(day, slot)}
                          style={{
                            background: 'rgba(168, 85, 247, 0.2)',
                            border: '1px solid rgba(168, 85, 247, 0.5)',
                            borderRadius: '6px',
                            color: '#f3e8ff',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* If section currently has 0 entries, show informative banner above grid */}
      {sectionEntries.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: '24px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
          <h3 style={{ margin: '0 0 6px' }}>No timetable entries generated yet for {selectedSectionObj ? selectedSectionObj.section_name : 'this section'}</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 12px' }}>
            {canEdit
              ? 'Click "✏️ Edit" on any period (P1 to P8) in the grid below to schedule classes manually, or click "⚡ Generate Timetable".'
              : 'The timetable has not been generated by the administrator yet.'}
          </p>
          {canEdit && (
            <button
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '8px 18px' }}
              onClick={onGenerate}
              disabled={generating}
            >
              {generating ? '⏳ Generating Timetable…' : '⚡ Generate Timetable'}
            </button>
          )}
        </div>
      )}

      {/* DAY x PERIOD GRID TABLE - All 8 periods P1 to P8 editable */}
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
                      <td key={slot.id} className="period-cell empty-period-cell">
                        <div className="period-card empty-card" style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: '84px',
                          border: '1px dashed rgba(168, 85, 247, 0.25)',
                          borderRadius: '8px',
                          background: 'rgba(15, 12, 34, 0.4)',
                          padding: '6px'
                        }}>
                          <span style={{ color: '#64748b', fontSize: '11px', marginBottom: '6px' }}>— Free —</span>
                          {canEdit && (
                            <button
                              type="button"
                              className="btn-edit-period"
                              title={`Schedule ${day.day_name} ${slot.slot_name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddModal(day, slot);
                              }}
                              style={{
                                background: 'rgba(168, 85, 247, 0.2)',
                                border: '1px solid rgba(168, 85, 247, 0.5)',
                                borderRadius: '6px',
                                color: '#f3e8ff',
                                padding: '2px 8px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              ✏️ Edit
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={slot.id} className="period-cell">
                      <div className={`period-card ${entry.is_lab ? 'card-practical' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div className="card-subject-code">{entry.subject_code}</div>
                            <div className="card-subject-name" title={entry.subject_name}>
                              {entry.subject_name}
                            </div>
                          </div>
                          {canEdit && (
                            <button
                              type="button"
                              className="btn-edit-period"
                              title="Edit period entry"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(entry);
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

      {/* TIMETABLE ENTRY EDIT MODAL */}
      {editingEntry && (
        <div className="timetable-modal-backdrop" onClick={() => setEditingEntry(null)}>
          <div className="timetable-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>
                {editingEntry.id ? '✏️ Edit Scheduled Period' : '➕ Add Timetable Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Automatically identified department, class/section, day, period info box */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '16px',
              fontSize: '12px'
            }}>
              <div><span style={{ color: '#94a3b8' }}>Department:</span> <b style={{ color: '#f3e8ff' }}>{selectedSectionObj?.department || user?.departmentCode || 'All'}</b></div>
              <div><span style={{ color: '#94a3b8' }}>Section:</span> <b style={{ color: '#f3e8ff' }}>{selectedSectionObj?.section_name || '—'}</b></div>
              <div><span style={{ color: '#94a3b8' }}>Day:</span> <b style={{ color: '#f3e8ff' }}>{workingDays.find(d => String(d.id) === String(editDayId))?.day_name || editingEntry.day_name || '—'}</b></div>
              <div><span style={{ color: '#94a3b8' }}>Period:</span> <b style={{ color: '#f3e8ff' }}>{orderedSlots.find(s => String(s.id) === String(editSlotId))?.slot_name || editingEntry.slot_name || '—'}</b></div>
            </div>

            {editConflict && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                ⚠️ {editConflict}
              </div>
            )}

            {editSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#6ee7b7',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                ✓ {editSuccess}
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Subject</label>
                <select
                  className="form-select"
                  value={editSubjectId}
                  onChange={e => setEditSubjectId(e.target.value)}
                  required
                  style={{ background: '#0f0c22', color: '#fff' }}
                >
                  <option value="">-- Select Subject --</option>
                  {availableSubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} — {sub.name} ({sub.subject_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Faculty</label>
                <select
                  className="form-select"
                  value={editFacultyId}
                  onChange={e => setEditFacultyId(e.target.value)}
                  required
                  style={{ background: '#0f0c22', color: '#fff' }}
                >
                  <option value="">-- Select Faculty --</option>
                  {availableFaculty.map(fac => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.designation || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Classroom / Laboratory</label>
                <select
                  className="form-select"
                  value={editRoomId}
                  onChange={e => setEditRoomId(e.target.value)}
                  required
                  style={{ background: '#0f0c22', color: '#fff' }}
                >
                  <option value="">-- Select Room / Lab --</option>
                  {data.rooms.filter(r => r.is_available).map(r => (
                    <option key={r.id} value={r.id}>
                      {r.room_code} ({r.room_type} · {r.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Day</label>
                  <select
                    className="form-select"
                    value={editDayId}
                    onChange={e => setEditDayId(e.target.value)}
                    required
                    style={{ background: '#0f0c22', color: '#fff' }}
                  >
                    {workingDays.map(d => (
                      <option key={d.id} value={d.id}>{d.day_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Period Slot</label>
                  <select
                    className="form-select"
                    value={editSlotId}
                    onChange={e => setEditSlotId(e.target.value)}
                    required
                    style={{ background: '#0f0c22', color: '#fff' }}
                  >
                    {orderedSlots.filter(s => s.slot_type === 'PERIOD').map(s => (
                      <option key={s.id} value={s.id}>
                        {s.slot_name} ({formatTimeRange(s)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px 16px' }}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Validating & Saving...' : 'Save Changes'}
                </button>
                {editingEntry.id && (
                  <button
                    type="button"
                    className="btn-danger"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={handleDeleteEntry}
                    disabled={savingEdit}
                  >
                    Clear Period
                  </button>
                )}
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '10px 16px' }}
                  onClick={() => setEditingEntry(null)}
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

// Render React App to DOM
createRoot(document.getElementById('root')).render(<App />);
