
-- ============================================================================
-- DANGER: DATABASE RESET SCRIPT
-- This script will delete ALL data and tables in the 'public' schema.
-- Run this in the Supabase SQL Editor to clean your project before applying 'schema.sql'.
-- ============================================================================

-- 1. Drop the entire public schema and all its objects (tables, functions, etc.)
DROP SCHEMA public CASCADE;

-- 2. Recreate the public schema
CREATE SCHEMA public;

-- 3. Restore default permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 4. Re-enable default extensions (if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- ============================================================================
-- NEXT STEP: Run the content of 'supabase/schema.sql' to rebuild the structure.
-- ============================================================================
