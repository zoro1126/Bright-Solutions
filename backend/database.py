"""
Forward compatibility shim for legacy imports.
Actual database connection and schema initialization reside in app.core.database.
"""
from app.core.database import (
    get_connection,
    init_db,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
)

__all__ = [
    "get_connection",
    "init_db",
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME"
]
