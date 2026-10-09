<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AcademicYear;
use App\Models\Schedule;
use App\Models\ModuleProfessor;
use App\Http\Controllers\Api\ProfessorAssignmentController;
use App\Services\Academic\AiTimetableSchedulerService;
use App\Services\Academic\OfficialTimetableMatrixService;
use Illuminate\Http\Request;

echo "=========================================================\n";
echo "1. EXECUTING OPTION B PROFESSOR AUTO-DISTRIBUTION\n";
echo "=========================================================\n";

$assignmentController = app(ProfessorAssignmentController::class);
$distributeRequest = Request::create('/api/professors/assignments/auto-distribute', 'POST', [
    'semester_period' => 'odd',
]);
$distributeResponse = $assignmentController->autoDistribute($distributeRequest);
$distributeData = json_decode($distributeResponse->getContent(), true);

echo "Status: " . ($distributeData['success'] ? 'SUCCESS' : 'FAILED') . "\n";
echo "Message: " . ($distributeData['message'] ?? 'N/A') . "\n";

echo "\n--- Sample Module Assignments (CM) ---\n";
$currYear = AcademicYear::where('is_current', true)->first();
$assignments = ModuleProfessor::with(['module.filiere', 'group', 'professor.user'])
    ->where('academic_year_id', $currYear->id)
    ->where('session_type', 'cm')
    ->get()
    ->groupBy('module_id');

foreach ($assignments as $mId => $rows) {
    $mod = $rows->first()->module;
    $prof = $rows->first()->professor?->user?->name ?? 'N/A';
    $grps = $rows->map(fn($r) => $r->group?->name ?? 'ALL')->unique()->implode(', ');
    echo "- Module {$mod?->code} ({$mod?->name}) => Prof: {$prof} | Groups: [{$grps}]\n";
}

echo "\n=========================================================\n";
echo "2. GENERATING SCHEDULES WITH OPTION B (AMPHITHÉÂTRE)\n";
echo "=========================================================\n";

$scheduler = app(AiTimetableSchedulerService::class);
$genResult = $scheduler->generateSchedule($currYear->id, 'odd', [
    'avoid_saturday_afternoon' => true,
    'prefer_morning_lectures' => true,
    'ignore_existing' => true,
]);

echo "Total Scheduled Sessions: " . $genResult['total_scheduled_sessions'] . "\n";
echo "Optimization Score: " . $genResult['optimization_score'] . "%\n";
echo "Conflicts Count: " . $genResult['conflicts_count'] . "\n";
if (!empty($genResult['conflicts_details'])) {
    echo "Conflicts: " . json_encode($genResult['conflicts_details'], JSON_PRETTY_PRINT) . "\n";
}

echo "\n=========================================================\n";
echo "3. COMMITTING OPTIMIZED SCHEDULES TO DATABASE\n";
echo "=========================================================\n";

$applyRequest = Request::create('/api/timetable/ai-scheduler/apply', 'POST', [
    'academic_year_id' => $currYear->id,
    'scheduled_items' => $genResult['scheduled_items'],
    'overwrite_existing' => true,
]);

$applyController = app(App\Http\Controllers\Api\AiTimetableSchedulerController::class);
$applyResponse = $applyController->apply($applyRequest);
$applyData = json_decode($applyResponse->getContent(), true);

echo "Apply Status: " . ($applyData['success'] ? 'SUCCESS' : 'FAILED') . "\n";
echo "Message: " . ($applyData['message'] ?? 'N/A') . "\n";

echo "\n=========================================================\n";
echo "4. SCANNING DATABASE FOR CONFLICTS (HEALTH CHECK)\n";
echo "=========================================================\n";

$scan = $scheduler->scanConflicts($currYear->id);
echo "Database Conflict Status: " . $scan['status'] . "\n";
echo "Total Scanned: " . $scan['total_scanned'] . "\n";
echo "Conflicts Found: " . $scan['conflicts_count'] . "\n";
if (!empty($scan['conflicts'])) {
    echo "Conflicts: " . json_encode($scan['conflicts'], JSON_PRETTY_PRINT) . "\n";
}

echo "\n=========================================================\n";
echo "5. INSPECTING OFFICIAL TIMETABLE MATRIX PER FILIÈRE\n";
echo "=========================================================\n";

$matrixService = app(OfficialTimetableMatrixService::class);
$filieres = App\Models\Filiere::whereIn('code', ['GFC', 'TC', 'MCM'])->get();

foreach ($filieres as $filiere) {
    echo "\n>>> FILIERE: {$filiere->code} ({$filiere->name}) <<<\n";
    $filiereSchedules = Schedule::with(['module.filiere', 'group.filiere', 'professor.user', 'room'])
        ->where('academic_year_id', $currYear->id)
        ->where('is_active', true)
        ->whereHas('module', fn($q) => $q->where('filiere_id', $filiere->id))
        ->get();

    $matrix = $matrixService->fromSchedules($filiereSchedules, [
        'filiere' => $filiere,
        'academic_year' => $currYear,
    ]);

    echo "Title: {$matrix['title']} | Rows Count: " . count($matrix['rows']) . "\n";
    foreach ($matrix['rows'] as $r) {
        $slotsStr = [];
        foreach ($r['days'] as $dayNum => $daySlots) {
            if (!empty($daySlots)) {
                $slotsStr[] = "J{$dayNum}: [" . implode(', ', $daySlots) . "]";
            }
        }
        $slotsDisplay = implode(' | ', $slotsStr);
        echo "  [{$r['session_type']}] {$r['module_name']} | Prof: {$r['professor_name']} | Salles: [{$r['room_label']}] | {$slotsDisplay}\n";
    }
}
