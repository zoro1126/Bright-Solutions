"""
Global Pytest Configuration and Test Isolation Fixtures
"""

import pytest
from sqlalchemy import text
from app.core.database import engine


@pytest.fixture(autouse=True)
def ensure_clean_bed_states():
    """
    Ensures beds in the shared test database are in AVAILABLE state
    so tests never encounter depleted or collided beds.
    """
    with engine.begin() as conn:
        conn.execute(text("UPDATE beds SET status = 'AVAILABLE'"))
    yield
    with engine.begin() as conn:
        conn.execute(text("UPDATE beds SET status = 'AVAILABLE'"))
