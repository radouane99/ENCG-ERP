<?php

namespace App\Services\Academic;

use App\Models\Internship;
use App\Models\InternshipDocument;
use Illuminate\Http\UploadedFile;

class InternshipService
{
    /**
     * Submit a new internship application.
     */
    public function submitApplication(array $data, int $studentId): Internship
    {
        $data['student_id'] = $studentId;
        $data['status'] = 'pending';

        return Internship::create($data);
    }

    /**
     * Upload an internship document (e.g. final report).
     */
    public function uploadDocument(int $internshipId, string $documentType, UploadedFile $file): InternshipDocument
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($internshipId, $documentType, $file) {
            $document = InternshipDocument::create(['internship_id' => $internshipId, 'document_type' => $documentType, 'status' => 'pending']);
            $document->addMedia($file)->toMediaCollection('internship_documents', 'private');
            return $document;
        });
    }

    /**
     * Validate an internship application (Admin).
     */
    public function validateInternship(int $internshipId, string $status, ?int $professorSupervisorId = null): Internship
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($internshipId, $status, $professorSupervisorId) {
            $stage = Internship::whereKey($internshipId)->lockForUpdate()->firstOrFail();
            abort_unless(auth()->user() && \App\Support\InternshipAccess::staff(auth()->user()), 403);
            \App\Support\InternshipAccess::stage(auth()->user(), $stage);
            abort_unless(in_array($stage->status->value, ['pending', 'validated', 'active'], true), 409, 'Stage déjà clôturé ou annulé.');
            if ($professorSupervisorId) \App\Models\Professor::where('institution_id', $stage->student->institution_id)->findOrFail($professorSupervisorId);
            if ($status === 'approved') {
                abort_unless($stage->insurance_verified && $stage->school_signed_by && in_array($stage->convention_status, ['school_signed', 'active'], true), 422, 'Vérifiez l’assurance et visez la convention avant la validation pédagogique.');
                $stage->status = $stage->convention_status === 'active' ? 'active' : 'validated';
                if ($professorSupervisorId) $stage->supervisor_id = $professorSupervisorId;
            } else { $stage->status = 'cancelled'; $stage->convention_status = 'cancelled'; $stage->company_token_hash = null; }
            $stage->save(); activity()->causedBy(auth()->user())->performedOn($stage)->log('internship_reviewed'); return $stage;
        });
    }
}
