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
}
