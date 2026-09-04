<?php

namespace App\Services;

use App\Mail\ProfessorAvailabilitySurveyMail;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Professor;
use App\Models\Room;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

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

    /**
     * Récupérer les données pour l'affectation manuelle des surveillants.
     */
    public function getAssignmentData(int $sessionId): array
    {
        $session = ExamSession::with([
            'exams.room',
            'exams.module.filiere',
            'exams.group',
            'exams.surveillances.professor.user',
        ])->find($sessionId);

        if (! $session) {
            return ['success' => false, 'message' => 'Session introuvable.', 'data' => null];
        }

        // Proctors : permanents, chefs de département, vacataires, doctorants
        $proctors = User::where(function ($query) {
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
        ->with(['roles', 'professor.department'])
        ->get()
        ->map(function ($u) {
            $name = trim(($u->first_name ?? '').' '.($u->last_name ?? ''));
            if (empty($name)) {
                $name = $u->name ?? 'Surveillant';
            }

            $roleNames = $u->roles->pluck('name')->toArray();
            $type = 'Permanent';
            if (in_array('doctorant', $roleNames)) {
                $type = 'Doctorant';
            } elseif (in_array('vacataire', $roleNames)) {
                $type = 'Vacataire';
            } elseif (in_array('department-head', $roleNames)) {
                $type = 'Chef de Département';
            }

            return [
                'id' => $u->id,
                'name' => $name,
                'email' => $u->email,
                'cin' => $u->cin ?? ($u->professor?->cin ?? ''),
                'type' => $type,
                'department' => $u->professor?->department?->name ?? 'ENCG',
            ];
        })
        ->sortBy('name')
        ->values()
        ->toArray();

        $rooms = Room::select(['id', 'name', 'code', 'capacity'])->orderBy('name')->get();

        $exams = $session->exams->sortBy(['exam_date', 'start_time'])->map(function ($exam) {
            $principalSurv = $exam->surveillances->first(fn ($s) => in_array($s->role, ['president_salle', 'Surveillant Principal']));
            $secondarySurvs = $exam->surveillances->filter(fn ($s) => ! in_array($s->role, ['president_salle', 'Surveillant Principal']));

            $principalId = $principalSurv?->professor_id;
            $secondaryIds = $secondarySurvs->pluck('professor_id')->toArray();

            return [
                'id' => $exam->id,
                'exam_date' => $exam->exam_date?->format('Y-m-d'),
                'date_formatted' => $exam->exam_date?->format('d/m/Y'),
                'start_time' => $exam->start_time ? substr($exam->start_time, 0, 5) : '08:30',
                'duration_minutes' => $exam->duration_minutes ?: 120,
                'module_name' => $exam->module?->name ?? 'Module N/A',
                'module_code' => $exam->module?->code ?? '',
                'filiere_name' => $exam->module?->filiere?->name ?? ($exam->module?->filiere?->code ?? ''),
                'group_name' => $exam->group?->name ?? '',
                'room_id' => $exam->room_id,
                'room_name' => $exam->room?->name ?? 'Non assignée',
                'principal_id' => $principalId,
                'secondary_ids' => $secondaryIds,
            ];
        })->values()->toArray();

        return [
            'success' => true,
            'data' => [
                'session_id' => $sessionId,
                'session_name' => $session->name,
                'proctors' => $proctors,
                'rooms' => $rooms,
                'exams' => $exams,
            ],
        ];
    }

    /**
     * Affectation manuelle et sur-mesure des surveillants par l'administrateur.
     */
    public function saveManualAssignments(int $examSessionId, array $assignments): array
    {
        $session = ExamSession::with(['exams.room', 'exams.module'])->find($examSessionId);
        if (! $session) {
            return ['success' => false, 'message' => 'Session d\'examen introuvable.'];
        }

        return DB::transaction(function () use ($session, $assignments) {
            $sessionExamIds = $session->exams->pluck('id')->toArray();

            // Récupérer les confirmations existantes pour les préserver si même prof
            $existingConfirmed = ExamSurveillance::whereIn('exam_id', $sessionExamIds)
                ->whereNotNull('confirmed_at')
                ->get()
                ->keyBy(fn ($s) => "{$s->exam_id}_{$s->professor_id}");

            // Supprimer les affectations précédentes de cette session
            ExamSurveillance::whereIn('exam_id', $sessionExamIds)->delete();

            $createdCount = 0;
            $examsMap = $session->exams->keyBy('id');
            $defaultRoomId = Room::first()?->id;

            foreach ($assignments as $item) {
                $examId = (int) ($item['exam_id'] ?? 0);
                if (! in_array($examId, $sessionExamIds) || ! isset($examsMap[$examId])) {
                    continue;
                }

                $exam = $examsMap[$examId];
                $roomId = ! empty($item['room_id']) ? (int) $item['room_id'] : ($exam->room_id ?: $defaultRoomId);

                // 1. Surveillant Principal (Président de salle)
                if (! empty($item['principal_id'])) {
                    $profId = (int) $item['principal_id'];
                    $confirmedAt = $existingConfirmed->get("{$examId}_{$profId}")?->confirmed_at;

                    ExamSurveillance::create([
                        'exam_id' => $examId,
                        'room_id' => $roomId,
                        'professor_id' => $profId,
                        'role' => 'Surveillant Principal',
                        'qr_token' => 'SURV-'.strtoupper(Str::random(12)),
                        'confirmed_at' => $confirmedAt,
                    ]);
                    $createdCount++;
                }

                // 2. Surveillant(s) Secondaire(s)
                $secIds = [];
                if (! empty($item['secondary_ids'])) {
                    $secIds = is_array($item['secondary_ids']) ? $item['secondary_ids'] : [$item['secondary_ids']];
                } elseif (! empty($item['secondary_id'])) {
                    $secIds = [$item['secondary_id']];
                }

                foreach ($secIds as $sId) {
                    if (! empty($sId) && (int) $sId !== (int) ($item['principal_id'] ?? 0)) {
                        $profId = (int) $sId;
                        $confirmedAt = $existingConfirmed->get("{$examId}_{$profId}")?->confirmed_at;

                        ExamSurveillance::create([
                            'exam_id' => $examId,
                            'room_id' => $roomId,
                            'professor_id' => $profId,
                            'role' => 'Surveillant Secondaire',
                            'qr_token' => 'SURV-'.strtoupper(Str::random(12)),
                            'confirmed_at' => $confirmedAt,
                        ]);
                        $createdCount++;
                    }
                }
            }

            return [
                'success' => true,
                'message' => "Affectation manuelle enregistrée avec succès ({$createdCount} créneaux pourvus).",
                'created_count' => $createdCount,
            ];
        });
    }
}
