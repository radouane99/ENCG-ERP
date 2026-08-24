<?php

namespace Tests\Unit;

use App\Models\Assessment;
use App\Models\Grade;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class GradeAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_grade_update_creates_audit_log()
    {
        $professor = User::factory()->create();
        $role = Role::firstOrCreate(['name' => 'professor', 'guard_name' => 'sanctum']);
        $professor->assignRole($role);

        $this->actingAs($professor);

        $student = Student::factory()->create();
        $assessment = Assessment::factory()->create();

        $grade = Grade::create([
            'student_id' => $student->id,
            'assessment_id' => $assessment->id,
            'value' => 12.0,
            'absent' => false,
        ]);

        // Trigger update
        $grade->update(['value' => 15.5]);

        $this->assertDatabaseHas('grade_audits', [
            'grade_id' => $grade->id,
            'user_id' => $professor->id,
            'old_value' => 12.0,
            'new_value' => 15.5,
        ]);
    }
}
