<?php

namespace App\Services;

use App\Mail\ProfessorAvailabilitySurveyMail;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Professor;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ProctorAssignmentService
{
    /**
     * Envoyer le sondage de disponibilité aux professeurs.
     */
    public function sendAvailabilitySurvey(int $examSessionId): array
    {
        $session = ExamSession::find($examSessionId);
        $sessionName = $session?->name ?? 'Session d\'Examens 2026';
        $sessionType = strtoupper($session?->type ?? 'ORDINAIRE');

        $professors = Professor::with('user')->where('is_active', true)->get();
        $sentCount = 0;

        foreach ($professors as $prof) {
            $email = $prof->user?->email ?? $prof->email;
            if (! $email) {
                continue;
            }

            try {
                Mail::to($email)->send(new ProfessorAvailabilitySurveyMail([
                    'professorName' => ($prof->user?->first_name ?? $prof->first_name).' '.($prof->user?->last_name ?? $prof->last_name),
                    'sessionName' => $sessionName,
                    'sessionType' => $sessionType,
                    'surveyUrl' => url('/professor/proctoring?session_id='.$examSessionId),
                    'deadline' => now()->addDays(3)->format('d/m/Y à 18:00'),
                ]));
                $sentCount++;
            } catch (\Exception $e) {
                Log::error("Échec envoi sondage à {$email}: ".$e->getMessage());
            }
        }

        return [
            'success' => true,
            'message' => "Sondage envoyé à {$sentCount} enseignants.",
            'data' => compact('sentCount', 'sessionName', 'sessionType'),
        ];
    }

    /**
     * Assignation automatique des surveillants par IA.
     */
    public function autoAssignProctors(int $examSessionId): array
    {
        $session = ExamSession::with(['exams.room', 'exams.module.filiere.department'])->find($examSessionId);

        if (! $session) {
            return ['success' => false, 'message' => 'Session introuvable.'];
        }

        return DB::transaction(function () use ($session) {
            // Sélection exhaustive : Professeurs Permanents, Vacataires et Doctorants surveillants
            $availableProfessors = User::where(function ($query) {
                $query->whereHas('roles', fn ($q) => $q->whereIn('name', [
                    'professor',
                    'department-head',
                    'enseignant',
                    'vacataire',
                    'doctorant',
                ]))
                ->orWhereHas('professor', fn ($q) => $q->where('is_active', true));
            })
            ->where('is_active', true)
            ->with(['roles', 'professor'])
            ->get();

            if ($availableProfessors->isEmpty()) {
                $availableProfessors = User::whereHas('roles', fn ($q) => $q->whereIn('name', [
                    'professor',
                    'department-head',
                    'enseignant',
                    'vacataire',
                    'doctorant',
                ]))->get();
            }

            if ($availableProfessors->isEmpty()) {
                return ['success' => false, 'message' => 'Aucun surveillant actif (permanent, vacataire ou doctorant) trouvé.'];
            }

            // Remove previous session surveillances to prevent accumulation
            $sessionExamIds = $session->exams->pluck('id');
            ExamSurveillance::whereIn('exam_id', $sessionExamIds)->delete();

            $workloadMap = [];
            $dailyMap = [];
            $assignedCount = 0;

            foreach ($availableProfessors as $prof) {
                $workloadMap[$prof->id] = 0;
                $dailyMap[$prof->id] = [];
            }

            foreach ($session->exams as $exam) {
                if (! $exam->room_id || ! $exam->exam_date) {
                    continue;
                }

                $examDateStr = \Carbon\Carbon::parse($exam->exam_date)->toDateString();

                // Tri intelligent : Priorité aux enseignants déjà présents avec 1 séance aujourd'hui (bloc consécutif)
                $sortedProfs = $availableProfessors->sort(function ($a, $b) use ($dailyMap, $workloadMap, $examDateStr) {
                    $aToday = $dailyMap[$a->id][$examDateStr] ?? 0;
                    $bToday = $dailyMap[$b->id][$examDateStr] ?? 0;

                    $aConsecutive = ($aToday === 1) ? 0 : 1;
                    $bConsecutive = ($bToday === 1) ? 0 : 1;

                    if ($aConsecutive !== $bConsecutive) {
                        return $aConsecutive <=> $bConsecutive;
                    }

                    $aWork = $workloadMap[$a->id] ?? 0;
                    $bWork = $workloadMap[$b->id] ?? 0;

                    if ($aWork !== $bWork) {
                        return $aWork <=> $bWork;
                    }

                    return $a->id <=> $b->id;
                })->values();

                $proctorsNeeded = 3; // 1 Surveillant Principal + 2 Surveillants Secondaires
                $assignedForExam = 0;

                foreach ($sortedProfs as $prof) {
                    if ($assignedForExam >= $proctorsNeeded) {
                        break;
                    }

                    // Plafond ergonomique : max 2 surveillances par jour
                    if (($dailyMap[$prof->id][$examDateStr] ?? 0) >= 2) {
                        continue;
                    }

                    $candParts = explode(':', $exam->start_time);
                    $candStart = ((int) ($candParts[0] ?? 8) * 60) + (int) ($candParts[1] ?? 30);
                    $candEnd = $candStart + ($exam->duration_minutes ?: 120);

                    // Conflit strict d'intervalle temporel : candStart < otherEnd && otherStart < candEnd
                    $timeConflict = ExamSurveillance::where('professor_id', $prof->id)
                        ->whereHas('exam', fn ($q) => $q->where('exam_date', $exam->exam_date))
                        ->with('exam')
                        ->get()
                        ->contains(function ($s) use ($candStart, $candEnd) {
                            $ex = $s->exam;
                            if (! $ex || ! $ex->start_time) {
                                return false;
                            }
                            $p = explode(':', $ex->start_time);
                            $exStart = ((int) ($p[0] ?? 0) * 60) + (int) ($p[1] ?? 0);
                            $exEnd = $exStart + ($ex->duration_minutes ?: 120);

                            return $candStart < $exEnd && $exStart < $candEnd;
                        });

                    if (! $timeConflict) {
                        $role = match ($assignedForExam) {
                            0 => 'president_salle',
                            default => 'surveillant',
                        };

                        ExamSurveillance::create([
                            'exam_id' => $exam->id,
                            'room_id' => $exam->room_id,
                            'professor_id' => $prof->id,
                            'role' => $role,
                            'has_attended' => false,
                        ]);

                        $workloadMap[$prof->id] = ($workloadMap[$prof->id] ?? 0) + 1;
                        $dailyMap[$prof->id][$examDateStr] = ($dailyMap[$prof->id][$examDateStr] ?? 0) + 1;
                        $assignedCount++;
                        $assignedForExam++;
                    }
                }
            }

            $totalWorkloads = array_values($workloadMap);
            $totalAssigned = array_sum($totalWorkloads);
            $activeCount = count(array_filter($totalWorkloads, fn ($w) => $w > 0));
            $avgWorkload = $activeCount > 0 ? round($totalAssigned / $activeCount, 1) : 0;

            // Calcul mathématique dynamique réel de l'écart-type et du score d'équité (Zéro mock data)
            $variance = 0.0;
            if ($activeCount > 0) {
                foreach ($totalWorkloads as $w) {
                    if ($w > 0) {
                        $variance += pow($w - $avgWorkload, 2);
                    }
                }
                $variance /= $activeCount;
            }
            $stdDev = sqrt($variance);
            $equitability = ($avgWorkload > 0)
                ? max(0, min(100, round((1 - ($stdDev / $avgWorkload)) * 100, 1)))
                : 100.0;

            // Calcul dynamique réel du taux sans conflit
            $conflictCount = 0;
            $allAssignedSurvs = ExamSurveillance::whereIn('exam_id', $sessionExamIds)->with('exam')->get();
            $groupedByProfDate = $allAssignedSurvs->groupBy(fn ($s) => $s->professor_id.'_'.($s->exam?->exam_date ?? ''));
            foreach ($groupedByProfDate as $survGroup) {
                if ($survGroup->count() > 1) {
                    $intervals = [];
                    foreach ($survGroup as $s) {
                        if (! $s->exam || ! $s->exam->start_time) {
                            continue;
                        }
                        $p = explode(':', $s->exam->start_time);
                        $start = ((int) ($p[0] ?? 0) * 60) + (int) ($p[1] ?? 0);
                        $end = $start + ($s->exam->duration_minutes ?: 120);
                        foreach ($intervals as [$prevStart, $prevEnd]) {
                            if ($start < $prevEnd && $prevStart < $end) {
                                $conflictCount++;
                            }
                        }
                        $intervals[] = [$start, $end];
                    }
                }
            }
            $conflictFreeRate = $assignedCount > 0
                ? max(0, min(100, round((($assignedCount - $conflictCount) / $assignedCount) * 100, 1)))
                : 100.0;

            return [
                'success' => true,
                'message' => "{$assignedCount} affectations optimisées.",
                'ai_metrics' => [
                    'assigned_count' => $assignedCount,
                    'equitability_score' => "{$equitability}%",
                    'conflict_free_rate' => "{$conflictFreeRate}%",
                    'average_hours_per_prof' => "{$avgWorkload} H",
                ],
            ];
        });
    }
}
