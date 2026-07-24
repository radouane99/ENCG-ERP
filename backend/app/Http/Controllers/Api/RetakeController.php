<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use App\Models\ResitEligibility;
use App\Mail\RattrapageDecisionMail;

class RetakeController extends Controller
{
    // ── #4 Allowed statuses ────────────────────────────────────────────────
    private const STATUSES = ['Accordé', 'Refusé', 'En attente'];

    /**
     * GET /retakes
     * Returns filtered list + stats.
     */
    public function index(Request $request): JsonResponse
    {
        $filiereId = $request->query('filiere_id');
        $sessionId = $request->query('session');
        $reason    = $request->query('reason');
        $status    = $request->query('status');

        $query = ResitEligibility::with([
            'student.user',
            'module.filiere',
            'examSession',
            'decidedBy',                   // #8 — who decided
        ]);

        if ($filiereId) {
            $query->whereHas('module', fn($q) => $q->where('filiere_id', $filiereId));
        }
        if ($sessionId && $sessionId !== 'all') {
            $query->where('exam_session_id', $sessionId);
        }
        if ($reason && $reason !== 'all') {
            $query->where('reason', 'like', '%' . $reason . '%');
        }
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $retakes = $query->get()->map(fn($item) => $this->format($item));

        $total     = $retakes->count();
        $enAttente = $retakes->where('status', 'En attente')->count();
        $accordes  = $retakes->where('status', 'Accordé')->count();
        $refuses   = $retakes->where('status', 'Refusé')->count();
        $eligibles = $retakes->where('is_eligible', true)->count();

        return response()->json([
            'success' => true,
            'data'    => $retakes->values(),
            'stats'   => compact('total', 'enAttente', 'accordes', 'refuses', 'eligibles'),
        ]);
    }

    /**
     * PATCH /retakes/{id}/status
     * Single status update + auto email.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:Accordé,Refusé,En attente',
            'note'   => 'nullable|string|max:500',
        ]);

        $retake = ResitEligibility::with(['student.user', 'module.filiere'])->findOrFail($id);

        // #8 — Record decision author + timestamp
        $retake->is_eligible = ($validated['status'] === 'Accordé');
        $retake->status      = $validated['status'];
        $retake->decided_by  = auth()->id();
        $retake->decided_at  = now();
        $retake->save();

        // #2 — Send email notification
        $this->sendDecisionEmail($retake, $validated['status'], $validated['note'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Décision enregistrée et notification envoyée.',
            'status'  => $validated['status'],
        ]);
    }

    /**
     * POST /retakes/bulk-status
     * #4 — Bulk decision for multiple students at once.
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'integer|exists:resit_eligibilities,id',
            'status' => 'required|in:Accordé,Refusé',
            'note'   => 'nullable|string|max:500',
        ]);

        $retakes = ResitEligibility::with(['student.user', 'module.filiere'])
            ->whereIn('id', $validated['ids'])
            ->get();

        foreach ($retakes as $retake) {
            $retake->is_eligible = ($validated['status'] === 'Accordé');
            $retake->status      = $validated['status'];
            $retake->decided_by  = auth()->id();
            $retake->decided_at  = now();
            $retake->save();

            $this->sendDecisionEmail($retake, $validated['status'], $validated['note'] ?? null);
        }

        return response()->json([
            'success' => true,
            'message' => count($validated['ids']) . ' décision(s) enregistrée(s) et notifications envoyées.',
            'count'   => count($validated['ids']),
        ]);
    }

    /**
     * POST /retakes/{id}/upload-justification
     * #6 — Student uploads justification document (PDF/image).
     */
    public function uploadJustification(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $retake = ResitEligibility::findOrFail($id);

        // Store the file
        $path = $request->file('document')->store('retake-justifications', 'public');

        $retake->justification_document = $path;
        // Flag for admin review
        $retake->admin_note = 'Justificatif soumis le ' . now()->format('d/m/Y à H:i');
        $retake->save();

        return response()->json([
            'success' => true,
            'message' => 'Justificatif uploadé avec succès.',
            'path'    => $path,
        ]);
    }

    /**
     * #2 — Send rattrapage decision email to student.
     */
    private function sendDecisionEmail(ResitEligibility $retake, string $status, ?string $note): void
    {
        try {
            $student = $retake->student;
            $email   = $student?->user?->email;
            if (!$email) return;

            $studentName = $student->user->name
                ?? trim(($student->last_name ?? '') . ' ' . ($student->first_name ?? ''));

            Mail::to($email)->send(new RattrapageDecisionMail(
                studentName:  $studentName,
                moduleName:   $retake->module?->name   ?? 'Module inconnu',
                filiereName:  $retake->module?->filiere?->name ?? 'Filière inconnue',
                decision:     $status,
                reason:       $retake->reason ?? 'Non spécifiée',
                decisionNote: $note,
            ));
        } catch (\Throwable $e) {
            // Log error silently — don't fail the status update
            \Illuminate\Support\Facades\Log::warning('Rattrapage email failed: ' . $e->getMessage());
        }
    }

    /**
     * Format a ResitEligibility record for the API response.
     */
    private function format(ResitEligibility $item): array
    {
        $student   = $item->student;
        $module    = $item->module;
        $lower     = strtolower($item->reason ?? '');
        $isAbsence = str_contains($lower, 'absence');
        $isFraud   = str_contains($lower, 'fraude');
        $isElim    = str_contains($lower, 'éliminatoire');

        $eligibiliteLabel = 'Éligible';
        if ($isFraud || $isElim) $eligibiliteLabel = 'Non Éligible';
        elseif ($isAbsence)      $eligibiliteLabel = 'À vérifier (Absence)';

        // #8 — Decision author
        $decidedByName = $item->decidedBy?->name ?? null;

        return [
            'id'                => $item->id,
            'student_id'        => $item->student_id,
            'nom'               => $student?->user?->name
                ?? trim(($student?->last_name ?? '') . ' ' . ($student?->first_name ?? '')),
            'email'             => $student?->user?->email ?? '',
            'cne'               => $student?->cne ?? $student?->student_number ?? 'N/A',
            'filiere'           => $module?->filiere?->name ?? 'N/A',
            'filiere_id'        => $module?->filiere_id,
            'module'            => $module?->name ?? 'N/A',
            'module_id'         => $item->module_id,
            'raison'            => $item->reason ?? 'Non spécifiée',
            'eligibilite_label' => $eligibiliteLabel,
            'status'            => $item->status ?? ($item->is_eligible ? 'En attente' : 'Refusé'),
            'is_eligible'       => (bool) $item->is_eligible,
            'date'              => $item->updated_at?->format('d/m/Y'),
            'session_label'     => $item->examSession?->name ?? 'Session Ordinaire',
            // #8 — Decision tracking
            'decided_by'        => $decidedByName,
            'decided_at'        => $item->decided_at?->format('d/m/Y H:i'),
        ];
    }
}
