<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }
        // Legacy seeds insert explicit IDs. PostgreSQL does not advance serial sequences for them.
        DB::unprepared(<<<'SQL'
DO $$
DECLARE item record; highest bigint; current_value bigint;
BEGIN
    FOR item IN
        SELECT table_name, column_name,
               pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name) AS sequence_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND (column_default LIKE 'nextval(%' OR is_identity = 'YES')
    LOOP
        IF item.sequence_name IS NULL THEN CONTINUE; END IF;
        EXECUTE format('SELECT max(%I) FROM public.%I', item.column_name, item.table_name) INTO highest;
        EXECUTE format('SELECT last_value FROM %s', item.sequence_name) INTO current_value;
        IF highest IS NOT NULL AND highest >= current_value THEN
            PERFORM setval(item.sequence_name::regclass, highest, true);
        END IF;
    END LOOP;
END $$;
SQL);
    }

    public function down(): void
    {
        // Never rewind a sequence on rollback.
    }
};
