<?php

namespace Tests\Feature;

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
}
