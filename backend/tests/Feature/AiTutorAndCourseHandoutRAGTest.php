<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Module;
use App\Models\Semester;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AiTutorAndCourseHandoutRAGTest extends TestCase
{
    use RefreshDatabase;

    private User $studentUser;
    private Student $student;
    private Module $module;

    protected function setUp(): void
    {
        parent::setUp();

        $academicYear = $this->makeTestAcademicYear();
        $filiere = $this->makeTestFiliere(['name' => 'Sciences de Gestion', 'code' => 'SDG']);
        $semester = $this->makeTestSemester($academicYear->id, [
            'name'   => 'Semestre 3',
            'number' => 3,
        ]);

        $this->module = $this->makeTestModule($filiere->id, [
            'name'            => 'Droit des Sociétés',
            'code'            => 'M305',
            'semester_number' => 3,
        ]);

        $this->student = $this->makeTestStudent([
            'first_name' => 'Reda',
            'last_name'  => 'EL HASSANI',
            'cne'        => 'N889900112',
        ]);
        $this->studentUser = $this->student->user;
        $role = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $this->studentUser->assignRole($role);
    }

    /**
     * Test d'interrogation du Tuteur IA (RAG) avec citations précises du polycopié.
     */
    public function test_student_can_query_ai_tutor_with_handout_citations(): void
    {
        Sanctum::actingAs($this->studentUser);

        $payload = [
            'module'   => 'finance',
            'question' => 'Quelle est la formule du CMPC WACC en Finance ?',
        ];

        $response = $this->postJson('/api/v1/student-portal/ai-tutor/chat', $payload);

        $response->assertOk()
            ->assertJsonStructure(['success', 'data' => ['answer', 'citation']]);
    }

    /**
     * Test de génération instantanée de QCM d'entraînement d'examen.
     */
    public function test_student_can_generate_quiz_from_course_handouts(): void
    {
        Sanctum::actingAs($this->studentUser);

        $response = $this->getJson("/api/v1/student-portal/ai-tutor/quiz?module=finance");

        $response->assertOk()
            ->assertJsonStructure(['success', 'data' => ['questions']]);
    }
}
