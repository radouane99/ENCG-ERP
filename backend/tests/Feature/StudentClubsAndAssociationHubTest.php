<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentClubsAndAssociationHubTest extends TestCase
{
    use RefreshDatabase;

    private Student $president;

    private Club $club;

    protected function setUp(): void
    {
        parent::setUp();

        $this->president = $this->makeTestStudent([
            'first_name' => 'Walid',
            'last_name' => 'BENZIANE',
            'cne' => 'N554433221',
        ]);

        $this->club = Club::create([
            'institution_id' => 1,
            'name' => 'Junior Entreprise ENCG Fès',
            'category' => 'cultural',
            'president_name' => 'Walid BENZIANE',
            'description' => 'Cabinet de conseil étudiant de l\'ENCG Fès',
            'is_active' => true,
        ]);
    }

    /**
     * Test de création et validation d'un événement associatif étudiant.
     */
    public function test_can_create_and_approve_club_event(): void
    {
        $event = ClubEvent::create([
            'club_id' => $this->club->id,
            'title' => 'Forum Entreprises & Recrutement ENCG Fès 2027',
            'start_at' => '2027-03-18 09:00:00',
            'location' => 'Hall Principal & Amphithéâtre A',
            'description' => 'Forum annuel de recrutement et de networking',
            'status' => 'planned',
        ]);

        $this->assertDatabaseHas('club_events', [
            'club_id' => $this->club->id,
            'title' => 'Forum Entreprises & Recrutement ENCG Fès 2027',
            'status' => 'planned',
        ]);
    }
}
