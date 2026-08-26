<?php

namespace App\Console\Commands;

use App\Domain\Student\Models\StudentDossierAuditLog;
use App\Mail\ReinscriptionOuverteMail;
use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Services\Campus\CampusAlertService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

/**
 * Reinscription:OuvrirAnnuelle — Recommendation #4
 *
 * Cron: every July 1st at 08:00
 * Usage: php artisan reinscription:ouvrir --annee=2027
 *
 * Logic:
 *  1. Find all "inscrit" students
 *  2. Check moyenne annuelle >= 10/20 (via deliberation decisions)
 *  3. Check no active disciplinary sanctions
 *  4. Mark eligible students as "reinscrit" and send emails
 *  5. Block ineligible students with reason message
 */
class OuvrirReinscriptionAnnuelle extends Command
{
    protected $signature = 'reinscription:ouvrir {--annee= : Année académique cible (ex: 2027)}';

    protected $description = 'Ouvre la réinscription annuelle pour les étudiants éligibles ENCG Fès';

    public function handle(): int
    {
        $annee = $this->resolveEndYear();
        $prevAnnee = $annee - 1;
        $academicYear = "{$prevAnnee}-{$annee}";
        $targetYear = $this->resolveAcademicYear($academicYear, $prevAnnee, (int) $annee);
        $hasStudentYearColumn = Schema::hasColumn('students', 'academic_year');

        $this->info('╔══════════════════════════════════════════════════════════╗');
        $this->info("║  ENCG FÈS — Réinscription Annuelle {$academicYear}         ║");
        $this->info('╚══════════════════════════════════════════════════════════╝');

        $students = Student::query()
            ->where(function ($query) use ($academicYear, $hasStudentYearColumn) {
                $query->where('inscription_status', 'inscrit');
                if ($hasStudentYearColumn) {
                    $query->orWhere(function ($inner) use ($academicYear) {
                        $inner->where('inscription_status', 'reinscrit')
                            ->where('academic_year', $academicYear);
                    });
                }
            })
            ->with(['user'])
            ->get();

        $this->info("→ {$students->count()} étudiants inscrits trouvés.");

        $eligibleCount = 0;
        $blockedCount = 0;

        foreach ($students as $student) {
            if ($this->isAlreadyReinscritForYear($student, $academicYear, $targetYear, $hasStudentYearColumn)) {
                continue;
            }

            $blockReason = $this->checkBlockingConditions($student, $academicYear, $targetYear, $hasStudentYearColumn);
            $previousStatus = (string) $student->inscription_status;

            if ($blockReason) {
                $this->warn("  ❌ {$student->last_name} {$student->first_name} — BLOQUÉ : {$blockReason}");
                $blockedCount++;

                StudentDossierAuditLog::log(
                    studentId: $student->id,
                    action: 'reinscription_blocked',
                    fieldChanged: 'inscription_status',
                    oldValue: $previousStatus,
                    newValue: 'blocked_'.$annee,
                    comment: "Réinscription {$academicYear} bloquée : {$blockReason}"
                );

                continue;
            }

            $payload = ['inscription_status' => 'reinscrit'];
            if ($hasStudentYearColumn) {
                $payload['academic_year'] = $academicYear;
            }
            $student->update($payload);
            $this->advanceCurrentPathway($student, $targetYear);

            // Audit log
            StudentDossierAuditLog::log(
                studentId: $student->id,
                action: StudentDossierAuditLog::ACTION_REINSCRIPTION,
                fieldChanged: 'inscription_status',
                oldValue: $previousStatus,
                newValue: 'reinscrit',
                comment: "Réinscription automatique ouverte pour {$academicYear}"
            );

            // Send email notification
            try {
                $email = $student->user?->email ?? $student->email;
                if ($email) {
                    Mail::to($email)->queue(
                        new ReinscriptionOuverteMail($student, $academicYear)
                    );
                }
                app(CampusAlertService::class)->send(
                    CampusAlertService::TEMPLATE_REINSCRIPTION,
                    null,
                    $student->user?->phone ?? $student->phone,
                    ['year' => $academicYear]
                );
            } catch (\Exception $e) {
                Log::warning("Email réinscription échoué pour {$student->cne}: ".$e->getMessage());
            }

            $this->info("  ✅ {$student->last_name} {$student->first_name} ({$student->cne}) — réinscrit");
            $eligibleCount++;
        }

        $this->newLine();
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info("✅ Étudiants réinscrits : {$eligibleCount}");
        $this->warn("❌ Étudiants bloqués    : {$blockedCount}");
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return self::SUCCESS;
    }

    /**
     * --annee is the academic-year END (ex: 2027 → "2026-2027").
     * Manual runs without the option must match the July scheduler (now()->year + 1).
     */
    private function resolveEndYear(): int
    {
        $option = $this->option('annee');

        if ($option !== null && $option !== '') {
            return (int) $option;
        }

        return (int) now()->year + 1;
    }

    /**
     * Check if a student has blocking conditions for reinscription.
     * Returns null if eligible, or a reason string if blocked.
     */
    private function checkBlockingConditions(
        Student $student,
        string $academicYear,
        ?AcademicYear $targetYear,
        bool $hasStudentYearColumn
    ): ?string {
        // 1. Check active disciplinary sanction
        $hasActiveSanction = Schema::hasTable('discipline_cases')
            && DB::table('discipline_cases')
                ->where('student_id', $student->id)
                ->where('status', 'active')
                ->exists();

        if ($hasActiveSanction) {
            return 'Sanction disciplinaire active en cours';
        }

        // 2. Already reinscrit for the academic year targeted by --annee
        if ($this->isAlreadyReinscritForYear($student, $academicYear, $targetYear, $hasStudentYearColumn)) {
            return 'Déjà réinscrit pour cette année';
        }

        // 3. Unresolved rattrapage (RAT) blocks reinscription when the column exists
        $hasFailingDecision = false;
        if (Schema::hasTable('deliberation_decisions')) {
            $query = DB::table('deliberation_decisions')
                ->where('student_id', $student->id)
                ->where('decision', 'RAT');

            if (Schema::hasColumn('deliberation_decisions', 'resolved_at')) {
                $query->whereNull('resolved_at');
            }

            $hasFailingDecision = $query->exists();
        }

        if ($hasFailingDecision) {
            return 'Session de rattrapage non résolu — résultats en attente';
        }

        return null; // ✅ Eligible
    }

    private function isAlreadyReinscritForYear(
        Student $student,
        string $academicYear,
        ?AcademicYear $targetYear,
        bool $hasStudentYearColumn
    ): bool {
        if ($student->inscription_status !== 'reinscrit') {
            return false;
        }

        if ($hasStudentYearColumn && (string) $student->academic_year === $academicYear) {
            return true;
        }

        if (! $targetYear || ! Schema::hasTable('student_pathways')) {
            return false;
        }

        return StudentPathway::query()
            ->where('student_id', $student->id)
            ->where('is_current', true)
            ->where('academic_year_id', $targetYear->id)
            ->exists();
    }

    private function resolveAcademicYear(string $label, int $startYear, int $endYear): ?AcademicYear
    {
        if (! Schema::hasTable('academic_years')) {
            return null;
        }

        $slashLabel = str_replace('-', '/', $label);

        $existing = AcademicYear::query()
            ->where(function ($query) use ($label, $slashLabel) {
                $query->where('label', $label)->orWhere('label', $slashLabel);
            })
            ->orWhere(function ($query) use ($startYear, $endYear) {
                $query->where('start_year', $startYear)->where('end_year', $endYear);
            })
            ->first();

        if ($existing) {
            return $existing;
        }

        return AcademicYear::query()->firstOrCreate(
            ['institution_id' => 1, 'start_year' => $startYear],
            [
                'label' => $label,
                'end_year' => $endYear,
                'start_date' => sprintf('%d-09-01', $startYear),
                'end_date' => sprintf('%d-06-30', $endYear),
                'is_current' => false,
                'is_locked' => false,
            ]
        );
    }

    private function advanceCurrentPathway(Student $student, ?AcademicYear $targetYear): void
    {
        if (! $targetYear || ! Schema::hasTable('student_pathways')) {
            return;
        }

        $current = StudentPathway::query()
            ->where('student_id', $student->id)
            ->where('is_current', true)
            ->first();

        if (! $current) {
            return;
        }

        $current->update(['academic_year_id' => $targetYear->id]);
    }
}
