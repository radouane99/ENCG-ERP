<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Professor;
use App\Models\ScheduleChangeRequest;
use App\Notifications\SystemNotification;
use App\Support\InternshipAccess;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleChangeRequestController extends Controller
{
    /**
     * Liste des demandes de changement.
     */
    public function index(): JsonResponse
    {
        $requests = ScheduleChangeRequest::whereHas('professor', fn ($q) => $q->where('institution_id', request()->user()->institution_id))->when(! InternshipAccess::staff(request()->user()), fn ($q) => $q->where('professor_id', request()->user()->id))->with(['professor.professor.department', 'exam.module'])->latest()->limit(200)
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'professor_name' => $req->professor->name ?? 'Inconnu',
                    'department' => $req->professor->professor?->department?->name ?? 'Inconnu',
                    'module_name' => $req->exam->module->name ?? 'N/A',
                    'old_date' => $req->old_date?->format('d/m/Y') ?? 'N/A',
                    'old_start_time' => $req->old_start_time ? substr($req->old_start_time, 0, 5) : 'N/A',
                    'proposed_date' => $req->proposed_date?->format('d/m/Y'),
                    'proposed_start_time' => $req->proposed_start_time ? substr($req->proposed_start_time, 0, 5) : 'N/A',
                    'reason' => $req->reason,
                    'status' => $req->status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Enregistrement d'un rapport groupé de conflits d'horaires transmis par un enseignant.
     */
    public function storeBatchReport(Request $request): JsonResponse
    {
        $data = $request->validate(['summary' => 'required|string|min:10|max:10000', 'total_count' => 'required|integer|min:1|max:10000']);
        abort_unless($request->user()->professor || InternshipAccess::staff($request->user()), 403);
        $record = ScheduleChangeRequest::create(['professor_id' => $request->user()->id, 'request_type' => 'conflict_report', 'reason' => 'Rapport de '.$data['total_count'].' conflit(s) : '.$data['summary'], 'status' => 'pending']);
        activity()->causedBy($request->user())->performedOn($record)->log('schedule_conflicts_reported');

        return response()->json(['success' => true, 'message' => 'Rapport enregistré pour examen par le service des emplois du temps.', 'data' => $record], 201);
    }

    /**
     * Approuver ou rejeter une demande.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        abort_unless(InternshipAccess::staff($request->user()), 403);
        $data = $request->validate(['status' => 'required|in:approved,rejected']);
        DB::transaction(function () use ($request, $id, $data) {
            $change = ScheduleChangeRequest::whereHas('professor', fn ($q) => $q->where('institution_id', $request->user()->institution_id))->whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless($change->status === 'pending', 409, 'Demande déjà traitée.');
            if ($data['status'] === 'approved' && $change->exam_id) {
                $exam = Exam::whereKey($change->exam_id)->lockForUpdate()->firstOrFail();
                abort_unless($change->proposed_date && $change->proposed_start_time && $exam->exam_date?->format('Y-m-d') === Carbon::parse($change->proposed_date)->format('Y-m-d') && substr($exam->start_time, 0, 5) === substr($change->proposed_start_time, 0, 5), 422, 'Replanifiez l’examen dans le module Examens avec contrôle des conflits avant de clôturer cette demande.');
            }
            $change->update(['status' => $data['status']]);
            $change->professor->notifyNow(new SystemNotification('Suivi de votre demande d’horaire', 'Votre demande a été '.($data['status'] === 'approved' ? 'acceptée pour traitement' : 'rejetée').'. Consultez le service des emplois du temps.', 'info', '/professor/schedule'), ['database']);
            activity()->causedBy($request->user())->performedOn($change)->log('schedule_change_reviewed');
        });

        return response()->json(['success' => true, 'message' => 'Décision enregistrée et notification déposée dans l’espace enseignant.']);
    }

    /**
     * Suggérer des professeurs remplaçants.
     */
    public function suggestSubstitutes(Request $request): JsonResponse
    {
        $departmentId = $request->query('department_id');

        $professors = Professor::with('user')
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->take(5)
            ->get()
            ->map(fn ($prof) => [
                'id' => $prof->id,
                'name' => $prof->user?->name ?? "{$prof->first_name} {$prof->last_name}",
                'specialty' => $prof->specialty ?? 'Non défini',
                'available' => true,
                'contact' => $prof->email ?? 'N/A',
            ]);

        return response()->json([
            'success' => true,
            'substitutes' => $professors,
        ]);
    }
}
