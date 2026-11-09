#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from psycopg import connect

load_dotenv()
db_url = os.getenv('DATABASE_URL')

with connect(db_url) as conn:
    with conn.cursor() as cur:
        # Check what tables exist
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
        tables = [row[0] for row in cur.fetchall()]
        print('Existing tables:')
        for t in tables:
            print(f'  - {t}')
        
        # Check if elder_device_codes exists
        cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='elder_device_codes')")
        has_codes = cur.fetchone()[0]
        print(f'\n✓ has elder_device_codes table: {has_codes}')
        
        # Check if function exists
        cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name='has_elder_role')")
        has_func = cur.fetchone()[0]
        print(f'✓ has has_elder_role function: {has_func}')
        
        # Check DEVICE_PAIRING_PEPPER
        pepper = os.getenv('DEVICE_PAIRING_PEPPER', '')
        print(f'✓ DEVICE_PAIRING_PEPPER length: {len(pepper)} (min 32 required)')
