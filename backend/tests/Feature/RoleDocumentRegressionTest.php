<?php

namespace Tests\Feature;

use App\Mail\StudentTranscriptMail;
use App\Models\Grade;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleDocumentRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_attestation_requires_validated_registration_and_mail_attaches_only_published_notes(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['institution_id' => 1]);
        $admin->assignRole(Role::findOrCreate('admin', 'sanctum'));
        Sanctum::actingAs($admin);
        $year = $this->makeTestAcademicYear();
        $f = $this->makeTestFiliere();
        $student = $this->makeTestStudent();
        $this->getJson('/api/v1/admin/students/'.$student->id.'/attestation-pdf')->assertUnprocessable();
        StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'semester_number' => 1, 'status' => 'admin_validated', 'registration_type' => 're_enrollment']);
        $pdf = $this->get('/api/v1/admin/students/'.$student->id.'/attestation-pdf')->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $pdf->getContent());
        $module = $this->makeTestModule($f->id);
        $a = $this->createTestAssessment(['module_id' => $module->id, 'academic_year_id' => $year->id, 'type' => 'Exam', 'weight' => 100]);
        Grade::create(['student_id' => $student->id, 'assessment_id' => $a->id, 'value' => 14, 'absent' => false]);
        $this->postJson('/api/students/'.$student->id.'/send-transcript')->assertUnprocessable();
        Mail::assertNothingSent();
        DB::table('grade_publications')->insert(['assessment_id' => $a->id, 'published_at' => now(), 'appeals_until' => now()->addHours(48), 'published_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()]);
        $this->postJson('/api/students/'.$student->id.'/send-transcript')->assertOk();
        Mail::assertSent(StudentTranscriptMail::class, fn ($mail) => $mail->hasTo($student->user->email) && $mail->sessionName === $year->label && count($mail->attachments()) === 1);
    }
}
