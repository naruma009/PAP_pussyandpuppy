import sqlite3
from collections.abc import Iterator
from pathlib import Path

from fastapi import Request


def connect(database_path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(database_path, timeout=5, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database(database_path: Path) -> None:
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = connect(database_path)
    try:
        schema_path = Path(__file__).with_name("schema.sql")
        connection.executescript(schema_path.read_text(encoding="utf-8"))
        connection.commit()
    finally:
        connection.close()


def get_db(request: Request) -> Iterator[sqlite3.Connection]:
    connection = connect(request.app.state.settings.database_path)
    try:
        yield connection
    finally:
        connection.close()
