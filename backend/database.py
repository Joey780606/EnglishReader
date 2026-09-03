import sqlite3
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATABASE_PATH = DATA_DIR / "app.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT,
    format TEXT NOT NULL,
    last_read_page INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    slot INTEGER NOT NULL CHECK(slot IN (1, 2, 3)),
    page_number INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, slot)
);

CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    english_word TEXT NOT NULL,
    chinese_meanings TEXT NOT NULL,
    part_of_speech TEXT,
    example_sentence TEXT,
    importance INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    source_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.execute("PRAGMA foreign_keys = ON")
    connection.row_factory = sqlite3.Row
    return connection


def init_database() -> None:
    connection = get_connection()
    try:
        connection.executescript(SCHEMA)
        _migrate_add_content_hash(connection)
        _migrate_add_last_read_page(connection)
        connection.commit()
    finally:
        connection.close()


def _migrate_add_content_hash(connection: sqlite3.Connection) -> None:
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(documents)")}
    if "content_hash" not in columns:
        connection.execute("ALTER TABLE documents ADD COLUMN content_hash TEXT")


def _migrate_add_last_read_page(connection: sqlite3.Connection) -> None:
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(documents)")}
    if "last_read_page" not in columns:
        connection.execute("ALTER TABLE documents ADD COLUMN last_read_page INTEGER NOT NULL DEFAULT 1")
