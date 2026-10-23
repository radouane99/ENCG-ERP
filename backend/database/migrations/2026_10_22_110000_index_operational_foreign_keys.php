<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $columns = [
        'student_registrations' => ['student_id', 'group_id', 'module_id'],
        'student_pathways' => ['group_id', 'academic_year_id'],
        'attendances' => ['student_id', 'attendance_session_id'],
        'schedules' => ['professor_id', 'room_id', 'group_id', 'module_id'],
        'document_requests' => ['student_id', 'user_id'],
        'professor_document_requests' => ['user_id', 'professor_id'],
        'messages' => ['conversation_id', 'sender_id'],
    ];

    public function up(): void
    {
        foreach ($this->columns as $table => $columns) {
            foreach ($columns as $column) {
                if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
                    continue;
                }
                $covered = collect(Schema::getIndexes($table))->contains(fn ($index) => ($index['columns'][0] ?? null) === $column);
                if (! $covered) {
                    Schema::table($table, fn (Blueprint $blueprint) => $blueprint->index($column, 'audit_'.$table.'_'.$column));
                }
            }
        }
    }

    public function down(): void
    {
        foreach ($this->columns as $table => $columns) {
            foreach ($columns as $column) {
                $name = 'audit_'.$table.'_'.$column;
                if (Schema::hasTable($table) && Schema::hasIndex($table, $name)) {
                    Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropIndex($name));
                }
            }
        }
    }
};
