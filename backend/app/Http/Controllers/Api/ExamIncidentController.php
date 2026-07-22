<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ExamIncident;

class ExamIncidentController extends Controller
{
    /**
     * Display a listing of the incidents, optionally filtered by session or exam.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ExamIncident::with(['exam.module', 'exam.session', 'student.user', 'reporter']);

        if ($request->has('session_id')) {
            $query->whereHas('exam', function ($q) use ($request) {
                $q->where('exam_session_id', $request->session_id);
            });
        }

        if ($request->has('exam_id')) {
            $query->where('exam_id', $request->exam_id);
        }

        $incidents = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $incidents
        ]);
    }

    /**
     * Store a newly created incident in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'student_id' => 'required|exists:students,id',
            'type' => 'required|string|in:retard,fraude,absence_injustifiee,autre',
            'description' => 'nullable|string'
        ]);

        $incident = ExamIncident::create([
            'exam_id' => $validated['exam_id'],
            'student_id' => $validated['student_id'],
            'reported_by' => $request->user()->id ?? null,
            'type' => $validated['type'],
            'description' => $validated['description']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Incident enregistré avec succès.',
            'data' => $incident
        ], 201);
    }

    /**
     * Download official PDF Procès-Verbal for an incident.
     */
    public function downloadPdf(int $id)
    {
        $incident = ExamIncident::with(['exam.module.filiere', 'student.user', 'reporter'])->findOrFail($id);
        
        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.pv_incident', [
            'incident_id' => $incident->id,
            'incident_type' => $incident->type,
            'incident_date' => $incident->created_at ? $incident->created_at->format('d/m/Y H:i') : date('d/m/Y H:i'),
            'student_name' => $incident->student?->user?->name ?? 'N/A',
            'cne' => $incident->student?->cne ?? 'N/A',
            'cin' => $incident->student?->cin ?? $incident->student?->user?->cin ?? 'N/A',
            'filiere_name' => $incident->exam?->module?->filiere?->name ?? 'Tronc Commun',
            'seat_number' => 'Assigné',
            'module_name' => $incident->exam?->module?->name ?? 'N/A',
            'room_name' => 'Salle d\'Examen',
            'exam_date' => $incident->exam?->exam_date ? \Carbon\Carbon::parse($incident->exam->exam_date)->format('d/m/Y') : date('d/m/Y'),
            'exam_time' => $incident->exam?->start_time ?? '09:00',
            'professor_name' => $incident->reporter?->name ?? 'Surveillant Responsable',
            'description' => $incident->description,
            'logoBase64' => $logoBase64,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("PV_Incident_{$incident->id}.pdf");
    }
}
