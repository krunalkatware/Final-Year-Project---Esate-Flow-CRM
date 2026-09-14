import sqlite3
import os

db_path = "estateflow.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(bookings)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    print(f"Existing columns in bookings: {existing_cols}")

    columns_to_add = [
        ("customer_name", "VARCHAR(255)"),
        ("customer_email", "VARCHAR(255)"),
        ("customer_phone", "VARCHAR(50)"),
        ("customer_address", "TEXT"),
        ("preferred_visit_date", "DATETIME"),
        ("visit_time_slot", "VARCHAR(50)"),
        ("special_requirements", "TEXT"),
    ]

    for col_name, col_type in columns_to_add:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_type}")
                print(f"Added column {col_name} ({col_type}) to bookings table")
            except Exception as e:
                print(f"Could not add column {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Booking table migration completed successfully!")
