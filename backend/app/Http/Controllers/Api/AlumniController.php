<?php

namespace App\Http\Controllers\Api;

use App\Actions\Academic\FinalizeGraduationAction;
use App\Http\Controllers\Controller;
use App\Models\DeliberationDecision;
use App\Models\Student;
use App\Services\Academic\AlumniService;
use App\Support\AdmissionAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniController extends Controller
{
    public function graduationCandidates(Request $request): JsonResponse
    {
        abort_unless(AdmissionAccess::staff($request->user()) || $request->user()->hasRole('pedagogy_officer'), 403);
        $rows = DeliberationDecision::with('student.user', 'deliberation.filiere', 'deliberation.academicYear')
            ->whereIn('decision', ['DIPLOME', 'graduated', 'admitted', 'V', 'V.Comp'])
            ->whereHas('deliberation', fn ($q) => $q->where('institution_id', $request->user()->institution_id)->where('is_sealed', true)->whereIn('type', ['annual', 'annuel']))
            ->whereHas('student', fn ($q) => $q->where('institution_id', $request->user()->institution_id)->where('status', '!=', 'graduated'))
            ->whereExists(function ($q) {
                $q->selectRaw('1')->from('student_pathways as p')->join('filieres as f', 'f.id', '=', 'p.filiere_id')
                    ->join('deliberations as d', 'd.id', '=', 'deliberation_decisions.deliberation_id')
                    ->whereColumn('p.student_id', 'deliberation_decisions.student_id')->where('p.is_current', true)
                    ->whereColumn('p.academic_year_id', 'd.academic_year_id')->whereColumn('p.filiere_id', 'd.filiere_id')
                    ->whereRaw("(2 * CEIL(p.current_semester / 2.0)) = CASE WHEN LOWER(TRIM(f.type)) IN ('grande_ecole', 'formation_initiale') THEN 10 ELSE f.duration_years * 2 END");
            })->orderByDesc('id')->paginate(25);
        $rows->getCollection()->transform(fn ($row) => ['decision_id' => $row->id, 'name' => $row->student?->user?->name,
            'filiere' => $row->deliberation?->filiere?->name, 'academic_year' => $row->deliberation?->academicYear?->label, 'decision' => $row->decision]);

        return response()->json($rows);
    }

    public function finalizeGraduation(Request $request): JsonResponse
    {
        $data = $request->validate(['decision_id' => 'required|integer|min:1']);
        $student = app(FinalizeGraduationAction::class)->execute($request->user(), $data['decision_id']);

        return response()->json(['message' => 'Diplomation enregistrée. Le lauréat figure au registre.', 'student_id' => $student->id]);
    }

    public function graduates(Request $request): JsonResponse
    {
        abort_unless(AdmissionAccess::staff($request->user()) || $request->user()->hasRole('pedagogy_officer'), 403);
        $filters = $request->validate(['search' => 'nullable|string|max:100', 'page' => 'nullable|integer|min:1']);
        $query = Student::with('user', 'latestPathway.filiere', 'latestPathway.academicYear', 'graduations')
            ->where('institution_id', $request->user()->institution_id)
            ->where(fn ($q) => $q->where('status', 'graduated')->orWhereHas('graduations'));
        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $query->where(fn ($q) => $q->where('cne', 'like', $term)->orWhere('student_number', 'like', $term)
                ->orWhereHas('user', fn ($u) => $u->where('first_name', 'like', $term)->orWhere('last_name', 'like', $term)));
        }
        $rows = $query->orderBy('id')->paginate(25);
        $rows->getCollection()->transform(fn ($student) => [
            'id' => $student->id, 'name' => $student->user?->name, 'cne' => $student->cne,
            'filiere' => $student->graduations->isNotEmpty() ? $student->graduations->pluck('filiere_name')->unique()->implode(' · ') : $student->latestPathway?->filiere?->name,
            'academic_year' => $student->graduations->isNotEmpty() ? $student->graduations->pluck('academic_year_label')->unique()->implode(' · ') : $student->latestPathway?->academicYear?->label,
            'graduations' => $student->graduations->map(fn ($g) => $g->only(['filiere_name', 'academic_year_label', 'finalized_at', 'deliberation_decision_id'])),
            'status' => 'graduated',
        ]);

        return response()->json($rows);
    }

    public function __construct(
        private AlumniService $alumniService
    ) {}

    /**
     * Statistiques du tableau de bord Alumni.
     */
    public function getDashboardStats(): JsonResponse
    {
        $stats = $this->alumniService->getDashboardStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Annuaire des Alumni.
     */
    public function index(Request $request): JsonResponse
    {
        $directory = $this->alumniService->getAlumniDirectory($request->all());

        return response()->json([
            'success' => true,
            'data' => $directory,
        ]);
    }
}
