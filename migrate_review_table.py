import sqlite3
import os

db_path = "estateflow.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(reviews)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    print(f"Existing columns in reviews: {existing_cols}")

    columns_to_add = [
        ("builder_id", "INTEGER"),
        ("booking_id", "INTEGER"),
        ("site_visit_id", "INTEGER"),
        ("lead_id", "INTEGER"),
        ("status", "VARCHAR(20) DEFAULT 'approved'"),
        ("sentiment_score", "FLOAT DEFAULT 0.0"),
        ("sentiment_label", "VARCHAR(20) DEFAULT 'neutral'"),
        ("is_spam", "BOOLEAN DEFAULT 0"),
        ("spam_score", "FLOAT DEFAULT 0.0"),
        ("spam_flags", "TEXT"),
        ("helpful_count", "INTEGER DEFAULT 0"),
        ("unhelpful_count", "INTEGER DEFAULT 0"),
        ("reports_count", "INTEGER DEFAULT 0"),
        ("moderated_by_id", "INTEGER"),
        ("moderated_at", "DATETIME"),
        ("moderation_note", "TEXT"),
        ("is_deleted", "BOOLEAN DEFAULT 0"),
        ("deleted_at", "DATETIME")
    ]

    for col_name, col_type in columns_to_add:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE reviews ADD COLUMN {col_name} {col_type}")
                print(f"Added column {col_name} ({col_type}) to reviews table")
            except Exception as e:
                print(f"Could not add column {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration completed successfully!")
