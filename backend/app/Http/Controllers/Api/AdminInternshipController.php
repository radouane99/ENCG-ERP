<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Internship;

class AdminInternshipController extends Controller
{
    public function index()
    {
        $internships = Internship::with('student')->get();
        
        $data = $internships->map(function($i) {
            return [
                'id' => $i->id,
                'student' => $i->student ? [
                    'first_name' => $i->student->user->first_name ?? '',
                    'last_name' => $i->student->user->last_name ?? '',
                    'cne' => $i->student->cne
                ] : null,
                'title' => $i->title ?? 'Stage',
                'company' => $i->company_name ?? 'Entreprise',
                'start_date' => $i->start_date ? $i->start_date->format('Y-m-d') : null,
                'end_date' => $i->end_date ? $i->end_date->format('Y-m-d') : null,
                'status' => $i->status->value ?? 'pending',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $internship = Internship::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'required|string'
        ]);

        $internship->update([
            'status' => $validated['status']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour',
            'data' => $internship
        ]);
    }
}
