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
        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $status, $adminNotes) {
            $request->update([
                'status' => $status,
                'admin_notes' => $adminNotes,
                'processed_at' => now(),
            ]);

            if ($status === 'ready') {
                $this->generateDocumentPdf($request);
            }

            return $request;
        });
    }

    protected function generateDocumentPdf(DocumentRequest $request): void
    {
        $request->loadMissing(['student.user', 'documentType']);
        
        $student = $request->student;
        $type = $request->documentType;

        // Map DB view_names to actual blade views in resources/views/pdf
        $viewMap = [
            'documents.attestation_scolarite' => 'pdf.attestation',
            'documents.convention_stage' => 'pdf.convention_stage',
            'documents.releve_notes' => 'pdf.releve_notes',
            'documents.attestation_travail' => 'pdf.attestation_travail',
            'documents.ordre_mission' => 'pdf.ordre_mission',
        ];

        // Fallback to str_replace if not in map
        $viewName = $viewMap[$type->view_name] ?? str_replace('documents.', 'pdf.', $type->view_name);

        // Ensure the Blade view exists
        if (!View::exists($viewName)) {
            throw new Exception("Blade view [{$viewName}] does not exist for this document type (Original: {$type->view_name}).");
        }

        $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
        $year = $academicYear ? $academicYear->name : (now()->year . '-' . (now()->year + 1));

        // Generate tracking code and verification URL
        $trackingCode = strtoupper($type->code) . '_' . $student->user->cin . '_' . time();
        $verifyUrl = config('app.url') . '/verify-document/' . $trackingCode;

        // Generate QR Code
        $svg = \SimpleSoftwareIO\QrCode\Facades\QrCode::size(100)->generate($verifyUrl);
        $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode($svg);

        // Load Logo or use SVG fallback
        $logoPath = public_path('logo-encg.png');
        if (file_exists($logoPath)) {
            $logoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        } else {
            $svgLogo = '<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="60" rx="8" fill="#002e5b"/><text x="100" y="38" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">ENCG FÈS</text></svg>';
            $logoBase64 = 'data:image/svg+xml;base64,' . base64_encode($svgLogo);
        }

        // The View variables
        $data = [
            'student' => $student,
            'documentRequest' => $request,
            'date' => now()->format('d/m/Y'),
            'year' => $year,
            'qrBase64' => $qrBase64,
            'logoBase64' => $logoBase64,
        ];

        if ($viewName === 'pdf.releve_notes') {
            $data['avgGrade'] = 14.5;
            $data['modules'] = [
                ['code' => 'M101', 'name' => 'Management Général', 'score' => 15.5, 'is_validated' => true],
                ['code' => 'M102', 'name' => 'Comptabilité Générale', 'score' => 13.0, 'is_validated' => true],
                ['code' => 'M103', 'name' => 'Microéconomie', 'score' => 16.0, 'is_validated' => true],
                ['code' => 'M104', 'name' => 'Statistiques', 'score' => 13.5, 'is_validated' => true],
            ];
        }

        // Unique filename for storage
        $filename = $type->code . '_' . $student->user->cin . '_' . time() . '.pdf';
        
        // Use the PdfEngineService to render the view and save it locally
        // generateFromView handles Pdf::loadView()->output() and Storage::disk('public')->put()
        $pdfPath = $this->pdfEngine->generateFromView(
            $viewName, 
            $data, 
            'temp_documents', 
            $filename
        );

        // Retrieve the file from public disk and attach it to MediaLibrary
        $media = $request->addMedia(storage_path('app/public/' . ltrim($pdfPath, '/')))
                ->toMediaCollection('generated_documents');
        
        // Also insert into generated_documents to support public verification
        \Illuminate\Support\Facades\DB::table('generated_documents')->insert([
            'document_request_id' => $request->id,
            'file_path' => str_replace(config('app.url'), '', $media->getUrl()),
            'verification_token' => $trackingCode,
            'verification_url' => $verifyUrl,
            'expires_at' => now()->addYears(1),
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
}
