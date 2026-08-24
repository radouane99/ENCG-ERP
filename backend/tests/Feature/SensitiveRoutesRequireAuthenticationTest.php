<?php

use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;

it('rejects unauthenticated access to previously public admin and PDF routes', function (string $method, string $uri) {
    $response = match (strtoupper($method)) {
        'POST' => postJson($uri, []),
        'PATCH' => patchJson($uri, ['status' => 'approved']),
        default => getJson($uri),
    };

    expect($response->status())->toBeIn([401, 403]);
})->with([
    ['GET', '/api/admin/students/1/progress-report'],
    ['GET', '/api/admin/activity-logs'],
    ['GET', '/api/activity-logs'],
    ['GET', '/api/admin/tafem/ministry-list'],
    ['GET', '/api/hr/vacataires/payroll'],
    ['GET', '/api/admin/ai/grade-anomalies'],
    ['GET', '/api/admin/pfe/workflow'],
    ['PATCH', '/api/admin/pfe/1/status'],
    ['GET', '/api/students/1/transcript'],
    ['GET', '/api/admin/students/1/transcript'],
    ['GET', '/api/document-requests/1/download'],
    ['GET', '/api/professor-portal/documents/1/pdf'],
    ['POST', '/api/admin/ai/chat'],
    ['POST', '/api/professor/ai/grade-report'],
    ['GET', '/api/v1/enrollments/dossier-complet-pdf'],
]);

it('keeps intentional public admission endpoints reachable without a token', function () {
    $response = getJson('/api/public/track-dossier');

    expect($response->status())->not->toBe(401);
});
