<?php

namespace App\Services;

use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Student;
use App\Services\Core\PdfEngineService;
use Exception;
use Illuminate\Support\Facades\View;

class DocumentRequestService
{
    public function __construct(
        protected PdfEngineService $pdfEngine
    ) {}

    public function checkEligibility(Student $student, DocumentType $type): bool
    {
        if (!$type->is_active) {
            return false;
        }

        // Example logic: A student cannot have multiple pending/processing requests for the same document
        $hasPending = DocumentRequest::where('student_id', $student->id)
            ->where('document_type_id', $type->id)
            ->whereIn('status', ['pending', 'processing'])
            ->exists();

        if ($hasPending) {
            throw new Exception("You already have a pending request for this document type.");
        }

        return true;
    }

    public function createRequest(Student $student, array $data): DocumentRequest
    {
        $type = DocumentType::findOrFail($data['document_type_id']);
        
        $this->checkEligibility($student, $type);

        return DocumentRequest::create([
            'student_id' => $student->id,
            'document_type_id' => $type->id,
            'status' => 'pending',
            'requested_at' => now(),
        ]);
    }

    public function processRequest(DocumentRequest $request, string $status, ?array $adminNotes = null): DocumentRequest
    {
        $request->update([
            'status' => $status,
            'admin_notes' => $adminNotes,
            'processed_at' => now(),
        ]);

        if ($status === 'ready') {
            $this->generateDocumentPdf($request);
        }

        return $request;
    }

    protected function generateDocumentPdf(DocumentRequest $request): void
    {
        $request->loadMissing(['student.user', 'documentType']);
        
        $student = $request->student;
        $type = $request->documentType;

        // Ensure the Blade view exists
        if (!View::exists($type->view_name)) {
            throw new Exception("Blade view [{$type->view_name}] does not exist for this document type.");
        }

        // The View variables
        $data = [
            'student' => $student,
            'documentRequest' => $request,
            'date' => now()->format('d/m/Y'),
        ];

        // Unique filename for storage
        $filename = $type->code . '_' . $student->user->cin . '_' . time() . '.pdf';
        
        // Use the PdfEngineService to render the view and save it locally
        // generateFromView handles Pdf::loadView()->output() and Storage::disk('public')->put()
        $pdfPath = $this->pdfEngine->generateFromView(
            $type->view_name, 
            $data, 
            'temp_documents', 
            $filename
        );

        // Retrieve the file from public disk and attach it to MediaLibrary
        $request->addMedia(storage_path('app/public/' . ltrim($pdfPath, '/')))
                ->toMediaCollection('generated_documents');
    }
}
