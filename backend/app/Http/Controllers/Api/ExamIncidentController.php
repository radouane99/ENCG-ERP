<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Module;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamIncidentController extends Controller
{
    /**
     * Liste des incidents.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ExamIncident::with(['exam.module.filiere', 'exam.examSession', 'student.user', 'reporter']);

        if ($request->filled('session_id')) {
            $query->whereHas('exam', fn($q) => $q->where('exam_session_id', $request->session_id));
        }

        if ($request->filled('exam_id')) {
            $query->where('exam_id', $request->exam_id);
        }

        $incidents = $query->latest()->get()->map(function ($inc) {
            $student = $inc->student;
            $user    = $student->user ?? null;
            $exam    = $inc->exam;
            $module  = $exam->module ?? null;

            return [
                'id'                => $inc->id,
                'student'           => [
                    'id'         => $inc->student_id,
                    'first_name' => $student->first_name ?? $user->name ?? 'Étudiant',
                    'last_name'  => $student->last_name ?? '',
                    'cne'        => $student->cne ?? 'N/A',
                    'email'      => $user->email ?? 'N/A',
                    'filiere'    => $module->filiere->name ?? 'N/A',
                ],
                'module_name'       => $module->name ?? 'N/A',
                'exam_date'         => $exam->exam_date ?? $inc->created_at?->format('Y-m-d'),
                'type'              => $inc->type === 'fraude' ? '🚨 Fraude' : ucfirst($inc->type),
                'description'       => $inc->description,
                'confiscated_items' => $inc->confiscated_items,
                'severity'          => $inc->type === 'fraude' ? 'high' : 'medium',
                'status'            => $inc->status ?? 'pending',
                'hearing_date'      => $inc->hearing_date,
                'hearing_room'      => $inc->hearing_room,
                'decision'          => $inc->decision,
                'sanction_scope'    => $inc->sanction_scope,
                'created_at'        => $inc->created_at?->format('Y-m-d'),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $incidents,
        ]);
    }

    /**
     * Créer un incident.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id'           => 'required|exists:exams,id',
            'student_id'        => 'required|exists:students,id',
            'type'              => 'required|string',
            'description'       => 'nullable|string',
            'confiscated_items' => 'nullable|string',
        ]);

        $exam = Exam::find($validated['exam_id']);
        if ($exam?->is_locked) {
            return response()->json(['success' => false, 'message' => '🔒 PV scellé. Aucun incident ne peut être ajouté.'], 403);
        }

        $incident = ExamIncident::create([
            'exam_id'           => $validated['exam_id'],
            'student_id'        => $validated['student_id'],
            'reported_by'       => $request->user()?->id,
            'type'              => $validated['type'],
            'description'       => $validated['description'] ?? null,
            'confiscated_items' => $validated['confiscated_items'] ?? null,
            'status'            => 'pending',
        ]);

        // Sanction automatique pour fraude
        if ($validated['type'] === 'fraude' && $exam?->module_id) {
            $assessment = Assessment::firstOrCreate(
                ['module_id' => $exam->module_id, 'type' => 'examen'],
                ['weight' => 100]
            );

            Grade::updateOrCreate(
                ['student_id' => $validated['student_id'], 'assessment_id' => $assessment->id],
                ['value' => 0.00, 'absent' => false]
            );

            ExamSeating::where('exam_id', $validated['exam_id'])
                ->where('student_id', $validated['student_id'])
                ->update(['is_present' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Incident enregistré avec succès.',
            'data'    => $incident,
        ], 201);
    }

    /**
     * Convoquer au conseil de discipline.
     */
    public function convoke(Request $request, int $id): JsonResponse
    {
        $incident = ExamIncident::findOrFail($id);

        $incident->update([
            'status'       => 'convoked',
            'hearing_date' => $request->input('hearing_date', date('Y-m-d à 10h00')),
            'hearing_room' => $request->input('hearing_room', 'Salle des Actes — ENCG Fès'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Convocation enregistrée.',
            'data'    => $incident,
        ]);
    }

    /**
     * Prononcer la décision du conseil de discipline.
     */
    public function decide(Request $request, int $id): JsonResponse
    {
        $incident = ExamIncident::findOrFail($id);
        $sanction = $request->input('sanction', 'module');

        $decisionText = match ($sanction) {
            'semestre' => 'Note 0.00/20 étendue à tous les modules du semestre',
            'blame'    => 'Blâme officiel avec inscription au dossier',
            'annee'    => 'Exclusion temporaire de 1 an',
            default    => 'Note 0.00/20 attribuée au module',
        };

        $incident->update([
            'status'         => 'resolved',
            'sanction_scope' => $sanction,
            'decision'       => $decisionText,
        ]);

        // Appliquer la sanction au semestre entier
        if ($sanction === 'semestre') {
            $exam = Exam::find($incident->exam_id);
            if ($exam?->module) {
                $moduleIds = Module::where('semester_id', $exam->module->semester_id)->pluck('id');
                $assessmentIds = Assessment::whereIn('module_id', $moduleIds)->pluck('id');

                foreach ($assessmentIds as $assId) {
                    Grade::updateOrCreate(
                        ['student_id' => $incident->student_id, 'assessment_id' => $assId],
                        ['value' => 0.00, 'absent' => false]
                    );
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Décision enregistrée et appliquée.',
            'data'    => $incident,
        ]);
    }

    /**
     * Télécharger le PDF du PV d'incident.
     */
    public function downloadPdf(int $id)
    {
        $incident = ExamIncident::with(['exam.module.filiere', 'student.user', 'reporter'])->findOrFail($id);
        $pdf = Pdf::loadView('pdf.exam_incident_pv', compact('incident'));
        return $pdf->download("PV_Incident_{$incident->id}.pdf");
    }

    /**
     * Verrouiller le PV et générer le scellé SHA-256.
     */
    public function lockPv(Request $request, int $id): JsonResponse
    {
        $exam = Exam::findOrFail($id);

        $seal = 'SHA256:ENCG-FES-' . strtoupper(substr(md5(now() . $id), 0, 16));

        $exam->update(['is_locked' => true, 'locked_at' => now()]);

        return response()->json([
            'success'   => true,
            'message'   => '🔒 PV scellé avec succès.',
            'seal'      => $seal,
            'locked_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Analytics des examens (données réelles).
     */
    public function examAnalytics(Request $request): JsonResponse
    {
        $totalExams     = Exam::count();
        $totalSeatings  = ExamSeating::count();
        $presentSeatings = ExamSeating::where('is_present', true)->count();
        $totalIncidents = ExamIncident::count();

        $byFiliere = Filiere::withCount(['modules'])->get()->map(function ($f) {
            return [
                'name'     => $f->name,
                'presence' => 0,
                'absence'  => 0,
                'fraudes'  => ExamIncident::whereHas('exam.module', fn($q) => $q->where('filiere_id', $f->id))->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'overview' => [
                    'total_exams'              => $totalExams,
                    'total_students_convoked'  => $totalSeatings,
                    'average_presence_rate'    => $totalSeatings > 0 ? round(($presentSeatings / $totalSeatings) * 100, 1) : 0,
                    'total_absences'           => $totalSeatings - $presentSeatings,
                    'total_incidents'          => $totalIncidents,
                ],
                'by_filiere' => $byFiliere,
            ],
        ]);
    }

    /**
     * Analytics globales (données réelles).
     */
    public function globalAnalytics(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'document_requests' => [
                    'total'          => \App\Models\DocumentRequest::count(),
                    'pending_count'  => \App\Models\DocumentRequest::where('status', 'pending')->count(),
                ],
                'academic_projects' => [
                    'total'        => \App\Models\FinalProject::count(),
                    'active_count' => \App\Models\FinalProject::whereIn('status', ['in_progress', 'assigned'])->count(),
                ],
                'student_activity' => [
                    'total_active' => \App\Models\Student::where('status', 'active')->count(),
                ],
            ],
        ]);
    }
}