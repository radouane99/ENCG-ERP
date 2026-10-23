<?php
namespace Tests\Feature;
use App\Models\{StudentRegistration, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB, Mail, Notification, Route};
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
class RoleWorkflowIntegrationTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp(); Mail::fake(); Notification::fake(); }
    private function admin(): User { $user = User::factory()->create(['institution_id' => 1]); $user->assignRole(Role::findOrCreate('admin', 'sanctum')); Sanctum::actingAs($user); return $user; }
    public function test_every_controller_route_has_a_public_callable_action(): void
    {
        $missing = [];
        foreach (Route::getRoutes() as $route) {
            $action = $route->getActionName(); if (! str_starts_with($action, 'App\\') || ! str_contains($action, '@')) continue;
            [$class, $method] = explode('@', $action, 2);
            if (! method_exists($class, $method) || ! (new \ReflectionMethod($class, $method))->isPublic()) $missing[] = $route->uri().' '.$action;
        }
        $this->assertSame([], $missing);
    }
    public function test_invoice_payment_is_verified_once_and_cannot_exceed_the_balance(): void
    {
        $this->admin(); $year = $this->makeTestAcademicYear(); $filiere = $this->makeTestFiliere(['type' => 'formation_continue']); $student = $this->makeTestStudent();
        StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 1, 'status' => 'academic_validated', 'registration_type' => 're_enrollment']);
        $invoice = $this->postJson('/api/admin/finance/invoices', ['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'amount' => 1000, 'due_on' => now()->addDays(5)->toDateString()])->assertCreated()->json('invoice.id');
        $payload = ['reference' => 'SYNTHETIC-RECEIPT-001', 'amount' => 400, 'provider' => 'bank', 'verification_note' => 'Justificatif synthétique vérifié.', 'receipt_verified' => true];
        $this->postJson('/api/admin/finance/payments/'.$invoice.'/validate', $payload)->assertOk();
        $this->postJson('/api/admin/finance/payments/'.$invoice.'/validate', $payload)->assertOk();
        $this->assertSame(1, DB::table('tuition_payments')->count());
        $this->assertEquals(400, DB::table('tuition_invoices')->find($invoice)->paid_amount);
        $this->postJson('/api/admin/finance/payments/'.$invoice.'/validate', array_merge($payload, ['reference' => 'SYNTHETIC-OVERPAY', 'amount' => 601]))->assertUnprocessable();
        $this->postJson('/api/admin/finance/payments/'.$invoice.'/validate', array_merge($payload, ['reference' => 'SYNTHETIC-RECEIPT-002', 'amount' => 600]))->assertOk();
        $this->getJson('/api/finance/stats?status=PAID&search='.$student->cne)->assertOk()->assertJsonPath('data.meta.total', 1)->assertJsonPath('data.payments.0.remaining_amount', 0);
        Sanctum::actingAs($student->user->assignRole(Role::findOrCreate('student', 'sanctum')));
        $this->getJson('/api/student-portal/reinscription/status')->assertOk()->assertJsonPath('data.can_confirm', true);
        $this->postJson('/api/student-portal/reinscription/confirm', ['phone' => '0612345678', 'address' => 'Adresse synthétique', 'city' => 'Fès'])->assertOk();
    }
    public function test_empty_exports_are_rejected_and_unsigned_results_are_not_emailed(): void
    {
        $this->admin(); $this->makeTestAcademicYear(); $f = $this->makeTestFiliere(); $module = $this->makeTestModule($f->id);
        $this->getJson('/api/admin/students/export-attestations-zip')->assertUnprocessable();
        $this->postJson('/api/modules/'.$module->id.'/bulk-send-transcripts', ['filter' => 'all'])->assertUnprocessable();
        Mail::assertNothingSent();
        $this->postJson('/api/admin/grades/send-prof-reminder', ['module_id' => $module->id])->assertUnprocessable();
    }
    public function test_published_grade_can_be_appealed_and_corrected_only_after_archiving_its_signature(): void
    {
        $admin = $this->admin(); $admin->assignRole(Role::findOrCreate('institution-admin', 'sanctum'));
        $year = $this->makeTestAcademicYear(); $f = $this->makeTestFiliere(); $module = $this->makeTestModule($f->id); $student = $this->makeTestStudent();
        $assessment = $this->createTestAssessment(['module_id' => $module->id, 'academic_year_id' => $year->id, 'type' => 'Exam', 'weight' => 100]);
        $grade = \App\Models\Grade::create(['student_id' => $student->id, 'assessment_id' => $assessment->id, 'value' => 8, 'absent' => false]);
        $this->postJson('/api/admin/grade-publications', ['assessment_id' => $assessment->id, 'duration_hours' => 48])->assertOk();
        $student->user->assignRole(Role::findOrCreate('student', 'sanctum')); Sanctum::actingAs($student->user);
        $this->getJson('/api/student-portal/grade-appeals')->assertOk()->assertJsonPath('data.appeal_targets.0.assessment_id', $assessment->id);
        $id = $this->postJson('/api/student-portal/grade-appeals', ['module_id' => $module->id, 'assessment_id' => $assessment->id, 'reason_category' => 'erreur_materielle', 'student_justification' => 'Vérification synthétique de la sommation des points.'])->assertCreated()->json('data.id');
        Sanctum::actingAs($admin);
        \App\Models\ModulePvSignature::create(['module_id' => $module->id, 'academic_year_id' => $year->id, 'signed_by' => $admin->id, 'signed_at' => now(), 'signature_data' => 'synthetic', 'digital_seal' => hash('sha256', 'synthetic')]);
        $payload = ['decision' => 'rectified', 'rectified_grade' => 12, 'professor_comment' => 'Correction après vérification de la copie synthétique.'];
        $this->postJson('/api/admin/grade-appeals/'.$id.'/resolve', $payload)->assertConflict();
        $this->postJson('/api/modules/'.$module->id.'/unlock-pv', ['reason' => 'Réouverture motivée pour la vérification du recours synthétique.'])->assertOk();
        $this->assertSame(1, DB::table('module_pv_signature_archives')->where('module_id', $module->id)->count());
        $this->postJson('/api/admin/grade-appeals/'.$id.'/resolve', $payload)->assertOk();
        $this->assertEquals(12, $grade->fresh()->value);
        $this->assertDatabaseHas('grade_audits', ['grade_id' => $grade->id, 'old_value' => 8, 'new_value' => 12]);
    }
    public function test_attendance_uses_real_sessions_and_atomically_rejects_students_outside_the_group(): void
    {
        $year = $this->makeTestAcademicYear(); $f = $this->makeTestFiliere(); $module = $this->makeTestModule($f->id, ['semester_number' => 1]);
        $group = \App\Models\Group::create(['name' => 'Synthetic attendance G1', 'filiere_id' => $f->id, 'academic_year_id' => $year->id, 'semester_number' => 1]);
        $prof = $this->makeTestProfessor(); $prof->user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        \App\Models\ModuleProfessor::create(['module_id' => $module->id, 'academic_year_id' => $year->id, 'professor_id' => $prof->id, 'professor_type' => \App\Models\Professor::class, 'group_id' => $group->id, 'session_type' => 'cm']);
        $student = $this->makeTestStudent(); $outsider = $this->makeTestStudent();
        \App\Models\StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'group_id' => $group->id, 'current_semester' => 1, 'is_current' => true]);
        Sanctum::actingAs($prof->user);
        $start = ['module_id' => $module->id, 'group_id' => $group->id, 'room_name' => 'Salle synthétique', 'date' => now()->toDateString()];
        $response = $this->postJson('/api/professor/attendance/start', $start)->assertCreated(); $session = $response->json('session.id');
        $this->assertNotEmpty($response->json('session.qr_token'));
        $this->postJson('/api/professor/attendance/start', $start)->assertJsonPath('session.id', $session);
        $this->postJson('/api/professor/attendance/save', ['session_id' => $session, 'records' => [['student_id' => $student->id, 'status' => 'present'], ['student_id' => $outsider->id, 'status' => 'present']]])->assertForbidden();
        $this->assertDatabaseMissing('attendances', ['attendance_session_id' => $session, 'student_id' => $student->id, 'status' => 'present']);
        $save = ['session_id' => $session, 'close_session' => true, 'records' => [['student_id' => $student->id, 'status' => 'present']]];
        $this->postJson('/api/professor/attendance/save', $save)->assertOk();
        $this->postJson('/api/professor/attendance/save', $save)->assertOk();
        $this->assertDatabaseHas('attendance_sessions', ['id' => $session, 'status' => 'completed', 'qr_token' => null]);
    }
    public function test_mobility_ranks_before_pagination_and_respects_choices_and_capacity(): void
    {
        $this->admin(); $year = $this->makeTestAcademicYear(); $f = $this->makeTestFiliere(); $module = $this->makeTestModule($f->id, ['semester_number' => 1]);
        $assessment = $this->createTestAssessment(['module_id' => $module->id, 'academic_year_id' => $year->id, 'type' => 'Exam', 'weight' => 100]);
        $partner = \App\Models\MobilityPartner::create(['institution_id' => 1, 'name' => 'Synthetic exchange', 'country' => 'Test', 'program_type' => 'exchange', 'slots' => 1, 'gpa_required' => 10, 'is_active' => true]);
        $ids = [];
        foreach ([12, 18, 15] as $score) {
            $student = $this->makeTestStudent(); $ids[$score] = $student->id;
            \App\Models\Grade::create(['student_id' => $student->id, 'assessment_id' => $assessment->id, 'value' => $score, 'absent' => false]);
            \App\Models\StudentMobilityChoice::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'mobility_partner_id' => $partner->id, 'choice_rank' => 1]);
        }
        $this->getJson('/api/admin/mobility/ranking?per_page=1')->assertOk()->assertJsonPath('data.0.student_id', $ids[18])->assertJsonPath('data.0.proposed_partner', $partner->name)->assertJsonPath('data.0.assigned_partner', null);
        $this->getJson('/api/admin/mobility/ranking?per_page=1&page=2')->assertOk()->assertJsonPath('data.0.student_id', $ids[15])->assertJsonPath('data.0.proposed_partner', null)->assertJsonPath('data.0.rank', 2);
    }    public function test_convention_company_acceptance_supervision_documents_and_defense_are_connected(): void
    {
        \Illuminate\Support\Facades\Storage::fake('private');
        $year = $this->makeTestAcademicYear(); $student = $this->makeTestStudent(); $student->user->assignRole(Role::findOrCreate('student', 'sanctum')); Sanctum::actingAs($student->user);
        $stage = $this->postJson('/api/student-portal/internships', ['type' => 'pfe', 'company_name' => 'Synthetic company', 'company_mentor_name' => 'Synthetic mentor', 'supervisor_email' => 'mentor@example.test', 'position_title' => 'Synthetic mission', 'start_date' => now()->subMonth()->toDateString(), 'end_date' => now()->addMonth()->toDateString()])->assertCreated()->json('data.id');
        $this->postJson('/api/internships/'.$stage.'/messages', ['body' => 'Message étudiant synthétique pour le suivi.'])->assertCreated();
        $document = $this->post('/api/student-portal/internships/'.$stage.'/documents', ['document_type' => 'rapport_final', 'file' => \Illuminate\Http\UploadedFile::fake()->create('rapport.pdf', 20, 'application/pdf')], ['Accept' => 'application/json'])->assertCreated()->json('document.id');
        $admin = $this->admin();
        $link = $this->postJson('/api/admin/internships/'.$stage.'/review-convention', ['insurance_company' => 'Synthetic insurance', 'insurance_policy_number' => 'SYNTHETIC-POLICY', 'insurance_verified' => true, 'reason' => 'Justificatif synthétique contrôlé pour la période.'])->assertOk()->json('company_link');
        $token = basename(parse_url($link, PHP_URL_PATH));
        $this->getJson('/api/public/convention-sign/'.$token)->assertOk()->assertJsonPath('company', 'Synthetic company');
        $this->postJson('/api/public/convention-sign/'.$token, ['name' => 'Synthetic mentor', 'email' => 'wrong@example.test', 'consent' => true])->assertUnprocessable();
        $this->postJson('/api/public/convention-sign/'.$token, ['name' => 'Synthetic mentor', 'email' => 'mentor@example.test', 'consent' => true])->assertOk();
        $this->postJson('/api/public/convention-sign/'.$token, ['name' => 'Synthetic mentor', 'email' => 'mentor@example.test', 'consent' => true])->assertUnprocessable();
        $prof = $this->makeTestProfessor(); $examiner = $this->makeTestProfessor(); $president = $this->makeTestProfessor();
        $this->postJson('/api/admin/internships/'.$stage.'/validate', ['status' => 'approved', 'professor_supervisor_id' => $prof->id])->assertOk();
        $this->postJson('/api/internship-documents/'.$document.'/review', ['status' => 'approved', 'feedback' => 'Rapport synthétique contrôlé par le service.'])->assertOk();
        $room = \App\Models\Room::create(['institution_id' => 1, 'name' => 'Synthetic defense room', 'code' => 'SYN-DEF', 'type' => 'classroom', 'capacity' => 30]);
        $defense = $this->postJson('/api/admin/internships/soutenances', ['internship_id' => $stage, 'room_id' => $room->id, 'date_time' => now()->addDays(3)->toIso8601String(), 'president_id' => $president->id, 'examiner_id' => $examiner->id])->assertCreated()->json('soutenance.id');
        $prof->user->assignRole(Role::findOrCreate('professor', 'sanctum')); Sanctum::actingAs($prof->user);
        $this->getJson('/api/internships/'.$stage.'/messages')->assertOk()->assertJsonPath('data.0.text', 'Message étudiant synthétique pour le suivi.');
        $this->postJson('/api/professor/internships/soutenances/'.$defense.'/evaluate', ['grade' => 15])->assertUnprocessable();
        $this->travel(4)->days();
        $this->postJson('/api/professor/internships/soutenances/'.$defense.'/evaluate', ['grade' => 15, 'remarks' => 'Évaluation synthétique.'])->assertOk();
        $this->assertDatabaseHas('internships', ['id' => $stage, 'status' => 'completed']);
        $this->travelBack();
    }
    public function test_settings_expose_canonical_rules_and_send_a_real_mailable_without_claiming_delivery(): void
    {
        $admin = $this->admin();
        $this->getJson('/api/admin/institution-settings')->assertOk()->assertJsonPath('academic_rules.eliminatory_threshold', 6)->assertJsonPath('runtime.backup_self_service', false);
        $this->postJson('/api/admin/institution-settings', ['eliminatoryGrade' => 7])->assertUnprocessable();
        $this->postJson('/api/admin/institution-settings/test-email', ['email' => 'different@example.test'])->assertOk();
        Mail::assertSent(\App\Mail\SystemTestMail::class, fn ($mail) => $mail->hasTo($admin->email) && ! $mail->hasTo('different@example.test'));
    }}