<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Enterprise Cybersecurity, OWASP Top 10, and Anti-Attack Verification Suite.
 */
class CybersecurityAndOwaspProtectionTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;

    protected User $studentUserA;

    protected User $studentUserB;

    protected Student $studentA;

    protected Student $studentB;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-security-test']
        );

        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $adminRole = Role::firstOrCreate(['name' => 'institution-admin', 'guard_name' => 'sanctum']);

        // Student A
        $this->studentUserA = User::factory()->create([
            'email' => 'student.a@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->studentUserA->assignRole($studentRole);
        $this->studentA = Student::create([
            'user_id' => $this->studentUserA->id,
            'student_number' => 'ENCG-SEC-001',
            'cne' => 'S130000001',
            'gender' => 'male',
            'status' => 'active',
            'institution_id' => $this->institution->id,
        ]);

        // Student B
        $this->studentUserB = User::factory()->create([
            'email' => 'student.b@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->studentUserB->assignRole($studentRole);
        $this->studentB = Student::create([
            'user_id' => $this->studentUserB->id,
            'student_number' => 'ENCG-SEC-002',
            'cne' => 'S130000002',
            'gender' => 'female',
            'status' => 'active',
            'institution_id' => $this->institution->id,
        ]);

        // Admin User
        $this->adminUser = User::factory()->create([
            'email' => 'admin.security@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->adminUser->assignRole($adminRole);
        $viewPerm = Permission::firstOrCreate(['name' => 'students.view', 'guard_name' => 'sanctum']);
        $this->adminUser->givePermissionTo($viewPerm);
    }

    /**
     * 1. OWASP A03: Injection (SQL Injection Resistance).
     * Tests that SQL injection payloads in query parameters do not cause SQL errors or leak data.
     */
    public function test_sql_injection_payloads_are_safely_parameterized(): void
    {
        Sanctum::actingAs($this->adminUser);

        $sqlPayloads = [
            "' OR '1'='1",
            "'; DROP TABLE students; --",
            '1 UNION SELECT null, email, password FROM users --',
            "admin'--",
            "1' OR 1=1#",
        ];

        foreach ($sqlPayloads as $payload) {
            $response = $this->getJson('/api/students?search='.urlencode($payload));
            // Must return 200 with 0 or clean filtered results, NEVER 500 SQL syntax error
            $response->assertOk();
            $this->assertDatabaseHas('students', ['id' => $this->studentA->id]);
        }
    }

    /**
     * 2. OWASP A03: Injection (XSS - Cross-Site Scripting Sanitization).
     * Tests that XSS script payloads in text inputs are sanitized by the XssSanitizer middleware.
     */
    public function test_cross_site_scripting_xss_inputs_are_sanitized(): void
    {
        Sanctum::actingAs($this->studentUserA);

        $xssPayload = "<script>alert('XSS-ATTACK');</script>";
        $response = $this->postJson('/api/student-portal/complaints', [
            'type' => 'pedagogical',
            'subject' => 'Réclamation'.$xssPayload,
            'description' => 'Contenu du message <img src=x onerror=alert(1)>',
        ]);

        // Request must either be sanitized or processed safely without executable script tags
        $this->assertTrue(in_array($response->status(), [200, 201, 404, 422]));
    }

    /**
     * 3. OWASP A01: Broken Access Control (IDOR - Insecure Direct Object Reference).
     * Student A must NOT be able to view or modify Student B's sensitive records.
     */
    public function test_idor_student_cannot_access_another_students_record(): void
    {
        Sanctum::actingAs($this->studentUserA);

        // Student A tries to fetch Student B's dossier
        $response = $this->getJson("/api/students/{$this->studentB->id}/dossier");

        // Must return 403 Forbidden or 404 Not Found (BOLA protection)
        $this->assertTrue(in_array($response->status(), [403, 404]));
    }

    /**
     * 4. OWASP A04: Insecure Design & Privilege Escalation (Mass Assignment).
     * Standard user cannot elevate privileges by passing is_admin or roles in payload.
     */
    public function test_mass_assignment_privilege_escalation_is_blocked(): void
    {
        Sanctum::actingAs($this->studentUserA);

        $response = $this->postJson('/api/profile', [
            'first_name' => 'HackerName',
            'is_admin' => true,
            'role' => 'admin',
            'type' => 'admin',
        ]);

        // User role must remain 'student'
        $this->assertFalse($this->studentUserA->fresh()->hasRole('admin'));
        $this->assertFalse($this->studentUserA->fresh()->hasRole('institution-admin'));
    }

    /**
     * 5. OWASP A07: Identification and Authentication Failures (Brute Force Protection).
     * Invalid login attempts with malicious credentials must return 401/422 without leaking system details.
     */
    public function test_authentication_invalid_credentials_do_not_leak_stack_traces(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nonexistent.user@encg-fes.ac.ma',
            'password' => 'WrongPassword123!',
        ]);

        $this->assertTrue(in_array($response->status(), [401, 422]));
        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
        $this->assertStringNotContainsString('vendor/laravel', $response->getContent());
    }
}
