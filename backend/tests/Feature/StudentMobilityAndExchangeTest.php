<?php

namespace Tests\Feature;

use App\Models\MobilityPartner;
use App\Models\Student;
use App\Models\StudentMobilityChoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentMobilityAndExchangeTest extends TestCase
{
    use RefreshDatabase;

    private Student $student;

    private MobilityPartner $partner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->makeTestAcademicYear();

        $this->student = $this->makeTestStudent([
            'first_name' => 'Sara',
            'last_name' => 'BERRADA',
            'cne' => 'N998877665',
        ]);

        $this->partner = MobilityPartner::create([
            'name' => 'KEDGE Business School',
            'country' => 'France',
            'city' => 'Bordeaux',
            'program_type' => 'double_degree',
            'slots' => 5,
            'gpa_required' => 14.00,
            'is_active' => true,
        ]);
    }

    /**
     * Test de soumission de vœu de mobilité internationale.
     */
    public function test_can_apply_for_international_mobility_program(): void
    {
        $choice = StudentMobilityChoice::create([
            'student_id' => $this->student->id,
            'mobility_partner_id' => $this->partner->id,
            'choice_rank' => 1,
        ]);

        $this->assertDatabaseHas('student_mobility_choices', [
            'student_id' => $this->student->id,
            'mobility_partner_id' => $this->partner->id,
            'choice_rank' => 1,
        ]);
    }
}
