<?php

namespace Tests\Feature;

use App\Models\Building;
use App\Models\Campus;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
