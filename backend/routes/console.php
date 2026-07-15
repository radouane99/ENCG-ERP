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
use App\Mail\GradeDeadlineReminder;
use Illuminate\Support\Facades\Mail;

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

Schedule::call(function () {
    // Find active periods ending within the next 24 hours
    $upcomingDeadlines = GradeEntryPeriod::where('is_open', true)
        ->whereBetween('end_date', [now()->toDateString(), now()->addDay()->toDateString()])
        ->get();

    if ($upcomingDeadlines->isNotEmpty()) {
        $deadline = $upcomingDeadlines->first();
        $sessionLabel = $deadline->session_type ?? 'Saisie des Notes';

        // Get all professors (users with professor role via Spatie)
        $professors = \App\Models\User::role('professor')->get();

        foreach ($professors as $prof) {
            try {
                Mail::to($prof->email)->send(
                    new GradeDeadlineReminder(
                        professorName: $prof->name ?? ($prof->first_name . ' ' . $prof->last_name),
                        endDate: $deadline->end_date,
                        sessionLabel: $sessionLabel,
                    )
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Grade deadline reminder failed for ' . $prof->email . ': ' . $e->getMessage());
            }
        }
    }
})->dailyAt('09:00');

