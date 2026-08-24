<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Filiere;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Student;
use App\Models\User;
use App\Models\VacationContract;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MultiRoleInteractionAndNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;
    protected User $adminUser;
    protected User $profUser;
    protected User $studentUser;
    protected Student $student;
    protected Professor $professor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-roles-notifications']
        );

        $adminRole = Role::firstOrCreate(['name' => 'institution-admin', 'guard_name' => 'sanctum']);
        $profRole = Role::firstOrCreate(['name' => 'professor', 'guard_name' => 'sanctum']);
        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);

        $this->adminUser = User::factory()->create([
            'email'          => 'admin.directeur@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->adminUser->assignRole($adminRole);

        $this->profUser = User::factory()->create([
            'email'          => 'prof.responsable@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->profUser->assignRole($profRole);

        $this->studentUser = User::factory()->create([
            'email'          => 'etudiant.delegue@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->studentUser->assignRole($studentRole);

        $department = Department::firstOrCreate(
            ['code' => 'FINANCE'],
            ['name' => 'Finance & Comptabilité', 'institution_id' => $this->institution->id]
        );

        $this->professor = Professor::create([
            'user_id'        => $this->profUser->id,
            'department_id'  => $department->id,
            'specialty'      => 'Audit & Contrôle de Gestion',
            'contract_type'  => 'permanent',
            'is_active'      => true,
            'institution_id' => $this->institution->id,
        ]);

        $this->student = Student::create([
            'user_id'        => $this->studentUser->id,
            'student_number' => 'ENCG-2026-DELEGUE',
            'cne'            => 'M139988776',
            'gender'         => 'female',
            'status'         => 'active',
            'institution_id' => $this->institution->id,
        ]);
    }

    /**
     * 1. Student -> Admin interaction: Document Request & Approval Lifecycle.
     */
    public function test_student_to_admin_document_request_and_approval(): void
    {
        $docType = DocumentType::firstOrCreate(
            ['code' => 'ATTESTATION_SCOLAIRE'],
            ['name' => 'Attestation de Scolarité', 'view_name' => 'attestation_scolarite']
        );

        // Student submits request
        $request = DocumentRequest::create([
            'student_id'       => $this->student->id,
            'document_type_id' => $docType->id,
            'status'           => 'pending',
        ]);

        $this->assertEquals('pending', $request->status);

        // Admin approves request
        Sanctum::actingAs($this->adminUser);
        $request->update([
            'status'       => 'ready',
            'processed_at' => now(),
            'admin_notes'  => ['note' => 'Validé et prêt pour retrait au guichet.'],
        ]);

        $this->assertEquals('ready', $request->fresh()->status);
        $this->assertNotNull($request->fresh()->processed_at);
    }

    /**
     * 2. Admin -> Professor interaction: Department and Teaching Contract.
     */
    public function test_admin_to_professor_teaching_assignment_relationship(): void
    {
        Sanctum::actingAs($this->adminUser);

        $academicYear = $this->ensureAcademicYear([
            'institution_id' => $this->institution->id,
        ]);

        $filiere = Filiere::firstOrCreate(
            ['code' => 'AUDIT'],
            [
                'name'           => 'Audit et Contrôle de Gestion',
                'type'           => 'grande_ecole',
                'duration_years' => 5,
                'institution_id' => $this->institution->id,
                'is_active'      => true,
            ]
        );

        $module = Module::firstOrCreate(
            ['code' => 'AUD701', 'filiere_id' => $filiere->id],
            [
                'name'            => 'Audit Financier Avancé',
                'semester_number' => 7,
                'coefficient'     => 1.5,
                'credit_hours'    => 45,
                'institution_id'  => $this->institution->id,
                'is_active'       => true,
            ]
        );

        $contract = VacationContract::create([
            'institution_id'   => $this->institution->id,
            'user_id'          => $this->profUser->id,
            'first_name'       => 'Tarik',
            'last_name'        => 'Berrada',
            'email'            => 'prof.responsable@encg-fes.ac.ma',
            'academic_year_id' => $academicYear->id,
            'module_id'        => $module->id,
            'session_type'     => 'cm',
            'agreed_hours'     => 45,
            'hourly_rate'      => 350.00,
            'status'           => 'active',
            'contract_start'   => '2026-09-15',
            'contract_end'     => '2027-01-31',
        ]);

        $this->assertEquals(45, $contract->agreed_hours);
        $this->assertEquals(350.00, (float) $contract->hourly_rate);
        $this->assertEquals('active', $contract->status);
    }

    /**
     * 3. In-App Notifications: Dispatching, unread count, and mark-as-read lifecycle.
     */
    public function test_notification_fetching_and_read_lifecycle(): void
    {
        // Dispatch 2 database notifications to the student
        $notif1 = DatabaseNotification::create([
            'id'              => (string) Str::uuid(),
            'type'            => 'App\Notifications\GradePublishedNotification',
            'notifiable_type' => User::class,
            'notifiable_id'   => $this->studentUser->id,
            'data'            => ['message' => 'Votre note du module Contrôle de Gestion est disponible.'],
            'read_at'         => null,
        ]);

        $notif2 = DatabaseNotification::create([
            'id'              => (string) Str::uuid(),
            'type'            => 'App\Notifications\DocumentReadyNotification',
            'notifiable_type' => User::class,
            'notifiable_id'   => $this->studentUser->id,
            'data'            => ['message' => 'Votre attestation de scolarité est prête.'],
            'read_at'         => null,
        ]);

        // Student fetches notifications
        $this->assertEquals(2, $this->studentUser->notifications()->count());
        $this->assertEquals(2, $this->studentUser->unreadNotifications()->count());

        // Mark 1st notification as read
        $notif1->markAsRead();
        $this->assertEquals(1, $this->studentUser->unreadNotifications()->count());

        // Mark all as read
        $this->studentUser->unreadNotifications->markAsRead();
        $this->assertEquals(0, $this->studentUser->unreadNotifications()->count());
    }

    /**
     * 4. RBAC Security: Student cannot broadcast urgent notifications.
     */
    public function test_rbac_student_cannot_broadcast_urgent_alerts(): void
    {
        Sanctum::actingAs($this->studentUser);

        $response = $this->postJson('/api/admin/notifications/broadcast-urgent', [
            'title'   => 'Fermeture exceptionnelle du campus',
            'message' => 'Les cours sont suspendus.',
        ]);

        // Student must be forbidden from administrative broadcast endpoints
        $response->assertForbidden();
    }
}
