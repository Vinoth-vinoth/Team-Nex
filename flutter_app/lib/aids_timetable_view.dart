// ignore_for_file: deprecated_member_use, unnecessary_underscores
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AidsTimetableFlutterView extends StatefulWidget {
  const AidsTimetableFlutterView({super.key});

  @override
  State<AidsTimetableFlutterView> createState() => _AidsTimetableFlutterViewState();
}

class _AidsTimetableFlutterViewState extends State<AidsTimetableFlutterView> {
  String _selectedDay = 'Monday';

  final List<String> _days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  final List<Map<String, dynamic>> _timings = [
    {'id': 'P1', 'num': 1, 'label': 'Period 1', 'time': '9:00 AM – 9:50 AM', 'isBreak': false},
    {'id': 'P2', 'num': 2, 'label': 'Period 2', 'time': '9:50 AM – 10:40 AM', 'isBreak': false},
    {'id': 'MB', 'num': 0, 'label': 'Morning Break', 'time': '10:40 AM – 10:55 AM', 'isBreak': true},
    {'id': 'P3', 'num': 3, 'label': 'Period 3', 'time': '10:55 AM – 11:45 AM', 'isBreak': false},
    {'id': 'P4', 'num': 4, 'label': 'Period 4', 'time': '11:45 AM – 12:35 PM', 'isBreak': false},
    {'id': 'LB', 'num': 0, 'label': 'Lunch Break', 'time': '12:35 PM – 1:15 PM', 'isBreak': true},
    {'id': 'P5', 'num': 5, 'label': 'Period 5', 'time': '1:15 PM – 2:05 PM', 'isBreak': false},
    {'id': 'P6', 'num': 6, 'label': 'Period 6', 'time': '2:05 PM – 2:55 PM', 'isBreak': false},
    {'id': 'EB', 'num': 0, 'label': 'Evening Break', 'time': '2:55 PM – 3:05 PM', 'isBreak': true},
    {'id': 'P7', 'num': 7, 'label': 'Period 7', 'time': '3:05 PM – 3:55 PM', 'isBreak': false},
    {'id': 'P8', 'num': 8, 'label': 'Period 8', 'time': '3:55 PM – 4:45 PM', 'isBreak': false},
  ];

  late Map<String, Map<int, Map<String, String>>> _schedule;

  final List<Map<String, dynamic>> _subjects = [
    {
      'code': 'AI8701',
      'abbrev': 'HVE',
      'name': 'Human Values and Ethics',
      'faculty': 'Faculty In-charge (Please Verify)',
      'periods': 4,
      'color': const Color(0xFFF59E0B),
      'bg': const Color(0xFFFEF3C7),
    },
    {
      'code': 'AI8702',
      'abbrev': 'ITA',
      'name': 'IT in Agricultural System',
      'faculty': 'Faculty In-charge (Please Verify)',
      'periods': 4,
      'color': const Color(0xFF10B981),
      'bg': const Color(0xFFD1FAE5),
    },
    {
      'code': 'AI8703',
      'abbrev': 'HRM',
      'name': 'Human Resource Management',
      'faculty': 'Faculty In-charge (Please Verify)',
      'periods': 4,
      'color': const Color(0xFF06B6D4),
      'bg': const Color(0xFFCFFAFE),
    },
    {
      'code': 'AI8704',
      'abbrev': 'RET',
      'name': 'Renewable Energy Technologies',
      'faculty': 'Faculty In-charge (Please Verify)',
      'periods': 4,
      'color': const Color(0xFF8B5CF6),
      'bg': const Color(0xFFEDE9FE),
    },
    {
      'code': 'AI8711',
      'abbrev': 'PP (KT)',
      'name': 'Project Preparation',
      'faculty': 'Dr. K. T. (Please Verify)',
      'periods': 3,
      'color': const Color(0xFF4F46E5),
      'bg': const Color(0xFFE0E7FF),
    },
    {
      'code': 'AI8712',
      'abbrev': 'PP (TRV)',
      'name': 'Project Preparation',
      'faculty': 'Dr. T. R. V. (Please Verify)',
      'periods': 3,
      'color': const Color(0xFF2563EB),
      'bg': const Color(0xFFDBEAFE),
    },
  ];

  final List<Map<String, dynamic>> _activities = [
    {
      'activity': 'Placement & Soft Skill Development',
      'faculty': 'Training & Placement Officer / Aptitude Trainer (Please Verify)',
      'periods': 4,
      'timing': 'Wed P5-P6, Thu P7-P8, Sat P5',
      'color': const Color(0xFFF43F5E),
    },
    {
      'activity': 'Soft Skills Development',
      'faculty': 'Soft Skills Trainer (Please Verify)',
      'periods': 2,
      'timing': 'Tue P7-P8, Sat P6',
      'color': const Color(0xFFD946EF),
    },
    {
      'activity': 'Library (LIB)',
      'faculty': 'Librarian / Staff In-charge (Please Verify)',
      'periods': 1,
      'timing': 'Mon P7, Sat P8',
      'color': const Color(0xFF0284C7),
    },
    {
      'activity': 'Project Preparation (PP)',
      'faculty': 'Dr. K. T. & Dr. T. R. V. (Please Verify)',
      'periods': 6,
      'timing': 'Mon P5-P6, Tue P5-P6, Thu P5-P6',
      'color': const Color(0xFF6366F1),
    },
    {
      'activity': 'Mentor Hour',
      'faculty': 'Class Mentor / Advisor (Please Verify)',
      'periods': 1,
      'timing': 'Mon P8, Sat P8',
      'color': const Color(0xFFEA580C),
    },
    {
      'activity': 'Value Added Course (VAC)',
      'faculty': 'Industry Expert / Faculty In-charge (Please Verify)',
      'periods': 3,
      'timing': 'Wed P7-P8, Fri P5-P6',
      'color': const Color(0xFF059669),
    },
    {
      'activity': 'Club Activities',
      'faculty': 'AI&DS Technical Club Coordinator (Please Verify)',
      'periods': 2,
      'timing': 'Fri P7-P8',
      'color': const Color(0xFF0D9488),
    },
  ];

  @override
  void initState() {
    super.initState();
    _initDefaultSchedule();
  }

  void _initDefaultSchedule() {
    _schedule = {
      'Monday': {
        1: {'subject': 'HVE', 'name': 'Human Values and Ethics', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        2: {'subject': 'ITA', 'name': 'IT in Agricultural System', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        3: {'subject': 'HRM', 'name': 'Human Resource Management', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        4: {'subject': 'RET', 'name': 'Renewable Energy Technologies', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        5: {'subject': 'PP (KT)', 'name': 'Project Preparation', 'faculty': 'Dr. K. T. (Please Verify)', 'room': 'B 316'},
        6: {'subject': 'PP (KT)', 'name': 'Project Preparation', 'faculty': 'Dr. K. T. (Please Verify)', 'room': 'B 316'},
        7: {'subject': 'LIB', 'name': 'Library', 'faculty': 'Librarian (Please Verify)', 'room': 'B 316'},
        8: {'subject': 'Mentor', 'name': 'Mentoring Hour', 'faculty': 'Class Mentor (Please Verify)', 'room': 'B 316'},
      },
      'Tuesday': {
        1: {'subject': 'ITA', 'name': 'IT in Agricultural System', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        2: {'subject': 'HRM', 'name': 'Human Resource Management', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        3: {'subject': 'RET', 'name': 'Renewable Energy Technologies', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        4: {'subject': 'HVE', 'name': 'Human Values and Ethics', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        5: {'subject': 'PP (TRV)', 'name': 'Project Preparation', 'faculty': 'Dr. T. R. V. (Please Verify)', 'room': 'B 316'},
        6: {'subject': 'PP (TRV)', 'name': 'Project Preparation', 'faculty': 'Dr. T. R. V. (Please Verify)', 'room': 'B 316'},
        7: {'subject': 'Soft Skills', 'name': 'Soft Skills Development', 'faculty': 'Trainer (Please Verify)', 'room': 'B 316'},
        8: {'subject': 'Soft Skills', 'name': 'Soft Skills Development', 'faculty': 'Trainer (Please Verify)', 'room': 'B 316'},
      },
      'Wednesday': {
        1: {'subject': 'HRM', 'name': 'Human Resource Management', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        2: {'subject': 'RET', 'name': 'Renewable Energy Technologies', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        3: {'subject': 'HVE', 'name': 'Human Values and Ethics', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        4: {'subject': 'ITA', 'name': 'IT in Agricultural System', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        5: {'subject': 'Placement', 'name': 'Placement & Aptitude Training', 'faculty': 'Placement Cell (Please Verify)', 'room': 'B 316'},
        6: {'subject': 'Placement', 'name': 'Placement & Aptitude Training', 'faculty': 'Placement Cell (Please Verify)', 'room': 'B 316'},
        7: {'subject': 'Value Added Course', 'name': 'Value Added Course', 'faculty': 'Coordinator (Please Verify)', 'room': 'B 316'},
        8: {'subject': 'Value Added Course', 'name': 'Value Added Course', 'faculty': 'Coordinator (Please Verify)', 'room': 'B 316'},
      },
      'Thursday': {
        1: {'subject': 'RET', 'name': 'Renewable Energy Technologies', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        2: {'subject': 'HVE', 'name': 'Human Values and Ethics', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        3: {'subject': 'ITA', 'name': 'IT in Agricultural System', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        4: {'subject': 'HRM', 'name': 'Human Resource Management', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        5: {'subject': 'PP (KT)', 'name': 'Project Preparation', 'faculty': 'Dr. K. T. (Please Verify)', 'room': 'B 316'},
        6: {'subject': 'PP (TRV)', 'name': 'Project Preparation', 'faculty': 'Dr. T. R. V. (Please Verify)', 'room': 'B 316'},
        7: {'subject': 'Placement', 'name': 'Placement Training', 'faculty': 'Placement Cell (Please Verify)', 'room': 'B 316'},
        8: {'subject': 'Placement', 'name': 'Placement Training', 'faculty': 'Placement Cell (Please Verify)', 'room': 'B 316'},
      },
      'Friday': {
        1: {'subject': 'ITA', 'name': 'IT in Agricultural System', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        2: {'subject': 'HRM', 'name': 'Human Resource Management', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        3: {'subject': 'RET', 'name': 'Renewable Energy Technologies', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        4: {'subject': 'HVE', 'name': 'Human Values and Ethics', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        5: {'subject': 'Value Added Course', 'name': 'Value Added Course', 'faculty': 'Coordinator (Please Verify)', 'room': 'B 316'},
        6: {'subject': 'Value Added Course', 'name': 'Value Added Course', 'faculty': 'Coordinator (Please Verify)', 'room': 'B 316'},
        7: {'subject': 'Club Activities', 'name': 'Technical & Club Activities', 'faculty': 'Club In-charge (Please Verify)', 'room': 'B 316'},
        8: {'subject': 'Club Activities', 'name': 'Technical & Club Activities', 'faculty': 'Club In-charge (Please Verify)', 'room': 'B 316'},
      },
      'Saturday': {
        1: {'subject': 'HRM', 'name': 'Human Resource Management', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        2: {'subject': 'RET', 'name': 'Renewable Energy Technologies', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        3: {'subject': 'HVE', 'name': 'Human Values and Ethics', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        4: {'subject': 'ITA', 'name': 'IT in Agricultural System', 'faculty': 'Faculty In-charge (Please Verify)', 'room': 'B 316'},
        5: {'subject': 'Placement', 'name': 'Placement & Aptitude Test', 'faculty': 'Placement Cell (Please Verify)', 'room': 'B 316'},
        6: {'subject': 'Soft Skills', 'name': 'Soft Skills / Mock Interview', 'faculty': 'Trainer (Please Verify)', 'room': 'B 316'},
        7: {'subject': 'PP (KT)', 'name': 'Project Preparation Seminar', 'faculty': 'Dr. K. T. (Please Verify)', 'room': 'B 316'},
        8: {'subject': 'LIB', 'name': 'Library & Mentoring Hour', 'faculty': 'Librarian / Mentor (Please Verify)', 'room': 'B 316'},
      },
    };
  }

  Color _getSubjectColor(String abbrev) {
    for (var s in _subjects) {
      if (s['abbrev'].toString().toLowerCase() == abbrev.toLowerCase()) {
        return s['color'] as Color;
      }
    }
    for (var a in _activities) {
      if (a['activity'].toString().toLowerCase().contains(abbrev.toLowerCase())) {
        return a['color'] as Color;
      }
    }
    return const Color(0xFF64748B);
  }

  void _editSlot(String day, int period) {
    final current = _schedule[day]?[period] ?? {'subject': '—', 'name': '', 'faculty': '', 'room': 'B 316'};
    final subCtrl = TextEditingController(text: current['subject']);
    final nameCtrl = TextEditingController(text: current['name']);
    final facCtrl = TextEditingController(text: current['faculty']);
    final roomCtrl = TextEditingController(text: current['room'] ?? 'B 316');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Edit $day — Period $period'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Quick Select Subject / Activity'),
                items: [
                  ..._subjects.map((s) => DropdownMenuItem(
                        value: s['abbrev'] as String,
                        child: Text('${s['abbrev']} — ${s['name']}'),
                      )),
                  ..._activities.map((a) => DropdownMenuItem(
                        value: a['activity'] as String,
                        child: Text(a['activity'] as String),
                      )),
                ],
                onChanged: (val) {
                  if (val == null) return;
                  final matchSub = _subjects.firstWhere((s) => s['abbrev'] == val, orElse: () => {});
                  if (matchSub.isNotEmpty) {
                    subCtrl.text = matchSub['abbrev'];
                    nameCtrl.text = matchSub['name'];
                    facCtrl.text = matchSub['faculty'];
                  } else {
                    final matchAct = _activities.firstWhere((a) => a['activity'] == val, orElse: () => {});
                    if (matchAct.isNotEmpty) {
                      subCtrl.text = matchAct['activity'];
                      nameCtrl.text = matchAct['activity'];
                      facCtrl.text = matchAct['faculty'];
                    }
                  }
                },
              ),
              const SizedBox(height: 10),
              TextField(controller: subCtrl, decoration: const InputDecoration(labelText: 'Abbreviation')),
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Full Subject Name')),
              TextField(controller: facCtrl, decoration: const InputDecoration(labelText: 'Faculty In-Charge')),
              TextField(controller: roomCtrl, decoration: const InputDecoration(labelText: 'Classroom / Lab')),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _schedule[day]?[period] = {
                  'subject': 'Free',
                  'name': 'Free Period / Self-Study',
                  'faculty': '—',
                  'room': 'B 316',
                };
              });
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Cleared Period $period on $day')));
            },
            child: const Text('Clear', style: TextStyle(color: Colors.red)),
          ),
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _schedule[day]?[period] = {
                  'subject': subCtrl.text.trim(),
                  'name': nameCtrl.text.trim(),
                  'faculty': facCtrl.text.trim(),
                  'room': roomCtrl.text.trim().isEmpty ? 'B 316' : roomCtrl.text.trim(),
                };
              });
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Updated $day Period $period')));
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showPromptDialog() {
    const prompt = '''Institution Details:
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
- Club Activities''';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Official Timetable Prompt Reference'),
        content: const SingleChildScrollView(
          child: SelectableText(prompt, style: TextStyle(fontFamily: 'monospace', fontSize: 12)),
        ),
        actions: [
          TextButton.icon(
            onPressed: () {
              Clipboard.setData(const ClipboardData(text: prompt));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Prompt copied to clipboard!')));
            },
            icon: const Icon(Icons.copy, size: 16),
            label: const Text('Copy Prompt'),
          ),
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final daySchedule = _schedule[_selectedDay] ?? {};

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Institutional Header Card
        Card(
          color: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFF59E0B), width: 1.2),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.asset(
                        'assets/info_institute_logo.jpg',
                        width: 50,
                        height: 50,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 50,
                          height: 50,
                          color: const Color(0xFFF59E0B),
                          child: const Icon(Icons.school, color: Colors.white, size: 28),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'INFO INSTITUTE OF ENGINEERING',
                            style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'DEPARTMENT OF AI&DS · SEMESTER VII',
                            style: TextStyle(color: Color(0xFF38BDF8), fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            'Classroom: B 316 · AY: 2026–2027 · Eff: 16-07-2026',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Timetable changes saved successfully!')),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      icon: const Icon(Icons.save, size: 16),
                      label: const Text('Save Changes', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                    OutlinedButton.icon(
                      onPressed: _showPromptDialog,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFF59E0B),
                        side: const BorderSide(color: Color(0xFFF59E0B)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      icon: const Icon(Icons.info_outline, size: 16),
                      label: const Text('Prompt Specs', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                    TextButton.icon(
                      onPressed: () {
                        setState(() => _initDefaultSchedule());
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Reset timetable to official college defaults')),
                        );
                      },
                      style: TextButton.styleFrom(foregroundColor: const Color(0xFFCBD5E1)),
                      icon: const Icon(Icons.restart_alt, size: 16),
                      label: const Text('Reset', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Day Selector Tabs
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _days.map((day) {
              final isSel = _selectedDay == day;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(day, style: TextStyle(fontWeight: FontWeight.bold, color: isSel ? Colors.white : Colors.black87)),
                  selected: isSel,
                  selectedColor: const Color(0xFF2563EB),
                  onSelected: (selected) {
                    if (selected) setState(() => _selectedDay = day);
                  },
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 14),

        // Period List for selected day
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('$_selectedDay Schedule', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const Text('Tap any slot to edit', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  ],
                ),
                const Divider(),
                ..._timings.map((t) {
                  final isBreak = t['isBreak'] as bool;
                  if (isBreak) {
                    final label = t['id'] == 'MB' ? 'TEA BREAK (15 MIN)' : t['id'] == 'LB' ? 'LUNCH BREAK (40 MIN)' : 'BREAK (10 MIN)';
                    return Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Icon(t['id'] == 'LB' ? Icons.restaurant : Icons.coffee, size: 16, color: const Color(0xFF64748B)),
                          const SizedBox(width: 8),
                          Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF64748B))),
                          const Spacer(),
                          Text(t['time'] as String, style: const TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8))),
                        ],
                      ),
                    );
                  }

                  final pNum = t['num'] as int;
                  final slot = daySchedule[pNum] ?? {'subject': '—', 'name': 'Free', 'faculty': '—', 'room': 'B 316'};
                  final color = _getSubjectColor(slot['subject'] ?? '');

                  return Card(
                    elevation: 0,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: BorderSide(color: color.withOpacity(0.5), width: 1.2),
                    ),
                    color: color.withOpacity(0.06),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: () => _editSlot(_selectedDay, pNum),
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(6)),
                              alignment: Alignment.center,
                              child: Text(
                                'P$pNum',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        slot['subject'] ?? '—',
                                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                        decoration: BoxDecoration(
                                          color: Colors.black12,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          slot['room'] ?? 'B 316',
                                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    slot['name'] ?? '',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF334155)),
                                  ),
                                  Text(
                                    '👨‍🏫 ${slot['faculty']}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: slot['faculty']!.contains('Verify') ? const Color(0xFFD97706) : const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(t['time'] as String, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                const Icon(Icons.chevron_right, size: 16, color: Color(0xFF94A3B8)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Subject Information Table Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('📚 Subject Information Table', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                ..._subjects.map((s) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: s['bg'] as Color, borderRadius: BorderRadius.circular(4)),
                            child: Text(s['abbrev'] as String, style: TextStyle(fontWeight: FontWeight.bold, color: s['color'] as Color, fontSize: 11)),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${s['code']} · ${s['name']}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                Text(s['faculty'] as String, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(10)),
                            child: Text('${s['periods']} Periods', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8))),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Other Academic Activities Table Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('✨ Other Academic Activities', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                ..._activities.map((a) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(a['activity'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(color: const Color(0xFFFDF2F8), borderRadius: BorderRadius.circular(10)),
                                child: Text('${a['periods']} Periods', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: a['color'] as Color)),
                              ),
                            ],
                          ),
                          Text('Faculty: ${a['faculty']}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                          Text('Timing: ${a['timing']}', style: const TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8))),
                          const Divider(height: 8),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
