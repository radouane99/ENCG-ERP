<?php

namespace Tests\Feature;

use App\Models\Campus;
use App\Models\Group;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\User;
use App\Services\Academic\TimetableCampaignService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimetableManualBoardTest extends TestCase
{
    use RefreshDatabase;

    public function test_manual_move_rejects_saturday(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $filiere = $this->makeTestFiliere(['code' => 'TC']);
        $service = app(TimetableCampaignService::class);
        $user = User::factory()->create();
        $service->openCampaign((int) $user->id, false);

        $draft = $service->ensureEmptyDraft((int) $filiere->id);
        $this->assertTrue($draft['success']);
        $versionId = (int) $draft['version_id'];

        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $room = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Salle A',
            'code' => 'SA-'.uniqid(),
            'type' => 'classroom',
            'capacity' => 40,
        ]);
        $module = $this->makeTestModule($filiere->id);
        $prof = $this->makeTestProfessor();
        $group = Group::create([
            'academic_year_id' => $year->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 1,
            'name' => 'Groupe 1',
            'capacity' => 40,
        ]);

        $service->addSession($versionId, [
            'group_ids' => [$group->id],
            'module_id' => $module->id,
            'professor_id' => $prof->id,
            'room_id' => $room->id,
            'session_type' => 'td',
            'day_of_week' => 1,
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
        ]);

        $ids = Schedule::query()->where('schedule_version_id', $versionId)->pluck('id')->all();
        $blocked = $service->moveBlock($versionId, $ids, 6, '08:30:00', '10:30:00');
        $this->assertFalse($blocked['success']);
        $this->assertStringContainsString('samedi', strtolower($blocked['message']));
    }

    public function test_manual_move_to_empty_slot_succeeds(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $filiere = $this->makeTestFiliere(['code' => 'GFC']);
        $service = app(TimetableCampaignService::class);
        $service->openCampaign((int) User::factory()->create()->id, false);
        $draft = $service->ensureEmptyDraft((int) $filiere->id);
        $versionId = (int) $draft['version_id'];

        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $room = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Amphi',
            'code' => 'AM-'.uniqid(),
            'type' => 'amphitheater',
            'capacity' => 120,
        ]);
        $module = $this->makeTestModule($filiere->id);
        $prof = $this->makeTestProfessor();
        $group = Group::create([
            'academic_year_id' => $year->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 1,
            'name' => 'Groupe 1',
            'capacity' => 40,
        ]);

        $service->addSession($versionId, [
            'group_ids' => [$group->id],
            'module_id' => $module->id,
            'professor_id' => $prof->id,
            'room_id' => $room->id,
            'session_type' => 'td',
            'day_of_week' => 1,
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
        ]);

        $ids = Schedule::query()->where('schedule_version_id', $versionId)->pluck('id')->all();
        $moved = $service->moveBlock($versionId, $ids, 3, '14:30:00', '16:30:00');
        $this->assertTrue($moved['success']);
        $this->assertSame(3, (int) Schedule::query()->find($ids[0])->day_of_week);
    }

    public function test_add_session_rejects_same_group_overlap(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $filiere = $this->makeTestFiliere(['code' => 'MCM']);
        $service = app(TimetableCampaignService::class);
        $service->openCampaign((int) User::factory()->create()->id, false);
        $versionId = (int) $service->ensureEmptyDraft((int) $filiere->id)['version_id'];
        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $roomA = Room::create([
            'institution_id' => 1, 'campus_id' => $campus->id, 'name' => 'A', 'code' => 'A-'.uniqid(), 'type' => 'classroom', 'capacity' => 40,
        ]);
        $roomB = Room::create([
            'institution_id' => 1, 'campus_id' => $campus->id, 'name' => 'B', 'code' => 'B-'.uniqid(), 'type' => 'classroom', 'capacity' => 40,
        ]);
        $group = Group::create([
            'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 1, 'name' => 'G1', 'capacity' => 40,
        ]);
        $payload = [
            'group_ids' => [$group->id],
            'module_id' => $this->makeTestModule($filiere->id, ['code' => 'X1'])->id,
            'professor_id' => $this->makeTestProfessor(['email' => 'a@encg.test'])->id,
            'room_id' => $roomA->id,
            'session_type' => 'td',
            'day_of_week' => 1,
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
        ];
        $this->assertTrue($service->addSession($versionId, $payload)['success']);
        $second = $service->addSession($versionId, array_merge($payload, [
            'module_id' => $this->makeTestModule($filiere->id, ['code' => 'X2'])->id,
            'professor_id' => $this->makeTestProfessor(['email' => 'b@encg.test'])->id,
            'room_id' => $roomB->id,
        ]));
        $this->assertFalse($second['success']);
    }

    public function test_board_snaps_non_standard_times_onto_pedagogic_slots(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $filiere = $this->makeTestFiliere(['code' => 'TC']);
        $service = app(TimetableCampaignService::class);
        $service->openCampaign((int) User::factory()->create()->id, false);
        $versionId = (int) $service->ensureEmptyDraft((int) $filiere->id)['version_id'];
        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $room = Room::create([
            'institution_id' => 1, 'campus_id' => $campus->id, 'name' => 'A', 'code' => 'A-'.uniqid(), 'type' => 'classroom', 'capacity' => 40,
        ]);
        $group = Group::create([
            'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 1, 'name' => 'G1', 'capacity' => 40,
        ]);
        $this->assertTrue($service->addSession($versionId, [
            'group_ids' => [$group->id],
            'module_id' => $this->makeTestModule($filiere->id)->id,
            'professor_id' => $this->makeTestProfessor()->id,
            'room_id' => $room->id,
            'session_type' => 'td',
            'day_of_week' => 1,
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
        ])['success']);

        $block = $service->board($versionId)['blocks'][0];
        $this->assertSame(1, $block['slot_index']);
        $this->assertSame('08:30:00', $block['start_time']);
        $this->assertFalse($block['unplaced']);
    }

    public function test_workspace_counts_unique_professors_not_sessions(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $filiere = $this->makeTestFiliere(['code' => 'TC']);
        $service = app(TimetableCampaignService::class);
        $service->openCampaign((int) User::factory()->create()->id, false);
        $versionId = (int) $service->ensureEmptyDraft((int) $filiere->id)['version_id'];
        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $room = Room::create([
            'institution_id' => 1, 'campus_id' => $campus->id, 'name' => 'A', 'code' => 'A-'.uniqid(), 'type' => 'classroom', 'capacity' => 40,
        ]);
        $group = Group::create([
            'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 1, 'name' => 'G1', 'capacity' => 40,
        ]);
        $prof = $this->makeTestProfessor(['email' => 'one@encg.test']);
        $modA = $this->makeTestModule($filiere->id, ['code' => 'M1']);
        $modB = $this->makeTestModule($filiere->id, ['code' => 'M2']);
        $this->assertTrue($service->addSession($versionId, [
            'group_ids' => [$group->id], 'module_id' => $modA->id, 'professor_id' => $prof->id,
            'room_id' => $room->id, 'session_type' => 'td', 'day_of_week' => 1,
            'start_time' => '08:30:00', 'end_time' => '10:30:00',
        ])['success']);
        $this->assertTrue($service->addSession($versionId, [
            'group_ids' => [$group->id], 'module_id' => $modB->id, 'professor_id' => $prof->id,
            'room_id' => $room->id, 'session_type' => 'td', 'day_of_week' => 2,
            'start_time' => '08:30:00', 'end_time' => '10:30:00',
        ])['success']);

        $card = collect($service->workspace()['filieres'])->firstWhere('filiere_id', $filiere->id);
        $this->assertSame(1, $card['confirmations']['total']);
        $this->assertSame(2, $card['confirmations']['sessions']);
        $this->assertSame(0, $card['confirmations']['confirmed']);
    }
}
