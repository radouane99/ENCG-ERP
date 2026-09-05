<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('debug:prof-stats {userId=10}', function (string $userId) {
    $result = app(\App\Services\Analytics\DashboardAnalyticsService::class)->getProfessorStats((int) $userId);
    $this->line(json_encode([
        'error' => $result['error_debug'] ?? null,
        'modules' => $result['data']['total_modules'] ?? null,
        'students' => $result['data']['total_students'] ?? null,
        'groups' => $result['data']['total_groups'] ?? null,
        'hours' => $result['data']['statutory_hours_done'] ?? null,
        'list' => count($result['data']['modules_list'] ?? []),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
})->purpose('Debug professor dashboard stats');

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
use App\Mail\ReinscriptionOuverteMail;
use App\Models\GradeEntryPeriod;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
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

// ── Réinscription Annuelle — 1er Juillet à 08:00 (Recommendation #4) ───────
// Usage manual: php artisan reinscription:ouvrir --annee=2027
Schedule::command('reinscription:ouvrir --annee='.(date('Y') + 1))
    ->yearlyOn(7, 1, '08:00')
    ->description('Ouverture automatique de la réinscription annuelle ENCG Fès');

Schedule::command('encg:ai-risk-digest')->weeklyOn(1, '08:00')
    ->description('Digest hebdomadaire des alertes pédagogiques direction');

// ── Rappel Réinscription — J-7 avant fermeture (1er Août à 09:00) ───────────
Schedule::call(function () {
    $annee = date('Y') + 1;
    $academicYear = date('Y').'-'.$annee;

    // Find all "reinscrit" students who have NOT yet completed their reinscription docs
    $studentsNeedingReminder = Student::where('inscription_status', 'reinscrit')
        ->where('academic_year', $academicYear)
        ->with(['user'])
        ->get();

    foreach ($studentsNeedingReminder as $student) {
        $email = $student->user?->email ?? $student->email;
        if ($email) {
            try {
                Mail::to($email)->queue(
                    new ReinscriptionOuverteMail($student, $academicYear, isReminder: true)
                );
            } catch (Exception $e) {
                Log::warning("Rappel réinscription failed for {$student->cne}: ".$e->getMessage());
            }
        }
    }
})->yearlyOn(8, 1, '09:00')->description('Rappel réinscription J-7 pour étudiants ENCG');
