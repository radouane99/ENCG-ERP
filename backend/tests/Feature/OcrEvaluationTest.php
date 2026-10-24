<?php
namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class OcrEvaluationTest extends TestCase
{
    use RefreshDatabase;
    private const URL = '/api/admissions/workflow/ocr-evaluation';
    private function actor(string $role = 'scolarite'): void
    {
        $u = User::factory()->create(['institution_id' => 1]); $u->assignRole(Role::findOrCreate($role, 'sanctum')); Sanctum::actingAs($u);
    }
    private function file(array $data): UploadedFile { return UploadedFile::fake()->createWithContent('annotations.json', json_encode($data)); }
    private function annotations(): array
    {
        return ['dataset_kind' => 'synthetic', 'samples' => [
            ['document_type' => 'bac', 'expected' => ['cne' => 'SYN123', 'bac_average' => '15,50'], 'extracted' => ['cne' => 'syn123', 'bac_average' => 15.5]],
            ['document_type' => 'cnie', 'expected' => ['cin' => 'SECRET-EXPECTED', 'first_name' => 'SECRET-NAME'], 'extracted' => ['cin' => 'SECRET-ACTUAL', 'first_name' => null]],
        ]];
    }
    public function test_metrics_distinguish_missing_mismatch_and_exact_without_storing_values_or_external_calls(): void
    {
        $this->actor(); Http::preventStrayRequests();
        $response = $this->post(self::URL, ['file' => $this->file($this->annotations()), 'authorized_use' => '1'], ['Accept' => 'application/json'])->assertOk()
            ->assertJsonPath('data.exact_match_percent', 50)->assertJsonPath('data.totals.labeled', 4)->assertJsonPath('data.totals.exact', 2)
            ->assertJsonPath('data.totals.missing', 1)->assertJsonPath('data.totals.mismatched', 1)->assertJsonPath('data.totals.critical_mismatches', 1)
            ->assertJsonPath('data.external_calls', 0)->assertJsonPath('data.raw_values_stored', false);
        $this->assertStringNotContainsString('SECRET-', $response->getContent());
        Http::assertNothingSent();
    }
    public function test_unauthorized_actor_and_missing_attestation_are_rejected(): void
    {
        $this->actor('professor'); $this->post(self::URL, ['file' => $this->file($this->annotations()), 'authorized_use' => '1'], ['Accept' => 'application/json'])->assertForbidden();
        $this->actor(); $this->post(self::URL, ['file' => $this->file($this->annotations())], ['Accept' => 'application/json'])->assertUnprocessable();
    }
    public function test_invalid_and_unbounded_annotations_do_not_generate_a_score(): void
    {
        $this->actor();
        foreach ([['dataset_kind' => 'synthetic', 'samples' => []], ['dataset_kind' => 'synthetic', 'samples' => [['document_type' => 'bac', 'expected' => ['unknown' => 'secret'], 'extracted' => []]]]] as $data) {
            $this->post(self::URL, ['file' => $this->file($data), 'authorized_use' => '1'], ['Accept' => 'application/json'])->assertUnprocessable();
        }
        $this->post(self::URL, ['file' => UploadedFile::fake()->createWithContent('annotations.json', '{not json'), 'authorized_use' => '1'], ['Accept' => 'application/json'])->assertUnprocessable();
        $named = $this->annotations(); $named['samples'] = ['unexpected-key' => $named['samples'][0]];
        $this->post(self::URL, ['file' => $this->file($named), 'authorized_use' => '1'], ['Accept' => 'application/json'])->assertUnprocessable();
    }
}
