<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ProfessorAiCopilotIntegrationTest extends TestCase
{
    protected User $professorUser;

    protected Professor $professor;

    protected Module $module;

    protected Group $group;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $role = Role::firstOrCreate(['name' => 'professor', 'guard_name' => 'sanctum']);

        $this->professor = $this->makeTestProfessor();
        $this->professorUser = $this->professor->user;
        $this->professorUser->assignRole($role);

        $academicYear = AcademicYear::first() ?? $this->makeTestAcademicYear(['start_year' => rand(2030, 2090)]);
        $filiere = $this->makeTestFiliere();
        $this->module = $this->makeTestModule($filiere->id, ['name' => 'Diagnostic Financier']);

        $this->group = Group::create([
            'academic_year_id' => $academicYear->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 1,
            'name' => 'Section 1',
            'capacity' => 60,
        ]);
    }

    /**
     * Test AI Voice Textbook Structuring endpoint.
     */
    public function test_voice_textbook_structuring_endpoint_returns_valid_structure(): void
    {
        $response = $this->actingAs($this->professorUser, 'sanctum')
            ->postJson('/api/v1/professor/copilot/voice-textbook', [
                'transcription' => "Aujourd'hui nous avons terminé le chapitre sur le calcul de la CAF et de l'EBE avec deux exercices pratiques.",
                'module_id' => $this->module->id,
                'session_type' => 'CM',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'source',
            'data' => [
                'title',
                'pedagogical_objectives',
                'notions_covered',
                'work_assigned',
                'estimated_syllabus_progress',
            ],
        ]);
        $this->assertTrue($response->json('success'));
        $this->assertNotEmpty($response->json('data.title'));
    }

    /**
     * Test Attendance Textbook Auto-Completion endpoint.
     */
    public function test_attendance_textbook_auto_completion_endpoint(): void
    {
        $response = $this->actingAs($this->professorUser, 'sanctum')
            ->postJson('/api/v1/professor/copilot/attendance-textbook-suggestion', [
                'module_id' => $this->module->id,
                'seance_code' => 'S3',
                'session_type' => 'TD',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'source',
            'data' => [
                'chapter_title',
                'key_concepts',
            ],
        ]);
        $this->assertTrue($response->json('success'));
    }

    /**
     * Test Attendance Risk Analysis endpoint.
     */
    public function test_attendance_risk_analysis_endpoint(): void
    {
        $response = $this->actingAs($this->professorUser, 'sanctum')
            ->postJson('/api/v1/professor/copilot/attendance-risk-analysis', [
                'group_id' => $this->group->id,
                'module_id' => $this->module->id,
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'group_name',
                'total_students',
                'critical_count',
                'warning_count',
                'critical_students',
                'warning_students',
                'ai_summary',
                'ai_recommendations',
            ],
        ]);
        $this->assertTrue($response->json('success'));
    }

    /**
     * Test Official Exam PDF generation endpoint.
     */
    public function test_download_exam_paper_pdf_endpoint(): void
    {
        $response = $this->actingAs($this->professorUser, 'sanctum')
            ->post('/api/v1/professor/copilot/download-exam-pdf', [
                'module_id' => $this->module->id,
                'title' => 'Épreuve Finale de Diagnostic Financier',
                'context' => 'Étude de cas sur le Groupe OCP et sa filiale internationale.',
                'sections' => [
                    [
                        'section_title' => 'Partie I : Analyse Financière (10 pts)',
                        'points' => 10,
                        'questions' => [
                            ['num' => '1', 'text' => 'Calculez le BFR et la Trésorerie Nette.', 'points' => 5],
                        ],
                    ],
                ],
                'rubric' => [
                    ['criteria' => 'Rigueur des calculs', 'points' => 10, 'description' => 'Exactitude des formules et interprétation.'],
                ],
                'total_points' => 20,
                'duration' => '2 Heures',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
    }
}
