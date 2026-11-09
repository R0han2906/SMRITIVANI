#!/usr/bin/env python3
"""
Run migration 0004_device_pairing_voice.sql directly via psycopg.
This bypasses migrate.py conflicts with existing tables.
"""
import os
import sys
import psycopg
from pathlib import Path

def load_env():
    """Load .env file into environment variables."""
    env_path = Path('.env')
    if not env_path.exists():
        print("ERROR: .env file not found")
        sys.exit(1)
    
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

def run_migration():
    # Load environment from .env
    load_env()
    
    # Read environment
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)
    
    # Read migration SQL
    migration_path = 'schema/migrations/0004_device_pairing_voice.sql'
    if not os.path.exists(migration_path):
        print(f"ERROR: Migration file not found: {migration_path}")
        sys.exit(1)
    
    with open(migration_path, 'r') as f:
        sql = f.read()
    
    print(f"Connecting to database...")
    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                print(f"Running migration 0004_device_pairing_voice.sql...")
                cur.execute(sql)
                conn.commit()
                print("✓ Migration 0004 completed successfully")
                return 0
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    sys.exit(run_migration())
