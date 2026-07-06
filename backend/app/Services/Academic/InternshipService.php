<?php

namespace App\Services\Academic;

use App\Models\Internship;
use App\Models\InternshipDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class InternshipService
{
    /**
     * Submit a new internship application.
     */
    public function submitApplication(array $data, int $studentId): Internship
    {
        // Enforce basic student ID internally
        $data['student_id'] = $studentId;
        $data['status'] = 'pending';
        
        return Internship::create($data);
    }

    /**
     * Upload an internship document (e.g. final report).
     */
    public function uploadDocument(int $internshipId, string $documentType, UploadedFile $file): InternshipDocument
    {
        $path = $file->store("internships/{$internshipId}/{$documentType}", 'public');

        return InternshipDocument::create([
            'internship_id' => $internshipId,
            'document_type' => $documentType,
            'file_path' => $path,
            'status' => 'pending'
        ]);
    }

    /**
     * Validate an internship application (Admin).
     */
    public function validateInternship(int $internshipId, string $status, ?int $professorSupervisorId = null): Internship
    {
        $internship = Internship::findOrFail($internshipId);
        
        $internship->status = $status;
        if ($professorSupervisorId) {
            $internship->professor_supervisor_id = $professorSupervisorId;
        }
        
        $internship->save();
        return $internship;
    }
}
