<?php

use App\Models\NotificationLog;
use App\Services\Campus\CampusAlertService;

it('journalise les 3 templates SMS campus sans HTTP externe', function () {
    $service = app(CampusAlertService::class);

    $service->send(CampusAlertService::TEMPLATE_CONVOCATION, null, '0612345678');
    $service->send(CampusAlertService::TEMPLATE_GRADE_DEADLINE, null, '0612345678', [
        'date' => '2026-09-01',
        'session' => 'Normale',
    ]);
    $service->send(CampusAlertService::TEMPLATE_REINSCRIPTION, null, null, [
        'year' => '2026-2027',
    ]);

    expect(NotificationLog::where('type', 'sms')->count())->toBe(3);
    expect(NotificationLog::where('status', 'skipped')->count())->toBe(1);
    expect(NotificationLog::where('status', 'sent')->count())->toBe(2);
    expect($service->render(CampusAlertService::TEMPLATE_CONVOCATION))->toContain('Convocation');
});
