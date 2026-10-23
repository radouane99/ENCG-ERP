<?php

namespace Tests\Feature;

use App\Actions\Exam\StoreBulkGradesAction;
use App\Actions\Student\SubmitAssignmentAction;
use App\Console\Commands\DeepDatabaseScanCommand;
use App\Exceptions\OptimisticLockException;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Grade;
use App\Models\Group;
use App\Models\LearningMaterial;
use App\Models\Room;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\GradeGridService;
use Illuminate\Console\OutputStyle;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class SecondDeepScanRemediationTest extends TestCase
{
    use RefreshDatabase;

    private function actor(string $role): User
    {
        Role::findOrCreate($role, 'sanctum');
        $user = User::factory()->create(['institution_id' => 1]);
        $user->assignRole($role);

        return $user;
    }

    private function context(): array
    {
        $year = $this->ensureAcademicYear();
        $year->update(['is_current' => true]);
        $f = $this->makeTestFiliere();
        $module = $this->makeTestModule($f->id);
        $group = Group::create(['filiere_id' => $f->id, 'academic_year_id' => $year->id, 'semester_number' => 1, 'name' => 'G1', 'capacity' => 60]);

        return [$year, $f, $module, $group];
    }

    public function test_evaluations_are_isolated_by_year_and_keep_historical_grades(): void
    {
        [$year,$f,$module] = $this->context();
        $a = Assessment::create(['module_id' => $module->id, 'type' => 'CC', 'weight' => 100]);
        $s = $this->makeTestStudent();
        Grade::create(['student_id' => $s->id, 'assessment_id' => $a->id, 'value' => 14]);
        $year->update(['is_current' => false]);
        $next = AcademicYear::create(['institution_id' => 1, 'label' => '2027/2028', 'start_year' => 2027, 'end_year' => 2028, 'start_date' => '2027-09-01', 'end_date' => '2028-06-30', 'is_current' => true]);
        $b = Assessment::firstOrCreate(['module_id' => $module->id, 'type' => 'CC'], ['weight' => 100]);
        $this->assertNotEquals($a->id, $b->id);
        $this->assertEquals($next->id, $b->academic_year_id);
        $this->assertDatabaseHas('grades', ['assessment_id' => $a->id, 'value' => 14]);
        $this->assertNull(Assessment::find($a->id));
    }

    public function test_unassigned_professor_cannot_read_secondary_grid(): void
    {
        [$year,$f,$m,$g] = $this->context();
        Sanctum::actingAs($this->actor('professor'));
        $this->getJson('/api/v1/professor/grades/grid?module_id='.$m->id.'&group_id='.$g->id)->assertForbidden();
        $this->assertDatabaseCount('assessments', 0);
    }

    public function test_secondary_grid_rejects_missing_versions(): void
    {
        [$year,$f,$m,$g] = $this->context();
        Sanctum::actingAs($this->actor('institution-admin'));
        $this->postJson('/api/v1/professor/grades/save', ['module_id' => $m->id, 'group_id' => $g->id, 'updates' => [['student_id' => 1, 'cc' => 12, 'exam' => 14]]])->assertUnprocessable();
    }

    public function test_two_semester_registrations_in_same_year_are_allowed(): void
    {
        [$year,$f,$m,$g] = $this->context();
        $s = $this->makeTestStudent();
        foreach ([1, 2] as $semester) {
            StudentRegistration::create(['student_id' => $s->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'semester_number' => $semester, 'registration_type' => 'new']);
        }
        $this->assertEquals(2, StudentRegistration::where('student_id', $s->id)->count());
    }

    public function test_identity_writes_save_the_canonical_user_without_loading_relation(): void
    {
        $s = $this->makeTestStudent();
        $s->unsetRelation('user');
        $s->update(['first_name' => 'Canonical', 'cin' => 'AUDIT-CIN', 'birth_date' => '2000-01-03']);
        $this->assertEquals('Canonical', $s->user->fresh()->first_name);
        $this->assertEquals('AUDIT-CIN', $s->fresh()->cin);
        $this->assertEquals('2000-01-03', $s->user->fresh()->birth_date->format('Y-m-d'));
    }

    public function test_submission_persists_and_rejects_a_duplicate(): void
    {
        [$year,$f,$m] = $this->context();
        $s = $this->makeTestStudent();
        $p = $this->makeTestProfessor();
        $a = LearningMaterial::create(['module_id' => $m->id, 'academic_year_id' => $year->id, 'professor_id' => $p->id, 'professor_type' => get_class($p), 'title' => 'Travail', 'type' => 'assignment', 'is_published' => true, 'due_date' => now()->addDay()]);
        $result = app(SubmitAssignmentAction::class)->execute($s->user, $m->id, $a->id, ['text' => 'Mon travail'], null);
        $this->assertDatabaseHas('lms_submissions', ['id' => $result->id, 'submission_text' => 'Mon travail']);
        try {
            app(SubmitAssignmentAction::class)->execute($s->user, $m->id, $a->id, ['text' => 'Autre'], null);
            $this->fail('Duplicate accepted');
        } catch (HttpException $e) {
            $this->assertEquals(409, $e->getStatusCode());
        }
        $this->assertDatabaseCount('lms_submissions', 1);
    }

    public function test_assignment_must_belong_to_requested_module(): void
    {
        [$year,$f,$m] = $this->context();
        $other = $this->makeTestModule($f->id);
        $s = $this->makeTestStudent();
        $p = $this->makeTestProfessor();
        $a = LearningMaterial::create(['module_id' => $m->id, 'academic_year_id' => $year->id, 'professor_id' => $p->id, 'professor_type' => get_class($p), 'title' => 'Travail', 'type' => 'assignment', 'is_published' => true, 'due_date' => now()->addDay()]);
        $this->expectException(ModelNotFoundException::class);
        app(SubmitAssignmentAction::class)->execute($s->user, $other->id, $a->id, ['text' => 'Travail'], null);
    }

    public function test_signed_module_cannot_delete_its_modalities(): void
    {
        [$year,$f,$m] = $this->context();
        $s = $this->makeTestStudent();
        $a = Assessment::create(['module_id' => $m->id, 'type' => 'CC', 'weight' => 100]);
        Grade::create(['student_id' => $s->id, 'assessment_id' => $a->id, 'value' => 13]);
        $this->expectException(HttpException::class);
        $a->delete();
    }

    public function test_secondary_grid_is_atomic_and_rejects_a_stale_version(): void
    {
        [$year,$f,$m,$g] = $this->context();
        $this->ensureInstitution()->update(['settings' => ['exam_lock_phase' => 'Ordinaire Automne']]);
        $actor = $this->actor('institution-admin');
        $s = $this->makeTestStudent();
        StudentRegistration::create(['student_id' => $s->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'group_id' => $g->id, 'semester_number' => 1, 'registration_type' => 'new']);
        foreach (['CC', 'Exam'] as $type) {
            Assessment::create(['module_id' => $m->id, 'type' => $type, 'weight' => 50]);
        }
        $data = ['module_id' => $m->id, 'group_id' => $g->id, 'updates' => [['student_id' => $s->id, 'cc' => 12, 'exam' => 14, 'cc_version' => 0, 'exam_version' => 0]]];
        $result = app(GradeGridService::class)->save($actor, $data);
        $this->assertEquals(13, $result['calculated_results'][0]['average']);
        $data['updates'][0]['cc'] = 19;
        try {
            app(GradeGridService::class)->save($actor, $data);
            $this->fail('Stale write accepted');
        } catch (OptimisticLockException $e) {
            $this->assertDatabaseHas('grades', ['student_id' => $s->id, 'value' => 12]);
        }
        $this->assertDatabaseCount('grades', 2);
    }

    public function test_secondary_grid_does_not_write_for_another_group_student(): void
    {
        [$year,$f,$m,$g] = $this->context();
        $this->ensureInstitution()->update(['settings' => ['exam_lock_phase' => 'Ordinaire Automne']]);
        foreach (['CC', 'Exam'] as $type) {
            Assessment::create(['module_id' => $m->id, 'type' => $type, 'weight' => 50]);
        }
        $s = $this->makeTestStudent();
        try {
            app(GradeGridService::class)->save($this->actor('institution-admin'), ['module_id' => $m->id, 'group_id' => $g->id, 'updates' => [['student_id' => $s->id, 'cc' => 12, 'exam' => 14, 'cc_version' => 0, 'exam_version' => 0]]]);
            $this->fail('Foreign student accepted');
        } catch (ValidationException $e) {
            $this->assertDatabaseCount('grades', 0);
        }
    }

    public function test_repartition_keeps_the_old_year_untouched(): void
    {
        [$year,$f,$m,$g] = $this->context();
        $s = $this->makeTestStudent();
        $old = AcademicYear::create(['institution_id' => 1, 'label' => '2023/2024', 'start_year' => 2023, 'end_year' => 2024, 'start_date' => '2023-09-01', 'end_date' => '2024-06-30', 'is_current' => false]);
        $previous = StudentPathway::create(['student_id' => $s->id, 'filiere_id' => $f->id, 'academic_year_id' => $old->id, 'current_semester' => 1, 'is_current' => false]);
        StudentPathway::create(['student_id' => $s->id, 'filiere_id' => $f->id, 'academic_year_id' => $year->id, 'current_semester' => 1, 'is_current' => true]);
        Sanctum::actingAs($this->actor('super-admin'));
        $this->postJson('/api/groups/dispatch-students', ['filiere_id' => $f->id, 'academic_year_id' => $year->id, 'semester_number' => 1])->assertOk()->assertJsonPath('dispatched_count', 1);
        $this->assertNull($previous->fresh()->group_id);
        $this->assertDatabaseHas('student_pathways', ['student_id' => $s->id, 'academic_year_id' => $year->id, 'group_id' => $g->id]);
    }

    public function test_private_submission_file_is_downloadable_only_by_owner_or_teacher(): void
    {
        [$year,$f,$m] = $this->context();
        $s = $this->makeTestStudent(['user' => $this->actor('student')]);
        $p = $this->makeTestProfessor();
        $a = LearningMaterial::create(['module_id' => $m->id, 'academic_year_id' => $year->id, 'professor_id' => $p->id, 'professor_type' => get_class($p), 'title' => 'Travail', 'type' => 'assignment', 'is_published' => true, 'due_date' => now()->addDay()]);
        Storage::fake('local');
        $result = app(SubmitAssignmentAction::class)->execute($s->user, $m->id, $a->id, [], UploadedFile::fake()->create('rapport.pdf', 5, 'application/pdf'));
        Sanctum::actingAs($s->user);
        $this->get('/api/lms/submissions/'.$result->id.'/file')->assertOk();
        Sanctum::actingAs($this->actor('student'));
        $this->get('/api/lms/submissions/'.$result->id.'/file')->assertForbidden();
    }

    public function test_explicit_historical_context_does_not_leak_into_the_next_operation(): void
    {
        [$year,$f,$m] = $this->context();
        $active = Assessment::create(['module_id' => $m->id, 'type' => 'CC', 'weight' => 100]);
        $old = AcademicYear::create(['institution_id' => 1, 'label' => '2023/2024', 'start_year' => 2023, 'end_year' => 2024, 'start_date' => '2023-09-01', 'end_date' => '2024-06-30', 'is_current' => false]);
        $historical = Assessment::create(['module_id' => $m->id, 'academic_year_id' => $old->id, 'type' => 'CC', 'weight' => 100]);
        AcademicContext::run($old->id, function () use ($historical) {
            $this->assertSame($historical->id, Assessment::first()->id);
        });
        $this->assertSame($active->id, Assessment::first()->id);
    }

    public function test_postgres_rejects_raw_cascade_deletion_of_a_recorded_assessment(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('PostgreSQL FK preservation');
        }
        [$year,$f,$m] = $this->context();
        $s = $this->makeTestStudent();
        $a = Assessment::create(['module_id' => $m->id, 'type' => 'CC', 'weight' => 100]);
        Grade::create(['student_id' => $s->id, 'assessment_id' => $a->id, 'value' => 12]);
        try {
            DB::transaction(fn () => DB::table('assessments')->where('id', $a->id)->delete());
            $this->fail('Grade deleted');
        } catch (QueryException $e) {
            $this->assertDatabaseHas('grades', ['assessment_id' => $a->id, 'value' => 12]);
        }
    }

    public function test_integrity_review_changes_the_canonical_identity_and_closes_only_that_issue(): void
    {
        $student = $this->makeTestStudent();
        $issue = DB::table('data_integrity_issues')->insertGetId(['entity' => 'students', 'entity_id' => $student->id, 'reason' => 'identity_conflict_cin', 'created_at' => now(), 'updated_at' => now()]);
        Sanctum::actingAs($this->actor('student'));
        $this->patchJson('/api/admin/academic-integrity/issues/'.$issue.'/identity', ['value' => 'VALID123'])->assertForbidden();
        Sanctum::actingAs($this->actor('super-admin'));
        $this->patchJson('/api/admin/academic-integrity/issues/'.$issue.'/identity', ['value' => 'VALID123'])->assertOk();
        $this->assertSame('VALID123', $student->fresh()->cin);
        $this->assertNotNull(DB::table('data_integrity_issues')->where('id', $issue)->value('resolved_at'));
    }

    public function test_review_pending_blocks_grade_writes_without_deleting_existing_grades(): void
    {
        [$year,$f,$m] = $this->context();
        $s = $this->makeTestStudent();
        $a = Assessment::create(['module_id' => $m->id, 'type' => 'CC', 'weight' => 100]);
        Assessment::create(['module_id' => $m->id, 'type' => 'legacy', 'weight' => 0, 'needs_review' => true]);
        try {
            app(StoreBulkGradesAction::class)->execute($a, [['student_id' => $s->id, 'value' => 14, 'version' => 0]], [], fn () => null);
            $this->fail('Pending review ignored');
        } catch (HttpException $e) {
            $this->assertEquals(409, $e->getStatusCode());
            $this->assertDatabaseCount('grades', 0);
        }
    }

    public function test_qr_scan_requires_a_real_token_and_prevents_double_attendance(): void
    {
        [$year,$f,$m,$g] = $this->context();
        $student = $this->makeTestStudent();
        $actor = $this->actor('professor');
        $semester = $this->makeTestSemester($year->id);
        $session = ExamSession::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'semester_id' => $semester->id, 'name' => 'Session test', 'type' => 'normale', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
        $room = Room::create(['institution_id' => 1, 'name' => 'Audit room', 'code' => 'AUDIT-QR', 'type' => 'classroom', 'capacity' => 40]);
        $exam = Exam::create(['exam_session_id' => $session->id, 'module_id' => $m->id, 'group_id' => $g->id, 'room_id' => $room->id, 'exam_date' => now()->toDateString(), 'start_time' => '09:00', 'duration_minutes' => 120, 'type' => 'written']);
        ExamSurveillance::create(['exam_id' => $exam->id, 'room_id' => $room->id, 'professor_id' => $actor->id, 'role' => 'surveillant']);
        ExamSeating::create(['exam_id' => $exam->id, 'room_id' => $room->id, 'student_id' => $student->id, 'seat_number' => 1, 'qr_token' => 'real-audit-token']);
        Sanctum::actingAs($actor);
        $url = '/api/professor/exam-attendance/scan';
        $data = ['exam_id' => $exam->id, 'room_id' => $room->id];
        $this->postJson($url, $data)->assertUnprocessable();
        $this->postJson($url, $data + ['qr_token' => 'invalid-token'])->assertNotFound();
        $this->postJson($url, $data + ['qr_token' => 'real-audit-token'])->assertOk();
        $this->postJson($url, $data + ['qr_token' => 'real-audit-token'])->assertConflict();
        $this->assertDatabaseHas('exam_seatings', ['exam_id' => $exam->id, 'student_id' => $student->id, 'is_present' => true]);
    }

    public function test_foreign_key_scanner_pairs_composite_columns_in_order(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('PostgreSQL catalog scan');
        }
        [$year,$f,$m,$group] = $this->context();
        $group->id = 500;
        $group->save();
        $student = $this->makeTestStudent();
        StudentPathway::create(['student_id' => $student->id, 'filiere_id' => $f->id, 'academic_year_id' => $year->id, 'group_id' => 500, 'current_semester' => 1, 'is_current' => true]);
        $command = app(DeepDatabaseScanCommand::class);
        $command->setOutput(new OutputStyle(new ArrayInput([]), new BufferedOutput));
        $method = new \ReflectionMethod($command, 'scanFormalForeignKeys');
        $method->invoke($command);
        $property = new \ReflectionProperty($command, 'criticalErrors');
        $this->assertSame([],$property->getValue($command));
    }
}
