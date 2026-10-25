<?php

namespace Tests\Feature;

use App\Models\{Campus, Exam, ExamIncident, ExamSeating, ExamSession, ExamSurveillance, Group, Room, StudentRegistration, User};
use App\Services\Academic\ExamConvocationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        $seat = $this->seat(); $seat->update(['sent_at' => now()]);
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
        $seat = $this->seat(); $this->exam->update(['is_locked' => true]);
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
        unset($data['exam_id']); $this->postJson('/api/exam-incidents', $data)->assertUnprocessable();
    }

    public function test_council_decision_requires_hearing_and_cannot_be_rewritten(): void
    {
        $seat = $this->seat();
        $incident = ExamIncident::create(['exam_id' => $this->exam->id, 'student_id' => $seat->student_id, 'type' => 'fraude', 'status' => 'pending']);
        $url = '/api/discipline/'.$incident->id;
        $data = ['sanction' => 'dismissed', 'observations' => 'Audition synthétique : aucun élément retenu.'];
        $this->postJson($url.'/decide', $data)->assertStatus(409);
        $this->postJson($url.'/convoke', ['hearing_date' => '2027-01-16 à 10:00', 'hearing_room' => 'Salle du conseil'])->assertOk();
        $this->travelTo(\Carbon\Carbon::parse('2027-01-16 11:00'));
        $this->postJson($url.'/decide', $data)->assertOk();
        $this->postJson($url.'/decide', ['sanction' => 'module', 'observations' => 'Autre décision sans réouverture.'])->assertStatus(409);
        $this->deleteJson($url)->assertStatus(409);
        $this->assertDatabaseHas('exam_incidents', ['id' => $incident->id, 'status' => 'dismissed']);
    }

    public function test_regenerating_qr_keeps_existing_seat_number_and_token(): void
    {
        $seat = $this->seat(); $seat->update(['seat_number' => 19]);
        app(ExamConvocationService::class)->generateConvocations($this->exam->id);
        app(ExamConvocationService::class)->generateConvocations($this->exam->id);
        $this->assertDatabaseHas('exam_seatings', ['id' => $seat->id, 'qr_token' => 'SYN-QR', 'seat_number' => 19]);
        $this->assertDatabaseCount('exam_seatings', 1);
    }

    public function test_manual_planning_requires_session_and_refuses_overlap(): void
    {
        $data = ['exam_session_id' => $this->session->id, 'module_id' => $this->exam->module_id, 'group_id' => $this->exam->group_id, 'room_id' => $this->exam->room_id, 'exam_date' => '2027-01-12', 'start_time' => '09:00', 'duration_minutes' => 120];
        $this->postJson('/api/exam-planning/store', $data)->assertStatus(409);
        $data['exam_date'] = '2027-02-01'; $this->postJson('/api/exam-planning/store', $data)->assertUnprocessable();
        $data['exam_date'] = '2027-01-13'; $this->postJson('/api/exam-planning/store', $data)->assertOk()->assertJsonPath('exam.exam_session_id', $this->session->id);
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
        $seat = $this->seat(); $seat->update(['seat_number' => 125]);
        $this->getJson('/api/exam-planning/'.$this->exam->id.'/details')->assertOk();
        $this->getJson('/api/exam-planning/'.$this->exam->id.'/details')->assertOk();
        $this->assertEquals(125, $seat->fresh()->seat_number);
    }

    public function test_pending_or_dismissed_incident_does_not_force_zero_in_grading(): void
    {
        $seat = $this->seat();
        $incident = ExamIncident::create(['exam_id' => $this->exam->id, 'student_id' => $seat->student_id, 'type' => 'fraude', 'status' => 'pending']);
        $service = app(\App\Services\Academic\GradeService::class);
        $this->assertSame([], $service->getFraudStudentIds($this->exam->module));
        $incident->update(['status' => 'dismissed', 'sanction_scope' => 'dismissed']);
        $this->assertSame([], $service->getFraudStudentIds($this->exam->module));
    }

    public function test_personal_visas_are_persistent_and_lock_requires_both(): void
    {
        $seat = $this->seat(); $seat->update(['status' => 'present', 'is_present' => true]);
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
        $seat = $this->seat(); $seat->update(['seat_number' => 125]);
        foreach (['Premier constat', 'Deuxième constat distinct'] as $description) {
            ExamIncident::create(['exam_id' => $this->exam->id, 'student_id' => $seat->student_id, 'type' => 'fraude', 'description' => $description]);
        }
        $pdf = \Mockery::mock(\Barryvdh\DomPDF\PDF::class);
        $pdf->shouldReceive('stream')->once()->andReturn(response('%PDF-synthetic', 200, ['Content-Type' => 'application/pdf']));
        $this->mock(\App\Services\Documents\OfficialPdfFactory::class)->shouldReceive('make')->once()
            ->with('pdf.pv_examen', \Mockery::on(fn ($data) => ! $data['hasPrincipalSignature'] && ! $data['hasSecondarySignature'] && $data['incidents']->count() === 2 && $data['unrecorded_students'] === 1 && str_contains($data['verifyUrl'], '/surveillance')))->andReturn($pdf);
        $this->get('/api/exams/'.$this->exam->id.'/pv-pdf?principal_signature=data:image/png;base64,FORGED')->assertOk();
        $this->assertDatabaseCount('exam_incidents', 2);
        $this->assertEquals(125, $seat->fresh()->seat_number);
        $this->assertNull($seat->fresh()->is_present);
    }

    public function test_hearing_email_uses_registered_student_and_reports_transport_status(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $seat = $this->seat();
        $incident = ExamIncident::create(['exam_id' => $this->exam->id, 'student_id' => $seat->student_id, 'type' => 'fraude', 'status' => 'pending']);
        $this->mock(\App\Http\Controllers\Api\PdfExportController::class)->shouldReceive('convocationDisciplinePdf')->once()->with($incident->id)->andReturn(response('%PDF-synthetic'));
        $this->postJson('/api/discipline/'.$incident->id.'/convoke', ['hearing_date' => '2027-01-16 à 10:00', 'hearing_room' => 'Salle du conseil', 'send_email' => true])->assertOk()->assertJsonPath('email_status', 'accepted');
        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\DisciplineHearingMail::class, fn ($mail) => $mail->hasTo($seat->student->user->email) && count($mail->attachments()) === 1);
    }
}

