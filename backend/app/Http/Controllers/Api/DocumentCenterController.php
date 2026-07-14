<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Student;
use Illuminate\Support\Str;

class DocumentCenterController extends Controller
{
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'document_type' => 'required|string',
        ]);

        $student = Student::with('user')->findOrFail($validated['student_id']);
        $token = Str::random(32); // Generate a fake cryptographic token for verification

        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'Document généré avec succès',
                'document_type' => $validated['document_type'],
                'student_name' => trim(($student->user->first_name ?? '') . ' ' . ($student->user->last_name ?? '')),
                'verification_token' => $token,
                'created_at' => now()->toIso8601String(),
            ]
        ]);
    }
}
