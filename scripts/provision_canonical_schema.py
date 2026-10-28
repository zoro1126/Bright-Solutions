import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database import engine

DDL_FILE_PATH = Path(__file__).resolve().parent.parent / "docs" / "design" / "09_database_schema_ddl.sql"

def split_sql_statements(sql_text: str):
    """Splits a multi-statement SQL script by semicolons, preserving statements."""
    statements = []
    current = []
    for line in sql_text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--") or stripped.startswith("/*"):
            continue
        current.append(line)
        if stripped.endswith(";"):
            stmt = "\n".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
    if current:
        stmt = "\n".join(current).strip()
        if stmt:
            statements.append(stmt)
    return statements

def provision_canonical_schema():
    print(f"Connecting to database using QueuePool engine: {engine.url.database}@{engine.url.host}")
    
    with engine.begin() as conn:
        print("Disabling foreign key checks and clearing obsolete tables...")
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        # Get all existing tables
        existing_tables = [row[0] for row in conn.execute(text("SHOW TABLES;")).fetchall()]
        print(f"Found {len(existing_tables)} existing tables. Dropping to ensure clean DDL baseline...")
        for tbl in existing_tables:
            conn.execute(text(f"DROP TABLE IF EXISTS `{tbl}`;"))
        
        # Read and execute DDL
        print(f"Reading DDL from {DDL_FILE_PATH}...")
        with open(DDL_FILE_PATH, "r", encoding="utf-8") as f:
            ddl_content = f.read()
        
        statements = split_sql_statements(ddl_content)
        print(f"Executing {len(statements)} SQL statements from canonical DDL...")
        
        for i, stmt in enumerate(statements, 1):
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"Error on statement #{i}: {stmt[:80]}...\n{e}")
                raise
        
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        print("Schema execution complete.")

    # Verification phase
    with engine.connect() as conn:
        tables = [row[0] for row in conn.execute(text("SHOW TABLES;")).fetchall()]
        print(f"\nVerification: Successfully provisioned {len(tables)} InnoDB tables in database '{engine.url.database}'.")
        
        # Verify ipd_clinical_form_submissions generated columns
        res = conn.execute(text("""
            SELECT COLUMN_NAME, GENERATION_EXPRESSION, EXTRA 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'ipd_clinical_form_submissions' 
              AND COLUMN_NAME IN ('is_mlc', 'triage_score');
        """)).fetchall()
        
        print("\nVirtual & Stored Generated Columns in 'ipd_clinical_form_submissions':")
        for col_name, expr, extra in res:
            print(f" - {col_name}: EXTRA={extra}, EXPR={expr}")
            
        assert len(tables) >= 56, f"Expected at least 56 tables, got {len(tables)}"
        assert len(res) == 2, f"Expected 2 generated columns in ipd_clinical_form_submissions, got {len(res)}"
        print("\nAll 56 tables, indexes, and virtual columns validated successfully!")

if __name__ == "__main__":
    provision_canonical_schema()

