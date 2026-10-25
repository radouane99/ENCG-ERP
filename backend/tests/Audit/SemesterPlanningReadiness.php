<?php

use App\Services\Academic\TimetableCampaignService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$data = DB::transaction(function () {
    DB::statement('SET TRANSACTION READ ONLY');
    $workspace = app(TimetableCampaignService::class)->workspace();
    $readiness = $workspace['readiness'];
    unset($readiness['professor_loads'], $readiness['missing_assignments']);

    return ['database' => DB::connection()->getDatabaseName(), 'academic_year' => $workspace['academic_year'], 'campaign' => $workspace['campaign'], 'campaign_open' => $workspace['campaign_open'], 'readiness' => $readiness,
        'versions_by_status' => collect($workspace['filieres'])->countBy('status')->all()];
});
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
