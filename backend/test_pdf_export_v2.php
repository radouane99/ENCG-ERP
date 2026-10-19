<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\Api\DeliberationController;
use Illuminate\Http\Request;

$delibCtrl = app(DeliberationController::class);
$request = Request::create('/api/deliberations/export-pv-pdf', 'GET', [
    'filiere_id' => 13,
    'academic_year_id' => 3,
    'semester' => 2,
    'semester_number' => 2,
    'type' => 'annuel',
    'year_level' => 1,
]);

$response = $delibCtrl->exportPvQuery($request);
echo "PDF Status: " . $response->getStatusCode() . "\n";
$content = $response->getContent();
echo "PDF Size: " . strlen($content) . " bytes\n";
file_put_contents(__DIR__ . '/storage/app/test_pv_annuel_v2.pdf', $content);

$pdfPath = __DIR__ . '/storage/app/test_pv_annuel_v2.pdf';
$fp = @fopen($pdfPath, 'rb');
$pages = 0;
while (!feof($fp)) {
    $line = fgets($fp, 255);
    if (preg_match('/\/Count [0-9]+/', $line, $matches)) {
        preg_match('/[0-9]+/', $matches[0], $matches2);
        if ($matches2[0] > $pages) $pages = $matches2[0];
    }
}
fclose($fp);
echo "Total Pages in PDF: " . $pages . "\n";
