<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\PdfExportController;
use App\Mail\DisciplineHearingMail;
use App\Mail\ProfessorConvocationEmail;
use App\Models\Campus;
use App\Models\Convocation;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Professor;
use App\Models\ProfessorAvailability;
use App\Models\ResitEligibility;
use App\Models\Room;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Academic\ExamConvocationService;
use App\Services\Academic\ExamWorkflowGuard;
use App\Services\Academic\GradeService;
use App\Services\Academic\ResitEligibilityRegistry;
use App\Services\Documents\OfficialPdfFactory;
use App\Services\Documents\RegisteredPdf as PDF;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ExamWorkflowReliabilityTest extends TestCase
{
    use RefreshDatabase;

    private Exam $exam;

    private ExamSession $session;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['institution_id' => 1]);
        $this->admin->assignRole(Role::findOrCreate('admin', 'sanctum'));
        $this->actingAs($this->admin, 'sanctum');
        $year = $this->makeTestAcademicYear();
        $semester = $this->makeTestSemester($year->id, ['number' => 1]);
        $filiere = $this->makeTestFiliere();
        $module = $this->makeTestModule($filiere->id, ['semester_number' => 1]);
        $group = Group::create(['academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 1, 'name' => 'SYN-G1', 'capacity' => 30]);
        $campus = Campus::create(['institution_id' => 1, 'name' => 'Test', 'code' => 'SYN']);
        $room = Room::create(['institution_id' => 1, 'campus_id' => $campus->id, 'name' => 'SYN salle', 'code' => 'SYN-R', 'capacity' => 60, 'type' => 'classroom', 'is_available' => true]);
        $this->session = ExamSession::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'semester_id' => $semester->id, 'name' => 'Session synthétique', 'type' => 'normal', 'start_date' => '2027-01-10', 'end_date' => '2027-01-20']);
        $this->exam = Exam::create(['exam_session_id' => $this->session->id, 'module_id' => $module->id, 'group_id' => $group->id, 'room_id' => $room->id, 'exam_date' => '2027-01-12', 'start_time' => '08:30', 'duration_minutes' => 120, 'type' => 'written']);
    }

    private function seat(): ExamSeating
    {
        $student = $this->makeTestStudent();

        return ExamSeating::create(['exam_id' => $this->exam->id, 'student_id' => $student->id, 'room_id' => $this->exam->room_id, 'seat_number' => 1, 'qr_token' => 'SYN-QR', 'is_present' => null]);
    }

    public function test_legacy_generation_uses_student_account_key_and_keeps_its_identity_on_retry(): void
    {
        $this->admin->givePermissionTo(Permission::findOrCreate('exams.manage', 'sanctum'));
        User::factory()->count(3)->create(['institution_id' => 1]);
        $seat = $this->seat();
        $this->assertNotEquals($seat->student_id, $seat->student->user_id);
        $url = '/api/exam-planning/'.$this->exam->id.'/convocations';
        $this->postJson($url.'/generate', ['room_id' => $seat->room_id])->assertCreated();
        $legacy = Convocation::where('exam_id', $this->exam->id)->firstOrFail();
        $this->assertEquals($seat->student->user_id, $legacy->student_id);
        $this->assertEquals($seat->student_id, $legacy->student->id);
        $this->postJson($url.'/generate', ['room_id' => $seat->room_id])->assertCreated();
        $this->assertDatabaseCount('convocations', 1);
        $this->assertSame('SYN-QR', $legacy->fresh()->reference);
    }

    public function test_reprogramming_reissues_qr_preserves_records_and_notifies_without_email(): void
    {
        Mail::fake();
        $this->travelTo(Carbon::parse('2027-01-01'));
        $this->session->update(['is_active' => true]);
        $seat = $this->seat();
        $seat->update(['status' => 'sent', 'sent_at' => now()]);
        $teacher = $this->makeTestProfessor();
        $proctor = ExamSurveillance::create(['exam_id' => $this->exam->id, 'room_id' => $this->exam->room_id, 'professor_id' => $teacher->user_id, 'role' => 'surveillant', 'qr_token' => 'OLD-PROCTOR', 'confirmed_at' => now(), 'sent_at' => now()]);
        $legacy = Convocation::create(['exam_id' => $this->exam->id, 'student_id' => $seat->student->user_id, 'room_id' => $seat->room_id, 'seat_number' => 1, 'reference' => 'SYN-QR', 'status' => 'sent']);
        $data = ['exam_date' => '2027-01-13', 'start_time' => '10:45', 'room_id' => $this->exam->room_id, 'duration_minutes' => 90, 'planning_revision' => $this->exam->fresh()->planningRevision(), 'reason' => 'Indisponibilité exceptionnelle de la salle.'];
        $url = '/api/exam-planning/'.$this->exam->id.'/reschedule';
        $this->postJson($url, $data)->assertOk();
        $this->assertNotEquals('SYN-QR', $seat->fresh()->qr_token);
        $this->assertSame('sent', $seat->fresh()->status);
        $this->assertNull($seat->fresh()->sent_at);
        $this->assertSame($seat->fresh()->qr_token, $legacy->fresh()->reference);
        $this->assertNull($proctor->fresh()->confirmed_at);
        $this->assertNotEquals('OLD-PROCTOR', $proctor->fresh()->qr_token);
        $this->assertDatabaseCount('notifications', 2);
        $this->assertDatabaseHas('activity_log', ['description' => 'exam_reprogrammed_and_reissued']);
        $this->postJson($url, $data)->assertStatus(409);
        $this->assertDatabaseCount('notifications', 2);
        Mail::assertNothingSent();
    }

    public function test_failed_reprogramming_rolls_back_publication_and_proctor_confirmation(): void
    {
        $this->travelTo(Carbon::parse('2027-01-01'));
        $this->session->update(['is_active' => true]);
        $seat = $this->seat();
        $seat->update(['status' => 'sent', 'sent_at' => now()]);
        $teacher = $this->makeTestProfessor();
        $proctor = ExamSurveillance::create(['exam_id' => $this->exam->id, 'room_id' => $this->exam->room_id, 'professor_id' => $teacher->user_id, 'role' => 'surveillant', 'confirmed_at' => now()]);
        ProfessorAvailability::create(['professor_id' => $teacher->user_id, 'academic_year_id' => $this->session->academic_year_id, 'availability_data' => ['Mardi' => ['matin' => false, 'apresMidi' => true]]]);
        $data = ['exam_date' => '2027-01-19', 'start_time' => '08:30', 'room_id' => $this->exam->room_id, 'duration_minutes' => 120, 'planning_revision' => $this->exam->fresh()->planningRevision(), 'reason' => 'Changement de date exceptionnel.'];
        $url = '/api/exam-planning/'.$this->exam->id.'/reschedule';
        $this->postJson($url, $data)->assertStatus(409);
        $this->assertSame('sent', $seat->fresh()->status);
        $this->assertSame('SYN-QR', $seat->fresh()->qr_token);
        $this->assertNotNull($proctor->fresh()->confirmed_at);
        $this->assertDatabaseCount('notifications', 0);
        $seat->update(['status' => 'absent', 'is_present' => false]);
        $data['planning_revision'] = $this->exam->fresh()->planningRevision();
        $this->postJson($url, $data)->assertStatus(409);
        $data['reason'] = '';
        $this->postJson($url, $data)->assertUnprocessable();
    }

    public function test_reprogramming_rejects_unchanged_started_or_foreign_exam(): void
    {
        $this->travelTo(Carbon::parse('2027-01-01'));
        $this->session->update(['is_active' => true]);
        $data = ['exam_date' => '2027-01-12', 'start_time' => '08:30', 'room_id' => $this->exam->room_id, 'duration_minutes' => 120, 'planning_revision' => $this->exam->fresh()->planningRevision(), 'reason' => 'Réorganisation exceptionnelle documentée.'];
        $url = '/api/exam-planning/'.$this->exam->id.'/reschedule';
        $this->postJson($url, $data)->assertUnprocessable();
        $data['exam_date'] = '2027-01-13';
        $this->travelTo(Carbon::parse('2027-01-12 09:00'));
        $this->postJson($url, $data)->assertStatus(409);
        $institution = Institution::create(['name' => 'Autre établissement', 'code' => 'OTHER', 'slug' => 'other', 'city' => 'Fès', 'type' => 'grande_ecole']);
        $other = User::factory()->create(['institution_id' => $institution->id]);
        $other->assignRole(Role::findOrCreate('admin', 'sanctum'));
        $this->actingAs($other, 'sanctum')->postJson($url, $data)->assertForbidden();
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_session_requires_valid_dates_and_matching_year_semester(): void
    {
        $this->postJson('/api/exam-sessions', ['name' => 'Test', 'type' => 'normal'])->assertUnprocessable();
        $year = $this->makeTestAcademicYear(['label' => '2030-2031', 'start_year' => 2030, 'end_year' => 2031, 'is_current' => false]);
        $this->postJson('/api/exam-sessions', ['name' => 'Test', 'type' => 'normal', 'academic_year_id' => $year->id, 'semester_id' => $this->session->semester_id, 'start_date' => '2031-01-01', 'end_date' => '2031-01-02'])->assertUnprocessable();
    }

    public function test_session_with_exams_cannot_be_deleted_or_shrunk(): void
    {
        $this->deleteJson('/api/exam-sessions/'.$this->session->id)->assertStatus(409);
        $this->putJson('/api/exam-sessions/'.$this->session->id, ['end_date' => '2027-01-11'])->assertUnprocessable();
        $this->assertDatabaseHas('exams', ['id' => $this->exam->id]);
    }

    public function test_professor_cannot_open_or_reset_an_exam_session(): void
    {
        $user = User::factory()->create(['institution_id' => 1]);
        $user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        $this->actingAs($user, 'sanctum')->putJson('/api/exam-sessions/'.$this->session->id, ['is_active' => true])->assertForbidden();
        $this->postJson('/api/exam-planning/reset', ['session_id' => $this->session->id])->assertForbidden();
    }

    public function test_reset_requires_scope_and_preserves_sent_convocations(): void
    {
        $seat = $this->seat();
        $seat->update(['sent_at' => now()]);
        $this->postJson('/api/exam-planning/reset', [])->assertUnprocessable();
        $this->postJson('/api/exam-planning/reset', ['session_id' => $this->session->id])->assertStatus(409);
        $this->assertDatabaseHas('exam_seatings', ['id' => $seat->id, 'qr_token' => 'SYN-QR']);
    }

    public function test_single_attendance_endpoint_cannot_update_whole_room(): void
    {
        $seat = $this->seat();
        $this->postJson('/api/exam-planning/'.$this->exam->id.'/update-seating-status', ['status' => 'present'])->assertUnprocessable();
        $this->assertNull($seat->fresh()->is_present);
    }

    public function test_legacy_and_qr_attendance_both_respect_pv_lock(): void
    {
        $seat = $this->seat();
        $this->exam->update(['is_locked' => true]);
        $this->postJson('/api/convocations/update-attendance/SYN-QR', ['status' => 'present'])->assertStatus(409);
        $this->postJson('/api/exam-planning/'.$this->exam->id.'/update-seating-status', ['seating_id' => $seat->id, 'status' => 'present'])->assertStatus(409);
        $this->assertNull($seat->fresh()->is_present);
    }

    public function test_incident_requires_exam_membership_and_never_changes_grade_or_presence(): void
    {
        $seat = $this->seat();
        $data = ['exam_id' => $this->exam->id, 'student_id' => $seat->student_id, 'type' => 'fraude', 'description' => 'Signalement synthétique à instruire.'];
        $this->postJson('/api/exam-incidents', $data)->assertCreated();
        $this->assertDatabaseCount('grades', 0);
        $this->assertDatabaseCount('disciplinary_cases', 0);
        $this->assertNull($seat->fresh()->is_present);
        unset($data['exam_id']);
        $this->postJson('/api/exam-incidents', $data)->assertUnprocessable();
    }

    public function test_council_decision_requires_hearing_and_cannot_be_rewritten(): void
    {
        $seat = $this->seat();
        $incident = ExamIncident::create(['exam_id' => $this->exam->id, 'student_id' => $seat->student_id, 'type' => 'fraude', 'status' => 'pending']);
        $url = '/api/discipline/'.$incident->id;
        $data = ['sanction' => 'dismissed', 'observations' => 'Audition synthétique : aucun élément retenu.'];
        $this->postJson($url.'/decide', $data)->assertStatus(409);
        $this->postJson($url.'/convoke', ['hearing_date' => '2027-01-16 à 10:00', 'hearing_room' => 'Salle du conseil'])->assertOk();
        $this->travelTo(Carbon::parse('2027-01-16 11:00'));
        $this->postJson($url.'/decide', $data)->assertOk();
        $this->postJson($url.'/decide', ['sanction' => 'module', 'observations' => 'Autre décision sans réouverture.'])->assertStatus(409);
        $this->deleteJson($url)->assertStatus(409);
        $this->assertDatabaseHas('exam_incidents', ['id' => $incident->id, 'status' => 'dismissed']);
    }

    public function test_regenerating_qr_keeps_existing_seat_number_and_token(): void
    {
        $seat = $this->seat();
        $seat->update(['seat_number' => 19]);
        app(ExamConvocationService::class)->generateConvocations($this->exam->id);
        app(ExamConvocationService::class)->generateConvocations($this->exam->id);
        $this->assertDatabaseHas('exam_seatings', ['id' => $seat->id, 'qr_token' => 'SYN-QR', 'seat_number' => 19]);
        $this->assertDatabaseCount('exam_seatings', 1);
    }

    public function test_manual_planning_requires_session_and_refuses_overlap(): void
    {
        $data = ['exam_session_id' => $this->session->id, 'module_id' => $this->exam->module_id, 'group_id' => $this->exam->group_id, 'room_id' => $this->exam->room_id, 'exam_date' => '2027-01-12', 'start_time' => '09:00', 'duration_minutes' => 120];
        $this->postJson('/api/exam-planning/store', $data)->assertStatus(409);
        $data['exam_date'] = '2027-02-01';
        $this->postJson('/api/exam-planning/store', $data)->assertUnprocessable();
        $data['exam_date'] = '2027-01-13';
        $this->postJson('/api/exam-planning/store', $data)->assertOk()->assertJsonPath('exam.exam_session_id', $this->session->id);
    }

    public function test_global_live_contract_separates_unrecorded_from_absence(): void
    {
        $this->seat();
        $this->getJson('/api/convocations/session/'.$this->session->id.'/live-stats')->assertOk()
            ->assertJsonPath('data.students.total', 1)->assertJsonPath('data.students.absent', 0)->assertJsonPath('data.students.unrecorded', 1)
            ->assertJsonPath('data.professors.total', 0);
        $this->getJson('/api/exam-sessions/'.$this->session->id.'/readiness')->assertOk()->assertJsonPath('data.without_proctors', 1);
    }

    public function test_details_are_read_only_even_for_seat_125(): void
    {
        $seat = $this->seat();
        $seat->update(['seat_number' => 125]);
        $this->getJson('/api/exam-planning/'.$this->exam->id.'/details')->assertOk();
        $this->getJson('/api/exam-planning/'.$this->exam->id.'/details')->assertOk();
        $this->assertEquals(125, $seat->fresh()->seat_number);
    }

    public function test_pending_or_dismissed_incident_does_not_force_zero_in_grading(): void
    {
        $seat = $this->seat();
        $incident = ExamIncident::create(['exam_id' => $this->exam->id, 'student_id' => $seat->student_id, 'type' => 'fraude', 'status' => 'pending']);
        $service = app(GradeService::class);
        $this->assertSame([], $service->getFraudStudentIds($this->exam->module));
        $incident->update(['status' => 'dismissed', 'sanction_scope' => 'dismissed']);
        $this->assertSame([], $service->getFraudStudentIds($this->exam->module));
    }

    public function test_personal_visas_are_persistent_and_lock_requires_both(): void
    {
        $seat = $this->seat();
        $seat->update(['status' => 'present', 'is_present' => true]);
        $this->exam->update(['exam_date' => now()->subDay()->toDateString()]);
        $teachers = collect([1, 2])->map(function ($index) {
            $user = User::factory()->create(['institution_id' => 1]);
            $user->assignRole(Role::findOrCreate('professor', 'sanctum'));
            ExamSurveillance::create(['exam_id' => $this->exam->id, 'room_id' => $this->exam->room_id, 'professor_id' => $user->id, 'role' => $index === 1 ? 'president_salle' : 'surveillant']);

            return $user;
        });
        $save = '/api/exam-planning/'.$this->exam->id.'/save-signature';
        $this->postJson($save, ['signature_data' => 'DIGITAL_CERTIFIED_STAMP_ENCG', 'role' => 'principal'])->assertForbidden();
        $this->actingAs($teachers[0], 'sanctum')->postJson($save, ['signature_data' => 'DIGITAL_CERTIFIED_STAMP_ENCG', 'role' => 'principal'])->assertOk();
        $this->postJson('/api/exams/'.$this->exam->id.'/pv/lock')->assertUnprocessable();
        $this->actingAs($teachers[1], 'sanctum')->postJson($save, ['signature_data' => 'DIGITAL_CERTIFIED_STAMP_ENCG', 'role' => 'secondary'])->assertOk();
        $response = $this->postJson('/api/exams/'.$this->exam->id.'/pv/lock')->assertOk();
        $seal = $response->json('seal');
        $this->postJson('/api/exams/'.$this->exam->id.'/pv/lock')->assertOk()->assertJsonPath('seal', $seal);
        $this->assertEquals(2, ExamSurveillance::whereNotNull('signed_at')->count());
        $this->postJson('/api/convocations/update-attendance/SYN-QR', ['status' => 'absent'])->assertStatus(409);
    }

    public function test_pdf_cannot_forge_signatures_or_delete_multiple_incidents(): void
    {
        $seat = $this->seat();
        $seat->update(['seat_number' => 125]);
        foreach (['Premier constat', 'Deuxième constat distinct'] as $description) {
            ExamIncident::create(['exam_id' => $this->exam->id, 'student_id' => $seat->student_id, 'type' => 'fraude', 'description' => $description]);
        }
        $pdf = \Mockery::mock(PDF::class);
        $pdf->shouldReceive('stream')->once()->andReturn(response('%PDF-synthetic', 200, ['Content-Type' => 'application/pdf']));
        $this->mock(OfficialPdfFactory::class)->shouldReceive('make')->once()
            ->with('pdf.pv_examen', \Mockery::on(fn ($data) => ! $data['hasPrincipalSignature'] && ! $data['hasSecondarySignature'] && $data['incidents']->count() === 2 && $data['unrecorded_students'] === 1 && str_contains($data['verifyUrl'], '/surveillance')))->andReturn($pdf);
        $this->get('/api/exams/'.$this->exam->id.'/pv-pdf?principal_signature=data:image/png;base64,FORGED')->assertOk();
        $this->assertDatabaseCount('exam_incidents', 2);
        $this->assertEquals(125, $seat->fresh()->seat_number);
        $this->assertNull($seat->fresh()->is_present);
    }

    public function test_hearing_email_uses_registered_student_and_reports_transport_status(): void
    {
        Mail::fake();
        $seat = $this->seat();
        $incident = ExamIncident::create(['exam_id' => $this->exam->id, 'student_id' => $seat->student_id, 'type' => 'fraude', 'status' => 'pending']);
        $this->mock(PdfExportController::class)->shouldReceive('convocationDisciplinePdf')->once()->with($incident->id)->andReturn(response('%PDF-synthetic'));
        $this->postJson('/api/discipline/'.$incident->id.'/convoke', ['hearing_date' => '2027-01-16 à 10:00', 'hearing_room' => 'Salle du conseil', 'send_email' => true])->assertOk()->assertJsonPath('email_status', 'accepted');
        Mail::assertSent(DisciplineHearingMail::class, fn ($mail) => $mail->hasTo($seat->student->user->email) && count($mail->attachments()) === 1);
    }

    public function test_generation_requires_real_enrolment_and_rolls_back_missing_data(): void
    {
        $this->makeTestProfessor();
        $this->makeTestProfessor();
        $payload = ['session_id' => $this->session->id, 'module_ids' => [$this->exam->module_id], 'modules_per_day' => 1];
        $this->postJson('/api/exam-planning/auto-generate', $payload)->assertUnprocessable();
        $this->assertDatabaseHas('exams', ['id' => $this->exam->id]);
        $student = $this->makeTestStudent();
        StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $this->session->academic_year_id, 'filiere_id' => $this->exam->module->filiere_id, 'semester_number' => 1, 'group_id' => $this->exam->group_id, 'status' => 'academic_validated', 'registration_type' => 'new_enrollment']);
        $this->postJson('/api/exam-planning/auto-generate', $payload)->assertOk();
        $this->assertDatabaseCount('exams', 1);
        $this->assertDatabaseCount('exam_seatings', 1);
        $this->assertDatabaseCount('exam_surveillances', 2);
        $this->assertDatabaseHas('exam_seatings', ['student_id' => $student->id]);
    }

    public function test_student_cannot_download_another_students_convocation(): void
    {
        $seat = $this->seat();
        $other = $this->makeTestStudent();
        $other->user->assignRole(Role::findOrCreate('student', 'sanctum'));
        $this->actingAs($other->user, 'sanctum')->getJson('/api/students/'.$seat->student_id.'/convocation-pdf')->assertForbidden();
    }

    public function test_declared_unavailability_is_used_by_proctor_assignment(): void
    {
        $teacher = $this->makeTestProfessor();
        ProfessorAvailability::create(['professor_id' => $teacher->user_id, 'academic_year_id' => $this->session->academic_year_id, 'availability_data' => ['Mardi' => ['matin' => false, 'apresMidi' => true]]]);
        $this->assertFalse(app(ExamWorkflowGuard::class)->allowsProctor($teacher->user, $this->exam));
    }

    public function test_edit_saves_same_exam_and_rejects_stale_or_published_plan(): void
    {
        $revision = $this->getJson('/api/exam-planning/'.$this->exam->id.'/details')->assertOk()->json('data.exam.planning_revision');
        $data = ['exam_date' => '2027-01-13', 'start_time' => '10:45', 'room_id' => $this->exam->room_id, 'duration_minutes' => 90, 'planning_revision' => $revision];
        $url = '/api/exam-planning/'.$this->exam->id.'/planning';
        $this->putJson($url, $data)->assertOk();
        $this->assertDatabaseCount('exams', 1);
        $this->assertDatabaseHas('exams', ['id' => $this->exam->id, 'duration_minutes' => 90, 'start_time' => '10:45:00']);
        $this->putJson($url, $data)->assertStatus(409);
        $seat = $this->seat();
        $seat->update(['sent_at' => now()]);
        $data['planning_revision'] = $this->exam->fresh()->planningRevision();
        $this->putJson($url, $data)->assertStatus(409);
    }

    public function test_resit_invites_only_current_year_eligible_candidates(): void
    {
        $student = $this->makeTestStudent();
        $other = $this->makeTestStudent();
        $resit = $this->session->replicate();
        $resit->type = 'rattrapage';
        $resit->save();
        $registry = app(ResitEligibilityRegistry::class);
        $registry->record($student->id, $this->exam->module_id, $this->session->academic_year_id, $this->session->id, true);
        ResitEligibility::create(['student_id' => $other->id, 'module_id' => $this->exam->module_id, 'is_eligible' => true]);
        $ids = app(ExamWorkflowGuard::class)->eligibleCandidates($resit, $this->exam->module_id, collect([$student->id, $other->id]));
        $this->assertSame([$student->id], $ids->all());
    }

    public function test_resit_registry_preserves_year_history_and_manual_refusal(): void
    {
        $student = $this->makeTestStudent();
        $registry = app(ResitEligibilityRegistry::class);
        $current = $registry->record($student->id, $this->exam->module_id, $this->session->academic_year_id, $this->session->id, true);
        $current->update(['status' => 'Refusé', 'is_eligible' => false, 'decided_at' => now(), 'decided_by' => $this->admin->id]);
        $registry->record($student->id, $this->exam->module_id, $this->session->academic_year_id, $this->session->id, true);
        $this->assertFalse($current->fresh()->is_eligible);
        $nextYear = $this->makeTestAcademicYear(['start_year' => 2027, 'end_year' => 2028, 'label' => '2027/2028', 'is_current' => false]);
        $registry->record($student->id, $this->exam->module_id, $nextYear->id, null, true);
        $this->assertDatabaseCount('resit_eligibilities', 2);
        $this->assertDatabaseHas('resit_eligibilities', ['id' => $current->id, 'status' => 'Refusé', 'is_eligible' => false]);
    }

    public function test_legacy_resit_requires_explicit_year_and_never_merges_over_existing_decision(): void
    {
        $student = $this->makeTestStudent();
        $legacy = ResitEligibility::create(['student_id' => $student->id, 'module_id' => $this->exam->module_id, 'is_eligible' => false, 'status' => 'Refusé']);
        $this->getJson('/api/retakes/legacy')->assertOk()->assertJsonPath('count', 1);
        $data = ['academic_year_id' => $this->session->academic_year_id, 'reason' => 'Année vérifiée depuis le dossier synthétique.'];
        $this->patchJson('/api/retakes/'.$legacy->id.'/year', $data)->assertOk();
        $this->assertDatabaseHas('resit_eligibilities', ['id' => $legacy->id, 'academic_year_id' => $this->session->academic_year_id, 'is_eligible' => false, 'status' => 'Refusé']);
        $duplicate = ResitEligibility::create(['student_id' => $student->id, 'module_id' => $this->exam->module_id, 'is_eligible' => true]);
        $this->patchJson('/api/retakes/'.$duplicate->id.'/year', $data)->assertStatus(409);
        $this->assertNull($duplicate->fresh()->academic_year_id);
        $this->assertDatabaseCount('resit_eligibilities', 2);
    }

    public function test_portal_publication_is_explicit_idempotent_and_independent_of_email(): void
    {
        Mail::fake();
        $seat = $this->seat();
        $student = $seat->student;
        $student->user->assignRole(Role::findOrCreate('student', 'sanctum'));
        $this->actingAs($student->user, 'sanctum')->getJson('/api/v1/student-portal/convocations?session_type=ORDINAIRE')->assertOk()->assertJsonCount(0, 'convocations');
        $this->actingAs($this->admin, 'sanctum');
        $this->postJson('/api/convocations/publish-session', ['session_id' => $this->session->id])->assertUnprocessable();
        $this->session->update(['is_active' => true]);
        $teacher = $this->makeTestProfessor();
        ExamSurveillance::create(['exam_id' => $this->exam->id, 'room_id' => $this->exam->room_id, 'professor_id' => $teacher->user_id, 'role' => 'president_salle']);
        $this->postJson('/api/convocations/publish-session', ['session_id' => $this->session->id])->assertOk()->assertJsonPath('published_count', 1);
        $this->postJson('/api/convocations/publish-session', ['session_id' => $this->session->id])->assertOk()->assertJsonPath('published_count', 0);
        $this->actingAs($student->user, 'sanctum')->getJson('/api/v1/student-portal/convocations?session_type=ORDINAIRE')->assertOk()->assertJsonCount(1, 'convocations');
        $this->getJson('/api/v1/student-portal/convocations?session_type=RATTRAPAGE')->assertOk()->assertJsonCount(0, 'convocations');
        $resit = $this->session->replicate();
        $resit->type = 'rattrapage';
        $resit->save();
        $resitExam = $this->exam->replicate();
        $resitExam->exam_session_id = $resit->id;
        $resitExam->save();
        ExamSeating::create(['exam_id' => $resitExam->id, 'student_id' => $student->id, 'room_id' => $seat->room_id, 'seat_number' => 1, 'qr_token' => 'RESIT-SYN', 'status' => 'sent']);
        $this->getJson('/api/v1/student-portal/convocations?session_type=ORDINAIRE')->assertOk()->assertJsonCount(1, 'convocations');
        $this->getJson('/api/v1/student-portal/convocations?session_type=RATTRAPAGE')->assertOk()->assertJsonCount(1, 'convocations');
        $this->assertDatabaseHas('exam_seatings', ['id' => $seat->id, 'status' => 'sent', 'qr_token' => 'SYN-QR']);
        Mail::assertNothingSent();
    }

    public function test_legacy_exam_aliases_validate_inputs_instead_of_returning_empty_responses(): void
    {
        $this->postJson('/api/convocations/send-students', [])->assertUnprocessable();
        $this->postJson('/api/convocations/send-professors', [])->assertUnprocessable();
        $this->getJson('/api/convocations/export-zip')->assertUnprocessable();
        $this->postJson('/api/mission-orders', [])->assertUnprocessable();
    }

    public function test_convocation_export_contains_real_pdf_entries_in_a_zip(): void
    {
        $seat = $this->seat();
        $this->mock(PdfExportController::class)->shouldReceive('studentConvocationPdf')->once()->with($seat->id)->andReturn(response('%PDF-synthetic'));
        $response = $this->get('/api/convocations/export-zip?session_id='.$this->session->id)->assertOk()->assertDownload('Convocations_session_'.$this->session->id.'.zip');
        $path = $response->baseResponse->getFile()->getPathname();
        $zip = new \ZipArchive;
        $this->assertTrue($zip->open($path));
        $this->assertEquals(1, $zip->numFiles);
        $this->assertStringStartsWith('%PDF', $zip->getFromIndex(0));
        $zip->close();
        File::delete($path);
    }

    public function test_surveillance_email_uses_user_identity_even_when_a_profile_id_collides(): void
    {
        Mail::fake();
        $teacher = User::factory()->create(['institution_id' => 1, 'email' => 'teacher@example.test']);
        $decoy = User::factory()->create(['institution_id' => 1, 'email' => 'decoy@example.test']);
        $profile = new Professor(['institution_id' => 1, 'user_id' => $decoy->id, 'employee_number' => 'SYN-COLLISION', 'grade' => 'PES', 'contract_type' => 'permanent', 'hire_date' => '2020-01-01', 'is_active' => true]);
        $profile->id = $teacher->id;
        $profile->save();
        $row = ExamSurveillance::create(['exam_id' => $this->exam->id, 'room_id' => $this->exam->room_id, 'professor_id' => $teacher->id, 'role' => 'president_salle']);
        $pdf = \Mockery::mock(PDF::class);
        $pdf->shouldReceive('output')->once()->andReturn('%PDF-synthetic');
        \Barryvdh\DomPDF\Facade\Pdf::shouldReceive('loadView')->once()->with('pdf.convocations_profs_batch', \Mockery::type('array'))->andReturn($pdf);
        $result = app(ExamConvocationService::class)->sendBatchSurveillantsEmails($this->session->id, [$row->id]);
        $this->assertTrue($result['success']);
        Mail::assertSent(ProfessorConvocationEmail::class, fn ($mail) => $mail->hasTo('teacher@example.test') && ! $mail->hasTo('decoy@example.test'));
    }

    public function test_failed_email_batch_is_an_http_error_and_does_not_claim_success(): void
    {
        Mail::fake();
        $this->postJson('/api/convocations/send-session', ['session_id' => $this->session->id])->assertUnprocessable()->assertJsonPath('success', false);
        Mail::assertNothingSent();
    }
}
