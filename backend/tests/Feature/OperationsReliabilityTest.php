<?php

namespace Tests\Feature;

use App\Http\Middleware\QueryTokenAuth;
use App\Jobs\ProcessAdmissionOcrJob;
use App\Services\Ocr\AdmissionOcrService;
use App\Support\AuditPayload;
use App\Support\AuthCookie;
use Database\Seeders\StagingSmokeSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OperationsReliabilityTest extends TestCase
{
    public function test_staging_cookie_is_isolated_from_the_normal_erp_cookie(): void
    {
        config(['auth.cookie_name' => 'encg_staging_auth_token']);
        $request = Request::create('/api/v1/auth/me', 'GET', [], [
            AuthCookie::NAME => AuthCookie::encode('1|OTHER-ENVIRONMENT'),
            'encg_staging_auth_token' => AuthCookie::encode('2|STAGING'),
        ]);
        (new QueryTokenAuth)->handle($request, fn () => response('ok'));
        $this->assertSame('Bearer 2|STAGING', $request->headers->get('Authorization'));
        $this->assertSame('encg_staging_auth_token', AuthCookie::make('2|STAGING')->getName());
        $this->assertSame('encg_staging_auth_token', AuthCookie::forget()->getName());
    }

    public function test_synthetic_staging_seeder_refuses_every_other_environment(): void
    {
        $this->expectException(\RuntimeException::class);
        (new StagingSmokeSeeder)->run();
    }

    public function test_old_duplicate_and_finished_ocr_jobs_never_access_documents_or_restart_extraction(): void
    {
        $extractor = $this->mock(AdmissionOcrService::class);
        $extractor->shouldNotReceive('extract');
        foreach (['retried', 'failed', 'processing', 'succeeded', 'cancelled', 'needs_review'] as $status) {
            DB::shouldReceive('table')->once()->with('admission_ocr_runs')->andReturnSelf();
            DB::shouldReceive('find')->once()->with($status)->andReturn((object) ['status' => $status]);
            (new ProcessAdmissionOcrJob($status))->handle($extractor);
        }
        $this->addToAssertionCount(6);
    }

    public function test_full_backup_includes_documents_but_excludes_credentials_and_recursive_archives(): void
    {
        $files = config('backup.backup.source.files');
        $this->assertSame([storage_path('app')], $files['include']);
        $this->assertContains(storage_path('app/private/database-backups'), $files['exclude']);
        $this->assertContains(storage_path('app/backup-temp'), $files['exclude']);
        $this->assertContains(storage_path('app/private/'.config('backup.backup.name')), $files['exclude']);
        $this->assertTrue(config('backup.backup.verify_backup'));
    }

    public function test_audit_never_persists_api_credentials_even_in_nested_payloads(): void
    {
        $payload = AuditPayload::redact(['api_key' => 'PRIVATE', 'nested' => ['authorization' => 'Bearer PRIVATE', 'cookie' => 'PRIVATE'], 'status' => 'approved']);
        $this->assertStringNotContainsString('PRIVATE', json_encode($payload));
        $this->assertSame('approved', $payload['status']);
    }
}
