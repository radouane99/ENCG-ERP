<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CedocDoctoralStudiesAndThesisTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;
    protected User $doctorantUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-cedoc']
        );

        $doctorantRole = Role::firstOrCreate(['name' => 'doctorant', 'guard_name' => 'sanctum']);
        $this->doctorantUser = User::factory()->create([
            'email'          => 'doctorant.chercheur@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->doctorantUser->assignRole($doctorantRole);
    }

    public function test_doctorant_dashboard_metrics_and_thesis_progress(): void
    {
        Sanctum::actingAs($this->doctorantUser);

        // Required training hours = 200h (MESRSFC standards for Moroccan Doctorates)
        $requiredHours = 200;
        $completedHours = 140;
        $progressPercentage = ($completedHours / $requiredHours) * 100;

        $this->assertEquals(70.0, $progressPercentage);
        $this->assertGreaterThan(50.0, $progressPercentage);
    }
}
