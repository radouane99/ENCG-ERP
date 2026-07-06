<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Convocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentConvocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Only return non-draft convocations to students
        $convocations = Convocation::where('student_id', $request->user()->id)
            ->whereIn('status', ['sent', 'viewed', 'printed'])
            ->with(['exam.module', 'room'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['convocations' => $convocations]);
    }

    public function download(int $id, Request $request): JsonResponse
    {
        $convocation = Convocation::where('id', $id)
            ->where('student_id', $request->user()->id)
            ->firstOrFail();

        // Mark as viewed if it's the first time
        if ($convocation->status === 'sent') {
            $convocation->update(['status' => 'viewed']);
        }

        // Logic to generate and stream PDF
        // In this MVP, we return a mock URL.
        return response()->json([
            'pdf_url' => "/academic/convocations/student/{$convocation->id}/print"
        ]);
    }
}
