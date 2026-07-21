-- ─────────────────────────────────────────────────────────────
-- ENCG ERP — PostgreSQL Init Script
-- Runs automatically on first container startup.
-- ─────────────────────────────────────────────────────────────

-- Ensure the database exists (already created by POSTGRES_DB env var)
-- This script handles extra setup that Docker env vars can't do.

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- For fast LIKE/ILIKE searches
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- For accent-insensitive search (useful for Arabic/French names)

-- Create a read-only reporting role (optional — useful for analytics)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'encg_readonly') THEN
        CREATE ROLE encg_readonly WITH LOGIN PASSWORD 'readonly_secret';
        GRANT CONNECT ON DATABASE encg_erp TO encg_readonly;
        GRANT USAGE ON SCHEMA public TO encg_readonly;
    END IF;
END
$$;

-- Set default timezone for the database
ALTER DATABASE encg_erp SET timezone TO 'Africa/Casablanca';

-- Confirm setup
DO $$
BEGIN
    RAISE NOTICE 'ENCG ERP — PostgreSQL initialized successfully.';
END
$$;
