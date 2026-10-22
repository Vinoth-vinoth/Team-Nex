from mysql.connector import Error

WORKING_DAY_NAMES = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}

def columns(cursor, table):
    cursor.execute(f"SHOW COLUMNS FROM `{table}`")
    return {row[0] for row in cursor.fetchall()}

def first_match(existing, options):
    for option in options:
        if option in existing:
            return option
    return None

def get_schema_summary(conn):
    cur = conn.cursor()
    tables = ["faculty", "subjects", "sections", "rooms", "faculty_subjects",
              "time_slots", "working_days", "faculty_availability", "scheduling_rules",
              "timetable_entries"]
    result = []
    for table in tables:
        try:
            cur.execute(f"SELECT COUNT(*) FROM `{table}`")
            count = cur.fetchone()[0]
            result.append({"name": table, "count": count, "exists": True})
        except Error:
            result.append({"name": table, "count": "—", "exists": False})
    cur.close()
    return result

def generate_timetable(conn):
    """
    Greedy timetable builder for the schema shown in the user's MySQL screenshot.
    It reads existing records and writes timetable_entries, preventing section,
    faculty, and room clashes. It does not invent missing subjects or faculty mappings.
    """
    cur = conn.cursor(dictionary=True)
    try:
        # Ensure all required base tables are populated.
        for table in ("faculty", "subjects", "sections", "rooms", "faculty_subjects",
                      "time_slots", "working_days", "timetable_entries"):
            cur.execute(f"SELECT COUNT(*) AS n FROM `{table}`")
            count = cur.fetchone()["n"]
            if count == 0:
                raise ValueError(f"Table '{table}' is empty. Add its real data before generating a timetable.")

        cur.execute("SELECT * FROM sections ORDER BY id")
        sections = cur.fetchall()
        cur.execute("SELECT * FROM subjects ORDER BY id")
        subjects = cur.fetchall()
        cur.execute("SELECT * FROM faculty ORDER BY id")
        faculty = cur.fetchall()
        cur.execute("SELECT * FROM rooms WHERE is_available = 1 ORDER BY id")
        rooms = cur.fetchall()
        cur.execute("SELECT * FROM time_slots ORDER BY id")
        slots = [slot for slot in cur.fetchall() if slot.get("slot_type") == "PERIOD"]
        cur.execute("SELECT * FROM working_days ORDER BY id")
        days = [
            day for day in cur.fetchall()
            if day.get("is_working") and day.get("day_name") in WORKING_DAY_NAMES
        ]
        cur.execute("SELECT * FROM faculty_subjects")
        mappings = cur.fetchall()

        if not rooms:
            raise ValueError("No available rooms found. Add rooms on the Rooms page first.")
        if not slots or not days:
            raise ValueError("Add time slots and working days first.")

        # Find commonly used schema names without requiring a specific display-label format.
        section_cols = set(sections[0].keys())
        subject_cols = set(subjects[0].keys())
        mapping_cols = set(mappings[0].keys())
        subject_id_col = first_match(mapping_cols, ["subject_id"])
        faculty_id_col = first_match(mapping_cols, ["faculty_id"])
        if not subject_id_col or not faculty_id_col:
            raise ValueError("faculty_subjects must contain faculty_id and subject_id columns.")

        # Subject weekly hours/periods: default to one period per subject per section.
        hours_col = first_match(subject_cols, ["weekly_hours", "hours_per_week", "periods_per_week", "weekly_periods"])
        subject_name_col = first_match(subject_cols, ["subject_name", "name", "subject_code", "code"])
        room_type_col = "room_type" if "room_type" in rooms[0] else None
        room_code_col = "room_code" if "room_code" in rooms[0] else None

        # Use real faculty-subject mappings.
        eligible = {}
        for m in mappings:
            eligible.setdefault(m[subject_id_col], []).append(m[faculty_id_col])
        faculty_ids = {f["id"] for f in faculty}
        subject_ids = {s["id"] for s in subjects}
        eligible = {sid: [fid for fid in fids if fid in faculty_ids]
                    for sid, fids in eligible.items() if sid in subject_ids}

        # Respect section-specific subject lists if section_subjects exists; otherwise schedule all subjects.
        section_subjects = None
        try:
            cur.execute("SELECT * FROM section_subjects")
            ss = cur.fetchall()
            if ss and "section_id" in ss[0] and "subject_id" in ss[0]:
                section_subjects = {}
                for item in ss:
                    section_subjects.setdefault(item["section_id"], set()).add(item["subject_id"])
        except Error:
            pass

        # Don't silently duplicate a timetable: replace old generated rows in one transaction.
        cur.execute("DELETE FROM timetable_entries")
        used_section = set()
        used_faculty = set()
        used_room = set()
        inserted = 0
        unplaced = []
        day_ids = [d["id"] for d in days]
        slot_ids = [s["id"] for s in slots]

        # Try to place each subject once for each section; use weekly hours when available.
        for section in sections:
            section_id = section["id"]
            for subject in subjects:
                sid = subject["id"]
                if section_subjects is not None and sid not in section_subjects.get(section_id, set()):
                    continue
                candidates = eligible.get(sid, [])
                if not candidates:
                    label = subject.get(subject_name_col, sid) if subject_name_col else sid
                    unplaced.append(f"{section_id}:{label} (no faculty mapping)")
                    continue
                try:
                    repeats = int(subject.get(hours_col, 1) or 1) if hours_col else 1
                except (ValueError, TypeError):
                    repeats = 1
                repeats = max(1, min(repeats, len(day_ids) * len(slot_ids)))
                for _ in range(repeats):
                    placed = False
                    for day_id in day_ids:
                        if placed: break
                        for slot_id in slot_ids:
                            if placed: break
                            if (section_id, day_id, slot_id) in used_section:
                                continue
                            for fid in candidates:
                                if (fid, day_id, slot_id) in used_faculty:
                                    continue
                                for room in rooms:
                                    rid = room["id"]
                                    if (rid, day_id, slot_id) in used_room:
                                        continue
                                    # Insert using the known timetable_entries schema.
                                    cur.execute("""
                                        INSERT INTO timetable_entries
                                        (section_id, subject_id, faculty_id, room_id,
                                         working_day_id, time_slot_id, is_lab)
                                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                                    """, (section_id, sid, fid, rid, day_id, slot_id, 0))
                                    used_section.add((section_id, day_id, slot_id))
                                    used_faculty.add((fid, day_id, slot_id))
                                    used_room.add((rid, day_id, slot_id))
                                    inserted += 1
                                    placed = True
                                    break
                                if placed: break
                    if not placed:
                        label = subject.get(subject_name_col, sid) if subject_name_col else sid
                        unplaced.append(f"{section_id}:{label} (no free slot/room/faculty)")
        conn.commit()
        msg = f"Generated {inserted} timetable entries. Faculty, room, and section clashes were avoided."
        if unplaced:
            msg += f" {len(unplaced)} subject-period(s) could not be placed; check mappings, rooms, and available slots."
        return msg
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
