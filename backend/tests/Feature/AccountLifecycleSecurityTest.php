<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use PragmaRX\Google2FA\Google2FA;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AccountLifecycleSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function accounts(): array
    {
        Mail::fake();
        Notification::fake();
        $role = Role::findOrCreate('institution-admin', 'sanctum');
        $role->givePermissionTo(Permission::findOrCreate('users.manage', 'sanctum'));
        $actor = User::factory()->create(['institution_id' => 1, 'password' => 'Synthetic123!', 'is_active' => true, 'must_change_password' => false]);
        $actor->assignRole($role);
        $target = User::factory()->create(['institution_id' => 1, 'is_active' => true, 'password' => 'Synthetic123!', 'must_change_password' => false]);
        Sanctum::actingAs($actor);

        return [$actor, $target];
    }

    private function payload(string $operation): array
    {
        return ['operation' => $operation, 'password' => 'Synthetic123!', 'reason' => 'Synthetic verification reference TEST-001'];
    }

    public function test_suspension_reactivation_and_revocation_are_real_and_audited(): void
    {
        [$actor, $target] = $this->accounts();
        $target->createToken('old');
        $url = '/api/users/'.$target->uuid.'/security';
        $this->postJson($url, $this->payload('suspend'))->assertOk();
        $this->assertFalse($target->fresh()->is_active);
        $this->assertSame(0, $target->tokens()->count());
        $this->assertDatabaseHas('activity_log', ['description' => 'account_security_changed', 'causer_id' => $actor->id, 'subject_id' => $target->id]);
        $this->getJson($url)->assertOk()->assertJsonPath('data.0.details.operation', 'suspend')->assertJsonPath('data.0.details.revoked_sessions', 1)->assertJsonMissing(['password' => 'Synthetic123!']);
        $this->postJson($url, $this->payload('reactivate'))->assertOk();
        $this->assertTrue($target->fresh()->is_active);
        $target->createToken('new');
        $this->postJson($url, $this->payload('revoke_sessions'))->assertOk();
        $this->assertSame(0, $target->tokens()->count());
    }

    public function test_wrong_password_or_missing_reason_cannot_mutate_account(): void
    {
        [, $target] = $this->accounts();
        $target->createToken('old');
        $data = $this->payload('suspend');
        $data['password'] = 'wrong';
        $this->postJson('/api/users/'.$target->id.'/security', $data)->assertStatus(422);
        $data = $this->payload('suspend');
        unset($data['reason']);
        $this->postJson('/api/users/'.$target->id.'/security', $data)->assertStatus(422);
        $this->assertTrue($target->fresh()->is_active);
        $this->assertSame(1, $target->tokens()->count());
    }

    public function test_recovery_requires_identity_check_and_forces_password_and_two_factor_enrolment(): void
    {
        [, $target] = $this->accounts();
        $target->forceFill(['two_factor_enabled' => true, 'two_factor_secret' => encrypt('JBSWY3DPEHPK3PXP'), 'two_factor_confirmed_at' => now(), 'two_factor_recovery_codes' => encrypt('["ABCDE-FGHIJ"]')])->save();
        $target->createToken('old');
        $url = '/api/users/'.$target->id.'/security';
        $this->postJson($url, $this->payload('recover_2fa'))->assertStatus(422);
        $data = $this->payload('recover_2fa') + ['identity_verified' => true];
        $this->postJson($url, $data)->assertOk();
        $target->refresh();
        $this->assertTrue($target->two_factor_required);
        $this->assertTrue($target->must_change_password);
        $this->assertFalse($target->two_factor_enabled);
        $this->assertNull($target->two_factor_secret);
        $this->assertSame(0, $target->tokens()->count());
        Sanctum::actingAs($target);
        $this->getJson('/api/v1/auth/sessions')->assertForbidden();
        $this->postJson('/api/v1/auth/change-password', ['current_password' => 'Synthetic123!', 'password' => 'Changed123!', 'password_confirmation' => 'Changed123!'])->assertOk();
        Sanctum::actingAs($target->fresh());
        $this->getJson('/api/v1/auth/sessions')->assertForbidden()->assertJsonPath('requires_2fa_setup', true);
        $setup = $this->postJson('/api/v1/auth/two-factor/setup', ['password' => 'Changed123!'])->assertOk();
        $code = (new Google2FA)->getCurrentOtp($setup->json('secret'));
        $this->postJson('/api/v1/auth/two-factor/confirm', ['code' => $code])->assertOk();
        Sanctum::actingAs($target->fresh());
        $this->getJson('/api/v1/auth/sessions')->assertOk();
        $this->deleteJson('/api/v1/auth/two-factor/disable', ['password' => 'Changed123!', 'code' => $setup->json('recovery_codes.0')])->assertForbidden();
    }

    public function test_two_factor_requirement_is_selected_per_account(): void
    {
        [, $target] = $this->accounts();
        $unselected = User::factory()->create();
        $this->postJson('/api/users/'.$target->id.'/security', $this->payload('require_2fa'))->assertOk();
        $this->assertTrue($target->fresh()->two_factor_required);
        $this->assertFalse($unselected->fresh()->two_factor_required);
    }

    public function test_password_reset_link_uses_existing_mailable_and_hashed_token(): void
    {
        [, $target] = $this->accounts();
        $target->createToken('old');
        $this->postJson('/api/users/'.$target->id.'/security', $this->payload('password_reset_link'))->assertOk();
        Mail::assertSent(ResetPasswordMail::class, fn ($mail) => $mail->hasTo($target->email));
        $record = DB::table('password_reset_tokens')->where('email', $target->email)->first();
        $this->assertNotNull($record);
        $this->assertNotNull(Hash::info($record->token)['algoName']);
        $this->assertSame(0, $target->tokens()->count());
    }

    public function test_permissions_and_protected_accounts_cannot_be_bypassed(): void
    {
        [$actor, $target] = $this->accounts();
        $this->postJson('/api/users/'.$actor->id.'/security', $this->payload('recover_2fa') + ['identity_verified' => true])->assertStatus(422);
        $target->assignRole(Role::findOrCreate('super-admin', 'sanctum'));
        $this->postJson('/api/users/'.$target->id.'/security', $this->payload('suspend'))->assertForbidden();
        $ordinary = User::factory()->create(['institution_id' => 1, 'is_active' => true]);
        $ordinary->assignRole(Role::findOrCreate('professor', 'sanctum'));
        Sanctum::actingAs($ordinary);
        $this->postJson('/api/users/'.$target->id.'/security', $this->payload('suspend'))->assertForbidden();
    }

    public function test_enrolled_operator_must_supply_second_factor(): void
    {
        [$actor, $target] = $this->accounts();
        $actor->forceFill(['two_factor_enabled' => true, 'two_factor_secret' => encrypt('JBSWY3DPEHPK3PXP'), 'two_factor_confirmed_at' => now(), 'two_factor_recovery_codes' => encrypt('["ABCDE-FGHIJ"]')])->save();
        Sanctum::actingAs($actor->fresh());
        $target->createToken('old');
        $url = '/api/users/'.$target->id.'/security';
        $this->postJson($url, $this->payload('revoke_sessions'))->assertStatus(422);
        $this->assertSame(1, $target->tokens()->count());
        $this->postJson($url, $this->payload('revoke_sessions') + ['code' => 'ABCDE-FGHIJ'])->assertOk();
        $this->assertSame(0, $target->tokens()->count());
    }

    public function test_another_institution_cannot_be_managed_or_inspected(): void
    {
        [, $target] = $this->accounts();
        $institution = Institution::create(['name' => 'Synthetic Other', 'code' => 'OTHER', 'slug' => 'synthetic-other', 'city' => 'Fes', 'type' => 'grande_ecole']);
        $target->forceFill(['institution_id' => $institution->id])->save();
        $url = '/api/users/'.$target->id.'/security';
        $this->getJson($url)->assertNotFound();
        $this->postJson($url, $this->payload('suspend'))->assertNotFound();
        $this->assertTrue($target->fresh()->is_active);
    }
}
