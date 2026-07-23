<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index()
    {
        $complaints = Complaint::with(['student.user', 'handler'])->get();
        return response()->json(['success' => true, 'data' => $complaints]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|string',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $complaint = Complaint::create($validated);

        return response()->json(['success' => true, 'message' => 'Réclamation envoyée', 'data' => $complaint]);
    }

    public function show($id)
    {
        $complaint = Complaint::with(['student.user', 'handler'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $complaint]);
    }

    public function update(Request $request, $id)
    {
        $complaint = Complaint::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'string|in:pending,investigating,resolved,closed',
            'admin_response' => 'nullable|string',
        ]);
        
        $validated['handled_by'] = auth()->id();

        $complaint->update($validated);

        return response()->json(['success' => true, 'message' => 'Réclamation traitée', 'data' => $complaint]);
    }

    /**
     * Submit a Grade Appeal (Réclamation de Note) by Student.
     */
    public function submitGradeAppeal(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'assessment_id' => 'required|exists:assessments,id',
            'grade_id' => 'nullable|exists:grades,id',
            'reason' => 'required|string|max:1000',
        ]);

        $existingGrade = \App\Models\Grade::where('student_id', $validated['student_id'])
            ->where('assessment_id', $validated['assessment_id'])
            ->first();

        $oldGrade = $existingGrade ? $existingGrade->value : 0.00;

        $appealId = \Illuminate\Support\Facades\DB::table('grade_appeals')->insertGetId([
            'student_id' => $validated['student_id'],
            'assessment_id' => $validated['assessment_id'],
            'grade_id' => $existingGrade?->id ?? null,
            'reason' => $validated['reason'],
            'status' => 'pending',
            'old_grade' => $oldGrade,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Réclamation de note transmise au professeur avec succès.',
            'appeal_id' => $appealId,
        ], 201);
    }

    /**
     * List Grade Appeals for Student or Professor.
     */
    public function listGradeAppeals(Request $request)
    {
        $query = \Illuminate\Support\Facades\DB::table('grade_appeals')
            ->join('students', 'grade_appeals.student_id', '=', 'students.id')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->join('assessments', 'grade_appeals.assessment_id', '=', 'assessments.id')
            ->join('modules', 'assessments.module_id', '=', 'modules.id')
            ->select(
                'grade_appeals.*',
                'users.name as student_name',
                'students.cne',
                'assessments.type as assessment_type',
                'modules.name as module_name'
            );

        if ($request->has('student_id')) {
            $query->where('grade_appeals.student_id', $request->student_id);
        }

        $appeals = $query->orderBy('grade_appeals.created_at', 'desc')->get();

        return response()->json(['success' => true, 'data' => $appeals]);
    }

    /**
     * Resolve a Grade Appeal (Approve/Reject) by Professor or Admin.
     */
    public function resolveGradeAppeal(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected,under_review',
            'new_grade' => 'required_if:status,approved|nullable|numeric|min:0|max:20',
            'professor_notes' => 'nullable|string',
        ]);

        $appeal = \Illuminate\Support\Facades\DB::table('grade_appeals')->where('id', $id)->first();
        if (! $appeal) {
            return response()->json(['success' => false, 'message' => 'Réclamation introuvable.'], 404);
        }

        \Illuminate\Support\Facades\DB::table('grade_appeals')->where('id', $id)->update([
            'status' => $validated['status'],
            'new_grade' => $validated['status'] === 'approved' ? $validated['new_grade'] : null,
            'professor_notes' => $validated['professor_notes'] ?? null,
            'resolved_at' => now(),
            'updated_at' => now(),
        ]);

        // If approved, update official Grade table automatically
        if ($validated['status'] === 'approved') {
            \App\Models\Grade::updateOrCreate(
                [
                    'student_id' => $appeal->student_id,
                    'assessment_id' => $appeal->assessment_id,
                ],
                [
                    'value' => $validated['new_grade'],
                    'absent' => false,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => $validated['status'] === 'approved'
                ? 'Réclamation approuvée et note révisée automatiquement.'
                : 'Réclamation clôturée avec justification.',
        ]);
    }
}
