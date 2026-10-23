<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\InternshipStatus;
use App\Helpers\ArabicGlyphReshaper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\ScheduleSoutenanceRequest;
use App\Http\Requests\Internship\ValidateInternshipRequest;
use App\Models\Internship;
use App\Models\Soutenance;
use App\Services\Academic\InternshipService;
use App\Services\Academic\SoutenanceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AdminInternshipController extends Controller
{
    public function __construct(
        private InternshipService $internshipService,
        private SoutenanceService $soutenanceService
    ) {}

    /**
     * Liste tous les stages avec relations.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Internship::class);
        abort_unless(\App\Support\InternshipAccess::staff($request->user()) || $request->user()->hasRole('scolarite'), 403);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginated = Internship::whereHas('student', fn ($q) => $q->where('institution_id', $request->user()->institution_id))->with(['student.user', 'supervisor.user', 'soutenance.room', 'internshipDocuments'])
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'internships' => $paginated->items(),
            'total' => $paginated->total(),
            'meta' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Liste des soutenances depuis la base de données.
     */
    public function getSoutenancesList(): JsonResponse
    {
        $soutenances = Soutenance::where(fn ($q) => $q->whereHas('internship.student', fn ($s) => $s->where('institution_id', request()->user()->institution_id))->orWhereHas('finalProject.student', fn ($s) => $s->where('institution_id', request()->user()->institution_id)))->when(! \App\Support\InternshipAccess::staff(request()->user()), fn ($q) => $q->where(fn ($q) => $q->where('president_id', request()->user()->professor?->id ?? -1)->orWhere('examiner_id', request()->user()->professor?->id ?? -1)->orWhere('supervisor_id', request()->user()->professor?->id ?? -1)))->with([
            'internship.student.user',
            'internship.student.pathways.filiere',
            'finalProject.student.user',
            'finalProject.student.pathways.filiere',
            'room',
            'president.user',
            'examiner.user',
            'supervisor.user',
        ])
            ->latest('date_time')->limit(250)
            ->get();

        $formatted = $soutenances->map(function ($s) {
            $student = $s->finalProject?->student ?? $s->internship?->student;
            $user = $student?->user;
            $filiere = null;
            if ($student && $student->relationLoaded('pathways')) {
                $filiere = $student->pathways->where('is_current', true)->first()?->filiere?->name;
            }
            $filiere = $filiere ?? 'Commerce & Gestion';

            $dateObj = $s->scheduled_at ?? $s->date_time;
            $dateFormatted = $dateObj ? $dateObj->translatedFormat('d F Y') : 'Non planifiée';
            $timeFormatted = $dateObj ? $dateObj->format('H:i').' - '.$dateObj->copy()->addMinutes(90)->format('H:i') : 'Non planifiée';

            return [
                'id' => $s->id,
                'student' => $user ? trim(($user->first_name ?? '').' '.($user->last_name ?? ($user->name ?? ''))) : 'Étudiant ENCG',
                'filiere' => $filiere,
                'topic' => $s->finalProject?->title ?? $s->internship?->company_name ?? 'Projet de Fin d\'Études',
                'date' => $dateFormatted,
                'time' => $timeFormatted,
                'room' => $s->room?->name ?? 'Non renseignée',
                'president' => $s->president?->user ? 'Dr. '.($s->president->user->last_name ?? $s->president->user->name) : 'Non désigné',
                'encadrant' => $s->supervisor?->user ? 'Dr. '.($s->supervisor->user->last_name ?? $s->supervisor->user->name) : 'Non désigné',
                'rapporteur' => $s->examiner?->user ? 'Dr. '.($s->examiner->user->last_name ?? $s->examiner->user->name) : 'Non désigné',
                'status' => strtoupper($s->status ?? 'SCHEDULED'),
                'score' => $s->grade !== null ? (float) $s->grade : null,
                'mention' => $s->mention,
                'internship_id' => $s->internship_id,
                'final_project_id' => $s->final_project_id,
                'room_id' => $s->room_id,
                'president_id' => $s->president_id,
                'examiner_id' => $s->examiner_id,
                'supervisor_id' => $s->supervisor_id,
                'scheduled_at' => $s->scheduled_at?->toIso8601String(),
                'date_time' => $s->date_time?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'total' => $formatted->count(),
        ]);
    }

    /**
     * Valider un stage.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $internship = Internship::findOrFail($id);
        $this->authorize('update', $internship);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', array_column(InternshipStatus::cases(), 'value'))],
        ]);

        $request->merge(['internship_id' => $id]);
        return app(\App\Http\Controllers\Api\Professor\ProfessorInternshipController::class)->updateStatus($request);


    }

    public function validateInternship(int $id, ValidateInternshipRequest $request): JsonResponse
    {
        $internship = Internship::findOrFail($id);
        $this->authorize('update', $internship);

        $internship = $this->internshipService->validateInternship(
            $id,
            $request->validated('status'),
            $request->validated('professor_supervisor_id')
        );

        return response()->json([
            'success' => true,
            'message' => 'Stage validé avec succès.',
            'internship' => $internship,
        ]);
    }

    /**
     * Planifier une soutenance.
     */
    public function scheduleSoutenance(ScheduleSoutenanceRequest $request): JsonResponse
    {
        $soutenance = $this->soutenanceService->schedule($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Soutenance planifiée avec succès.',
            'soutenance' => $soutenance,
        ], 201);
    }

    /**
     * Télécharger la convocation officielle de soutenance PFE au format PDF.
     */
    public function downloadConvocationPdf(int $id)
    {
        $s = Soutenance::with('internship.student.user', 'finalProject.student.user', 'room', 'president.user', 'examiner.user', 'supervisor.user')->findOrFail($id);
        $student = $s->internship?->student ?? $s->finalProject?->student; abort_unless($student && (int) $student->institution_id === (int) request()->user()->institution_id, 404);
        if ((int) request()->user()->student?->id !== (int) $student->id) {
            if ($s->internship) \App\Support\InternshipAccess::defense(request()->user(), $s);
            else $this->authorize('view', $s->finalProject);
        }
        abort_unless($s->status !== 'cancelled' && $s->date_time, 422, 'Soutenance annulée ou non planifiée.');
        $bytes = app(\App\Services\Document\WorkflowDocumentExportService::class)->pdf('Convocation à la soutenance', [
            'Référence' => $s->id, 'Étudiant' => $student->user->name, 'CNE' => $student->cne, 'Date et heure' => $s->date_time->format('d/m/Y H:i'),
            'Salle' => $s->room?->name, 'Présidence' => $s->president?->user?->name, 'Examinateur' => $s->examiner?->user?->name, 'Encadrant' => $s->supervisor?->user?->name], [], [], 'Convocation préparée à partir de la planification enregistrée. Toute modification doit être confirmée par le service compétent.');
        return response($bytes)->header('Content-Type', 'application/pdf')->header('Content-Disposition', 'inline; filename="Convocation_Soutenance_'.$id.'.pdf"')->header('Cache-Control', 'private, no-store');
    }    public function options(Request $request): JsonResponse
    {
        abort_unless(\App\Support\InternshipAccess::staff($request->user()), 403);
        return response()->json(['professors' => \App\Models\Professor::with('user')->where('institution_id', $request->user()->institution_id)->where('is_active', true)->get()->map(fn ($p) => ['id' => $p->id, 'name' => $p->user->name]), 'rooms' => \App\Models\Room::where('institution_id', $request->user()->institution_id)->where('is_out_of_service', false)->get(['id', 'name'])]);
    }}
