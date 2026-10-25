<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ExamIncident;
use App\Models\ExamSession;
use App\Models\Institution;
use App\Models\Semester;
use App\Services\Academic\ExamSessionReadinessService;
use App\Services\Academic\ExamWorkflowGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExamSessionController extends Controller
{
    public function readiness(ExamSession $examSession): JsonResponse
    {
        app(ExamWorkflowGuard::class)->manage();

        return response()->json(['success' => true, 'data' => app(ExamSessionReadinessService::class)->inspect($examSession)]);
    }

    /**
     * Liste des sessions d'examen.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ExamSession::with(['academicYear', 'semester'])->withCount('exams')
            ->where('institution_id', $request->user()->institution_id);
        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->integer('academic_year_id'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $sessions = $query->latest()->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'type' => $s->type,
            'start_date' => $s->start_date?->format('Y-m-d'),
            'end_date' => $s->end_date?->format('Y-m-d'),
            'is_active' => $s->is_active,
            'is_locked' => $s->is_locked,
            'academic_year' => $s->academicYear?->label ?? '—',
            'semester' => $s->semester?->name ?? '—',
            'academic_year_id' => $s->academic_year_id,
            'semester_id' => $s->semester_id,
            'exams_count' => $s->exams_count,
        ]);

        return response()->json([
            'success' => true,
            'data' => $sessions,
            'stats' => [
                'total' => $sessions->count(),
                'active' => $sessions->where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * Créer une session d'examen.
     */
    public function store(Request $request): JsonResponse
    {
        app(ExamWorkflowGuard::class)->manage();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'academic_year_id' => 'required|exists:academic_years,id',
            'semester_id' => 'required|exists:semesters,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $validated['institution_id'] = $request->user()->institution_id;
        $this->validateContext($validated);
        $session = DB::transaction(function () use ($validated) {
            Institution::whereKey($validated['institution_id'])->lockForUpdate()->firstOrFail();
            if (! empty($validated['is_active'])) {
                ExamSession::where('institution_id', $validated['institution_id'])->where('academic_year_id', $validated['academic_year_id'])->update(['is_active' => false]);
            }

            return ExamSession::create($validated);
        });

        return response()->json([
            'success' => true,
            'message' => 'Session d\'examen créée avec succès.',
            'data' => $session,
        ], 201);
    }

    /**
     * Mettre à jour une session d'examen.
     */
    public function update(Request $request, ExamSession $examSession): JsonResponse
    {
        $guard = app(ExamWorkflowGuard::class);
        $guard->manage();
        $guard->session($examSession);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|max:50',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'boolean',
            'is_locked' => 'boolean',
        ]);

        $examSession = DB::transaction(function () use ($examSession, $validated) {
            Institution::whereKey($examSession->institution_id)->lockForUpdate()->firstOrFail();
            $session = ExamSession::whereKey($examSession->id)->lockForUpdate()->firstOrFail();
            if ($session->is_locked) {
                abort_unless(array_keys($validated) === ['is_locked'] && $validated['is_locked'] === false, 409, 'Déverrouiller explicitement la session avant modification.');
            }
            $next = array_merge($session->toArray(), $validated);
            $this->validateContext($next);
            if (! empty($validated['is_locked'])) {
                abort_if($session->exams()->where('is_locked', false)->exists(), 422, 'Clôturer tous les PV d’épreuve avant de verrouiller la session.');
                abort_if(ExamIncident::whereHas('exam', fn ($q) => $q->where('exam_session_id', $session->id))->whereNotIn('status', ['resolved', 'dismissed'])->exists(), 422, 'Traiter les dossiers disciplinaires avant la clôture de session.');
                $validated['is_active'] = false;
            }
            if ($session->exams()->exists()) {
                foreach (['academic_year_id', 'semester_id', 'type'] as $field) {
                    abort_if(isset($validated[$field]) && (string) $validated[$field] !== (string) $session->$field, 409, 'Le contexte des épreuves existantes doit être conservé.');
                }
                abort_if($session->exams()->where(fn ($q) => $q->whereDate('exam_date', '<', $next['start_date'])->orWhereDate('exam_date', '>', $next['end_date']))->exists(), 422, 'La période doit contenir toutes les épreuves existantes.');
            }
            if (! empty($validated['is_active'])) {
                abort_if(! empty($next['is_locked']), 409, 'Une session verrouillée ne peut pas être ouverte.');
                ExamSession::where('institution_id', $session->institution_id)->where('academic_year_id', $next['academic_year_id'])->whereKeyNot($session->id)->update(['is_active' => false]);
            }
            $session->update($validated);

            return $session;
        });

        return response()->json([
            'success' => true,
            'message' => 'Session d\'examen mise à jour.',
            'data' => $examSession,
        ]);
    }

    /**
     * Supprimer une session d'examen.
     */
    public function destroy(ExamSession $examSession): JsonResponse
    {
        app(ExamWorkflowGuard::class)->manage();
        app(ExamWorkflowGuard::class)->session($examSession);
        if ($examSession->is_locked) {
            return response()->json(['success' => false, 'message' => 'Impossible de supprimer une session verrouillée.'], 403);
        }

        DB::transaction(function () use ($examSession) {
            $session = ExamSession::whereKey($examSession->id)->lockForUpdate()->firstOrFail();
            abort_if($session->is_locked || $session->exams()->exists(), 409, 'Une session contenant des épreuves doit être conservée.');
            $session->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Session d\'examen supprimée.',
        ]);
    }

    private function validateContext(array $data): void
    {
        $year = AcademicYear::where('institution_id', $data['institution_id'])->findOrFail($data['academic_year_id']);
        $semester = Semester::findOrFail($data['semester_id']);
        if ((int) $semester->academic_year_id !== (int) $year->id) {
            throw ValidationException::withMessages(['semester_id' => "Le semestre doit appartenir à l'année sélectionnée."]);
        }
        if (empty($data['start_date']) || empty($data['end_date']) || substr($data['end_date'], 0, 10) < substr($data['start_date'], 0, 10)) {
            throw ValidationException::withMessages(['end_date' => 'Période de session invalide.']);
        }
    }
}
