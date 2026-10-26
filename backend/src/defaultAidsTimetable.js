export const DEFAULT_AIDS_TIMETABLE = {
  institution: {
    name: 'INFO Institute of Engineering',
    affiliation: 'Autonomous Institution - Coimbatore - 641 107',
    department: 'Artificial Intelligence & Data Science (AI&DS)',
    departmentCode: 'AI&DS',
    class: 'III Year',
    semester: 'VII',
    academicYear: '2026-2027',
    effectiveDate: '16-07-2026',
    classroom: 'B 316'
  },
  timings: [
    { period: 1, label: 'Period 1', time: '9:00 AM - 9:50 AM' },
    { period: 2, label: 'Period 2', time: '9:50 AM - 10:40 AM' },
    { period: 'BREAK_1', label: 'Morning Break', time: '10:40 AM - 10:55 AM', isBreak: true },
    { period: 3, label: 'Period 3', time: '10:55 AM - 11:45 AM' },
    { period: 4, label: 'Period 4', time: '11:45 AM - 12:35 PM' },
    { period: 'LUNCH', label: 'Lunch Break', time: '12:35 PM - 1:15 PM', isBreak: true },
    { period: 5, label: 'Period 5', time: '1:15 PM - 2:05 PM' },
    { period: 6, label: 'Period 6', time: '2:05 PM - 2:55 PM' },
    { period: 'BREAK_2', label: 'Evening Break', time: '2:55 PM - 3:05 PM', isBreak: true },
    { period: 7, label: 'Period 7', time: '3:05 PM - 3:55 PM' },
    { period: 8, label: 'Period 8', time: '3:55 PM - 4:45 PM' }
  ],
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  subjects: [
    { code: 'GE3791', abbrev: 'HVE', name: 'Human Values and Ethics', faculty: 'Dr. C. R. Santhosh, AP/MBA', periods: 4, color: '#f59e0b' },
    { code: 'AI3021', abbrev: 'ITA', name: 'IT in Agricultural System', faculty: 'Dr. P. Sangeetha, HOD/AI&DS', periods: 5, color: '#10b981' },
    { code: 'GE3754', abbrev: 'HRM', name: 'Human Resource Management', faculty: 'Mr. S. Kanararaj, AP/MBA', periods: 5, color: '#06b6d4' },
    { code: 'CME365', abbrev: 'RET', name: 'Renewable Energy Technologies', faculty: 'Dr. J. Balasubramaniam, Prof/MECH', periods: 5, color: '#8b5cf6' },
    { code: 'OBT356', abbrev: 'LD', name: 'Lifestyle Diseases', faculty: 'Mr. T. R. Vignesh, AP/AI&DS', periods: 5, color: '#0ea5e9' }
  ],
  activities: [
    { activity: 'Placement & Soft Skill Development', abbrev: 'PLACEMENT', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', periods: 10, color: '#f43f5e' },
    { activity: 'Soft Skills', abbrev: 'Soft Skills', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', periods: 2, color: '#d946ef' },
    { activity: 'Library', abbrev: 'LIB', faculty: 'Ms. T. Shampavi, AP/AI&DS; Ms. K. Thenmozhi, AP/AI&DS', periods: 2, color: '#0284c7' },
    { activity: 'Project Preparation (Thenmozhi / Vignesh)', abbrev: 'PP (TRV)', faculty: 'Ms. K. Thenmozhi, AP/AI&DS; Mr. T. R. Vignesh, AP/AI&DS', periods: 3, color: '#2563eb' },
    { activity: 'Project Preparation (Thenmozhi)', abbrev: 'PP (KT)', faculty: 'Ms. K. Thenmozhi, AP/AI&DS', periods: 3, color: '#4f46e5' },
    { activity: 'Mentor Hour', abbrev: 'Mentor', faculty: 'Ms. T. Shampavi, AP/AI&DS', periods: 1, color: '#ea580c' },
    { activity: 'Value Added Course', abbrev: 'VALUE ADDED COURSE', faculty: 'Mrs. S. Kayal Vizhi, AP/AI&DS', periods: 4, color: '#059669' },
    { activity: 'Club Activities', abbrev: 'CLUB ACTIVITIES', faculty: 'Ms. K. Thenmozhi, AP/AI&DS', periods: 4, color: '#0d9488' }
  ],
  facultyAdvisors: [
    { name: 'Ms. T. Shampavi', designation: 'AP/AI&DS' },
    { name: 'Mr. T. R. Vignesh', designation: 'AP/AI&DS' }
  ],
  schedule: {
    Monday: {
      1: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Dr. C. R. Santhosh, AP/MBA', room: 'B 316' },
      2: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Dr. C. R. Santhosh, AP/MBA', room: 'B 316' },
      3: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Mr. S. Kanararaj, AP/MBA', room: 'B 316' },
      4: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Dr. J. Balasubramaniam, Prof/MECH', room: 'B 316' },
      5: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Mr. S. Kanararaj, AP/MBA', room: 'B 316' },
      6: { subject: 'LIB', name: 'Library', faculty: 'Ms. T. Shampavi, AP/AI&DS; Ms. K. Thenmozhi, AP/AI&DS', room: 'B 316' },
      7: { subject: 'LIB', name: 'Library', faculty: 'Ms. T. Shampavi, AP/AI&DS; Ms. K. Thenmozhi, AP/AI&DS', room: 'B 316' },
      8: { subject: 'PP (TRV)', name: 'Project Preparation', faculty: 'Ms. K. Thenmozhi, AP/AI&DS; Mr. T. R. Vignesh, AP/AI&DS', room: 'B 316' }
    },
    Tuesday: {
      1: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Dr. C. R. Santhosh, AP/MBA', room: 'B 316' },
      2: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Mr. S. Kanararaj, AP/MBA', room: 'B 316' },
      3: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Dr. P. Sangeetha, HOD/AI&DS', room: 'B 316' },
      4: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Dr. J. Balasubramaniam, Prof/MECH', room: 'B 316' },
      5: { subject: 'LIB', name: 'Library', faculty: 'Ms. T. Shampavi, AP/AI&DS; Ms. K. Thenmozhi, AP/AI&DS', room: 'B 316' },
      6: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Mr. S. Kanararaj, AP/MBA', room: 'B 316' },
      7: { subject: 'Mentor', name: 'Mentor Hour', faculty: 'Ms. T. Shampavi, AP/AI&DS', room: 'B 316' },
      8: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Dr. J. Balasubramaniam, Prof/MECH', room: 'B 316' }
    },
    Wednesday: {
      1: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Dr. P. Sangeetha, HOD/AI&DS', room: 'B 316' },
      2: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Dr. C. R. Santhosh, AP/MBA', room: 'B 316' },
      3: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Mr. S. Kanararaj, AP/MBA', room: 'B 316' },
      4: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Dr. J. Balasubramaniam, Prof/MECH', room: 'B 316' },
      5: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Dr. P. Sangeetha, HOD/AI&DS', room: 'B 316' },
      6: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Dr. J. Balasubramaniam, Prof/MECH', room: 'B 316' },
      7: { subject: 'Soft Skills', name: 'Soft Skills Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' },
      8: { subject: 'Soft Skills', name: 'Soft Skills Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' }
    },
    Thursday: {
      1: { subject: 'PP (KT)', name: 'Project Preparation', faculty: 'Ms. K. Thenmozhi, AP/AI&DS', room: 'B 316' },
      2: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Dr. P. Sangeetha, HOD/AI&DS', room: 'B 316' },
      3: { subject: 'HRM', name: 'Human Resource Management', faculty: 'Mr. S. Kanararaj, AP/MBA', room: 'B 316' },
      4: { subject: 'RET', name: 'Renewable Energy Technologies', faculty: 'Dr. J. Balasubramaniam, Prof/MECH', room: 'B 316' },
      5: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Dr. C. R. Santhosh, AP/MBA', room: 'B 316' },
      6: { subject: 'HVE', name: 'Human Values and Ethics', faculty: 'Dr. C. R. Santhosh, AP/MBA', room: 'B 316' },
      7: { subject: 'ITA', name: 'IT in Agricultural System', faculty: 'Dr. P. Sangeetha, HOD/AI&DS', room: 'B 316' },
      8: { subject: 'PP (KT)', name: 'Project Preparation', faculty: 'Ms. K. Thenmozhi, AP/AI&DS', room: 'B 316' }
    },
    Friday: {
      1: { subject: 'PLACEMENT', name: 'Placement & Soft Skill Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' },
      2: { subject: 'PLACEMENT', name: 'Placement & Soft Skill Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' },
      3: { subject: 'PLACEMENT', name: 'Placement & Soft Skill Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' },
      4: { subject: 'PLACEMENT', name: 'Placement & Soft Skill Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' },
      5: { subject: 'PLACEMENT', name: 'Placement & Soft Skill Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' },
      6: { subject: 'PLACEMENT', name: 'Placement & Soft Skill Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' },
      7: { subject: 'PLACEMENT', name: 'Placement & Soft Skill Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' },
      8: { subject: 'PLACEMENT', name: 'Placement & Soft Skill Development', faculty: 'Mr. K. M. Mohanraj, Placement Officer; Mr. P. Jeeva, AP/Mechanical', room: 'B 316' }
    },
    Saturday: {
      1: { subject: 'VALUE ADDED COURSE', name: 'Value Added Course', faculty: 'Mrs. S. Kayal Vizhi, AP/AI&DS', room: 'B 316' },
      2: { subject: 'VALUE ADDED COURSE', name: 'Value Added Course', faculty: 'Mrs. S. Kayal Vizhi, AP/AI&DS', room: 'B 316' },
      3: { subject: 'VALUE ADDED COURSE', name: 'Value Added Course', faculty: 'Mrs. S. Kayal Vizhi, AP/AI&DS', room: 'B 316' },
      4: { subject: 'VALUE ADDED COURSE', name: 'Value Added Course', faculty: 'Mrs. S. Kayal Vizhi, AP/AI&DS', room: 'B 316' },
      5: { subject: 'CLUB ACTIVITIES', name: 'Club Activities', faculty: 'Ms. K. Thenmozhi, AP/AI&DS', room: 'B 316' },
      6: { subject: 'CLUB ACTIVITIES', name: 'Club Activities', faculty: 'Ms. K. Thenmozhi, AP/AI&DS', room: 'B 316' },
      7: { subject: 'CLUB ACTIVITIES', name: 'Club Activities', faculty: 'Ms. K. Thenmozhi, AP/AI&DS', room: 'B 316' },
      8: { subject: 'CLUB ACTIVITIES', name: 'Club Activities', faculty: 'Ms. K. Thenmozhi, AP/AI&DS', room: 'B 316' }
    }
  },
  promptReference: `Institution: INFO Institute of Engineering, Coimbatore 641107 | Dept: AI&DS | Class: III Year | Sem: VII | AY: 2026-2027 | Room: B 316

Period Timings: P1 9:00-9:50 | P2 9:50-10:40 | [Break 10:40-10:55] | P3 10:55-11:45 | P4 11:45-12:35 | [Lunch 12:35-1:15] | P5 1:15-2:05 | P6 2:05-2:55 | [Break 2:55-3:05] | P7 3:05-3:55 | P8 3:55-4:45

Monday:    HVE HVE HRM RET | HRM LIB LIB PP(TRV)
Tuesday:   HVE HRM ITA RET | LIB HRM Mentor RET
Wednesday: ITA HVE HRM RET | ITA RET SoftSkills SoftSkills
Thursday:  PP(KT) ITA HRM RET | HVE HVE ITA PP(KT)
Friday:    PLACEMENT x8
Saturday:  VALUE ADDED COURSE x4 | CLUB ACTIVITIES x4

Subjects: GE3791/HVE-Dr.C.R.Santhosh AP/MBA | AI3021/ITA-Dr.P.Sangeetha HOD/AI&DS | GE3754/HRM-Mr.S.Kanararaj AP/MBA | CME365/RET-Dr.J.Balasubramaniam Prof/MECH | OBT356/LD-Mr.T.R.Vignesh AP/AI&DS

Activities: PLACEMENT-Mr.K.M.Mohanraj+Mr.P.Jeeva | LIB-Ms.T.Shampavi+Ms.K.Thenmozhi | PP(TRV)-Ms.K.Thenmozhi+Mr.T.R.Vignesh | PP(KT)-Ms.K.Thenmozhi | Mentor-Ms.T.Shampavi | VAC-Mrs.S.Kayal Vizhi | Club-Ms.K.Thenmozhi

Faculty Advisors: Ms.T.Shampavi AP/AI&DS, Mr.T.R.Vignesh AP/AI&DS`
};
