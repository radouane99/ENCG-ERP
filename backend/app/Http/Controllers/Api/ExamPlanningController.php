<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\ExamSurveillance;
use App\Models\Filiere;
use App\Models\Room;
use App\Services\Academic\ExamConvocationService;
use App\Services\Academic\ExamPlanningEngine;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamPlanningController extends Controller
{
    public function __construct(
        private ExamPlanningEngine $engine,
        private ExamConvocationService $convocationService
    ) {}

    /**
     * Générer un plan d'examen (placements + surveillance).
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id' => 'required|integer',
            'room_ids' => 'required|array',
            'room_ids.*' => 'integer',
            'professor_ids' => 'required|array',
            'professor_ids.*' => 'integer',
            'secondary_group_id' => 'nullable|integer',
        ]);

        $result = $this->engine->generatePlan(
            $validated['exam_id'],
            $validated['room_ids'],
            $validated['professor_ids'],
            $validated['secondary_group_id'] ?? null
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Détails d'un examen (placements + surveillance).
     */
    public function getDetails(int $examId): JsonResponse
    {
        return response()->json($this->convocationService->getExamDetails($examId));
    }

    /**
     * Liste des examens filtrés par filière et session.
     */
    public function index(Request $request): JsonResponse
    {
        $filiereId = $request->query('filiere_id');
        $sessionId = $request->query('session_id');

        $query = Exam::with(['module.filiere', 'group', 'room', 'examSession', 'surveillances.professor.user'])
            ->withCount('seatings');

        if ($sessionId) {
            $query->where('exam_session_id', $sessionId);
        }

        if ($filiereId) {
            $query->whereHas('module', fn ($q) => $q->where('filiere_id', $filiereId));
        }

        $exams = $query->orderBy('exam_date')->get()->map(function ($e) {
            $proctors = $e->surveillances->map(function ($s) {
                if ($s->professor && $s->professor->user) {
                    $fn = trim(($s->professor->user->first_name ?? '').' '.($s->professor->user->last_name ?? ''));
                    if (! empty($fn)) {
                        return $fn;
                    }
                }
                if ($s->professor) {
                    $fn = trim(($s->professor->first_name ?? '').' '.($s->professor->last_name ?? ''));
                    if (! empty($fn)) {
                        return $fn;
                    }
                }

                return 'Professeur';
            })->filter()->values()->toArray();

            return [
                'id' => $e->id,
                'module' => $e->module->name ?? 'N/A',
                'group' => $e->group->name ?? 'N/A',
                'date' => $e->exam_date?->format('d/m/Y'),
                'dayLabel' => $e->exam_date?->format('d') ?? '--',
                'monthLabel' => $e->exam_date?->translatedFormat('M') ?? '---',
                'dayName' => $e->exam_date?->translatedFormat('D') ?? '--',
                'sessionLabel' => $e->examSession->name ?? 'Session',
                'time' => $e->start_time ? substr($e->start_time, 0, 5) : null,
                'duration' => $e->duration_minutes.' min',
                'room' => $e->room->name ?? 'À affecter',
                'convocations_generated' => $e->seatings_count ?? 0,
                'proctors' => $proctors,
            ];
        });

        return response()->json(['data' => $exams]);
    }

    /**
     * Supprimer les examens d'une session / filière.
     */
    public function resetExams(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filiere_id' => 'nullable|integer',
            'session_id' => 'nullable|integer',
            'exam_session_id' => 'nullable|integer',
            'semester_number' => 'nullable|integer',
        ]);

        $sessionId = $validated['session_id'] ?? $validated['exam_session_id'] ?? null;
        $query = Exam::query();

        if ($sessionId) {
            $query->where('exam_session_id', $sessionId);
        }

        if (! empty($validated['filiere_id']) || ! empty($validated['semester_number'])) {
            $query->whereHas('module', function ($q) use ($validated) {
                if (! empty($validated['filiere_id'])) {
                    $q->where('filiere_id', $validated['filiere_id']);
                }
                if (! empty($validated['semester_number'])) {
                    $q->where('semester_number', $validated['semester_number']);
                }
            });
        }

        $exams = $query->get();
        $count = $exams->count();

        foreach ($exams as $exam) {
            ExamSeating::where('exam_id', $exam->id)->delete();
            ExamSurveillance::where('exam_id', $exam->id)->delete();
            $exam->delete();
        }

        return response()->json([
            'success' => true,
            'message' => $count > 0
                ? "{$count} examen(s) et leurs convocations ont été réinitialisés avec succès."
                : 'Aucun examen à réinitialiser pour les critères sélectionnés.',
            'deleted_count' => $count,
        ]);
    }

    /**
     * Auto-génération intelligente des examens.
     */
    public function autoGenerateBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filiere_id' => 'required|integer',
            'session_id' => 'nullable|integer',
            'exam_session_id' => 'nullable|integer',
            'semester_number' => 'nullable|integer',
            'modules_per_day' => 'nullable|integer|in:1,2,3',
            'day_slot_mode' => 'nullable|string|in:matin,pm,split',
            'module_ids' => 'nullable|array',
            'module_ids.*' => 'integer',
            'ordered_module_ids' => 'nullable|array',
            'ordered_module_ids.*' => 'integer',
            'start_date' => 'nullable|date',
        ]);

        $sessionId = $validated['session_id'] ?? $validated['exam_session_id'] ?? null;
        if (! $sessionId) {
            return response()->json(['success' => false, 'message' => "Session d'examen obligatoire."], 422);
        }

        $result = $this->engine->autoGenerateIntelligentBatch(
            $validated['filiere_id'],
            $sessionId,
            $validated['semester_number'] ?? null,
            $validated['modules_per_day'] ?? 1,
            $validated['day_slot_mode'] ?? 'matin',
            $validated['module_ids'] ?? $validated['ordered_module_ids'] ?? null,
            $validated['start_date'] ?? null
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Créer un examen manuellement.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|integer',
            'group_id' => 'nullable|integer',
            'room_id' => 'nullable|integer',
            'exam_date' => 'required|date',
            'start_time' => 'required|string',
            'duration_minutes' => 'required|integer',
            'session_type' => 'nullable|string',
        ]);

        $exam = Exam::create([
            'module_id' => $validated['module_id'],
            'group_id' => $validated['group_id'] ?? null,
            'room_id' => $validated['room_id'] ?? null,
            'exam_date' => $validated['exam_date'],
            'start_time' => $validated['start_time'],
            'duration_minutes' => $validated['duration_minutes'],
            'session_type' => $validated['session_type'] ?? 'normale',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Examen créé avec succès.',
            'exam' => $exam->load(['module', 'group', 'room']),
        ]);
    }

    /**
     * Vérifier les conflits de salle et de groupe.
     */
    public function checkRoomConflict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|integer',
            'group_id' => 'nullable|integer',
            'exam_date' => 'required|date',
            'start_time' => 'required|string',
            'duration_minutes' => 'required|integer',
        ]);

        // Conflit de salle
        $roomConflict = Exam::with(['module', 'room'])
            ->where('room_id', $validated['room_id'])
            ->where('exam_date', $validated['exam_date'])
            ->where('start_time', $validated['start_time'])
            ->first();

        if ($roomConflict) {
            return response()->json([
                'success' => false,
                'has_conflict' => true,
                'message' => "{$roomConflict->room->name} est déjà réservée pour {$roomConflict->module->name}.",
            ]);
        }

        // Conflit de groupe le même jour
        if (! empty($validated['group_id'])) {
            $groupConflict = Exam::with('module')
                ->where('group_id', $validated['group_id'])
                ->where('exam_date', $validated['exam_date'])
                ->first();

            if ($groupConflict) {
                return response()->json([
                    'success' => true,
                    'has_conflict' => false,
                    'warning' => "Ce groupe a déjà {$groupConflict->module->name} le même jour.",
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'has_conflict' => false,
            'message' => 'Aucun conflit détecté.',
        ]);
    }

    /**
     * Télécharger le planning des examens en PDF.
     */
    public function downloadExamTimetablePdf(Request $request)
    {
        $sessionType = strtoupper($request->query('session_type', 'NORMALE'));
        $filiereId = $request->query('filiere_id');

        $examsQuery = Exam::with(['module.filiere', 'room']);

        if ($sessionType === 'RATTRAPAGE') {
            $examsQuery->where('session_type', 'rattrapage');
        } else {
            $examsQuery->where(fn ($q) => $q->where('session_type', 'normale')->orWhereNull('session_type'));
        }

        if ($filiereId) {
            $examsQuery->whereHas('module', fn ($m) => $m->where('filiere_id', $filiereId));
        }

        $examsList = $examsQuery->orderBy('exam_date')->get()->map(fn ($e) => [
            'date' => $e->exam_date?->format('d/m/Y') ?? 'À fixer',
            'time' => $e->start_time ? substr($e->start_time, 0, 5).' ('.($e->duration_minutes ?? 120).'m)' : '—',
            'module' => $e->module->name ?? '—',
            'filiere' => $e->module->filiere->name ?? '—',
            'rooms' => $e->room->name ?? 'À affecter',
        ])->toArray();

        // Si vide, retourne un message au lieu de données mockées
        if (empty($examsList)) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun examen trouvé pour cette session.',
            ], 404);
        }

        $filiere = $filiereId ? Filiere::find($filiereId) : null;

        $pdf = Pdf::loadView('pdf.timetable', [
            'session_name' => 'SESSION '.$sessionType,
            'session_type' => $sessionType,
            'academic_year' => AcademicYear::where('is_current', true)->value('label') ?? now()->format('Y').'/'.(now()->year + 1),
            'filiere_name' => $filiere?->name ?? 'Toutes les Filières',
            'exams' => $examsList,
            'date' => now()->format('d/m/Y'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download("Planning_Examens_{$sessionType}_2026.pdf");
    }

    /**
     * Télécharger l'affiche de porte d'examen en PDF.
     */
    public function downloadDoorSignPdf(Request $request, int $examId, ?int $roomId = null)
    {
        $exam = Exam::with(['module.filiere', 'group', 'room'])->findOrFail($examId);

        $room = $roomId ? Room::find($roomId) : $exam->room;

        $seatingsQuery = ExamSeating::with(['student.user'])
            ->where('exam_id', $examId);

        if ($room && $roomId) {
            $seatingsQuery->where('room_id', $roomId);
        }

        $seatings = $seatingsQuery->orderBy('seat_number')->get()->map(fn ($s) => [
            'seat_number' => $s->seat_number,
            'full_name' => $s->student->user->name ?? 'N/A',
            'cne' => $s->student->cne ?? 'N/A',
            'cin' => $s->student->user->cin ?? 'N/A',
        ]);

        $pdf = Pdf::loadView('pdf.exam_door_sign', [
            'exam' => $exam,
            'room' => $room ?? (object) ['name' => 'Non assignée', 'code' => 'N/A'],
            'seatings' => $seatings,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Affiche_Porte_Examen_{$examId}.pdf");
    }
}
