<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Module;
use App\Models\ModulePvSignature;
use App\Models\Professor;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicDocumentQrVerificationAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;
    protected AcademicYear $academicYear;
    protected Filiere $filiere;
    protected Module $module;
    protected Group $group;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-qr-verify']
        );

        $this->academicYear = AcademicYear::firstOrCreate(
            ['id' => 1],
            [
                'label'          => '2026/2027',
                'start_year'     => 2026,
                'end_year'       => 2027,
                'start_date'     => '2026-09-01',
                'end_date'       => '2027-06-30',
                'is_current'     => true,
                'institution_id' => $this->institution->id,
            ]
        );

        $department = Department::firstOrCreate(
            ['code' => 'MANAGEMENT'],
            ['name' => 'Management', 'institution_id' => $this->institution->id]
        );

        $this->filiere = Filiere::firstOrCreate(
            ['code' => 'MKT'],
            [
                'name'           => 'Marketing et Action Commerciale',
                'type'           => 'grande_ecole',
                'duration_years' => 5,
                'department_id'  => $department->id,
                'institution_id' => $this->institution->id,
                'is_active'      => true,
            ]
        );

        $this->module = Module::firstOrCreate(
            ['code' => 'MKT101', 'filiere_id' => $this->filiere->id],
            [
                'name'            => 'Marketing Stratégique',
                'semester_number' => 3,
                'coefficient'     => 1.00,
                'credit_hours'    => 45,
                'institution_id'  => $this->institution->id,
                'is_active'       => true,
            ]
        );

        $this->group = Group::firstOrCreate(
            ['name' => 'Groupe 1', 'filiere_id' => $this->filiere->id],
            ['academic_year_id' => $this->academicYear->id, 'semester_number' => 3]
        );
    }

    public function test_public_document_verification_with_invalid_token_returns_404(): void
    {
        $response = $this->getJson('/api/documents/verify/INVALID-TOKEN-9999');
        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_public_module_pv_signature_verification(): void
    {
        $signerUser = User::factory()->create(['institution_id' => $this->institution->id]);

        $signature = ModulePvSignature::create([
            'module_id'         => $this->module->id,
            'group_id'          => $this->group->id,
            'academic_year_id'  => $this->academicYear->id,
            'signed_by'         => $signerUser->id,
            'signature_data'    => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'digital_seal'      => hash('sha256', "PV-ENCG-{$this->module->id}-{$this->group->id}"),
            'signed_at'         => now(),
            'session'           => 'normale',
            'ip_address'        => '127.0.0.1',
        ]);

        $response = $this->getJson("/api/verify/pv/{$this->module->id}/{$this->group->id}");
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.institution', 'ENCG Fès')
            ->assertJsonPath('data.group', 'Groupe 1');
    }
}
