<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('admission_campaigns', function (Blueprint $t) { $t->string('entry_route', 20)->default('tafem'); $t->unsignedTinyInteger('entry_semester')->default(1); });
        Schema::table('student_renewals', function (Blueprint $t) { $t->timestamp('physical_verified_at')->nullable(); $t->foreignId('physical_verified_by')->nullable()->constrained('users')->restrictOnDelete(); $t->json('physical_checklist')->nullable(); $t->text('physical_observation')->nullable(); });
        Schema::create('student_renewal_reminders', function (Blueprint $t) { $t->id(); $t->foreignId('student_id')->constrained()->restrictOnDelete(); $t->foreignId('academic_year_id')->constrained()->restrictOnDelete(); $t->date('reminder_date'); $t->foreignId('sent_by')->constrained('users')->restrictOnDelete(); $t->boolean('email_queued')->default(false); $t->timestamps(); $t->unique(['student_id', 'academic_year_id', 'reminder_date'], 'renewal_daily_reminder_unique'); });
    }
    public function down(): void { Schema::dropIfExists('student_renewal_reminders'); Schema::table('student_renewals', fn (Blueprint $t) => $t->dropConstrainedForeignId('physical_verified_by')); Schema::table('student_renewals', fn (Blueprint $t) => $t->dropColumn(['physical_verified_at','physical_checklist','physical_observation'])); Schema::table('admission_campaigns', fn (Blueprint $t) => $t->dropColumn(['entry_route','entry_semester'])); }
};