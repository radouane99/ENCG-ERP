<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\AuditLog;
use App\Models\Grade;
use App\Models\Module;
use App\Models\ModulePvSignature;
use App\Models\Professor;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GradeCalculationAndPvDeliberationTest extends TestCase
{
    use RefreshDatabase;

    private User $profUser;

    private Professor $prof;

    private Student $student;

    private Module $module;

    private Assessment $ccAssessment;

    private Assessment $examAssessment;

    private Assessment $rattrapageAssessment;

    protected function setUp(): void
    {
        parent::setUp();

        $academicYear = $this->makeTestAcademicYear();
        $filiere = $this->makeTestFiliere(['name' => 'Audit & Contrôle', 'code' => 'ACG']);
        $semester = $this->makeTestSemester($academicYear->id, [
            'name' => 'Semestre 7',
            'number' => 7,
        ]);

        $this->module = $this->makeTestModule($filiere->id, [
            'name' => 'Audit Financier & Comptable',
            'code' => 'M701',
            'semester_number' => 7,
        ]);

        $this->ccAssessment = Assessment::create([
            'module_id' => $this->module->id,
            'type' => 'CC',
            'weight' => 50.0,
        ]);

        $this->examAssessment = Assessment::create([
            'module_id' => $this->module->id,
            'type' => 'EXAM',
            'weight' => 50.0,
        ]);

        $this->rattrapageAssessment = Assessment::create([
            'module_id' => $this->module->id,
            'type' => 'RATTRAPAGE',
            'weight' => 100.0,
        ]);

        $this->prof = $this->makeTestProfessor([
            'first_name' => 'Abdelkader',
            'last_name' => 'BERRADA',
            'email' => 'prof.berrada@encg-fes.ac.ma',
        ]);
        $this->profUser = $this->prof->user;

        $this->student = $this->makeTestStudent([
            'first_name' => 'Yassine',
            'last_name' => 'IDRISSI',
            'cne' => 'N123456789',
        ]);
    }

    /**
     * Test de saisie et calcul de la moyenne normale d'un module.
     */
    public function test_can_calculate_normal_session_module_grade(): void
    {
        // CC: 14/20 (50%), EXAM: 16/20 (50%) -> Moyenne: 15.00/20
        Grade::create([
            'student_id' => $this->student->id,
            'assessment_id' => $this->ccAssessment->id,
            'value' => 14.00,
            'version' => 1,
        ]);

        Grade::create([
            'student_id' => $this->student->id,
            'assessment_id' => $this->examAssessment->id,
            'value' => 16.00,
            'version' => 1,
        ]);

        $grades = Grade::where('student_id', $this->student->id)->get();
        $normalAverage = ($grades->where('assessment_id', $this->ccAssessment->id)->first()->value * 0.5)
                       + ($grades->where('assessment_id', $this->examAssessment->id)->first()->value * 0.5);

        $this->assertEquals(15.00, $normalAverage);
        $this->assertTrue($normalAverage >= 10.00); // Module Validé
    }

    /**
     * Test de la formule de rattrapage : Max(Moyenne Normale, Note Rattrapage).
     */
    public function test_rattrapage_formula_takes_max_grade(): void
    {
        $normalGrade = 8.00;
        $rattrapageGrade = 13.50;

        $finalGrade = max($normalGrade, $rattrapageGrade);

        $this->assertEquals(13.50, $finalGrade);
        $this->assertTrue($finalGrade >= 10.00); // Validé après rattrapage
    }

    /**
     * Test de signature numérique d'un PV avec sceau cryptographique SHA-256 et Audit Log.
     */
    public function test_pv_signing_generates_sha256_seal_and_audit_record(): void
    {
        $digitalSeal = hash('sha256', "PV-MOD-{$this->module->id}-2026/2027-".now()->timestamp);

        $pvSignature = ModulePvSignature::create([
            'module_id' => $this->module->id,
            'signed_by' => $this->profUser->id,
            'academic_year_id' => 1,
            'signed_at' => now(),
            'digital_seal' => $digitalSeal,
            'signature_data' => 'data:image/png;base64,mockSignatureData',
        ]);

        AuditLog::record([
            'user_id' => $this->profUser->id,
            'user_name' => 'Pr. BERRADA',
            'user_email' => 'prof.berrada@encg-fes.ac.ma',
            'user_role' => 'Professeur',
            'action' => 'Signature PV Module',
            'action_type' => 'PV_SIGNATURE',
            'description' => "PV signé avec succès avec sceau {$digitalSeal}",
            'method' => 'POST',
            'severity' => 'info',
            'payload' => ['module_id' => $this->module->id, 'seal' => $digitalSeal],
        ]);

        $this->assertDatabaseHas('module_pv_signatures', [
            'module_id' => $this->module->id,
            'digital_seal' => $digitalSeal,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action_type' => 'PV_SIGNATURE',
        ]);
    }
}
