<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Student;
use App\Models\DocumentRequest;
use App\Models\Grade;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Role;
use App\Http\Controllers\Api\UnifiedStudentRecordController;

class UnifiedStudentRecordTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Since we are in Unit namespace but making HTTP requests, we ensure routes are available.
        Route::get('/api/v1/student-portal/my-dossier', [UnifiedStudentRecordController::class, 'myDossier'])->middleware('auth:sanctum');
        Route::get('/api/students/{student}/dossier', [UnifiedStudentRecordController::class, 'show'])->middleware('auth:sanctum');
    }

    public function test_student_can_fetch_own_dossier()
    {
        $user = User::factory()->create();
        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $user->assignRole($studentRole);

        $student = Student::factory()->create(['user_id' => $user->id]);
        
        DocumentRequest::factory()->create(['student_id' => $student->id]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson('/api/v1/student-portal/my-dossier');
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'academic_records',
                'absences',
                'documents',
                'internships'
            ]
        ]);
        
        // Student should not see admin notes
        $documents = $response->json('data.documents');
        if (!empty($documents)) {
            $this->assertArrayNotHasKey('admin_notes', $documents[0]);
        }
    }

    public function test_admin_can_fetch_student_dossier()
    {
        $admin = User::factory()->create();
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $admin->assignRole($adminRole);

        $studentUser = User::factory()->create();
        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $studentUser->assignRole($studentRole);

        $student = Student::factory()->create(['user_id' => $studentUser->id]);

        DocumentRequest::factory()->create([
            'student_id' => $student->id, 
            'admin_notes' => ['note' => 'Needs review']
        ]);

        $this->actingAs($admin, 'sanctum');

        $response = $this->getJson('/api/students/' . $student->id . '/dossier');
        
        $response->assertStatus(200);
        
        // Admin should see admin notes
        $documents = $response->json('data.documents');
        if (!empty($documents)) {
            $this->assertArrayHasKey('admin_notes', $documents[0]);
        }
    }
}
