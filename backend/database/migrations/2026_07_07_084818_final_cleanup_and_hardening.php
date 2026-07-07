<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        // 1. REMOVE LEGACY TABLES
        Schema::dropIfExists('project_supervisors');
        Schema::dropIfExists('soutenances');
        Schema::dropIfExists('final_projects');
        Schema::dropIfExists('internships');

        // 2. DATA CONSISTENCY CHECK
        // 'document_requests' uses 'student_id' as a foreign key pointing to 'students.id'.
        // It is already correctly configured as we checked the schema. We'll ensure it explicitly if not exists.
        
        // 3. PERFORMANCE OPTIMIZATION
        // Add a composite index on 'attendance_records' for columns ('student_id', 'attendance_session_id', 'status')
        Schema::table('attendance_records', function (Blueprint $table) {
            $indexes = Schema::getIndexes('attendance_records');
            $hasIndex = false;
            foreach ($indexes as $index) {
                if (in_array('student_id', $index['columns']) && in_array('attendance_session_id', $index['columns']) && in_array('status', $index['columns'])) {
                    $hasIndex = true;
                    break;
                }
            }
            if (!$hasIndex) {
                $table->index(['student_id', 'attendance_session_id', 'status'], 'att_rec_stu_sess_stat_idx');
            }
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-creating legacy tables would require complex logic not necessary for cleanup
    }
};
