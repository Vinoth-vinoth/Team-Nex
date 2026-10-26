import React from 'react';

/**
 * Premium Modern SVG Icon Design System for Info Institute of Engineering Timetable App
 * Designed with custom multi-stop gradients, glowing depth, and futuristic geometric strokes.
 */
export function AppIcon({ name, size = 20, color = 'currentColor', className = '', ...props }) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: `svg-icon svg-icon-${name} ${className}`,
    ...props
  };

  switch (name) {
    case 'dashboard':
      // 4 isometric crystal analytics blocks with glowing cyan-blue gradient
      return (
        <svg {...iconProps}>
          <defs>
            <linearGradient id="dashGrad1" x1="2" y1="2" x2="11" y2="11" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="dashGrad2" x1="13" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="7.5" height="7.5" rx="2.5" fill="url(#dashGrad1)" />
          <circle cx="6.75" cy="6.75" r="1.5" fill="#ffffff" />
          <rect x="13.5" y="3" width="7.5" height="5" rx="2" fill="url(#dashGrad2)" fillOpacity="0.75" />
          <rect x="13.5" y="10.5" width="7.5" height="10.5" rx="2.5" fill="url(#dashGrad2)" />
          <rect x="3" y="13" width="7.5" height="8" rx="2.2" fill="url(#dashGrad1)" fillOpacity="0.6" />
        </svg>
      );

    case 'timetable':
    case 'aidsTimetable':
      // INFO Institute AI&DS Timetable: Golden Amber & Deep Cobalt Schedule Matrix
      return (
        <svg {...iconProps}>
          <defs>
            <linearGradient id="ttGoldGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="ttBlueGrad" x1="4" y1="8" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          {/* Calendar Binder Outline */}
          <rect x="2.5" y="4.5" width="19" height="16.5" rx="3.5" stroke="url(#ttGoldGrad)" strokeWidth="1.8" />
          <path d="M2.5 9.5H21.5" stroke="url(#ttGoldGrad)" strokeWidth="1.8" />
          {/* Twin Top Rings */}
          <path d="M7 2.5V5.5M17 2.5V5.5" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
          {/* Grid periods */}
          <rect x="5.5" y="12" width="3.5" height="3" rx="1" fill="#10b981" />
          <rect x="10.25" y="12" width="3.5" height="3" rx="1" fill="#38bdf8" />
          <rect x="15" y="12" width="3.5" height="3" rx="1" fill="#f59e0b" />
          <rect x="5.5" y="16.5" width="3.5" height="2.2" rx="0.8" fill="#818cf8" />
          <rect x="10.25" y="16.5" width="8.25" height="2.2" rx="0.8" fill="url(#ttBlueGrad)" fillOpacity="0.8" />
        </svg>
      );

    case 'departments':
      // Classical Corinthian Academic Portico with Dome
      return (
        <svg {...iconProps}>
          <defs>
            <linearGradient id="deptGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          {/* Triangular pediment */}
          <path d="M2 9.5L12 3L22 9.5V11H2V9.5Z" fill="url(#deptGrad)" />
          {/* Golden crest */}
          <circle cx="12" cy="7" r="1.3" fill="#f59e0b" />
          {/* 4 Architectural Columns */}
          <rect x="4.5" y="11" width="2.5" height="8.5" rx="0.8" fill="url(#deptGrad)" fillOpacity="0.85" />
          <rect x="9" y="11" width="2.5" height="8.5" rx="0.8" fill="url(#deptGrad)" fillOpacity="0.85" />
          <rect x="13" y="11" width="2.5" height="8.5" rx="0.8" fill="url(#deptGrad)" fillOpacity="0.85" />
          <rect x="17" y="11" width="2.5" height="8.5" rx="0.8" fill="url(#deptGrad)" fillOpacity="0.85" />
          {/* Plinth */}
          <rect x="2" y="19.5" width="20" height="2.2" rx="0.6" fill="#1e293b" />
        </svg>
      );

    case 'sections':
      // Dynamic Cohort / Class Section User Badge
      return (
        <svg {...iconProps}>
          <defs>
            <linearGradient id="secGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          {/* Background Member */}
          <circle cx="16.5" cy="7.5" r="2.8" stroke="url(#secGrad)" strokeWidth="1.6" strokeOpacity="0.6" />
          <path d="M13 18C13 15.5 15 13.8 17.5 13.8C20 13.8 22 15.5 22 18" stroke="url(#secGrad)" strokeWidth="1.6" strokeOpacity="0.6" strokeLinecap="round" />
          {/* Foreground Member */}
          <circle cx="8.5" cy="7.5" r="3.4" fill="#6366f1" fillOpacity="0.25" stroke="url(#secGrad)" strokeWidth="1.8" />
          <path d="M3.5 19.5C3.5 16 6 13.5 9 13.5C12 13.5 14.5 16 14.5 19.5" stroke="url(#secGrad)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8.5" cy="7.5" r="1.2" fill="#f59e0b" />
        </svg>
      );

    case 'subjects':
      // Digital Academic Codex / Textbook with Bookmark
      return (
        <svg {...iconProps}>
          <defs>
            <linearGradient id="subGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <path d="M3.5 18.5C5.8 17.5 9 17.5 12 19C15 17.5 18.2 17.5 20.5 18.5V5.5C18.2 4.5 15 4.5 12 6C9 4.5 5.8 4.5 3.5 5.5V18.5Z" stroke="url(#subGrad)" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 6V19" stroke="url(#subGrad)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15 7.5L15 12.5L16.5 11L18 12.5V7.5" fill="#f59e0b" />
          <path d="M6 9.5H9.5M6 13H9.5" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case 'faculty':
      // Academic Professor with Doctoral Cap and Collar
      return (
        <svg {...iconProps}>
          <defs>
            <linearGradient id="facGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>
          {/* Mortarboard */}
          <path d="M12 3L3.5 7.5L12 12L20.5 7.5L12 3Z" fill="url(#facGrad)" />
          <path d="M20.5 7.5V12.5" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="20.5" cy="13.5" r="1" fill="#f59e0b" />
          {/* Head */}
          <path d="M8.5 13C8.5 11 10 9.5 12 9.5C14 9.5 15.5 11 15.5 13" stroke="url(#facGrad)" strokeWidth="1.6" />
          {/* Shoulders */}
          <path d="M5 21C5 17.5 8 16 12 16C16 16 19 17.5 19 21" stroke="url(#facGrad)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M11 16L12 19.5L13 16" fill="#38bdf8" />
        </svg>
      );

    case 'rooms':
      // Smart Lab & Classroom Architecture Blueprint
      return (
        <svg {...iconProps}>
          <defs>
            <linearGradient id="roomGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <rect x="3" y="3.5" width="18" height="17" rx="3" stroke="url(#roomGrad)" strokeWidth="1.8" />
          {/* Archway */}
          <path d="M9 20.5V13H15V20.5" stroke="url(#roomGrad)" strokeWidth="1.8" />
          {/* Lab equipment / screen */}
          <rect x="6" y="6.5" width="4.5" height="4" rx="1" fill="#38bdf8" fillOpacity="0.4" />
          <rect x="13.5" y="6.5" width="4.5" height="4" rx="1" fill="#10b981" fillOpacity="0.6" />
          <circle cx="13.5" cy="16.5" r="0.9" fill="#f59e0b" />
        </svg>
      );

    case 'facultyLinks':
      // Covalent Interlocking Node Link
      return (
        <svg {...iconProps}>
          <defs>
            <linearGradient id="linkGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
          </defs>
          <circle cx="7" cy="7" r="3.5" stroke="url(#linkGrad)" strokeWidth="1.8" fill="#f43f5e" fillOpacity="0.2" />
          <circle cx="17" cy="17" r="3.5" stroke="url(#linkGrad)" strokeWidth="1.8" fill="#f43f5e" fillOpacity="0.2" />
          <path d="M9.5 9.5L14.5 14.5" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="17" cy="7" r="2.2" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="7" cy="17" r="2.2" stroke="#10b981" strokeWidth="1.5" />
          <path d="M9 16L15 8" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="2 2" />
        </svg>
      );

    case 'settings':
      // Twin Precision Mechanism Gears
      return (
        <svg {...iconProps}>
          <defs>
            <linearGradient id="gearGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <path
            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
            stroke="url(#gearGrad)"
            strokeWidth="1.8"
          />
          <path
            d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L20.08 17.17A2 2 0 1 1 17.25 20L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14 20.88V21.5A2 2 0 1 1 10 21.5V20.88A1.65 1.65 0 0 0 8.92 19.32A1.65 1.65 0 0 0 7.1 19.65L6.75 20A2 2 0 1 1 3.92 17.17L4.27 16.82A1.65 1.65 0 0 0 4.6 15A1.65 1.65 0 0 0 3.04 13.92H2.5A2 2 0 1 1 2.5 9.92H3.04A1.65 1.65 0 0 0 4.6 8.84A1.65 1.65 0 0 0 4.27 7.02L3.92 6.67A2 2 0 1 1 6.75 3.84L7.1 4.19A1.65 1.65 0 0 0 8.92 4.52A1.65 1.65 0 0 0 10 2.96V2.5A2 2 0 1 1 14 2.5V2.96A1.65 1.65 0 0 0 15.08 4.52A1.65 1.65 0 0 0 16.9 4.19L17.25 3.84A2 2 0 1 1 20.08 6.67L19.73 7.02A1.65 1.65 0 0 0 19.4 8.84A1.65 1.65 0 0 0 20.96 9.92H21.5A2 2 0 1 1 21.5 13.92H20.96A1.65 1.65 0 0 0 19.4 15Z"
            stroke="url(#gearGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'print':
      // Laser Printer with Sheet Out
      return (
        <svg {...iconProps}>
          <path d="M6 9V3H18V9" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="3" y="9" width="18" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7 15H17V21H7V15Z" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.8" />
          <circle cx="18" cy="12" r="1.2" fill="#10b981" />
        </svg>
      );

    case 'pdf':
      // PDF document badge
      return (
        <svg {...iconProps}>
          <path d="M6 3H14L19 8V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V4C5 3.4 5.4 3 6 3Z" stroke="#ef4444" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M14 3V8H19" stroke="#ef4444" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 14H10C10.6 14 11 13.6 11 13C11 12.4 10.6 12 10 12H8V16M13 12V16M13 14H15M8 12V16" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'save':
      // Memory disk save icon
      return (
        <svg {...iconProps}>
          <path d="M19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16L21 8V19C21 20.1 20.1 21 19 21Z" stroke="#10b981" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M17 21V13H7V21" stroke="#10b981" strokeWidth="1.8" />
          <path d="M7 3V8H15V3" stroke="#10b981" strokeWidth="1.8" />
          <rect x="9" y="4.5" width="2" height="2.5" fill="#f59e0b" />
        </svg>
      );

    case 'edit':
      return (
        <svg {...iconProps}>
          <path d="M16.5 3.5L20.5 7.5L7 21H3V17L16.5 3.5Z" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 6L18 10" stroke="#3b82f6" strokeWidth="1.8" />
        </svg>
      );

    case 'reset':
      return (
        <svg {...iconProps}>
          <path d="M3 12C3 7 7 3 12 3C16.5 3 20.2 6.3 20.9 10.5M21 12C21 17 17 21 12 21C7.5 21 3.8 17.7 3.1 13.5" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M3 7V12H8M21 17V12H16" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'sparkle':
      return (
        <svg {...iconProps}>
          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#f59e0b" />
        </svg>
      );

    case 'check':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.8" />
          <path d="M8 12L11 15L16 9" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'clock':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 6.5V12L15.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'copy':
      return (
        <svg {...iconProps}>
          <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 16V5C4 4.4 4.4 4 5 4H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'plus':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" stroke="#10b981" strokeWidth="1.8" />
          <path d="M12 8V16M8 12H16" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'info':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="1.8" />
          <path d="M12 8V8.5M12 11V16" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
  }
}
