<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Department;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Filiere;
use App\Models\Grade;
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
            'email' => 'admin.directeur@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->adminUser->assignRole($adminRole);

        $this->profUser = User::factory()->create([
            'email' => 'prof.responsable@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->profUser->assignRole($profRole);

        $this->studentUser = User::factory()->create([
            'email' => 'etudiant.delegue@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->studentUser->assignRole($studentRole);

        $department = Department::firstOrCreate(
            ['code' => 'FINANCE'],
            ['name' => 'Finance & Comptabilité', 'institution_id' => $this->institution->id]
        );

        $this->professor = Professor::create([
            'user_id' => $this->profUser->id,
            'department_id' => $department->id,
            'specialty' => 'Audit & Contrôle de Gestion',
            'contract_type' => 'permanent',
            'is_active' => true,
            'institution_id' => $this->institution->id,
        ]);

        $this->student = Student::create([
            'user_id' => $this->studentUser->id,
            'student_number' => 'ENCG-2026-DELEGUE',
            'cne' => 'M139988776',
            'gender' => 'female',
            'status' => 'active',
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
            'student_id' => $this->student->id,
            'document_type_id' => $docType->id,
            'status' => 'pending',
        ]);

        $this->assertEquals('pending', $request->status);

        // Admin approves request
        Sanctum::actingAs($this->adminUser);
        $request->update([
            'status' => 'ready',
            'processed_at' => now(),
            'admin_notes' => ['note' => 'Validé et prêt pour retrait au guichet.'],
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
                'name' => 'Audit et Contrôle de Gestion',
                'type' => 'grande_ecole',
                'duration_years' => 5,
                'institution_id' => $this->institution->id,
                'is_active' => true,
            ]
        );

        $module = Module::firstOrCreate(
            ['code' => 'AUD701', 'filiere_id' => $filiere->id],
            [
                'name' => 'Audit Financier Avancé',
                'semester_number' => 7,
                'coefficient' => 1.5,
                'credit_hours' => 45,
                'institution_id' => $this->institution->id,
                'is_active' => true,
            ]
        );

        $contract = VacationContract::create([
            'institution_id' => $this->institution->id,
            'user_id' => $this->profUser->id,
            'first_name' => 'Tarik',
            'last_name' => 'Berrada',
            'email' => 'prof.responsable@encg-fes.ac.ma',
            'academic_year_id' => $academicYear->id,
            'module_id' => $module->id,
            'session_type' => 'cm',
            'agreed_hours' => 45,
            'hourly_rate' => 350.00,
            'status' => 'active',
            'contract_start' => '2026-09-15',
            'contract_end' => '2027-01-31',
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
            'id' => (string) Str::uuid(),
            'type' => 'App\Notifications\GradePublishedNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $this->studentUser->id,
            'data' => ['message' => 'Votre note du module Contrôle de Gestion est disponible.'],
            'read_at' => null,
        ]);

        $notif2 = DatabaseNotification::create([
            'id' => (string) Str::uuid(),
            'type' => 'App\Notifications\DocumentReadyNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $this->studentUser->id,
            'data' => ['message' => 'Votre attestation de scolarité est prête.'],
            'read_at' => null,
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
            'title' => 'Fermeture exceptionnelle du campus',
            'message' => 'Les cours sont suspendus.',
        ]);

        // Student must be forbidden from administrative broadcast endpoints
        $response->assertForbidden();
    }

    /**
     * 5. PWA Push Subscription & Redis-Cached Broadcast Lifecycle.
     */
    public function test_pwa_push_subscription_and_redis_cached_broadcast_lifecycle(): void
    {
        Sanctum::actingAs($this->studentUser);

        // Subscribe to PWA Push
        $subResponse = $this->postJson('/api/notifications/push-subscribe', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/encg-test-sub',
            'user_agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
        ]);
        $subResponse->assertOk()->assertJsonPath('push_subscribed', true);

        // Verify index returns push_subscribed = true and caches unread_count = 0
        $indexResponse = $this->getJson('/api/notifications');
        $indexResponse->assertOk()
            ->assertJsonPath('meta.unread_count', 0)
            ->assertJsonPath('meta.push_subscribed', true);

        // Admin broadcasts urgent alert with 'push' channel only
        Sanctum::actingAs($this->adminUser);
        $broadcastResponse = $this->postJson('/api/admin/notifications/broadcast-urgent', [
            'title' => '🎓 Résultats S5 Publiés',
            'message' => 'Consultez votre relevé de notes.',
            'target_type' => 'students',
            'urgency' => 'urgent',
            'send_channels' => ['push'],
        ]);
        $broadcastResponse->assertOk()->assertJsonPath('success', true);

        // Admin fetches Redis-cached PWA Hub targeting stats
        $statsResponse = $this->getJson('/api/admin/pwa-notifications/stats');
        $statsResponse->assertOk()->assertJsonPath('success', true);

        // Student fetches notifications again -> cache was invalidated by broadcast, unread_count is now 1
        Sanctum::actingAs($this->studentUser);
        $afterBroadcast = $this->getJson('/api/notifications');
        $afterBroadcast->assertOk()->assertJsonPath('meta.unread_count', 1);

        // Unsubscribe from PWA Push
        $unsubResponse = $this->deleteJson('/api/notifications/push-subscribe');
        $unsubResponse->assertOk()->assertJsonPath('push_subscribed', false);
    }

    /**
     * 6. Quitus Numérique 4-Services, Lettres de Recommandation QR, Orientation Live & Rapport ANEAQ.
     */
    public function test_encg_digital_quitus_recommendations_live_orientation_and_aneaq_report(): void
    {
        $academicYear = $this->ensureAcademicYear([
            'institution_id' => $this->institution->id,
        ]);

        $filiere = Filiere::firstOrCreate(
            ['code' => 'GFC'],
            [
                'name' => 'Gestion Financière et Comptable',
                'type' => 'grande_ecole',
                'duration_years' => 5,
                'institution_id' => $this->institution->id,
                'is_active' => true,
            ]
        );

        $module = Module::create([
            'code' => 'GFC-AUDIT-S8',
            'name' => 'Audit Financier & Commissariat aux Comptes',
            'filiere_id' => $filiere->id,
            'semester_number' => 8,
            'coefficient' => 3,
            'credit_hours' => 45,
            'is_active' => true,
            'institution_id' => $this->institution->id,
        ]);

        $assessment = Assessment::create([
            'module_id' => $module->id,
            'academic_year_id' => $academicYear->id,
            'type' => 'final',
            'weight' => 100,
        ]);

        Grade::create([
            'student_id' => $this->student->id,
            'assessment_id' => $assessment->id,
            'value' => 16.5,
        ]);

        Sanctum::actingAs($this->studentUser);

        // 1. Quitus Numérique Automatisé en 1 Clic (4 services)
        $quitusRes = $this->getJson('/api/student-portal/quitus');
        $quitusRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.services.library.cleared', true)
            ->assertJsonPath('data.services.scolarite.cleared', true)
            ->assertJsonPath('data.services.discipline.cleared', true);
        $this->assertStringStartsWith('QUITUS-ENCG-', $quitusRes->json('data.verification_code'));

        // 2. Lettres de Recommandation Académiques Certifiées QR (note >= 12/20)
        $recListRes = $this->getJson('/api/student-portal/recommendation-letters');
        $recListRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.eligible_count', 1);

        $recPostRes = $this->postJson('/api/student-portal/recommendation-letters', [
            'module_id' => $module->id,
            'target_program' => 'Master Audit & Contrôle de Gestion',
        ]);
        $recPostRes->assertCreated()
            ->assertJsonPath('success', true);
        $this->assertStringStartsWith('REC-ENCG-', $recPostRes->json('data.reference_code'));

        // 3. Simulateur Live de Rang & Quota d'Orientation (S4 -> S5)
        $liveRankRes = $this->getJson('/api/student-portal/orientation/live-ranking');
        $liveRankRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.student_gpa', 16.5);
        $this->assertCount(5, $liveRankRes->json('data.specialties_live_quota'));

        // 4. Rapport d'Accréditation ANEAQ / MESRSFC (Admin)
        Sanctum::actingAs($this->adminUser);
        $aneaqRes = $this->getJson('/api/admin/dashboard/aneaq-report');
        $aneaqRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('report.status', 'CONFORME_MESRSFC')
            ->assertJsonPath('report.aneaq_accreditation.referentiel_version', 'ANEAQ-MESRSFC-2026')
            ->assertJsonPath('report.aneaq_accreditation.gouvernance_et_securite.retenue_igr_vacataires_cgi_73_ii_f', '17%');

        // 5. Détecteur Bourse Minhaty (ONOUSC) & Tableau d'Honneur / Excellence
        Sanctum::actingAs($this->studentUser);
        $scholarRes = $this->getJson('/api/student-portal/scholarship-excellence');
        $scholarRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.minhaty_onousc.eligibility_status', 'maintien_bourse_complete_100_pct')
            ->assertJsonPath('data.excellence_encg.is_director_honor_roll', true);
        $this->assertStringStartsWith('HONNEUR-ENCG-', $scholarRes->json('data.excellence_encg.certificate_code'));

        // 6. Bourse d'Échange de Sous-Groupes TD "1-for-1 Swap" (G1.1 <-> G1.2)
        $peerUser = User::factory()->create([
            'email' => 'camarade.td@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $peerUser->assignRole('student');
        $peerStudent = Student::create([
            'user_id' => $peerUser->id,
            'student_number' => 'ENCG-2026-PEER',
            'cne' => 'N135555555',
            'gender' => 'male',
            'status' => 'active',
            'institution_id' => $this->institution->id,
        ]);

        $swapPropRes = $this->postJson('/api/student-portal/td-swap', [
            'target_student_id' => $peerStudent->id,
            'reason' => 'Covoiturage Fès - Route Imouzzer',
        ]);
        $swapPropRes->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending_peer');
        $swapId = $swapPropRes->json('data.id');

        Sanctum::actingAs($peerUser);
        $swapAcceptRes = $this->postJson("/api/student-portal/td-swap/{$swapId}/accept");
        $swapAcceptRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'approved');

        // 7. Calendrier Universitaire Dynamique .ics Synchronisé 1-Clic
        Sanctum::actingAs($this->studentUser);
        $icsRes = $this->get('/api/student-portal/calendar/ics');
        $icsRes->assertOk();
        $this->assertStringContainsString('BEGIN:VCALENDAR', $icsRes->getContent());
        $this->assertStringContainsString('PRODID:-//ENCG Fes//USMBA Academic Calendar//FR', $icsRes->getContent());
    }
}
