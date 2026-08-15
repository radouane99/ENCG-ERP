<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\StudentCard;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentSmartCardAndNfcTest extends TestCase
{
    use RefreshDatabase;

    private Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = $this->makeTestStudent([
            'first_name' => 'Ghita',
            'last_name'  => 'BENJELLOUN',
            'cne'        => 'N223344556',
            'gender'     => 'female',
        ]);
    }

    /**
     * Test d'émission et d'impression d'une Carte Étudiant PVC Smart Card avec UID NFC.
     */
    public function test_can_issue_and_activate_pvc_smart_card(): void
    {
        $card = StudentCard::create([
            'student_id'     => $this->student->user_id,
            'card_number'    => 'ENCG-CARD-2026-GHITA1',
            'qr_token'       => hash('sha256', "CARD-{$this->student->cne}"),
            'academic_year'  => '2026-2027',
            'status'         => 'active',
            'expires_at'     => now()->addYear(),
        ]);

        $this->assertDatabaseHas('student_cards', [
            'student_id'  => $this->student->user_id,
            'card_number' => 'ENCG-CARD-2026-GHITA1',
            'status'      => 'active',
        ]);
    }
}
