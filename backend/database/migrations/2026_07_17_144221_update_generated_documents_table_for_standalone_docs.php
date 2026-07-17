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
        Schema::table('generated_documents', function (Blueprint $table) {
            $table->foreignId('document_request_id')->nullable()->change();
            $table->foreignId('student_id')->nullable()->after('id')->constrained('students')->nullOnDelete();
            $table->string('document_type')->nullable()->after('student_id'); // e.g., 'releve_notes', 'attestation_scolarite'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('generated_documents', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropColumn(['student_id', 'document_type']);
            // Changing back to non-nullable might fail if there are nulls, but for rollback we try.
            $table->foreignId('document_request_id')->nullable(false)->change();
        });
    }
};
