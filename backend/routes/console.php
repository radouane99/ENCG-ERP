<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


use Illuminate\Support\Facades\Schedule;

Schedule::command('backup:clean')->daily();
Schedule::command('backup:run')->daily();

use App\Models\GradeEntryPeriod;

Schedule::call(function () {
    // Find all active periods whose end date has passed
    $expiredPeriods = GradeEntryPeriod::where('is_open', true)
        ->where('end_date', '<', now()->toDateString())
        ->get();

    foreach ($expiredPeriods as $period) {
        $period->update([
            'is_open' => false,
            'closed_by' => null // Automatically closed by system
        ]);

        if (class_exists('Spatie\Activitylog\Models\Activity')) {
            activity()
                ->performedOn($period)
                ->event('auto_closed')
                ->log("La période de saisie de notes pour le semestre {$period->semester_id} a été fermée automatiquement (date limite dépassée).");
        }
    }

    if ($expiredPeriods->isNotEmpty()) {
        // If all periods are closed, set institution phase to locked
        $openCount = GradeEntryPeriod::where('is_open', true)->count();
        if ($openCount === 0) {
            $institution = \App\Models\Institution::first();
            if ($institution) {
                $settings = $institution->settings ?? [];
                $settings['exam_lock_phase'] = 'Verrouillage Total';
                $institution->update(['settings' => $settings]);
            }
        }
    }
})->hourly();

