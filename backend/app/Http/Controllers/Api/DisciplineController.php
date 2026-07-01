<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DisciplinaryCase;
use App\Models\DisciplinaryDecision;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DisciplineController extends Controller
{
    public function index()
    {
        $cases = DisciplinaryCase::with(['student.user', 'decision'])->get();
        return response()->json(['success' => true, 'data' => $cases]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'institution_id' => 'required|exists:institutions,id',
            'student_id' => 'required|exists:students,id',
            'infraction_type' => 'required|string',
            'description' => 'required|string',
            'incident_date' => 'required|date',
            'reported_by_name' => 'nullable|string',
        ]);

        $validated['case_number'] = 'DC-' . date('Y') . '-' . strtoupper(Str::random(5));
        $validated['status'] = 'pending';

        $case = DisciplinaryCase::create($validated);

        return response()->json(['success' => true, 'message' => 'Cas disciplinaire créé', 'data' => $case]);
    }

    public function show($id)
    {
        $case = DisciplinaryCase::with(['student.user', 'decision.decidedBy'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $case]);
    }

    public function update(Request $request, $id)
    {
        $case = DisciplinaryCase::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'string|in:pending,under_review,decided,appealed',
            'student_statement' => 'nullable|string',
        ]);

        $case->update($validated);

        return response()->json(['success' => true, 'message' => 'Cas mis à jour', 'data' => $case]);
    }

    public function decide(Request $request, $id)
    {
        $case = DisciplinaryCase::findOrFail($id);

        $validated = $request->validate([
            'sanction_type' => 'required|string|in:warning,suspension,exclusion,none',
            'suspension_days' => 'nullable|integer',
            'decision_text' => 'required|string',
            'decision_date' => 'required|date',
        ]);

        $validated['disciplinary_case_id'] = $case->id;
        $validated['decided_by'] = auth()->id() ?? 1; // fallback for testing

        $decision = DisciplinaryDecision::create($validated);
        
        $case->update(['status' => 'decided']);

        return response()->json(['success' => true, 'message' => 'Décision enregistrée', 'data' => $decision]);
    }
}
