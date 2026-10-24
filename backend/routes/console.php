<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('pfe:seed', function () {
    require_once database_path('seeders/PfeAndSoutenanceSeeder.php');
    $seeder = new PfeAndSoutenanceSeeder;
    $seeder->setCommand($this);
    $seeder->run();
    $this->info('PFE & Soutenances seeded successfully!');
})->purpose('Seed PFE Workflow projects and jury defense schedules');

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

// Automated Daily Backups (Pilier 3 - ENCG ERP Native & Spatie)
Schedule::command('db:backup-daily')->dailyAt('02:00')->description('Sauvegarde quotidienne native PostgreSQL avec rétention 30 jours');
Schedule::command('backup:clean')->dailyAt('02:30');
Schedule::command('backup:run --only-db')->dailyAt('03:00');

// Automated Weekly PostgreSQL Optimization & Statistics Update (Pilier 2)
// VACUUM cannot run as a prepared statement or inside a transaction.
Schedule::call(function () {
    if (DB::getDriverName() !== 'pgsql') {
        return;
    }

    $connection = DB::connection();
    if ($connection->transactionLevel() > 0) {
        Log::warning('PostgreSQL VACUUM ANALYZE skipped: connection is inside a transaction.');

        return;
    }

    try {
        $connection->unprepared('VACUUM (ANALYZE)');
        Log::info('PostgreSQL VACUUM ANALYZE completed successfully.');
    } catch (Throwable $e) {
        Log::warning('PostgreSQL VACUUM ANALYZE skipped: '.$e->getMessage());
    }
})->weeklyOn(0, '04:00')->description('Weekly PostgreSQL Vacuum & Statistics Optimization');

use App\Events\GradeDeadlineWarning;
use App\Mail\GradeDeadlineReminder;

Schedule::command('admissions:maintain')->hourly()->withoutOverlapping();
use App\Models\GradeEntryPeriod;
use App\Models\Institution;
use App\Models\User;
use Database\Seeders\PfeAndSoutenanceSeeder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

Schedule::call(function () {
    // Find all active periods whose end date has passed
    $expiredPeriods = GradeEntryPeriod::where('is_open', true)
        ->where('end_date', '<', now()->toDateString())
        ->get();

    foreach ($expiredPeriods as $period) {
        $period->update([
            'is_open' => false,
            'closed_by' => null, // Automatically closed by system
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
            $institution = Institution::first();
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
        $professors = User::role('professor')->get();

        foreach ($professors as $prof) {
            try {
                Mail::to($prof->email)->queue(
                    new GradeDeadlineReminder(
                        professorName: $prof->name ?? ($prof->first_name.' '.$prof->last_name),
                        endDate: $deadline->end_date,
                        sessionLabel: $sessionLabel,
                    )
                );
            } catch (Exception $e) {
                Log::warning('Grade deadline reminder failed for '.$prof->email.': '.$e->getMessage());
            }
        }

        // Broadcast the warning via Reverb
        event(new GradeDeadlineWarning($deadline->end_date, $sessionLabel));
    }
})->dailyAt('09:00');

// Renewal dates are published by staff in renewal_campaigns. No scheduled
// command promotes students or confirms their registration automatically.

Schedule::command('encg:ai-risk-digest')->weeklyOn(1, '08:00')
    ->description('Digest hebdomadaire des alertes pédagogiques direction');

// Staff reminders use the published renewal calendar and the deduplicated
// /admin/reinscriptions/send-reminders workflow, without fixed calendar dates.
