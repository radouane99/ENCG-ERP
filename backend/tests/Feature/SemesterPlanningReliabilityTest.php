<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\Group;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\Schedule;
use App\Models\User;
use App\Services\Academic\SemesterReadinessService;
use App\Services\Academic\SmartSchedulingEngine;
use App\Services\Academic\TimetableCampaignService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class SemesterPlanningReliabilityTest extends TestCase
{
    use RefreshDatabase;

    private function setupPlanning(): array
    {
        $year = $this->makeTestAcademicYear(['is_current' => true, 'start_date' => '2026-01-01', 'end_date' => '2027-12-31']);
        $semester = $this->makeTestSemester($year->id, ['number' => 1, 'is_current' => true]);
        $filiere = $this->makeTestFiliere();
        $module = $this->makeTestModule($filiere->id, ['semester_number' => 1]);
        $group = Group::create(['academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 1, 'name' => 'Synthetic G1', 'capacity' => 30]);
        $professor = $this->makeTestProfessor(['is_active' => true]);
        $actor = User::factory()->create(['institution_id' => 1]);
        $actor->assignRole(Role::findOrCreate('admin', 'sanctum'));
        Sanctum::actingAs($actor);
        $campus = Campus::firstOrCreate(['code' => 'SYNTHETIC'], ['institution_id' => 1, 'name' => 'Synthetic', 'is_main' => false]);
        $room = Room::create(['institution_id' => 1, 'campus_id' => $campus->id, 'name' => 'Synthetic A', 'code' => 'SYN-A', 'type' => 'classroom', 'capacity' => 40, 'is_available' => true]);
        $service = app(TimetableCampaignService::class);
        $service->openCampaign($actor->id);
        $versionId = $service->ensureEmptyDraft($filiere->id)['version_id'];
        $payload = ['group_ids' => [$group->id], 'module_id' => $module->id, 'professor_id' => $professor->id, 'room_id' => $room->id, 'session_type' => 'td', 'day_of_week' => 1, 'start_time' => '08:30:00', 'end_time' => '10:30:00'];

        return compact('year', 'semester', 'filiere', 'module', 'group', 'professor', 'actor', 'room', 'service', 'versionId', 'payload');
    }

    private function assign(array $c): void
    {
        ModuleProfessor::create(['academic_year_id' => $c['year']->id, 'module_id' => $c['module']->id, 'group_id' => $c['group']->id, 'professor_id' => $c['professor']->id, 'professor_type' => Professor::class, 'assigned_hours' => 30, 'session_type' => 'td']);
    }

    public function test_draft_stays_private_until_its_teacher_confirms_and_publication_is_idempotent(): void
    {
        $c = $this->setupPlanning();
        $this->assign($c);
        $service = $c['service'];
        $id = $c['versionId'];
        $this->assertTrue($service->addSession($id, $c['payload'])['success']);
        $session = Schedule::where('schedule_version_id', $id)->firstOrFail();
        $this->assertFalse((bool) $session->is_active);
        $this->assertFalse($service->publish($id)['success']);
        $this->assertTrue($service->propose($id)['success']);
        $this->assertFalse($service->publish($id)['success']);
        $c['professor']->user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        Sanctum::actingAs($c['professor']->user);
        $this->getJson('/api/professor-portal/schedule')->assertOk()->assertJsonPath('professor_id', $c['professor']->id)->assertJsonPath('data.0.lifecycle', 'PROPOSED');
        $this->postJson('/api/professor-portal/schedules/'.$session->id.'/confirm', ['decision' => 'confirmed'])->assertOk();
        Sanctum::actingAs($c['actor']);
        $this->assertTrue($service->propose($id)['success']);
        $this->assertSame('confirmed', $session->fresh()->confirmation_status);
        $this->assertTrue($service->publish($id)['success']);
        $this->assertTrue((bool) $session->fresh()->is_active);
        $this->assertFalse($service->board($id)['editable']);
        $this->assertTrue($service->publish($id)['success']);
        $this->expectException(HttpException::class);
        $service->deleteSession($id, [$session->id]);
    }

    public function test_room_capacity_and_overlapping_teacher_are_checked_on_manual_add(): void
    {
        $c = $this->setupPlanning();
        $service = $c['service'];
        $c['room']->update(['capacity' => 10]);
        $this->assertFalse($service->addSession($c['versionId'], $c['payload'])['success']);
        $c['room']->update(['capacity' => 40]);
        $this->assertTrue($service->addSession($c['versionId'], $c['payload'])['success']);
        $group = $c['group']->replicate();
        $group->name = 'Synthetic G2';
        $group->save();
        $this->assertFalse($service->addSession($c['versionId'], array_merge($c['payload'], ['group_ids' => [$group->id]]))['success']);
        $this->assertSame(1, Schedule::where('schedule_version_id', $c['versionId'])->count());
    }

    public function test_stale_board_revision_does_not_delete_another_agents_work(): void
    {
        $c = $this->setupPlanning();
        $revision = $c['service']->board($c['versionId'])['revision'];
        $c['service']->addSession($c['versionId'], $c['payload']);
        $id = Schedule::where('schedule_version_id', $c['versionId'])->value('id');
        $this->postJson('/api/admin/smart-scheduling/versions/'.$c['versionId'].'/sessions/delete', ['schedule_ids' => [$id], 'revision' => $revision])->assertConflict();
        $this->assertDatabaseHas('schedules', ['id' => $id]);
    }

    public function test_generator_uses_only_real_assignments_and_selected_semester(): void
    {
        $c = $this->setupPlanning();
        $empty = app(SmartSchedulingEngine::class)->simulate(['filiere_id' => $c['filiere']->id, 'semester_number' => 1]);
        $this->assertSame(0, $empty['total_placed']);
        $this->assertNotEmpty($empty['input_issues']);
        $this->assign($c);
        $result = app(SmartSchedulingEngine::class)->simulate(['filiere_id' => $c['filiere']->id, 'semester_number' => 1, 'teaching_weeks' => 15]);
        $this->assertSame(1, $result['total_placed']);
        $this->assertSame('td', $result['scheduled_sessions'][0]['session_type']);
        $this->assertSame($c['professor']->id, $result['scheduled_sessions'][0]['professor_id']);
        $other = app(SmartSchedulingEngine::class)->simulate(['filiere_id' => $c['filiere']->id, 'semester_number' => 2]);
        $this->assertSame(0, $other['total_placed']);
        $readiness = app(SemesterReadinessService::class)->summarize($c['year'], 1);
        $this->assertSame(0, $readiness['missing_assignments_count']);
        $this->assertEquals(30, $readiness['professor_loads'][0]['assigned_hours']);
    }

    public function test_reapproving_cancelled_booking_rechecks_occupancy(): void
    {
        $c = $this->setupPlanning();
        $base = ['room_id' => $c['room']->id, 'room_name' => $c['room']->name, 'booked_by' => $c['actor']->id, 'purpose' => 'Synthetic', 'start_time' => '2026-11-02 08:30:00', 'end_time' => '2026-11-02 10:30:00'];
        $old = RoomBooking::create($base + ['status' => 'cancelled']);
        $current = RoomBooking::create($base + ['status' => 'approved']);
        $this->patchJson('/api/room-bookings/'.$old->id, ['status' => 'approved'])->assertConflict();
        $this->assertSame('cancelled', $old->fresh()->status);
        $this->patchJson('/api/room-bookings/'.$current->id, ['status' => 'approved'])->assertOk();
    }

    public function test_legacy_timetable_write_and_read_share_conflict_checks(): void
    {
        $c = $this->setupPlanning();
        $payload = array_merge($c['payload'], ['institution_id' => 1, 'academic_year_id' => $c['year']->id, 'semester_id' => $c['semester']->id, 'group_id' => $c['group']->id, 'start_time' => '08:30', 'end_time' => '10:30']);
        unset($payload['group_ids']);
        $id = $this->postJson('/api/timetable', $payload)->assertCreated()->json('data.id');
        $this->postJson('/api/timetable', $payload)->assertConflict();
        $this->getJson('/api/timetable')->assertOk()->assertJsonPath('data.0.type', 'td');
        $this->putJson('/api/timetable/'.$id, ['start_time' => '11:00', 'end_time' => '12:30', 'version' => 999])->assertConflict();
        $this->assertDatabaseHas('schedules', ['id' => $id, 'start_time' => '08:30:00']);
    }

    public function test_carry_forward_previews_and_preserves_existing_target_assignments(): void
    {
        $c = $this->setupPlanning();
        $source = AcademicYear::firstOrCreate(['institution_id' => 1, 'start_year' => 2025], ['label' => '2025/2026', 'end_year' => 2026, 'start_date' => '2025-09-01', 'end_date' => '2026-06-30', 'is_current' => false, 'is_locked' => true]);
        $group = $c['group']->replicate();
        $group->academic_year_id = $source->id;
        $group->save();
        ModuleProfessor::create(['academic_year_id' => $source->id, 'module_id' => $c['module']->id, 'group_id' => $group->id, 'professor_id' => $c['professor']->id, 'professor_type' => Professor::class, 'assigned_hours' => 27, 'session_type' => 'td']);
        $url = '/api/professor-assignments/carry-forward';
        $this->postJson($url, ['source_year_id' => $source->id])->assertOk()->assertJsonCount(1, 'data.candidates')->assertJsonPath('data.created', 0);
        $this->assertSame(0, ModuleProfessor::where('academic_year_id', $c['year']->id)->count());
        $this->postJson($url, ['source_year_id' => $source->id, 'apply' => true])->assertOk()->assertJsonPath('data.created', 1);
        $this->postJson($url, ['source_year_id' => $source->id, 'apply' => true])->assertOk()->assertJsonPath('data.created', 0)->assertJsonCount(1, 'data.skipped');
        $this->assertDatabaseHas('module_professor', ['academic_year_id' => $c['year']->id, 'group_id' => $c['group']->id, 'assigned_hours' => 27]);
        $this->assertSame(1, ModuleProfessor::where('academic_year_id', $source->id)->count());
    }

    public function test_orders_zip_contains_a_real_pdf_for_each_assigned_teacher(): void
    {
        $c = $this->setupPlanning();
        $this->assign($c);
        $response = $this->get('/api/professor-assignments/orders-zip')->assertOk()->assertDownload('ordres-service-2026.zip');
        $path = $response->baseResponse->getFile()->getPathname();
        $zip = new \ZipArchive;
        $this->assertTrue($zip->open($path));
        $this->assertSame(1, $zip->numFiles);
        $this->assertStringStartsWith('%PDF-', $zip->getFromIndex(0));
        $zip->close();
        unlink($path);
    }
}
