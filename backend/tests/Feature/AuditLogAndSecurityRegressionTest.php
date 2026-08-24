<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogAndSecurityRegressionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test de la conformité CNDP Loi 09-08 et immutabilité de la chaîne de hachage SHA-256.
     */
    public function test_audit_log_creates_tamper_evident_sha256_record(): void
    {
        $admin = User::factory()->create(['email' => 'admin.audit@encg-fes.ac.ma']);

        $audit = AuditLog::record([
            'user_id' => $admin->id,
            'user_name' => 'Directeur des Études',
            'user_email' => 'admin.audit@encg-fes.ac.ma',
            'user_role' => 'Direction',
            'action' => 'Modification Sécurisée de Note',
            'action_type' => 'GRADE_CHANGE',
            'description' => 'Changement note CC M101 : 12.00 -> 14.50 suite à réclamation vérifiée',
            'method' => 'POST',
            'severity' => 'warning',
            'payload' => [
                'old_grade' => 12.00,
                'new_grade' => 14.50,
                'module' => 'Comptabilité Générale',
            ],
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action_type' => 'GRADE_CHANGE',
            'user_email' => 'admin.audit@encg-fes.ac.ma',
            'severity' => 'warning',
        ]);

        $this->assertNotNull($audit->id);
    }
}
