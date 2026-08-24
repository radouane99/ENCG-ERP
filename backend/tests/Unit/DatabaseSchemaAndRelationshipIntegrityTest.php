<?php

namespace Tests\Unit;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Department;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Enterprise Database Schema, Foreign Key Integrity, and Eloquent Relationship Unit Tests.
 */
class DatabaseSchemaAndRelationshipIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-db-test']
        );
    }

    /**
     * Test existence of core tables and primary keys.
     */
    public function test_core_database_tables_exist_with_proper_schemas(): void
    {
        $tables = [
            'users',
            'students',
            'professors',
            'institutions',
            'departments',
            'filieres',
            'semesters',
            'groups',
            'modules',
            'assessments',
            'grades',
            'student_pathways',
            'internships',
            'document_requests',
            'student_cards',
        ];

        foreach ($tables as $table) {
            $this->assertTrue(Schema::hasTable($table), "Table '{$table}' must exist in the database.");
            $this->assertTrue(Schema::hasColumn($table, 'id'), "Table '{$table}' must have an 'id' primary key column.");
            $this->assertTrue(Schema::hasColumn($table, 'created_at'), "Table '{$table}' must have a 'created_at' timestamp.");
            $this->assertTrue(Schema::hasColumn($table, 'updated_at'), "Table '{$table}' must have an 'updated_at' timestamp.");
        }
    }

    /**
     * Test Institution -> Department -> Filiere -> Semester -> Module relationships.
     */
    public function test_academic_structure_eloquent_relationships_and_foreign_keys(): void
    {
        $academicYear = AcademicYear::create([
            'label' => '2026/2027',
            'start_year' => 2026,
            'end_year' => 2027,
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
            'institution_id' => $this->institution->id,
        ]);

        $department = Department::create([
            'institution_id' => $this->institution->id,
            'name' => 'Département Commerce et Vente',
            'code' => 'DCV',
        ]);

        $filiere = Filiere::create([
            'institution_id' => $this->institution->id,
            'department_id' => $department->id,
            'name' => 'Marketing et Commerce International',
            'code' => 'MCI',
            'type' => 'grande_ecole',
            'duration_years' => 5,
            'is_active' => true,
        ]);

        $semester = Semester::create([
            'academic_year_id' => $academicYear->id,
            'name' => 'Semestre 5',
            'number' => 5,
            'start_date' => '2026-09-01',
            'end_date' => '2027-01-31',
        ]);

        $module = Module::create([
            'institution_id' => $this->institution->id,
            'filiere_id' => $filiere->id,
            'name' => 'Négociation Commerciale Internationale',
            'code' => 'M501',
            'semester_number' => 5,
            'coefficient' => 1.50,
            'credit_hours' => 45,
            'is_active' => true,
        ]);

        // Assert parent-child relations
        $this->assertEquals($this->institution->id, $department->institution->id);
        $this->assertEquals($department->id, $filiere->department->id);
        $this->assertEquals($filiere->id, $module->filiere->id);
        $this->assertTrue($department->filieres->contains($filiere));
        $this->assertTrue($filiere->modules->contains($module));
    }

    /**
     * Test Student -> User -> Pathway -> Grades cascade and relationships.
     */
    public function test_student_user_grades_and_pathway_relationships(): void
    {
        $user = User::factory()->create(['institution_id' => $this->institution->id]);
        $student = Student::create([
            'user_id' => $user->id,
            'student_number' => 'ENCG-2026-TEST-01',
            'cne' => 'N138877665',
            'gender' => 'female',
            'status' => 'active',
            'institution_id' => $this->institution->id,
        ]);

        $academicYear = AcademicYear::create([
            'label' => '2026/2027',
            'start_year' => 2026,
            'end_year' => 2027,
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
            'institution_id' => $this->institution->id,
        ]);

        $filiere = Filiere::create([
            'institution_id' => $this->institution->id,
            'name' => 'Gestion Financière et Comptable',
            'code' => 'GFC-TEST',
            'type' => 'grande_ecole',
            'duration_years' => 5,
            'is_active' => true,
        ]);

        $pathway = StudentPathway::create([
            'student_id' => $student->id,
            'filiere_id' => $filiere->id,
            'academic_year_id' => $academicYear->id,
            'current_semester' => 1,
            'is_current' => true,
        ]);

        $module = Module::create([
            'institution_id' => $this->institution->id,
            'filiere_id' => $filiere->id,
            'name' => 'Comptabilité Générale',
            'code' => 'CG101',
            'semester_number' => 1,
            'coefficient' => 1.00,
            'credit_hours' => 45,
            'is_active' => true,
        ]);

        $assessment = Assessment::create([
            'module_id' => $module->id,
            'type' => 'CC',
            'weight' => 50.00,
            'date' => '2026-11-15',
        ]);

        $grade = Grade::create([
            'student_id' => $student->id,
            'assessment_id' => $assessment->id,
            'value' => 17.00,
            'absent' => false,
            'version' => 1,
        ]);

        // Bidirectional assertions
        $this->assertEquals($user->id, $student->user->id);
        $this->assertEquals($student->id, $user->student->id);
        $this->assertTrue($student->pathways->contains($pathway));
        $this->assertTrue($student->grades->contains($grade));
        $this->assertEquals($assessment->id, $grade->assessment->id);
        $this->assertEquals($module->id, $assessment->module->id);
    }

    /**
     * Test Foreign Key Cascade: Deleting a module cascades to delete assessments and prevent orphan records.
     */
    public function test_module_deletion_cascades_to_assessments(): void
    {
        $filiere = Filiere::create([
            'institution_id' => $this->institution->id,
            'name' => 'Management Test',
            'code' => 'MGT-CASCADE',
            'type' => 'grande_ecole',
            'duration_years' => 5,
            'is_active' => true,
        ]);

        $module = Module::create([
            'institution_id' => $this->institution->id,
            'filiere_id' => $filiere->id,
            'name' => 'Microéconomie',
            'code' => 'ECO101',
            'semester_number' => 1,
            'coefficient' => 1.00,
            'credit_hours' => 45,
            'is_active' => true,
        ]);

        $assessment = Assessment::create([
            'module_id' => $module->id,
            'type' => 'Exam',
            'weight' => 100.00,
            'date' => '2026-12-20',
        ]);

        $assessmentId = $assessment->id;
        $this->assertDatabaseHas('assessments', ['id' => $assessmentId]);

        // Delete parent module
        $module->delete();

        // Assessment must be deleted via cascade
        $this->assertDatabaseMissing('assessments', ['id' => $assessmentId]);
    }
}
