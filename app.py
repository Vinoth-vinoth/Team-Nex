from flask import Flask, render_template, request, redirect, url_for, flash
import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG
from timetable_engine import generate_timetable, get_schema_summary

app = Flask(__name__)
app.secret_key = "change-this-local-development-key"

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

@app.route("/")
def index():
    try:
        conn = get_connection()
        schema = get_schema_summary(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS n FROM timetable_entries")
        entry_count = cursor.fetchone()["n"]
        cursor.execute("SELECT COUNT(*) AS n FROM faculty")
        faculty_count = cursor.fetchone()["n"]
        cursor.execute("SELECT COUNT(*) AS n FROM subjects")
        subject_count = cursor.fetchone()["n"]
        cursor.execute("SELECT COUNT(*) AS n FROM sections")
        section_count = cursor.fetchone()["n"]
        cursor.execute("SELECT COUNT(*) AS n FROM rooms")
        room_count = cursor.fetchone()["n"]
        cursor.close()
        conn.close()
        return render_template("index.html", schema=schema, entry_count=entry_count,
                               faculty_count=faculty_count, subject_count=subject_count,
                               section_count=section_count, room_count=room_count)
    except Error as e:
        return render_template("error.html", message=str(e),
            hint="Check config.py: MySQL should be running, database intelligent_timetable should exist, and username/password must match MySQL Workbench.")

@app.route("/rooms", methods=["GET", "POST"])
def rooms():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        if request.method == "POST":
            code = request.form.get("room_code", "").strip()
            room_type = request.form.get("room_type", "CLASSROOM").strip().upper()
            capacity = request.form.get("capacity", "60").strip()
            if not code:
                flash("Room code is required.", "error")
            else:
                try:
                    cursor.execute(
                        "INSERT INTO rooms (room_code, room_type, capacity, is_available) VALUES (%s, %s, %s, 1)",
                        (code, room_type, int(capacity))
                    )
                    conn.commit()
                    flash(f"Room {code} added.", "success")
                except Error as e:
                    conn.rollback()
                    flash(f"Could not add room: {e}", "error")
            cursor.close()
            conn.close()
            return redirect(url_for("rooms"))
        cursor.execute("SELECT * FROM rooms ORDER BY id")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template("rooms.html", rooms=rows)
    except Error as e:
        return render_template("error.html", message=str(e), hint="Confirm the rooms table has room_code, room_type, capacity and is_available columns.")

@app.route("/generate", methods=["POST"])
def generate():
    try:
        conn = get_connection()
        result = generate_timetable(conn)
        conn.close()
        flash(result, "success")
    except Exception as e:
        flash(str(e), "error")
    return redirect(url_for("index"))

@app.route("/timetable")
def timetable():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
        SELECT te.id, te.is_lab,
               s.section_name, sub.subject_name, f.faculty_name,
               r.room_code, wd.day_name, ts.start_time, ts.end_time
        FROM timetable_entries te
        LEFT JOIN sections s ON s.id = te.section_id
        LEFT JOIN subjects sub ON sub.id = te.subject_id
        LEFT JOIN faculty f ON f.id = te.faculty_id
        LEFT JOIN rooms r ON r.id = te.room_id
        LEFT JOIN working_days wd ON wd.id = te.working_day_id
        LEFT JOIN time_slots ts ON ts.id = te.time_slot_id
        ORDER BY te.working_day_id, te.time_slot_id, te.section_id
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template("timetable.html", rows=rows)
    except Error as e:
        return render_template("error.html", message=str(e),
            hint="This view expects section_name, subject_name, faculty_name, day_name, start_time and end_time columns. If your columns have different names, share DESCRIBE results and the query can be adjusted.")

@app.route("/clear", methods=["POST"])
def clear():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM timetable_entries")
        conn.commit()
        cursor.close()
        conn.close()
        flash("Timetable entries cleared.", "success")
    except Error as e:
        flash(f"Could not clear timetable: {e}", "error")
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
