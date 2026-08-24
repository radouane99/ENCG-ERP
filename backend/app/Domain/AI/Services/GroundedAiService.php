<?php

namespace App\Domain\AI\Services;

use App\Domain\AI\Contracts\AiDriverInterface;
use App\Domain\Deliberation\LmdRules;
use Illuminate\Support\Facades\Log;

/**
 * Gemini / stub explain facts already computed by Laravel. Never invents a verdict.
 */
class GroundedAiService
{
    public function __construct(
        private AiDriverInterface $driver
    ) {}

    /**
     * @param  array<string, mixed>  $facts
     * @return array{text_fr: string, text_ar: string, source: string}
     */
    public function explain(array $facts, string $task): array
    {
        $facts = $this->stripPii($facts);
        $fallback = $this->deterministicCopy($facts, $task);

        try {
            $prompt = "Tâche: {$task}\nFaits JSON (ne pas modifier les chiffres ni le verdict):\n"
                .json_encode($facts, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                ."\nRéponds en deux blocs: FR: ... AR: ... "
                .'Tu n\'inventes aucune note ni décision. Si facts.verdict=NV tu ne dis pas Validé. '
                .'Les seuils LMD sont éliminatoire < '.LmdRules::ELIMINATORY_THRESHOLD
                .' et validation >= '.LmdRules::VALIDATION_THRESHOLD.'.';

            $raw = $this->driver->generate($prompt, ['task' => $task, 'timeout' => 8]);
            $parsed = $this->freezeNumbers($this->parseBilingual($raw, $fallback), $facts);
            Log::info('grounded_ai', [
                'task' => $task,
                'user_id' => auth()->id(),
                'source' => 'driver',
            ]);

            return $parsed;
        } catch (\Throwable $e) {
            Log::warning('grounded_ai_fallback', ['task' => $task, 'error' => $e->getMessage()]);

            return $this->freezeNumbers($fallback, $facts);
        }
    }

    /**
     * @param  array<string, mixed>  $facts
     * @return array<string, mixed>
     */
    private function stripPii(array $facts): array
    {
        unset($facts['cne'], $facts['cin'], $facts['massar_code'], $facts['email'], $facts['first_name'], $facts['last_name'], $facts['student_name']);
        if (isset($facts['student_id'])) {
            $facts['student_ref'] = 'Étudiant #'.$facts['student_id'];
            unset($facts['student_id']);
        }

        return $facts;
    }

    /**
     * @param  array<string, mixed>  $facts
     * @return array{text_fr: string, text_ar: string, source: string}
     */
    private function deterministicCopy(array $facts, string $task): array
    {
        $verdict = (string) ($facts['verdict'] ?? $facts['status'] ?? '');
        $elim = LmdRules::ELIMINATORY_THRESHOLD;
        $val = LmdRules::VALIDATION_THRESHOLD;
        $avg = $facts['semester_average'] ?? $facts['average'] ?? $facts['score'] ?? null;

        $fr = match ($task) {
            'lmd_judge' => sprintf(
                'Décision LMD (ENCG Fès) : %s. Seuil éliminatoire < %s/20, validation ≥ %s/20%s. Le cursus Grande École est gratuit.',
                $verdict !== '' ? $verdict : 'RAT',
                $elim,
                $val,
                $avg !== null ? ', moyenne considérée '.$avg : ''
            ),
            'jury_brief' => sprintf(
                'Brief jury (lecture seule) : %s étudiants, %s notes < %s, %s rachat possible, %s RAT. L’IA ne vote pas et ne scelle pas le PV.',
                $facts['headcount'] ?? 0,
                $facts['below_eliminatory'] ?? 0,
                $elim,
                $facts['rachat_band'] ?? 0,
                $facts['rat_count'] ?? 0
            ),
            'tafem_review' => sprintf(
                'Contrôle TAFEM : %s CNE en double, %s CIN manquants, %s photos manquantes, %s Massar incohérents. Aucune inscription automatique.',
                $facts['duplicates_cne'] ?? 0,
                $facts['missing_cin'] ?? 0,
                $facts['missing_photo'] ?? 0,
                $facts['massar_mismatch'] ?? 0
            ),
            'slot_reason' => (string) ($facts['reason'] ?? 'Créneau validé par le moteur anti-conflit (férié / Ramadan / salle).'),
            'vacataire_cap' => sprintf(
                'Plafond vacation : %sh déjà saisies + %sh demandées > %sh par module.',
                $facts['done'] ?? 0,
                $facts['additional'] ?? 0,
                $facts['max'] ?? 45
            ),
            'pfe_oral' => 'Grille orale PFE (5A) : problématique, sources, timing et clarté. Feedback pédagogique uniquement.',
            default => 'Réponse pédagogique ENCG Fès à partir des faits calculés par le système (stub).',
        };

        $ar = match ($task) {
            'lmd_judge' => sprintf('قرار LMD: %s. العتبة الإقصائية أقل من %s/20 والتصديق من %s/20.', $verdict !== '' ? $verdict : 'RAT', $elim, $val),
            default => 'نص عربي مطابق للأرقام المحسوبة من النظام (بدون إعادة حساب).',
        };

        return ['text_fr' => $fr, 'text_ar' => $ar, 'source' => 'stub'];
    }

    /**
     * @param  array{text_fr: string, text_ar: string, source: string}  $fallback
     * @return array{text_fr: string, text_ar: string, source: string}
     */
    private function parseBilingual(?string $raw, array $fallback): array
    {
        if (! is_string($raw) || trim($raw) === '' || str_contains($raw, 'Local stub AI')) {
            return $fallback;
        }

        $fr = $fallback['text_fr'];
        $ar = $fallback['text_ar'];
        if (preg_match('/FR:\s*(.+?)(?:AR:|$)/is', $raw, $m)) {
            $fr = trim($m[1]);
        }
        if (preg_match('/AR:\s*(.+)$/is', $raw, $m)) {
            $ar = trim($m[1]);
        }

        return ['text_fr' => $fr, 'text_ar' => $ar, 'source' => 'driver'];
    }

    /**
     * @param  array{text_fr: string, text_ar: string, source: string}  $copy
     * @param  array<string, mixed>  $facts
     * @return array{text_fr: string, text_ar: string, source: string}
     */
    private function freezeNumbers(array $copy, array $facts): array
    {
        $elim = $facts['eliminatory_threshold'] ?? LmdRules::ELIMINATORY_THRESHOLD;
        $val = $facts['validation_threshold'] ?? LmdRules::VALIDATION_THRESHOLD;
        $footerFr = " Chiffres système : seuil éliminatoire {$elim}/20, validation {$val}/20.";
        $footerAr = " أرقام النظام: عتبة إقصائية {$elim}/20 وتصديق {$val}/20.";
        if (! str_contains($copy['text_fr'], 'Chiffres système :') && ! str_contains($copy['text_fr'], (string) $elim)) {
            $copy['text_fr'] .= $footerFr;
        }
        if (! str_contains($copy['text_ar'], 'أرقام النظام:') && ! str_contains($copy['text_ar'], (string) $elim)) {
            $copy['text_ar'] .= $footerAr;
        }

        return $copy;
    }
}
