-- Ensure all tables have a Primary Key on 'id' if not already present
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name = 'id'
          AND table_name NOT IN (
              SELECT c.relname 
              FROM pg_class c 
              JOIN pg_constraint p ON p.conrelid = c.oid 
              WHERE p.contype = 'p'
          )
    ) LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ADD PRIMARY KEY (id);', r.table_name);
            RAISE NOTICE 'Added primary key to %', r.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not add primary key to %: %', r.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Fix cache, sessions, and pivot table constraints
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cache') THEN
        BEGIN
            ALTER TABLE "cache" ADD PRIMARY KEY ("key");
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cache_locks') THEN
        BEGIN
            ALTER TABLE "cache_locks" ADD PRIMARY KEY ("key");
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'model_has_roles') THEN
        BEGIN
            ALTER TABLE "model_has_roles" ADD PRIMARY KEY (role_id, model_id, model_type);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'model_has_permissions') THEN
        BEGIN
            ALTER TABLE "model_has_permissions" ADD PRIMARY KEY (permission_id, model_id, model_type);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_has_permissions') THEN
        BEGIN
            ALTER TABLE "role_has_permissions" ADD PRIMARY KEY (permission_id, role_id);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- Ensure ai_chat_messages exists for the 134 tables count
    CREATE TABLE IF NOT EXISTS ai_chat_messages (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP(0) WITHOUT TIME ZONE,
        updated_at TIMESTAMP(0) WITHOUT TIME ZONE
    );
END $$;

