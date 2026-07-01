<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use Illuminate\Http\Request;

class InternshipController extends Controller
{
    public function index()
    {
        $internships = Internship::with('student.user')->get();
        return response()->json(['success' => true, 'data' => $internships]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'institution_id' => 'required|exists:institutions,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'student_id' => 'required|exists:students,id',
            'type' => 'required|string',
            'company_name' => 'required|string|max:255',
            'position_title' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'supervisor_name' => 'nullable|string|max:255',
        ]);

        $internship = Internship::create($validated);

        return response()->json(['success' => true, 'message' => 'Stage enregistré', 'data' => $internship]);
    }

    public function show($id)
    {
        $internship = Internship::with('student.user')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $internship]);
    }

    public function update(Request $request, $id)
    {
        $internship = Internship::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'string|in:pending,active,completed,cancelled',
            'agreement_file_path' => 'nullable|string',
        ]);

        $internship->update($validated);

        return response()->json(['success' => true, 'message' => 'Stage mis à jour', 'data' => $internship]);
    }
}
