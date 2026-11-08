<?php

namespace Tests\Feature;

use App\Mail\NewDeviceLoginAlertMail;
use App\Mail\PasswordlessOtpMail;
use App\Models\User;
use App\Services\LoginChallengeService;
use App\Services\TwoFactorAuthService;
use App\Support\AuthCookie;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\PersonalAccessToken;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class AuthSecurityWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_rate_limit_normalizes_email_without_sharing_all_student_challenges(): void
    {
        $limiter = RateLimiter::limiter('login');
        $request = fn ($data) => Request::create('/api/v1/auth/login', 'POST', $data, [], [], ['REMOTE_ADDR' => '192.0.2.1']);
        $this->assertSame($limiter($request(['email' => 'USER@example.test']))->key, $limiter($request(['email' => 'user@example.test']))->key);
        $this->assertNotSame($limiter($request(['challenge_token' => 'first']))->key, $limiter($request(['challenge_token' => 'second']))->key);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Notification::fake();
        Cache::flush();
    }

    private function account(bool $twoFactor = false): User
    {
        return User::factory()->create(['password' => 'Synthetic123!', 'is_active' => true, 'must_change_password' => false,
            'two_factor_enabled' => $twoFactor, 'two_factor_secret' => $twoFactor ? encrypt('JBSWY3DPEHPK3PXP') : null,
            'two_factor_recovery_codes' => $twoFactor ? encrypt(json_encode(['ABCDE-FGHIJ'])) : null,
            'two_factor_confirmed_at' => $twoFactor ? now() : null]);
    }

    public function test_login_requires_two_factor_for_an_ordinary_account_and_consumes_recovery_once(): void
    {
        $user = $this->account(true);
        $response = $this->postJson('/api/v1/auth/login', ['email' => strtoupper($user->email), 'password' => 'Synthetic123!']);
        $response->assertOk()->assertJsonPath('data.requires_two_factor', true);
        $this->assertSame(0, $user->tokens()->count());
        $challenge = $response->json('data.two_factor_challenge_token');
        $payload = ['challenge_token' => $challenge, 'code' => 'abcde-fghij'];
        $this->postJson('/api/v1/auth/two-factor/verify', $payload)->assertOk()->assertJsonPath('data.requires_two_factor', false);
        $this->postJson('/api/v1/auth/two-factor/verify', $payload)->assertStatus(422);
        $this->assertFalse(app(TwoFactorAuthService::class)->verify($user->fresh(), 'ABCDEFGHIJ'));
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_challenge_rechecks_active_status_and_credentials(): void
    {
        $user = $this->account(true);
        $service = app(LoginChallengeService::class);
        $challenge = $service->create($user)['two_factor_challenge_token'];
        $user->forceFill(['is_active' => false])->save();
        $this->assertNull($service->verify($challenge, 'ABCDE-FGHIJ'));
        $user->forceFill(['is_active' => true])->save();
        $challenge = $service->create($user)['two_factor_challenge_token'];
        $user->update(['password' => 'Changed123!']);
        $this->assertNull($service->verify($challenge, 'ABCDE-FGHIJ'));
    }

    public function test_challenge_is_limited_and_debug_master_codes_do_not_work(): void
    {
        config(['app.debug' => true]);
        $user = $this->account(true);
        $service = app(LoginChallengeService::class);
        $challenge = $service->create($user)['two_factor_challenge_token'];
        for ($i = 0; $i < 5; $i++) {
            $this->assertNull($service->verify($challenge, 'invalid'));
        }
        $this->assertNull($service->verify($challenge, 'ABCDE-FGHIJ'));
        $this->assertFalse(app(TwoFactorAuthService::class)->verify($user, '000000'));
    }

    public function test_totp_is_accepted_only_once(): void
    {
        $user = $this->account(true);
        $code = (new Google2FA)->getCurrentOtp('JBSWY3DPEHPK3PXP');
        $service = app(TwoFactorAuthService::class);
        $this->assertTrue($service->verify($user, $code));
        $this->assertFalse($service->verify($user, $code));
    }

    public function test_password_reset_revokes_all_sessions_and_is_single_use(): void
    {
        $user = $this->account();
        $user->createToken('first');
        $user->createToken('second');
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => Hash::make('synthetic-reset'), 'created_at' => now()]);
        $payload = ['email' => $user->email, 'token' => 'synthetic-reset', 'password' => 'Changed123!', 'password_confirmation' => 'Changed123!'];
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertOk();
        $this->assertSame(0, $user->tokens()->count());
        $this->assertTrue(Hash::check('Changed123!', $user->fresh()->password));
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(400);
    }

    public function test_session_management_is_scoped_to_owner_and_keeps_current_session(): void
    {
        $user = $this->account();
        $current = $user->createToken('current', ['*'], now()->addHour());
        $other = $user->createToken('other');
        $foreign = $this->account()->createToken('foreign');
        $this->withToken($current->plainTextToken)->getJson('/api/v1/auth/sessions')->assertOk()->assertJsonCount(2, 'data')->assertJsonMissing(['token' => $current->plainTextToken]);
        $this->deleteJson('/api/v1/auth/sessions/'.$foreign->accessToken->id)->assertNotFound();
        $this->deleteJson('/api/v1/auth/sessions/'.$current->accessToken->id)->assertStatus(409);
        $this->deleteJson('/api/v1/auth/sessions/others')->assertOk()->assertJsonPath('revoked', 1);
        $this->assertNull(PersonalAccessToken::find($other->accessToken->id));
        $this->assertNotNull(PersonalAccessToken::find($foreign->accessToken->id));
    }

    public function test_disabled_account_cannot_keep_using_existing_token(): void
    {
        $user = $this->account();
        $token = $user->createToken('old');
        $user->forceFill(['is_active' => false])->save();
        $this->withToken($token->plainTextToken)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_password_change_rotates_current_token_and_revokes_others(): void
    {
        $user = $this->account();
        $old = $user->createToken('current');
        $user->createToken('other');
        $this->withToken($old->plainTextToken)->withHeader('X-Client', 'mobile')->postJson('/api/v1/auth/change-password', ['current_password' => 'Synthetic123!', 'password' => 'Changed123!', 'password_confirmation' => 'Changed123!'])->assertOk()->assertJsonStructure(['data' => ['token', 'user']]);
        $this->assertNull(PersonalAccessToken::find($old->accessToken->id));
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_untrusted_browser_origin_is_rejected(): void
    {
        $user = $this->account();
        $this->withHeader('Origin', 'https://untrusted.invalid')->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Synthetic123!'])->assertForbidden();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_setup_and_disable_require_password_and_disable_requires_second_factor(): void
    {
        $user = $this->account();
        $token = $user->createToken('current');
        $this->withToken($token->plainTextToken)->postJson('/api/v1/auth/two-factor/setup', ['password' => 'wrong'])->assertStatus(422);
        $setup = $this->postJson('/api/v1/auth/two-factor/setup', ['password' => 'Synthetic123!'])->assertOk();
        $code = (new Google2FA)->getCurrentOtp($setup->json('secret'));
        $this->postJson('/api/v1/auth/two-factor/confirm', ['code' => $code])->assertOk();
        $this->deleteJson('/api/v1/auth/two-factor/disable', ['password' => 'Synthetic123!'])->assertStatus(422);
        $this->deleteJson('/api/v1/auth/two-factor/disable', ['password' => 'Synthetic123!', 'code' => $setup->json('recovery_codes.0')])->assertOk();
        $this->assertFalse($user->fresh()->two_factor_enabled);
    }

    public function test_cookie_options_and_expired_password_reset(): void
    {
        config(['app.url' => 'https://erp.example.test']);
        $cookie = AuthCookie::make('synthetic-token');
        $this->assertTrue($cookie->isSecure());
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame(0, $cookie->getExpiresTime());
        $this->assertGreaterThan(time(), AuthCookie::make('synthetic-token', true)->getExpiresTime());
        $user = $this->account();
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => Hash::make('expired'), 'created_at' => now()->subMinutes(61)]);
        $this->postJson('/api/v1/auth/reset-password', ['email' => $user->email, 'token' => 'expired', 'password' => 'Changed123!', 'password_confirmation' => 'Changed123!'])->assertStatus(400);
        $this->assertTrue(Hash::check('Synthetic123!', $user->fresh()->password));
        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk()->json();
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'missing@example.test'])->assertOk()->json();
        $this->assertSame($known, $unknown);
    }

    public function test_login_supports_remember_me_30_days_and_cin_identifier(): void
    {
        $user = User::factory()->create([
            'cin' => 'CD998877',
            'password' => 'Synthetic123!',
            'is_active' => true,
            'must_change_password' => false,
            'two_factor_enabled' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'cd998877',
            'password' => 'Synthetic123!',
            'remember' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.remember', true)
            ->assertJsonPath('data.user.email', $user->email);

        $token = $user->tokens()->latest('id')->first();
        $this->assertNotNull($token);
        $this->assertSame('auth-token-remember', $token->name);
        $this->assertTrue($token->expires_at->greaterThan(now()->addDays(25)));
    }

    public function test_passwordless_email_otp_login_and_personal_security_history(): void
    {
        $user = $this->account(false);

        $this->postJson('/api/v1/auth/otp/request', [
            'email' => $user->email,
        ])->assertOk()->assertJsonPath('success', true);

        $sentCode = null;
        Mail::assertSent(PasswordlessOtpMail::class, function (PasswordlessOtpMail $mail) use (&$sentCode, $user) {
            $sentCode = $mail->otpCode;

            return $mail->hasTo($user->email);
        });

        $this->assertNotNull($sentCode);
        $this->assertMatchesRegularExpression('/^[0-9]{6}$/', (string) $sentCode);

        $verifyRes = $this->withHeader('X-Client', 'mobile')->postJson('/api/v1/auth/otp/verify', [
            'email' => $user->email,
            'code' => $sentCode,
            'remember' => true,
        ]);

        $verifyRes->assertOk()
            ->assertJsonPath('data.remember', true)
            ->assertJsonPath('data.user.email', $user->email);

        $plainToken = $verifyRes->json('data.token');
        $this->assertNotEmpty($plainToken);

        // Single-use OTP check
        $this->postJson('/api/v1/auth/otp/verify', [
            'email' => $user->email,
            'code' => $sentCode,
        ])->assertStatus(422);

        // Verify sessions + personal security history (CNDP Loi 09-08)
        $sessionsRes = $this->withToken($plainToken)->getJson('/api/v1/auth/sessions');
        $sessionsRes->assertOk()
            ->assertJsonPath('data.0.session_type', 'remember_30d')
            ->assertJsonPath('security_history.0.method', 'email_otp')
            ->assertJsonPath('security_history.0.remember', true);
    }

    public function test_new_device_anomaly_alert_passkey_webauthn_sudo_mode_and_security_headers(): void
    {
        $user = $this->account(false);

        // 1. First login from a known desktop browser (Windows + Chrome)
        $firstLogin = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
            'X-Client' => 'mobile',
        ])->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Synthetic123!',
            'remember' => true,
        ]);

        $firstLogin->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // 2. Second login from a new unrecognized mobile device (iPhone + Safari) -> triggers NewDeviceLoginAlertMail
        $secondLogin = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Safari/605.1.15',
            'X-Client' => 'mobile',
        ])->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Synthetic123!',
            'remember' => false,
        ]);
        $secondLogin->assertOk();
        $token = $secondLogin->json('data.token');

        Mail::assertSent(NewDeviceLoginAlertMail::class, fn (NewDeviceLoginAlertMail $mail) => $mail->hasTo($user->email));

        // 3. Step-Up Authentication (Sudo Mode 10 min)
        $sudoStatusBefore = $this->withToken($token)->getJson('/api/v1/auth/sudo-status');
        $sudoStatusBefore->assertOk()->assertJsonPath('data.sudo_verified', false);

        $sudoConfirm = $this->withToken($token)->postJson('/api/v1/auth/sudo-confirm', [
            'password' => 'Synthetic123!',
        ]);
        $sudoConfirm->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.sudo_verified', true);

        // 4. WebAuthn / Passkey (FIDO2) registration and passwordless biometric login
        $regOptRes = $this->withToken($token)->postJson('/api/v1/auth/passkeys/register-options');
        $regOptRes->assertOk()->assertJsonPath('success', true);
        $regChallenge = $regOptRes->json('data.challenge');

        $regPasskeyRes = $this->withToken($token)->postJson('/api/v1/auth/passkeys/register', [
            'credential_id' => 'pk_fido2_encg_touchid_01',
            'public_key' => 'COSE_ES256_PUBLIC_KEY_TEST_PAYLOAD',
            'device_name' => 'MacBook Pro TouchID (ENCG)',
            'challenge' => $regChallenge,
        ]);
        $regPasskeyRes->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.credential_id', 'pk_fido2_encg_touchid_01');

        $loginOptRes = $this->postJson('/api/v1/auth/passkeys/login-options');
        $loginOptRes->assertOk()->assertJsonPath('success', true);
        $challengeId = $loginOptRes->json('data.challenge_id');

        $passkeyLoginRes = $this->postJson('/api/v1/auth/passkeys/login', [
            'credential_id' => 'pk_fido2_encg_touchid_01',
            'challenge_id' => $challengeId,
            'signature' => 'fido2_valid_assertion_signature',
            'remember' => true,
        ]);
        $passkeyLoginRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', $user->email);

        // 5. Verify sessions endpoint includes passkeys, sudo_mode, and new device flag in security_history
        $sessionsRes = $this->withToken($token)->getJson('/api/v1/auth/sessions');
        $sessionsRes->assertOk()
            ->assertJsonPath('sudo_mode.active', true)
            ->assertJsonPath('passkeys.0.credential_id', 'pk_fido2_encg_touchid_01')
            ->assertJsonPath('security_history.0.method', 'passkey_webauthn');
    }
}
