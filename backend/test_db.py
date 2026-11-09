#!/usr/bin/env python3
"""Test database connection directly."""

import os
import sys
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

# Load .env
load_dotenv(Path(__file__).parent / ".env")

# Check environment
db_url = os.getenv("DATABASE_URL", "").strip()
print(f"✓ DATABASE_URL loaded: {db_url[:80]}...")

if not db_url:
    print("❌ ERROR: DATABASE_URL not found in .env!")
    sys.exit(1)

# Try connecting
print("\nAttempting database connection...")
try:
    from psycopg import connect
    with connect(db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            result = cur.fetchone()
            print(f"✓ Database connection successful! Got: {result}")
except ModuleNotFoundError:
    print("❌ ERROR: psycopg not installed. Run: pip install -r requirements.txt")
    sys.exit(1)
except Exception as e:
    print(f"❌ ERROR: Failed to connect to database:")
    print(f"   {type(e).__name__}: {e}")
    sys.exit(1)

print("\n✓ All checks passed! Database is ready.")
