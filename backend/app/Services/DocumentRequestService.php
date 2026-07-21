<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\GeneratedDocument;
use App\Models\Grade;
use App\Models\Student;
use App\Services\Core\PdfEngineService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DocumentRequestService
{
    public function __construct(
        protected PdfEngineService $pdfEngine
    ) {
    }

    public function checkEligibility(Student $student, DocumentType $type): bool
    {
        if (! $type->is_active) {
            return false;
        }

        $hasPending = DocumentRequest::where('student_id', $student->id)
            ->where('document_type_id', $type->id)
            ->whereIn('status', ['pending', 'processing'])
            ->exists();

        if ($hasPending) {
            throw new Exception('You already have a pending request for this document type.');
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
        return DB::transaction(function () use ($request, $status, $adminNotes) {
            $request->update([
                'status' => $status,
                'admin_notes' => $adminNotes,
                'processed_at' => in_array($status, ['ready', 'rejected'], true) ? now() : null,
            ]);

            if ($status === 'ready') {
                $this->generateDocumentPdf($request);
            }

            return $request->fresh(['student.user', 'documentType']);
        });
    }

    public function getGeneratedDocument(DocumentRequest $request): ?GeneratedDocument
    {
        return GeneratedDocument::where('document_request_id', $request->id)->latest('id')->first();
    }

    protected function generateDocumentPdf(DocumentRequest $request): GeneratedDocument
    {
        $request->loadMissing(['student.user', 'documentType']);

        $student = $request->student;
        $type = $request->documentType;

        $viewName = $this->resolveViewName($type);

        if (! View::exists($viewName)) {
            throw new Exception("Blade view [{$viewName}] does not exist for this document type (Original: {$type->view_name}).");
        }

        $academicYear = AcademicYear::where('is_current', true)->first();
        $year = $academicYear?->label ?? $academicYear?->name ?? (now()->year . '-' . (now()->year + 1));

        $trackingCode = Str::upper($type->code . '-' . Str::random(12));
        $verifyUrl = route('document.verify', ['documentId' => $trackingCode]);
        $svg = QrCode::size(100)->generate($verifyUrl);
        $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode($svg);

        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : 'data:image/svg+xml;base64,' . base64_encode('<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="60" rx="8" fill="#002e5b"/><text x="100" y="38" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">ENCG FÈS</text></svg>');

        $signatoryTitle = $request->admin_notes['signatory_title'] ?? null;

        $data = [
            'student' => $student,
            'documentRequest' => $request,
            'date' => now()->format('d/m/Y'),
            'year' => $year,
            'qrBase64' => $qrBase64,
            'logoBase64' => $logoBase64,
            'signatoryTitle' => $signatoryTitle,
        ];

        if ($viewName === 'pdf.releve_notes') {
            $grades = Grade::with('assessment.module')
                ->where('student_id', $student->id)
                ->get();

            $modules = $grades->map(function (Grade $grade) {
                return [
                    'code' => $grade->assessment?->module?->code ?? 'N/A',
                    'name' => $grade->assessment?->module?->name ?? 'Module Inconnu',
                    'score' => $grade->value,
                    'is_validated' => (float) $grade->value >= 10,
                ];
            });

            $data['avgGrade'] = round((float) $grades->avg('value'), 2);
            $data['modules'] = $modules;
        }

        $filename = sprintf('%s_%s_%s.pdf', $type->code, $student->id, now()->timestamp);
        $pdfPath = $this->pdfEngine->generateFromView(
            $viewName,
            $data,
            'documents/generated/' . now()->format('Y/m'),
            $filename,
            'private'
        );

        $existingGeneratedDocument = $this->getGeneratedDocument($request);
        if ($existingGeneratedDocument && Storage::disk('private')->exists($existingGeneratedDocument->file_path)) {
            Storage::disk('private')->delete($existingGeneratedDocument->file_path);
        }

        return GeneratedDocument::updateOrCreate(
            ['document_request_id' => $request->id],
            [
                'student_id' => $student->id,
                'document_type' => $type->code,
                'file_path' => $pdfPath,
                'verification_token' => $trackingCode,
                'verification_url' => $verifyUrl,
                'expires_at' => now()->addYear(),
            ]
        );
    }

    private function resolveViewName(DocumentType $type): string
    {
        $viewMap = [
            'documents.attestation_scolarite' => 'pdf.attestation',
            'documents.convention_stage' => 'pdf.convention_stage',
            'documents.releve_notes' => 'pdf.releve_notes',
            'documents.attestation_travail' => 'pdf.attestation_travail',
            'documents.ordre_mission' => 'pdf.ordre_mission',
        ];

        if (array_key_exists($type->view_name, $viewMap)) {
            return $viewMap[$type->view_name];
        }

        if (str_starts_with($type->view_name, 'documents.')) {
            return str_replace('documents.', 'pdf.', $type->view_name);
        }

        throw new \InvalidArgumentException("Unsupported document view name [{$type->view_name}].");
    }
}
