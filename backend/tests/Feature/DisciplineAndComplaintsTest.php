<?php

namespace Tests\Feature;

use App\Models\DisciplinaryCase;
use App\Models\DisciplinaryDecision;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DisciplineAndComplaintsTest extends TestCase
{
    use RefreshDatabase;

    private Student $student;

    private User $studentUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = $this->makeTestStudent([
            'first_name' => 'Taha',
            'last_name' => 'BENABDELLAH',
            'cne' => 'N667788990',
        ]);
        $this->studentUser = $this->student->user;
    }

    /**
     * Test de consignation et instruction d'un dossier disciplinaire étudiant.
     */
    public function test_can_submit_and_resolve_student_complaint(): void
    {
        $case = DisciplinaryCase::create([
            'institution_id' => 1,
            'student_id' => $this->student->id,
            'case_number' => 'CASE-2026-'.uniqid(),
            'infraction_type' => 'cheating',
            'description' => 'Signalement d\'un incident lors de l\'épreuve.',
            'incident_date' => '2026-11-01',
            'status' => 'under_review',
        ]);

        $this->assertDatabaseHas('disciplinary_cases', [
            'id' => $case->id,
            'status' => 'under_review',
        ]);

        $case->update([
            'status' => 'decided',
            'student_statement' => 'Explication fournie et dossier clos.',
        ]);

        $this->assertDatabaseHas('disciplinary_cases', [
            'id' => $case->id,
            'status' => 'decided',
        ]);
    }

    /**
     * Test de tenue d'un conseil de discipline et prononcé d'un avertissement.
     */
    public function test_can_record_disciplinary_council_action(): void
    {
        $director = User::factory()->create();

        $case = DisciplinaryCase::create([
            'institution_id' => 1,
            'student_id' => $this->student->id,
            'case_number' => 'DISC-2026-'.uniqid(),
            'infraction_type' => 'cheating',
            'description' => 'Tentative de fraude constatée lors du devoir surveillé de Management.',
            'incident_date' => '2026-11-05',
            'status' => 'pending',
        ]);

        $decision = DisciplinaryDecision::create([
            'disciplinary_case_id' => $case->id,
            'sanction_type' => 'warning',
            'decision_text' => 'Avertissement officiel avec inscription au dossier universitaire.',
            'decision_date' => '2026-11-10',
            'decided_by' => $director->id,
        ]);

        $case->update(['status' => 'decided']);

        $this->assertDatabaseHas('disciplinary_cases', [
            'id' => $case->id,
            'status' => 'decided',
        ]);

        $this->assertDatabaseHas('disciplinary_decisions', [
            'disciplinary_case_id' => $case->id,
            'sanction_type' => 'warning',
        ]);
    }
}
