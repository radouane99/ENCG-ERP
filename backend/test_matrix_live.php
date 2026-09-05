<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Filiere;
use App\Models\Schedule;
use App\Services\Academic\OfficialTimetableMatrixService;

$filiere = Filiere::where('code', 'GFC')->first();
if (!$filiere) {
    echo "Filiere GFC not found\n";
    exit(1);
}

$schedules = Schedule::with(['module', 'professor.user', 'room', 'group.filiere'])
    ->whereHas('group', fn ($q) => $q->where('filiere_id', $filiere->id))
    ->get();

$service = app(OfficialTimetableMatrixService::class);
$catalog = $service->catalog($schedules, ['filiere' => $filiere]);

echo "Filiere: {$filiere->name} ({$filiere->code})\n";
echo "Total schedules in DB for GFC: " . $schedules->count() . "\n";
echo "Total sections: " . count($catalog['sections']) . "\n";

foreach ($catalog['sections'] as $section) {
    echo "\n=== Section: {$section['title']} ({$section['semester_label']}) ===\n";
    echo "Total rows: " . count($section['rows']) . "\n";
    echo "Cours Start: " . ($section['footer']['cours_start'] ?? 'N/A') . " | TD/TP Start: " . ($section['footer']['td_tp_start'] ?? 'N/A') . "\n\n";

    printf("%-28s | %-24s | %-22s | %-16s | %s\n", "Module", "Élément", "Intervenant", "Salles", "Créneaux (Lundi-Vendredi)");
    echo str_repeat('-', 110) . "\n";

    foreach ($section['rows'] as $row) {
        $slots = [];
        foreach ($row['days'] as $day => $daySlots) {
            if (!empty($daySlots)) {
                $slots[] = "J{$day}: " . implode(', ', $daySlots);
            }
        }
        $slotsStr = implode(' | ', $slots);

        printf(
            "%-28s | %-24s | %-22s | %-16s | %s\n",
            substr($row['module_label'], 0, 28),
            substr($row['element_name'], 0, 24),
            substr($row['professor_name'], 0, 22),
            substr($row['room_label'], 0, 16),
            $slotsStr
        );
    }
}
