<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Domain\Student\Models\Student;
use App\Domain\Student\Models\StudentDossierAuditLog;

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
    protected $signature   = 'reinscription:ouvrir {--annee= : Année académique cible (ex: 2027)}';
    protected $description = 'Ouvre la réinscription annuelle pour les étudiants éligibles ENCG Fès';

    public function handle(): int
    {
        $annee     = $this->option('annee') ?? date('Y');
        $prevAnnee = (int)$annee - 1;
        $academicYear = "{$prevAnnee}-{$annee}";

        $this->info("╔══════════════════════════════════════════════════════════╗");
        $this->info("║  ENCG FÈS — Réinscription Annuelle {$academicYear}         ║");
        $this->info("╚══════════════════════════════════════════════════════════╝");

        $students = Student::where('inscription_status', 'inscrit')
            ->with(['user', 'latestPathway.filiere'])
            ->get();

        $this->info("→ {$students->count()} étudiants inscrits trouvés.");

        $eligibleCount  = 0;
        $blockedCount   = 0;

        foreach ($students as $student) {
            $blockReason = $this->checkBlockingConditions($student);

            if ($blockReason) {
                $this->warn("  ❌ {$student->last_name} {$student->first_name} — BLOQUÉ : {$blockReason}");
                $blockedCount++;

                // Log the block
                StudentDossierAuditLog::log(
                    studentId: $student->id,
                    action: 'reinscription_blocked',
                    fieldChanged: 'inscription_status',
                    oldValue: 'inscrit',
                    newValue: 'blocked_' . date('Y'),
                    comment: "Réinscription {$academicYear} bloquée : {$blockReason}"
                );
                continue;
            }

            // Mark as reinscrit
            $student->update([
                'inscription_status' => 'reinscrit',
                'academic_year'      => $academicYear,
            ]);

            // Audit log
            StudentDossierAuditLog::log(
                studentId: $student->id,
                action: StudentDossierAuditLog::ACTION_REINSCRIPTION,
                fieldChanged: 'inscription_status',
                oldValue: 'inscrit',
                newValue: 'reinscrit',
                comment: "Réinscription automatique ouverte pour {$academicYear}"
            );

            // Send email notification
            try {
                $email = $student->user?->email ?? $student->email;
                if ($email) {
                    Mail::to($email)->queue(
                        new \App\Mail\ReinscriptionOuverteMail($student, $academicYear)
                    );
                }
            } catch (\Exception $e) {
                Log::warning("Email réinscription échoué pour {$student->cne}: " . $e->getMessage());
            }

            $this->info("  ✅ {$student->last_name} {$student->first_name} ({$student->cne}) — réinscrit");
            $eligibleCount++;
        }

        $this->newLine();
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("✅ Étudiants réinscrits : {$eligibleCount}");
        $this->warn("❌ Étudiants bloqués    : {$blockedCount}");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return self::SUCCESS;
    }

    /**
     * Check if a student has blocking conditions for reinscription.
     * Returns null if eligible, or a reason string if blocked.
     */
    private function checkBlockingConditions(Student $student): ?string
    {
        // 1. Check active disciplinary sanction
        $hasActiveSanction = \Illuminate\Support\Facades\DB::table('discipline_cases')
            ->where('student_id', $student->id)
            ->where('status', 'active')
            ->exists();

        if ($hasActiveSanction) {
            return 'Sanction disciplinaire active en cours';
        }

        // 2. Check if student is already marked as reinscrit for current year
        if ($student->inscription_status === 'reinscrit' &&
            $student->academic_year === date('Y') . '-' . (date('Y') + 1)) {
            return 'Déjà réinscrit pour cette année';
        }

        // 3. Check deliberation — must have passed (moyenne >= 10/20 or V/VC decision)
        $hasFailingDecision = \Illuminate\Support\Facades\DB::table('deliberation_decisions')
            ->where('student_id', $student->id)
            ->where('decision', 'RAT') // Rattrapage not resolved
            ->whereNull('resolved_at')
            ->exists();

        if ($hasFailingDecision) {
            return 'Session de rattrapage non résolu — résultats en attente';
        }

        return null; // ✅ Eligible
    }
}
