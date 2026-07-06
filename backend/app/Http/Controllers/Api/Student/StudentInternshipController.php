<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\ApplyInternshipRequest;
use App\Http\Requests\Internship\UploadInternshipDocumentRequest;
use App\Services\Academic\InternshipService;
use App\Models\Internship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentInternshipController extends Controller
{
    public function __construct(private InternshipService $internshipService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $internships = Internship::where('student_id', $request->user()->id)
            ->with(['internshipDocuments'])
            ->get();

        return response()->json(['internships' => $internships]);
    }

    public function store(ApplyInternshipRequest $request): JsonResponse
    {
        $internship = $this->internshipService->submitApplication(
            $request->validated(),
            $request->user()->id
        );

        return response()->json([
            'message' => 'Internship application submitted successfully',
            'internship' => $internship
        ], 201);
    }

    public function uploadDocument(int $internshipId, UploadInternshipDocumentRequest $request): JsonResponse
    {
        $document = $this->internshipService->uploadDocument(
            $internshipId,
            $request->validated('document_type'),
            $request->file('file')
        );

        return response()->json([
            'message' => 'Document uploaded successfully',
            'document' => $document
        ], 201);
    }
}
