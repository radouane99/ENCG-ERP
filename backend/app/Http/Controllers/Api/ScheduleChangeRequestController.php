<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ScheduleChangeRequest;

class ScheduleChangeRequestController extends Controller
{
    public function index(): JsonResponse
    {
        $requests = ScheduleChangeRequest::with(['professor', 'exam.module'])->get()->map(function ($req) {
            return [
                'id' => $req->id,
                'professor_name' => $req->professor->name ?? 'Inconnu',
                'department' => 'Génie Informatique', // Mock
                'module_name' => $req->exam->module->name ?? 'N/A',
                'old_date' => $req->old_date ? $req->old_date->format('d/m/Y') : 'N/A',
                'old_start_time' => $req->old_start_time ? substr($req->old_start_time, 0, 5) : 'N/A',
                'proposed_date' => $req->proposed_date->format('d/m/Y'),
                'proposed_start_time' => substr($req->proposed_start_time, 0, 5),
                'reason' => $req->reason,
                'status' => $req->status,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $changeRequest = ScheduleChangeRequest::findOrFail($id);
        $changeRequest->status = $validated['status'];
        $changeRequest->save();

        if ($validated['status'] === 'approved' && $changeRequest->exam_id) {
            // Update the actual exam date
            $exam = $changeRequest->exam;
            $exam->exam_date = $changeRequest->proposed_date;
            $exam->start_time = $changeRequest->proposed_start_time;
            $exam->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Demande ' . ($validated['status'] === 'approved' ? 'approuvée' : 'rejetée') . ' avec succès.'
        ]);
    }
}
