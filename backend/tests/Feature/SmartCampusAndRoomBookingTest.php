<?php

namespace Tests\Feature;

use App\Models\Building;
use App\Models\Campus;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class SmartCampusAndRoomBookingTest extends TestCase
{
    use RefreshDatabase;

    private Campus $campus;

    private Building $building;

    private Room $room;

    private User $professorUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->campus = Campus::create([
            'institution_id' => 1,
            'name' => 'Campus Principal ENCG Fès',
            'code' => 'CAMPUS_FES',
            'address' => 'Route de Ben Souda, Fès',
            'is_main' => true,
        ]);

        $this->room = Room::create([
            'institution_id' => 1,
            'campus_id' => $this->campus->id,
            'name' => 'Salle des Marchés & Informatique 1',
            'code' => 'INFO-1',
            'capacity' => 40,
            'type' => 'lab',
        ]);

        $this->professorUser = User::factory()->create();
    }

    /**
     * Test de réservation d'une salle avec détection des conflits de créneaux.
     */
    public function test_can_book_room_and_detect_schedule_conflicts(): void
    {
        $booking1 = RoomBooking::create([
            'room_name' => $this->room->name,
            'booked_by' => $this->professorUser->id,
            'start_time' => '2026-10-15 10:00:00',
            'end_time' => '2026-10-15 12:00:00',
            'purpose' => 'Séance TP Analyse de Données SPSS',
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('room_bookings', [
            'room_name' => $this->room->name,
            'purpose' => 'Séance TP Analyse de Données SPSS',
            'status' => 'approved',
        ]);
    }

    public function test_professor_cannot_self_approve_a_room_booking(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        $role = Role::firstOrCreate(['name' => 'professor', 'guard_name' => 'sanctum']);
        $this->professorUser->assignRole($role);

        $response = $this->actingAs($this->professorUser, 'sanctum')->postJson('/api/room-bookings', [
            'room_id' => $this->room->id,
            'purpose' => 'Séance extra',
            'start_time' => '2026-10-16 10:00:00',
            'end_time' => '2026-10-16 12:00:00',
            'status' => 'approved',
        ]);

        $response->assertCreated()->assertJsonPath('data.status', 'pending');
        $this->assertDatabaseHas('room_bookings', [
            'room_id' => $this->room->id,
            'purpose' => 'Séance extra',
            'status' => 'pending',
        ]);
    }

    public function test_scolarite_can_create_an_approved_booking(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'scolarite', 'guard_name' => 'sanctum']));

        $this->actingAs($admin, 'sanctum')->postJson('/api/room-bookings', [
            'room_id' => $this->room->id,
            'purpose' => 'Conseil pédagogique',
            'start_time' => '2026-10-17 09:00:00',
            'end_time' => '2026-10-17 11:00:00',
        ])->assertCreated()->assertJsonPath('data.status', 'approved');
    }

    public function test_professor_cannot_patch_booking_to_approved(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        $this->professorUser->assignRole(Role::firstOrCreate(['name' => 'professor', 'guard_name' => 'sanctum']));

        $booking = RoomBooking::create([
            'room_id' => $this->room->id,
            'room_name' => $this->room->name,
            'booked_by' => $this->professorUser->id,
            'purpose' => 'Réunion',
            'start_time' => '2026-10-18 10:00:00',
            'end_time' => '2026-10-18 12:00:00',
            'status' => 'pending',
        ]);

        $this->actingAs($this->professorUser, 'sanctum')
            ->patchJson('/api/room-bookings/'.$booking->id, ['status' => 'approved'])
            ->assertForbidden();

        $this->assertSame('pending', $booking->fresh()->status);
    }
}
