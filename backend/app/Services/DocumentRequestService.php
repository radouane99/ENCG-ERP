<?php

namespace App\Services;

use App\Mail\DocumentRequestCreatedMail;
use App\Mail\DocumentRequestStatusMail;
use App\Models\AcademicYear;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\GeneratedDocument;
use App\Models\Grade;
use App\Models\NotificationLog;
use App\Models\Student;
use App\Models\User;
use App\Notifications\DocumentRequestCreatedNotification;
use App\Notifications\DocumentRequestStatusUpdatedNotification;
use App\Notifications\NewDocumentRequestAdminNotification;
use App\Services\Core\PdfEngineService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DocumentRequestService
{
    public function __construct(
        private PdfEngineService $pdfEngine
    ) {}

    /**
     * Vérifier l'éligibilité.
     */
    public function checkEligibility(Student $student, DocumentType $type): bool
    {
        if (!$type->is_active) return false;

        $hasPending = DocumentRequest::where('student_id', $student->id)
            ->where('document_type_id', $type->id)
            ->whereIn('status', ['pending', 'processing'])
            ->exists();

        if ($hasPending) {
            throw new Exception('Vous avez déjà une demande en cours pour ce type de document.');
        }

        return true;
    }

    /**
     * Créer une demande de document.
     */
    public function createRequest(Student $student, array $data): DocumentRequest
    {
        $type = DocumentType::findOrFail($data['document_type_id']);
        $this->checkEligibility($student, $type);

        $docRequest = DocumentRequest::create([
            'student_id'        => $student->id,
            'document_type_id'  => $type->id,
            'status'            => 'pending',
            'requested_at'      => now(),
        ]);

        $studentUser = $student->user;

        try {
            // Notification étudiant
            if ($studentUser) {
                $studentUser->notify(new DocumentRequestCreatedNotification($docRequest));
            }

            // Notification admins
            User::role(['super-admin', 'institution-admin', 'director', 'admin'])
                ->get()
                ->each(fn($admin) => $admin->notify(new NewDocumentRequestAdminNotification($docRequest, $studentUser)));
        } catch (\Throwable $e) {
            Log::error('Échec notification création demande: ' . $e->getMessage());
        }

        // Email admin
        try {
            Mail::to(config('mail.from.address', 'admin@encg-fes.ma'))
                ->send(new DocumentRequestCreatedMail([
                    'student_name'  => $studentUser?->name ?? 'Étudiant',
                    'student_cne'   => $student->cne ?? 'N/A',
                    'document_type' => $type->name,
                    'request_id'    => $docRequest->id,
                ]));
        } catch (\Throwable $e) {
            Log::error('Échec email admin: ' . $e->getMessage());
        }

        return $docRequest;
    }

    /**
     * Traiter une demande.
     */
    public function processRequest(DocumentRequest $request, string $status, ?array $adminNotes = null): DocumentRequest
    {
        return DB::transaction(function () use ($request, $status, $adminNotes) {
            $request->update([
                'status'       => $status,
                'admin_notes'  => $adminNotes,
                'processed_at' => in_array($status, ['ready', 'approved'], true) ? now() : null,
            ]);

            if (in_array($status, ['ready', 'approved'], true)) {
                $this->generateDocumentPdf($request);
            }

            $fresh = $request->fresh(['student.user', 'documentType']);
            $studentUser = $fresh->student?->user;

            try {
                if ($studentUser) {
                    $studentUser->notify(new DocumentRequestStatusUpdatedNotification($fresh));

                    if (!empty($studentUser->email)) {
                        Mail::to($studentUser->email)->send(new DocumentRequestStatusMail([
                            'student_name'    => $studentUser->name,
                            'document_type'   => $fresh->documentType?->name ?? 'Document',
                            'request_id'      => $fresh->id,
                            'status'          => $status,
                            'rejection_reason' => $adminNotes['reason'] ?? null,
                        ]));

                        NotificationLog::create([
                            'user_id'   => $studentUser->id,
                            'type'      => 'email',
                            'recipient' => $studentUser->email,
                            'message'   => "Email statut [{$fresh->documentType?->name}] envoyé.",
                            'status'    => 'sent',
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Échec notification/email statut: ' . $e->getMessage());
            }

            return $fresh;
        });
    }

    /**
     * Récupérer le document généré.
     */
    public function getGeneratedDocument(DocumentRequest $request): ?GeneratedDocument
    {
        return GeneratedDocument::where('document_request_id', $request->id)->latest('id')->first();
    }

    /**
     * Générer le PDF du document.
     */
    private function generateDocumentPdf(DocumentRequest $request): GeneratedDocument
    {
        $request->loadMissing(['student.user', 'documentType']);

        $student  = $request->student;
        $type     = $request->documentType;
        $viewName = $this->resolveViewName($type);

        if (!View::exists($viewName)) {
            throw new Exception("Vue [{$viewName}] introuvable.");
        }

        $academicYear = AcademicYear::where('is_current', true)->first();
        $year = $academicYear?->label ?? (now()->year . '-' . (now()->year + 1));

        $trackingCode = Str::upper($type->code . '-' . Str::random(12));
        $verifyUrl    = route('document.verify', ['documentId' => $trackingCode]);
        $qrBase64     = 'data:image/svg+xml;base64,' . base64_encode(QrCode::size(100)->generate($verifyUrl));

        $logoPath   = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : '';

        $data = [
            'student'        => $student,
            'documentRequest' => $request,
            'date'           => now()->format('d/m/Y'),
            'year'           => $year,
            'qrBase64'       => $qrBase64,
            'logoBase64'     => $logoBase64,
            'signatoryTitle' => $request->admin_notes['signatory_title'] ?? null,
        ];

        if ($viewName === 'pdf.releve_notes') {
            $grades = Grade::with('assessment.module')->where('student_id', $student->id)->get();
            $data['modules'] = $grades->map(fn(Grade $g) => [
                'code'         => $g->assessment?->module?->code ?? 'N/A',
                'name'         => $g->assessment?->module?->name ?? 'N/A',
                'score'        => $g->value,
                'is_validated' => (float) $g->value >= 10,
            ]);
            $data['avgGrade'] = round((float) $grades->avg('value'), 2);
        }

        $filename = sprintf('%s_%s_%s.pdf', $type->code, $student->id, now()->timestamp);
        $pdfPath  = $this->pdfEngine->generateFromView($viewName, $data, 'documents/generated/' . now()->format('Y/m'), $filename, 'private');

        // Supprimer l'ancien document
        $existing = $this->getGeneratedDocument($request);
        if ($existing && Storage::disk('private')->exists($existing->file_path)) {
            Storage::disk('private')->delete($existing->file_path);
        }

        return GeneratedDocument::updateOrCreate(
            ['document_request_id' => $request->id],
            [
                'student_id'          => $student->id,
                'document_type'       => $type->code,
                'file_path'           => $pdfPath,
                'verification_token'  => $trackingCode,
                'verification_url'    => $verifyUrl,
                'expires_at'          => now()->addYear(),
            ]
        );
    }

    /**
     * Résoudre le nom de la vue Blade.
     */
    private function resolveViewName(DocumentType $type): string
    {
        $viewMap = [
            'documents.attestation_scolarite' => 'pdf.attestation',
            'documents.convention_stage'      => 'pdf.convention_stage',
            'documents.releve_notes'          => 'pdf.releve_notes',
            'documents.attestation_travail'   => 'pdf.attestation_travail',
            'documents.ordre_mission'         => 'pdf.ordre_mission',
        ];

        return $viewMap[$type->view_name]
            ?? (str_starts_with($type->view_name, 'documents.') ? str_replace('documents.', 'pdf.', $type->view_name) : throw new \InvalidArgumentException("Vue non supportée [{$type->view_name}]."));
    }
}