-- PostgreSQL initialization script for ENCG ERP
-- Creates the main database and enables required extensions

\c encg_erp;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable trigram search (for fuzzy name matching)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable unaccent (for Arabic/French name normalization)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create a read-only role for reporting
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'encg_readonly') THEN
    CREATE ROLE encg_readonly;
  END IF;
END
$$;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO encg_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO encg_readonly;
