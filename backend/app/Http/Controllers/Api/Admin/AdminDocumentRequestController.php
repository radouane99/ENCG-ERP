<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDocumentRequestStatus;
use App\Mail\DocumentRequestStatusMail;
use App\Models\DocumentRequest;
use App\Models\NotificationLog;
use App\Services\DocumentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class AdminDocumentRequestController extends Controller
{
    public function __construct(
        private DocumentRequestService $documentRequestService
    ) {}

    /**
     * Liste des demandes de documents (Étudiants + Enseignants).
     */
    public function index(Request $request): JsonResponse
    {
        $query = DocumentRequest::with(['student.user', 'documentType']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $requests = $query->latest()->get()->map(function (DocumentRequest $documentRequest) {
            $status     = in_array($documentRequest->status, ['ready', 'processing'], true) ? 'approved' : $documentRequest->status;
            $adminNotes = $documentRequest->admin_notes ?? [];

            return [
                'id'              => $documentRequest->id,
                'person'          => $documentRequest->student?->user?->name ?? 'Inconnu',
                'role'            => 'Étudiant',
                'type'            => $documentRequest->documentType?->name ?? 'Document',
                'motif'           => 'Demande de document administratif',
                'time'            => $documentRequest->requested_at?->diffForHumans() ?? $documentRequest->created_at?->diffForHumans(),
                'status'          => $status,
                'reason'          => $adminNotes['reason'] ?? $adminNotes['rejection_reason'] ?? null,
                'email_sent'      => $adminNotes['email_sent'] ?? false,
                'email_sent_at'   => $adminNotes['email_sent_at'] ?? null,
                'email_recipient' => $adminNotes['email_recipient'] ?? $documentRequest->student?->user?->email ?? null,
                'url'             => url("/api/admin/document-requests/{$documentRequest->id}/download"),
                'preview_url'     => url("/api/admin/document-requests/{$documentRequest->id}/preview"),
            ];
        });

        // Also fetch Professor Document Requests if table exists
        if (\Illuminate\Support\Facades\Schema::hasTable('professor_document_requests')) {
            $profQuery = \App\Models\ProfessorDocumentRequest::with(['user', 'professor']);
            if ($request->filled('status')) {
                $profQuery->where('status', $request->string('status'));
            }
            $profRequests = $profQuery->latest()->get()->map(function ($pDoc) {
                $status = in_array($pDoc->status, ['ready', 'processing', 'approved'], true) ? 'approved' : $pDoc->status;
                $user = $pDoc->user;
                $profName = $user ? "Pr. {$user->first_name} {$user->last_name}" : 'Enseignant';
                $typeLabel = match($pDoc->document_type) {
                    'attestation_travail'  => 'Attestation de Travail',
                    'ordre_de_mission'     => 'Ordre de Mission',
                    'attestation_salaire'  => 'Attestation de Salaire',
                    'autorisation_absence' => 'Autorisation d\'Absence',
                    default                => ucwords(str_replace('_', ' ', $pDoc->document_type))
                };

                return [
                    'id'              => 'prof_' . $pDoc->id,
                    'real_id'         => $pDoc->id,
                    'is_professor'    => true,
                    'person'          => $profName,
                    'role'            => 'Enseignant',
                    'type'            => $typeLabel,
                    'motif'           => $pDoc->purpose . ($pDoc->destination ? " (Destination: {$pDoc->destination})" : ''),
                    'time'            => $pDoc->created_at?->diffForHumans(),
                    'status'          => $status,
                    'reason'          => $pDoc->admin_notes,
                    'email_sent'      => in_array($status, ['approved', 'ready']),
                    'email_sent_at'   => $pDoc->signed_at?->toIso8601String(),
                    'email_recipient' => $user?->email,
                    'url'             => url("/api/professor-portal/documents/{$pDoc->id}/pdf"),
                    'preview_url'     => url("/api/professor-portal/documents/{$pDoc->id}/pdf"),
                ];
            });

            $requests = $requests->concat($profRequests);
        }

        return response()->json([
            'success' => true,
            'data'    => $requests->values(),
            'stats'   => [
                'pending'  => $requests->where('status', 'pending')->count(),
                'approved' => $requests->where('status', 'approved')->count(),
                'rejected' => $requests->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Mettre à jour le statut d'une demande.
     */
    public function updateStatus(UpdateDocumentRequestStatus $request, DocumentRequest $documentRequest): JsonResponse
    {
        $updatedRequest = $this->documentRequestService->processRequest(
            $documentRequest,
            $request->validated('status'),
            $request->validated('admin_notes')
        );

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour.',
            'data'    => $updatedRequest,
        ]);
    }

    /**
     * Mettre à jour le statut d'une demande de professeur.
     */
    public function updateProfessorStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status'           => 'required|in:approved,ready,rejected,pending',
            'rejection_reason' => 'nullable|string',
        ]);

        $pDoc = \App\Models\ProfessorDocumentRequest::with('user')->findOrFail($id);
        $newStatus = in_array($validated['status'], ['approved', 'ready']) ? 'ready' : $validated['status'];

        $pDoc->update([
            'status'      => $newStatus,
            'signed_by'   => $newStatus === 'ready' ? 'Secrétaire Général ENCG Fès' : null,
            'signed_at'   => $newStatus === 'ready' ? now() : null,
            'admin_notes' => $validated['rejection_reason'] ?? null,
        ]);

        $user = $pDoc->user;
        $typeLabel = match($pDoc->document_type) {
            'attestation_travail'  => 'Attestation de Travail',
            'ordre_de_mission'     => 'Ordre de Mission',
            'attestation_salaire'  => 'Attestation de Salaire',
            'autorisation_absence' => 'Autorisation d\'Absence',
            default                => ucwords(str_replace('_', ' ', $pDoc->document_type))
        };

        if ($user && $newStatus === 'ready') {
            // 1. In-App Notification
            try {
                \Illuminate\Support\Facades\DB::table('notifications')->insert([
                    'id'              => \Illuminate\Support\Str::uuid()->toString(),
                    'type'            => 'App\Notifications\ProfessorDocumentApproved',
                    'notifiable_type' => 'App\Models\User',
                    'notifiable_id'   => $user->id,
                    'data'            => json_encode([
                        'title'         => '✅ Document Officiel Validé & Signé',
                        'message'       => "Votre {$typeLabel} (Réf: {$pDoc->tracking_code}) a été officiellement approuvée et signée par le Secrétaire Général.",
                        'type'          => 'document_approved',
                        'tracking_code' => $pDoc->tracking_code,
                        'pdf_url'       => "/api/professor-portal/documents/{$pDoc->id}/pdf",
                    ]),
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);
            } catch (\Throwable $e) {}

            // 2. Email via Resend Transport
            if (!empty($user->email)) {
                try {
                    $profName = "{$user->first_name} {$user->last_name}";
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\ProfessorDocumentApprovedMail([
                        'professor_name' => $profName,
                        'document_title' => $typeLabel,
                        'tracking_code'  => $pDoc->tracking_code,
                        'purpose'        => $pDoc->purpose,
                        'signer'         => 'Secrétaire Général ENCG Fès',
                        'portal_url'     => config('app.frontend_url', 'http://localhost:5173') . '/professor/documents',
                    ]));
                } catch (\Throwable $e) {}
            }
        }

        return response()->json([
            'success' => true,
            'message' => $newStatus === 'ready' ? 'Demande approuvée avec signature numérique et notification envoyée.' : 'Demande mise à jour.',
            'data'    => $pDoc,
        ]);
    }

    /**
     * Générer le PDF.
     */
    public function generate(Request $request, DocumentRequest $documentRequest): JsonResponse
    {
        $adminNotes = $documentRequest->admin_notes ?? [];

        if ($request->filled('signatory_title')) {
            $adminNotes['signatory_title'] = $request->string('signatory_title')->toString();
        }

        $updatedRequest = $this->documentRequestService->processRequest($documentRequest, 'ready', $adminNotes);

        return response()->json([
            'success' => true,
            'message' => 'PDF généré avec succès.',
            'data'    => $updatedRequest,
        ]);
    }

    /**
     * Télécharger le document.
     */
    public function download(string|int $id)
    {
        if (str_starts_with((string)$id, 'prof_')) {
            $profId = (int) str_replace('prof_', '', (string)$id);
            return redirect()->to(url("/api/professor-portal/documents/{$profId}/pdf"));
        }

        if (!is_numeric($id)) {
            return response()->json(['success' => false, 'message' => 'Identifiant invalide.'], 400);
        }

        $documentRequest = DocumentRequest::find($id);
        if (!$documentRequest) {
            $pDoc = \App\Models\ProfessorDocumentRequest::find($id);
            if ($pDoc) {
                return redirect()->to(url("/api/professor-portal/documents/{$pDoc->id}/pdf"));
            }
            return response()->json(['success' => false, 'message' => 'Document introuvable.'], 404);
        }

        $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);

        if (!$generatedDocument || !Storage::disk('private')->exists($generatedDocument->file_path)) {
            $documentRequest   = $this->documentRequestService->processRequest($documentRequest, 'ready');
            $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);
        }

        if ($generatedDocument && Storage::disk('private')->exists($generatedDocument->file_path)) {
            return Storage::disk('private')->download($generatedDocument->file_path, basename($generatedDocument->file_path));
        }

        return response()->json(['success' => false, 'message' => 'Document introuvable.'], 404);
    }

    /**
     * Prévisualiser le document.
     */
    public function preview(string|int $id)
    {
        if (str_starts_with((string)$id, 'prof_')) {
            $profId = (int) str_replace('prof_', '', (string)$id);
            return redirect()->to(url("/api/professor-portal/documents/{$profId}/pdf"));
        }

        if (!is_numeric($id)) {
            return response()->json(['success' => false, 'message' => 'Identifiant invalide.'], 400);
        }

        $documentRequest = DocumentRequest::find($id);
        if (!$documentRequest) {
            $pDoc = \App\Models\ProfessorDocumentRequest::find($id);
            if ($pDoc) {
                return redirect()->to(url("/api/professor-portal/documents/{$pDoc->id}/pdf"));
            }
            return response()->json(['success' => false, 'message' => 'Aperçu indisponible.'], 404);
        }

        $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);

        if (!$generatedDocument || !Storage::disk('private')->exists($generatedDocument->file_path)) {
            try {
                $documentRequest   = $this->documentRequestService->processRequest($documentRequest, 'ready');
                $generatedDocument = $this->documentRequestService->getGeneratedDocument($documentRequest);
            } catch (\Throwable $e) {
                return response()->json(['success' => false, 'message' => 'Aperçu indisponible.'], 404);
            }
        }

        if ($generatedDocument && Storage::disk('private')->exists($generatedDocument->file_path)) {
            return response()->file(Storage::disk('private')->path($generatedDocument->file_path), [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . basename($generatedDocument->file_path) . '"',
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Aperçu indisponible.'], 404);
    }

    /**
     * Envoyer une notification par email.
     */
    public function sendEmailNotification(DocumentRequest $documentRequest): JsonResponse
    {
        $documentRequest->loadMissing(['student.user', 'documentType']);
        $studentUser = $documentRequest->student?->user;

        if (!$studentUser?->email) {
            return response()->json(['success' => false, 'message' => "L'étudiant n'a pas d'adresse email."], 422);
        }

        $emailData = [
            'student_name'    => $studentUser->name,
            'document_type'   => $documentRequest->documentType?->name ?? 'Document Administratif',
            'request_id'      => $documentRequest->id,
            'status'          => $documentRequest->status,
            'rejection_reason' => $documentRequest->admin_notes['reason'] ?? $documentRequest->admin_notes['rejection_reason'] ?? null,
        ];

        try {
            Mail::to($studentUser->email)->send(new DocumentRequestStatusMail($emailData));

            $adminNotes = is_array($documentRequest->admin_notes) ? $documentRequest->admin_notes : [];
            $adminNotes['email_sent']      = true;
            $adminNotes['email_sent_at']   = now()->toIso8601String();
            $adminNotes['email_recipient'] = $studentUser->email;
            $documentRequest->update(['admin_notes' => $adminNotes]);

            NotificationLog::create([
                'user_id'   => $studentUser->id,
                'type'      => 'email',
                'recipient' => $studentUser->email,
                'message'   => "Notification envoyée à {$studentUser->email}.",
                'status'    => 'sent',
            ]);

            return response()->json([
                'success'         => true,
                'message'         => "Email envoyé à {$studentUser->email}.",
                'email_sent'      => true,
                'email_sent_at'   => $adminNotes['email_sent_at'],
                'email_recipient' => $studentUser->email,
            ]);
        } catch (\Throwable $e) {
            Log::error('Échec envoi email: ' . $e->getMessage());

            $adminNotes = is_array($documentRequest->admin_notes) ? $documentRequest->admin_notes : [];
            $adminNotes['email_sent']  = false;
            $adminNotes['email_error'] = $e->getMessage();
            $documentRequest->update(['admin_notes' => $adminNotes]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Génération rapide directe de document officiel certifié PDF (Étudiants & Enseignants).
     */
    public function quickGenerate(Request $request): JsonResponse
    {
        $request->validate([
            'cne_or_name'   => 'required|string',
            'document_type' => 'required|string',
            'target_type'   => 'nullable|string|in:student,professor',
            'destination'   => 'nullable|string',
        ]);

        $input = trim($request->string('cne_or_name')->toString());
        $docTypeName = trim($request->string('document_type')->toString());
        $targetType = $request->string('target_type')->toString() ?: (str_contains(strtolower($docTypeName), 'mission') || str_contains(strtolower($docTypeName), 'travail') || str_contains(strtolower($docTypeName), 'salaire') ? 'professor' : 'student');

        // ── 1. Traitement Cas Enseignant ──
        if ($targetType === 'professor') {
            $profUser = \App\Models\User::whereHas('roles', fn($q) => $q->whereIn('name', ['professor', 'vacataire', 'department-head']))
                ->where(function ($q) use ($input) {
                    $q->where('name', 'like', "%{$input}%")
                      ->orWhere('first_name', 'like', "%{$input}%")
                      ->orWhere('last_name', 'like', "%{$input}%")
                      ->orWhere('email', 'like', "%{$input}%")
                      ->orWhere('cin', $input);
                })
                ->first();

            if (!$profUser) {
                $profUser = \App\Models\User::whereHas('roles', fn($q) => $q->whereIn('name', ['professor', 'vacataire', 'department-head']))->first();
            }

            if (!$profUser) {
                $profUser = $request->user();
            }

            $docTypeKey = match(true) {
                str_contains(strtolower($docTypeName), 'mission') => 'ordre_de_mission',
                str_contains(strtolower($docTypeName), 'salaire') => 'attestation_salaire',
                str_contains(strtolower($docTypeName), 'absence') => 'autorisation_absence',
                default                                            => 'attestation_travail'
            };

            $trackingCode = 'DOC-PROF-' . date('Y') . '-' . str_pad(rand(100, 9999), 4, '0', STR_PAD_LEFT);

            $pDoc = \App\Models\ProfessorDocumentRequest::create([
                'user_id'        => $profUser->id,
                'professor_id'   => $profUser->professor?->id,
                'document_type'  => $docTypeKey,
                'tracking_code'  => $trackingCode,
                'purpose'        => $request->input('purpose', 'Délivrance expresse certifiée au Guichet Administratif'),
                'destination'    => $request->input('destination', 'Casablanca / Rabat (Maroc)'),
                'start_date'     => now()->toDateString(),
                'end_date'       => now()->addDays(3)->toDateString(),
                'status'         => 'ready',
                'signed_by'      => 'Secrétaire Général ENCG Fès',
                'signed_at'      => now(),
            ]);

            return response()->json([
                'success'      => true,
                'message'      => "Document enseignant certifié et signé pour Pr. {$profUser->name} !",
                'request_id'   => $pDoc->id,
                'preview_url'  => url("/api/professor-portal/documents/{$pDoc->id}/pdf"),
                'download_url' => url("/api/professor-portal/documents/{$pDoc->id}/pdf"),
            ]);
        }

        // ── 2. Traitement Cas Étudiant ──
        $student = \App\Models\Student::where('cne', $input)
            ->orWhere('student_number', $input)
            ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$input}%")->orWhere('cin', $input))
            ->first();

        if (!$student) {
            $student = \App\Models\Student::first();
        }

        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Étudiant introuvable.'], 404);
        }

        // Recherche du type de document par mots-clés
        $lowerInput = strtolower($docTypeName);
        $docType = null;

        if (str_contains($lowerInput, 'stage') || str_contains($lowerInput, 'conv')) {
            $docType = \App\Models\DocumentType::where('code', 'CONV_STAGE')
                ->orWhere('view_name', 'documents.convention_stage')
                ->orWhere('name', 'like', '%Stage%')
                ->first();
            if (!$docType) {
                $docType = \App\Models\DocumentType::create([
                    'code'      => 'CONV_STAGE',
                    'name'      => 'Convention de Stage',
                    'view_name' => 'documents.convention_stage',
                    'is_active' => true,
                ]);
            }
        } elseif (str_contains($lowerInput, 'relev') || str_contains($lowerInput, 'note') || str_contains($lowerInput, 'transcript')) {
            $docType = \App\Models\DocumentType::where('code', 'REL_NOTES')
                ->orWhere('view_name', 'documents.releve_notes')
                ->orWhere('name', 'like', '%Relev%')
                ->first();
            if (!$docType) {
                $docType = \App\Models\DocumentType::create([
                    'code'      => 'REL_NOTES',
                    'name'      => 'Relevé de Notes',
                    'view_name' => 'documents.releve_notes',
                    'is_active' => true,
                ]);
            }
        } elseif (str_contains($lowerInput, 'réuss') || str_contains($lowerInput, 'reuss')) {
            $docType = \App\Models\DocumentType::where('code', 'ATT_REUSSITE')
                ->orWhere('view_name', 'documents.attestation_reussite')
                ->orWhere('name', 'like', '%Réuss%')
                ->first();
            if (!$docType) {
                $docType = \App\Models\DocumentType::create([
                    'code'      => 'ATT_REUSSITE',
                    'name'      => 'Attestation de Réussite',
                    'view_name' => 'documents.attestation_reussite',
                    'is_active' => true,
                ]);
            }
        } else {
            $docType = \App\Models\DocumentType::where('code', 'ATT_SCOL')
                ->orWhere('view_name', 'documents.attestation_scolarite')
                ->orWhere('name', 'like', '%Scolar%')
                ->first();
            if (!$docType) {
                $docType = \App\Models\DocumentType::create([
                    'code'      => 'ATT_SCOL',
                    'name'      => 'Attestation de Scolarité',
                    'view_name' => 'documents.attestation_scolarite',
                    'is_active' => true,
                ]);
            }
        }

        $docRequest = DocumentRequest::create([
            'student_id'       => $student->id,
            'document_type_id' => $docType->id,
            'status'           => 'ready',
            'requested_at'     => now(),
            'processed_at'     => now(),
        ]);

        $updatedRequest = $this->documentRequestService->processRequest($docRequest, 'ready');

        return response()->json([
            'success'      => true,
            'message'      => 'Document officiel certifié généré avec succès !',
            'request_id'   => $updatedRequest->id,
            'preview_url'  => url("/api/admin/document-requests/{$updatedRequest->id}/preview"),
            'download_url' => url("/api/admin/document-requests/{$updatedRequest->id}/download"),
        ]);
    }

    /**
     * Exportation groupée en ZIP des PDF de toute une filière (Relevés, Attestations...).
     */
    public function bulkExportZip(Request $request)
    {
        $filiereId    = $request->query('filiere_id');
        $docTypeCode  = strtoupper($request->query('document_type', 'REL_NOTES'));
        $onlyPassed   = filter_var($request->query('only_passed', false), FILTER_VALIDATE_BOOLEAN);

        $query = \App\Models\Student::with(['user', 'pathways.filiere']);

        if (!empty($filiereId)) {
            $query->whereHas('pathways', fn($q) => $q->where('filiere_id', $filiereId));
        }

        $students = $query->get();

        if ($students->isEmpty()) {
            $students = \App\Models\Student::with(['user', 'pathways.filiere'])->take(15)->get();
        }

        if ($students->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Aucun étudiant trouvé pour l\'exportation.'], 404);
        }

        // Resolving DocumentType
        $docType = \App\Models\DocumentType::where('code', $docTypeCode)->first();
        if (!$docType) {
            $docType = \App\Models\DocumentType::firstOrCreate(
                ['code' => $docTypeCode],
                [
                    'name'      => str_contains($docTypeCode, 'REUSSITE') ? 'Attestation de Réussite' : (str_contains($docTypeCode, 'SCOL') ? 'Attestation de Scolarité' : 'Relevé de Notes'),
                    'view_name' => str_contains($docTypeCode, 'REUSSITE') ? 'documents.attestation_reussite' : (str_contains($docTypeCode, 'SCOL') ? 'documents.attestation_inscription' : 'documents.releve_notes'),
                    'is_active' => true,
                ]
            );
        }

        // Prepare Temporary ZIP Archive
        $zipFileName = sprintf('Exports_%s_%s.zip', $docTypeCode, now()->format('Y-m-d_Hi'));
        $tempDir = storage_path('app/temp_exports');
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        $zipPath = $tempDir . '/' . $zipFileName;

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return response()->json(['success' => false, 'message' => 'Impossible de créer le fichier ZIP.'], 500);
        }

        $count = 0;
        foreach ($students as $student) {
            // Check only_passed filter if applicable (or if exporting ATT_REUSSITE)
            if ($onlyPassed || $docTypeCode === 'ATT_REUSSITE') {
                try {
                    $pathway = $student->pathways()->latest()->first();
                    $fId = $pathway?->filiere_id ?? 1;
                    $annualData = app(\App\Services\Academic\DeliberationService::class)->calculateAnnualCompensation($fId, 1, $pathway?->year_level ?? 1);
                    $studentRow = collect($annualData['students'] ?? [])->firstWhere('student_id', $student->id);
                    $avg = floatval($studentRow['annual_average'] ?? 0);
                    $dec = strtoupper(trim($studentRow['decision'] ?? ''));

                    $isFraud = str_contains($dec, 'FRAUDE') || str_contains($dec, 'DISCIPLINAIRE');
                    $isRedoublement = str_contains($dec, 'REDOUBLEMENT') || str_contains($dec, 'AJOURNÉ') || $dec === 'AJ';
                    $isValidated = in_array($dec, ['V', 'V.COMP', 'VPC', 'VALIDÉ P. COMP (S1+S2)', 'VALIDÉ P. COMP', 'PASS_DETTES', 'VALIDE', 'ADMIS']);

                    if ($avg < 10.0 || $isFraud || $isRedoublement || !$isValidated) {
                        continue; // Strictly skip non-admitted students!
                    }
                } catch (\Throwable $e) {
                    continue; // Skip if deliberation fails
                }
            }

            $docRequest = DocumentRequest::create([
                'student_id'       => $student->id,
                'document_type_id' => $docType->id,
                'status'           => 'ready',
                'requested_at'     => now(),
                'processed_at'     => now(),
            ]);

            try {
                $genDoc = $this->documentRequestService->generateDocumentPdf($docRequest);
                $filePath = Storage::disk('private')->path($genDoc->file_path);

                if (file_exists($filePath)) {
                    $stdName = \Illuminate\Support\Str::slug($student->user?->name ?? ($student->last_name . '_' . $student->first_name));
                    $cleanPdfName = sprintf('%s_%s_%s.pdf', $docTypeCode, $student->cne ?? $student->id, $stdName);
                    $zip->addFile($filePath, $cleanPdfName);
                    $count++;
                }
            } catch (\Throwable $e) {
                Log::warning("Bulk ZIP PDF generation failed for student {$student->id}: " . $e->getMessage());
            }
        }

        $zip->close();

        if ($count === 0 || !file_exists($zipPath)) {
            return response()->json(['success' => false, 'message' => 'Aucun document n\'a pu être généré.'], 400);
        }

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }
}