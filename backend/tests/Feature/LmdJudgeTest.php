<?php

use App\Domain\AI\Contracts\AiDriverInterface;
use App\Domain\AI\Services\GeminiAiDriver;
use App\Domain\AI\Services\GroundedAiService;
use App\Domain\Deliberation\LmdRules;
use App\Models\Student;
use App\Services\Academic\LmdJudgeService;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

it('maps LMD scores 5.99 NV, 6.00 RAT and 10 V without eliminatory', function () {
    expect(LmdRules::decisionFromScore(5.99))->toBe('NV')
        ->and(LmdRules::decisionFromScore(6.00))->toBe('RAT')
        ->and(LmdJudgeService::verdictFromAverage(10.0, false))->toBe('V')
        ->and(LmdJudgeService::verdictFromAverage(10.0, true))->toBe('NV');
});

it('does not present Grande Ecole as tuition fees', function () {
    expect(LmdRules::filiereRequiresPayment('grande_ecole'))->toBeFalse();

    $copy = app(GroundedAiService::class)->explain([
        'verdict' => 'V',
        'semester_average' => 12,
        'eliminatory_threshold' => LmdRules::ELIMINATORY_THRESHOLD,
        'validation_threshold' => LmdRules::VALIDATION_THRESHOLD,
    ], 'lmd_judge');

    expect($copy['text_fr'])->not->toContain('droits d')
        ->and($copy['text_fr'])->toContain('gratuit')
        ->and($copy['text_fr'])->toContain('6');
});

it('returns a computed LMD verdict before any LLM copy for the student portal', function () {
    $student = Student::factory()->create();
    $user = $student->user;
    $role = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
    $user->assignRole($role);
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/student-portal/ai/lmd-judge', [
        'question' => 'Est-ce que je valide ?',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);
    expect($response->json('verdict'))->toBeIn(['V', 'RAT', 'NV', 'RACHAT'])
        ->and((float) $response->json('facts.eliminatory_threshold'))->toBe(6.0)
        ->and($response->json('explanation_fr'))->not->toBeEmpty();
});

it('falls back when a fake Gemini HTTP call fails', function () {
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response(['error' => true], 500),
    ]);
    config(['services.gemini.key' => 'test-key']);

    $copy = (new GroundedAiService(new GeminiAiDriver))->explain(['verdict' => 'NV'], 'lmd_judge');

    expect($copy['text_fr'])->not->toContain('Validé')
        ->and(str_contains(strtolower($copy['text_fr']), 'nv') || str_contains($copy['text_fr'], 'NV'))->toBeTrue();
});

it('explains NV from precomputed facts without inventing Validé', function () {
    $copy = app(GroundedAiService::class)->explain(['verdict' => 'NV'], 'lmd_judge');
    expect($copy['text_fr'])->toContain('NV')
        ->and($copy['text_fr'])->not->toContain('Validé');
});

it('appends a single grounded-numbers footer from actual facts', function () {
    $driver = new class implements AiDriverInterface
    {
        public function generate(string $prompt, array $context = []): string
        {
            return "FR: Décision jury: RAT, sans seuil dans le texte.\nAR: قرار RAT بدون عتبة.";
        }

        public function chat(string $conversationId, string $message): string
        {
            return '';
        }

        public function predictRisk(array $data): array
        {
            return [];
        }
    };

    $copy = (new GroundedAiService($driver))->explain([
        'verdict' => 'RAT',
        'eliminatory_threshold' => LmdRules::ELIMINATORY_THRESHOLD,
        'validation_threshold' => LmdRules::VALIDATION_THRESHOLD,
    ], 'lmd_judge');

    expect(substr_count($copy['text_fr'], 'Chiffres système :'))->toBe(1)
        ->and($copy['text_fr'])->toContain((string) LmdRules::ELIMINATORY_THRESHOLD)
        ->and(substr_count($copy['text_ar'], 'أرقام النظام:'))->toBe(1);
});
