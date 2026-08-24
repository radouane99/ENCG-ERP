<?php

use App\Jobs\ProcessDataExportRequest;
use App\Models\DataExportRequest;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\artisan;
use function Pest\Laravel\postJson;

it('requires authentication to create a DSAR export request', function () {
    postJson('/api/v1/privacy/export')->assertUnauthorized();
});

it('queues a DSAR export for the authenticated user', function () {
    Queue::fake();
    $user = User::factory()->create();

    actingAs($user, 'sanctum')
        ->postJson('/api/v1/privacy/export')
        ->assertAccepted()
        ->assertJsonPath('success', true);

    Queue::assertPushed(ProcessDataExportRequest::class);
    expect(DataExportRequest::where('user_id', $user->id)->count())->toBe(1);
});

it('records a CNDP rectification request without queuing an export', function () {
    Queue::fake();
    $user = User::factory()->create();

    actingAs($user, 'sanctum')
        ->postJson('/api/v1/privacy/rectification', [
            'payload' => ['phone' => '0612345678'],
            'notes' => 'Correction du numéro de téléphone',
        ])
        ->assertAccepted()
        ->assertJsonPath('success', true);

    Queue::assertNothingPushed();
    expect(DataExportRequest::where('user_id', $user->id)->value('request_type'))->toBe('rectification');
});

it('records a CNDP opposition request without auto-anonymizing', function () {
    Queue::fake();
    $user = User::factory()->create();

    actingAs($user, 'sanctum')
        ->postJson('/api/v1/privacy/opposition', ['notes' => 'Opposition pour motif légitime'])
        ->assertAccepted();

    Queue::assertNothingPushed();
    $user->refresh();
    expect($user->email)->not->toStartWith('anonymized_')
        ->and(DataExportRequest::where('user_id', $user->id)->value('request_type'))->toBe('opposition');
});

it('anonymizes inactive accounts past the retention threshold', function () {
    $stale = User::factory()->create([
        'is_active' => false,
        'last_login_at' => now()->subYears(12),
        'email' => 'ancien.compte@encg-fes.ac.ma',
        'first_name' => 'Karim',
        'last_name' => 'Bennani',
    ]);

    $recent = User::factory()->create([
        'is_active' => false,
        'last_login_at' => now()->subDays(3),
        'email' => 'recent.inactif@encg-fes.ac.ma',
    ]);

    artisan('cndp:enforce-retention', ['--days' => 3650])->assertSuccessful();

    $stale->refresh();
    $recent->refresh();

    expect($stale->email)->toStartWith('anonymized_')
        ->and($stale->first_name)->toBe('Anonymized')
        ->and($recent->email)->toBe('recent.inactif@encg-fes.ac.ma');
});
