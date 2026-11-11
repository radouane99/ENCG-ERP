<?php
namespace Tests\Feature;

use App\Models\{Group, Grade, Internship, Soutenance, StudentPathway};
use App\Services\Security\CryptoLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Hash, Mail};
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FollowUpSecurityRegressionTest extends TestCase
{
    use RefreshDatabase;
    private function context(string $role = 'professor'): array
    {
        Mail::fake();
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        app()->instance('academic.context.year', $year->id);
        $filiere = $this->makeTestFiliere();
        $module = $this->makeTestModule($filiere->id, ['semester_number' => 1]);
        $group = Group::create(['name' => 'AUDIT-S1-G1', 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'semester_number' => 1]);
        $prof = $this->makeTestProfessor();
        $prof->user->assignRole(Role::findOrCreate($role, 'sanctum'));
        Sanctum::actingAs($prof->user);
        return [$year, $filiere, $module, $group, $prof];
    }

    public function test_profile_rejects_password_changes_without_current_password(): void
    {
        [, , , , $prof] = $this->context();
        $this->postJson('/api/profile', ['name' => 'Audit', 'email' => $prof->user->email, 'password' => 'V8!qR3@nT9#pL5xZ', 'password_confirmation' => 'V8!qR3@nT9#pL5xZ'])->assertUnprocessable();
    }

    public function test_profile_password_change_revokes_other_sessions(): void
    {
        [, , , , $prof] = $this->context();
        $prof->user->forceFill(['password' => 'Synthetic123!'])->save();
        $tokenId = $prof->user->createToken('other-audit-session')->accessToken->id;
        $this->postJson('/api/v1/auth/change-password', ['current_password' => 'Synthetic123!', 'password' => 'V8!qR3@nT9#pL5xZ', 'password_confirmation' => 'V8!qR3@nT9#pL5xZ'])->assertOk();
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }

    public function test_profile_email_change_does_not_retain_verified_status(): void
    {
        [, , , , $prof] = $this->context();
        $prof->user->forceFill(['email_verified_at' => now()])->save();
        $this->postJson('/api/profile', ['name' => 'Audit', 'email' => 'changed-audit@example.test'])->assertUnprocessable();
        $this->assertNotEquals('changed-audit@example.test', $prof->user->fresh()->email);
    }

    public function test_unassigned_professor_cannot_request_or_read_rectification_for_another_module(): void
    {
        [$year, , $module] = $this->context();
        $student = $this->makeTestStudent();
        $assessment = $this->createTestAssessment(['module_id' => $module->id, 'academic_year_id' => $year->id, 'type' => 'Exam', 'weight' => 100]);
        $grade = Grade::create(['assessment_id' => $assessment->id, 'student_id' => $student->id, 'value' => 8, 'absent' => false]);
        $this->postJson('/api/professor-portal/grade-rectifications', ['grade_id' => $grade->id, 'proposed_value' => 18, 'justification' => 'Demande synthétique hors affectation'])->assertForbidden();
    }

    public function test_completed_attendance_cannot_be_unlocked_and_rewritten_by_save_endpoint(): void
    {
        [$year, $filiere, $module, $group, $prof] = $this->context();
        $module->professors()->attach($prof->id, ['academic_year_id' => $year->id, 'group_id' => $group->id, 'professor_type' => \App\Models\Professor::class, 'session_type' => 'cm']);
        $student = $this->makeTestStudent();
        StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'group_id' => $group->id, 'current_semester' => 1, 'is_current' => true]);
        $payload = ['group_id' => $group->id, 'module_id' => $module->id, 'session_date' => now()->toDateString(), 'seance_code' => 'S1', 'is_locked' => true, 'absent_ids' => []];
        $first = $this->postJson('/api/professor-portal/student-lists/attendance', $payload)->assertOk();
        $this->postJson('/api/professor-portal/student-lists/attendance', [...$payload, 'attendance_session_id' => $first->json('data.session_id'), 'is_locked' => false, 'absent_ids' => [$student->id]])->assertConflict();
    }

    public function test_filiere_head_outside_the_jury_cannot_evaluate_an_unassigned_defense(): void
    {
        [, , , , $actor] = $this->context('filiere-head');
        $jury = $this->makeTestProfessor();
        $student = $this->makeTestStudent();
        $stage = Internship::create(['student_id' => $student->id, 'company_name' => 'Audit', 'type' => 'fin_etudes', 'start_date' => now()->subMonth(), 'end_date' => now(), 'status' => 'active', 'supervisor_id' => $jury->id]);
        $defense = Soutenance::create(['internship_id' => $stage->id, 'president_id' => $jury->id, 'examiner_id' => $jury->id, 'supervisor_id' => $jury->id, 'date_time' => now()->subHour(), 'status' => 'scheduled']);
        $this->postJson('/api/professor/internships/soutenances/'.$defense->id.'/evaluate', ['grade' => 18, 'remarks' => 'Acteur hors jury et hors affectation'])->assertForbidden();
    }

    public function test_simulated_vacation_amount_without_contract_cannot_receive_an_official_signature(): void
    {
        [, , , , $prof] = $this->context('vacataire');
        $prof->update(['contract_type' => 'vacataire']);
        $response = $this->getJson('/api/professor-portal/vacation-payment-tracker?simulated_hours=9999&simulated_rate=10000')->assertOk();
        $this->assertSame(0, $response->json('data.contracts_count'));
        $this->assertNull($response->json('data.signature_code'), 'Un calcul simulé sans contrat ne doit pas être signé comme document officiel.');
    }
    public function test_public_pv_verification_does_not_expose_the_signer_ip(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $filiere = $this->makeTestFiliere();
        $module = $this->makeTestModule($filiere->id, ['semester_number' => 1]);
        $group = Group::create(['name' => 'AUDIT-S1-G1', 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'semester_number' => 1]);
        $signer = $this->makeTestProfessor();
        \App\Models\ModulePvSignature::create(['module_id' => $module->id, 'group_id' => $group->id, 'academic_year_id' => $year->id, 'signed_by' => $signer->user_id, 'signed_at' => now(), 'signature_data' => 'audit', 'digital_seal' => hash('sha256', 'audit'), 'ip_address' => '192.0.2.42']);
        $this->getJson('/api/verify/pv/'.$module->id.'/'.$group->id)->assertOk()->assertJsonMissingPath('data.ip_address');
    }

    private function assignedGrade(): array
    {
        [$year, $filiere, $module, $group, $prof] = $this->context();
        $module->professors()->attach($prof->id, ['academic_year_id' => $year->id, 'group_id' => $group->id, 'professor_type' => \App\Models\Professor::class, 'session_type' => 'cm']);
        $student = $this->makeTestStudent();
        StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'group_id' => $group->id, 'current_semester' => 1, 'is_current' => true]);
        $assessment = $this->createTestAssessment(['module_id' => $module->id, 'academic_year_id' => $year->id, 'type' => 'Exam', 'weight' => 100]);
        $grade = Grade::create(['assessment_id' => $assessment->id, 'student_id' => $student->id, 'value' => 8, 'absent' => false]);
        \App\Models\Institution::find(1)->update(['settings' => ['exam_lock_phase' => 'Ordinaire Automne']]);
        return [$grade, $prof, $group];
    }

    public function test_rectification_is_durable_requires_two_actors_and_rejects_replay(): void
    {
        [$grade, $prof] = $this->assignedGrade();
        $response = $this->postJson('/api/professor-portal/grade-rectifications', ['grade_id' => $grade->id, 'proposed_value' => 15, 'justification' => 'Correction documentée après contrôle de copie'])->assertCreated();
        $reference = $response->json('data.id');
        \Illuminate\Support\Facades\Cache::flush();
        $this->assertDatabaseHas('grade_rectifications', ['reference' => $reference, 'status' => 'pending_second_approver']);
        $admin = \App\Models\User::factory()->create(['institution_id' => 1]);
        $admin->assignRole(Role::findOrCreate('institution-admin', 'sanctum'));
        Sanctum::actingAs($admin);
        $this->getJson('/api/admin/security/grade-rectifications')->assertOk()->assertJsonPath('data.0.id', $reference);
        $result = app(\App\Services\Security\GradeRectificationService::class)->approve($admin, $reference);
        $this->assertSame('approved_and_sealed', $result['rectification']['status']);
        $this->assertEquals(15, $grade->fresh()->value);
        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);
        app(\App\Services\Security\GradeRectificationService::class)->approve($admin, $reference);
    }

    public function test_a_stale_rectification_cannot_overwrite_a_new_grade(): void
    {
        [$grade, $prof] = $this->assignedGrade();
        $service = app(\App\Services\Security\GradeRectificationService::class);
        $entry = $service->request($prof->user, $grade->id, 15, 'Correction documentée après contrôle');
        $grade->refresh()->update(['value' => 11]);
        $admin = \App\Models\User::factory()->create(['institution_id' => 1]);
        $admin->assignRole(Role::findOrCreate('institution-admin', 'sanctum'));
        Sanctum::actingAs($admin);
        try { $service->approve($admin, $entry['id']); $this->fail('Stale approval accepted'); }
        catch (\Symfony\Component\HttpKernel\Exception\HttpException $exception) { $this->assertSame(409, $exception->getStatusCode()); }
        $this->assertEquals(11, $grade->fresh()->value);
    }

    public function test_official_document_signature_survives_cache_clear_and_detects_payload_tampering(): void
    {
        $this->context();
        $ledger = app(CryptoLedgerService::class);
        $record = $ledger->signOfficialDocument('attestation', 'AUDIT-DOC-1', 'Synthetic Holder', 'SYNTHETIC', ['value' => 10]);
        \Illuminate\Support\Facades\Cache::flush();
        $this->assertTrue($ledger->verifyOfficialDocument($record['signature_code'])['verified']);
        $this->assertTrue($ledger->verifyOfficialDocument('AUDIT-DOC-1')['verified']);
        $signature = \App\Models\OfficialDocumentSignature::where('signature_code', $record['signature_code'])->firstOrFail();
        $payload = $signature->payload;
        $payload['claims']['value'] = 999;
        $signature->update(['payload' => $payload]);
        $this->assertNull($ledger->verifyOfficialDocument($record['signature_code']));
    }

    public function test_legacy_import_preserves_history_and_revokes_unverified_fiscal_simulations(): void
    {
        [$grade, $prof] = $this->assignedGrade();
        $entry = app(\App\Services\Security\GradeRectificationService::class)->request($prof->user, $grade->id, 15, 'Correction synthétique à préserver');
        \App\Models\GradeRectification::where('reference', $entry['id'])->delete();
        \Illuminate\Support\Facades\Cache::put('encg_four_eyes_grade_rectifications', [$entry['id'] => $entry], 600);
        $ledger = app(CryptoLedgerService::class);
        $record = $ledger->signOfficialDocument('attestation', 'AUDIT-LEGACY-DOC', 'Synthetic Holder', 'SYNTHETIC');
        $fiscal = $ledger->signOfficialDocument('decompte_fiscal_vacation_cgi_73_ii_f', 'AUDIT-LEGACY-FISCAL', 'Synthetic Holder', 'SYNTHETIC');
        \App\Models\OfficialDocumentSignature::query()->delete();
        foreach ([$record, $fiscal] as $document) \Illuminate\Support\Facades\Cache::put('official_doc_registry:'.$document['signature_code'], $document, 600);
        $this->artisan('encg:import-security-records')->assertSuccessful();
        $this->artisan('encg:import-security-records')->assertSuccessful();
        $this->assertSame(1, \App\Models\GradeRectification::count());
        $this->assertSame(2, \App\Models\OfficialDocumentSignature::count());
        \Illuminate\Support\Facades\Cache::flush();
        $this->assertTrue($ledger->verifyOfficialDocument($record['signature_code'])['verified']);
        $this->assertNull($ledger->verifyOfficialDocument($fiscal['signature_code']));
    }

    public function test_integrity_command_uses_portable_schema_and_detects_row_loss(): void
    {
        $filename = 'audit-integrity-'.bin2hex(random_bytes(8)).'.json';
        \Illuminate\Support\Facades\Schema::create('audit_row_fixture', fn ($table) => $table->id());
        \Illuminate\Support\Facades\DB::table('audit_row_fixture')->insert(['id' => 1]);
        try {
            $this->artisan('erp:verify-integrity', ['--pre' => true, '--snapshot' => $filename])->assertSuccessful();
            $this->artisan('erp:verify-integrity', ['--post' => true, '--snapshot' => $filename])->assertSuccessful();
            \Illuminate\Support\Facades\DB::table('audit_row_fixture')->delete();
            $this->artisan('erp:verify-integrity', ['--post' => true, '--snapshot' => $filename])->assertFailed();
        } finally {
            \Illuminate\Support\Facades\File::delete(storage_path('app/'.$filename));
            \Illuminate\Support\Facades\Schema::dropIfExists('audit_row_fixture');
        }
    }

    public function test_rectification_rejects_another_group_and_self_approval(): void
    {
        [$grade, $prof, $group] = $this->assignedGrade();
        $otherGroup = Group::create(['name' => 'AUDIT-S1-G2', 'filiere_id' => $group->filiere_id, 'academic_year_id' => $group->academic_year_id, 'semester_number' => 1]);
        $student = $this->makeTestStudent();
        StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $group->academic_year_id, 'filiere_id' => $group->filiere_id, 'group_id' => $otherGroup->id, 'current_semester' => 1, 'is_current' => true]);
        $outsideGrade = Grade::create(['student_id' => $student->id, 'assessment_id' => $grade->assessment_id, 'value' => 9]);
        $payload = ['grade_id' => $outsideGrade->id, 'proposed_value' => 15, 'justification' => 'Demande hors du groupe affecté'];
        $this->postJson('/api/professor-portal/grade-rectifications', $payload)->assertForbidden();
        $prof->user->assignRole(Role::findOrCreate('institution-admin', 'sanctum'));
        $service = app(\App\Services\Security\GradeRectificationService::class);
        $entry = $service->request($prof->user, $grade->id, 15, 'Contrôle de la séparation des deux acteurs');
        try { $service->approve($prof->user, $entry['id']); $this->fail('Self-approval accepted'); }
        catch (\Symfony\Component\HttpKernel\Exception\HttpException $exception) { $this->assertSame(403, $exception->getStatusCode()); }
        $this->assertEquals(8, $grade->fresh()->value);
    }

    public function test_attendance_reopening_requires_administration_and_audits_the_reason(): void
    {
        [$grade, $prof, $group] = $this->assignedGrade();
        $payload = ['group_id' => $group->id, 'module_id' => $grade->assessment->module_id, 'session_date' => now()->toDateString(), 'seance_code' => 'S1', 'is_locked' => true, 'absent_ids' => []];
        $id = $this->postJson('/api/professor-portal/student-lists/attendance', $payload)->assertOk()->json('data.session_id');
        $url = '/api/professor/attendance/'.$id.'/reopen';
        $this->postJson($url, ['reason' => 'Réouverture motivée pour correction matérielle'])->assertForbidden();
        $admin = \App\Models\User::factory()->create(['institution_id' => 1]);
        $admin->assignRole(Role::findOrCreate('institution-admin', 'sanctum'));
        Sanctum::actingAs($admin);
        $this->postJson($url, ['reason' => 'Réouverture motivée pour correction matérielle'])->assertOk()->assertJsonPath('session.status', 'active');
        $this->assertDatabaseHas('activity_log', ['description' => 'attendance_session_reopened', 'causer_id' => $admin->id]);
        Sanctum::actingAs($prof->user);
        $this->postJson('/api/professor-portal/student-lists/attendance', [...$payload, 'is_locked' => false, 'absent_ids' => [$grade->student_id]])->assertOk();
    }

}
