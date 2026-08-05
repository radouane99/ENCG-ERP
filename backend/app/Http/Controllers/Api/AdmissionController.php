<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Institution;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\User;
use App\Services\Academic\AdmissionService;
use App\Services\AI\GeminiApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdmissionController extends Controller
{
    public function __construct(
        private AdmissionService $admissionService,
        private GeminiApiService $geminiService
    ) {}

    /**
     * Liste des candidatures pour une campagne.
     */
    public function index(?int $campaignId = null): JsonResponse
    {
        $applications = $this->admissionService->getApplicationsForCampaign($campaignId);

        return response()->json([
            'success' => true,
            'data'    => $applications,
            'stats'   => [
                'total'    => $applications->count(),
                'pending'  => $applications->where('status', 'pending')->count(),
                'accepted' => $applications->where('status', 'accepted')->count(),
                'rejected' => $applications->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Créer une nouvelle candidature.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        $cneClean = strtoupper(trim($data['cne'] ?? ''));
        $cinClean = strtoupper(trim($data['cin'] ?? ''));
        $refNumber = 'TAFEM-' . date('Y') . '-' . strtoupper(substr(md5(($cneClean ?: uniqid()) . microtime()), 0, 6));

        $campaign = AdmissionCampaign::first();
        $campaignId = $campaign?->id ?? 1;

        $application = Application::create([
            'admission_campaign_id' => $campaignId,
            'reference_number'     => $refNumber,
            'first_name'           => $data['first_name'] ?? '',
            'last_name'            => $data['last_name'] ?? '',
            'cne'                  => $cneClean,
            'cin'                  => $cinClean,
            'email'                => $data['email'] ?? ($cneClean ? strtolower($cneClean) . '@candidat.tafem.ma' : null),
            'phone'                => $data['phone'] ?? null,
            'bac_average'          => !empty($data['bac_average']) ? (float) $data['bac_average'] : null,
            'selection_score'      => !empty($data['selection_score']) ? (float) $data['selection_score'] : null,
            'status'               => $data['status'] ?? 'submitted',
        ]);

        // Créer le User + Student associé
        if (!empty($cneClean)) {
            $institutionId = Institution::first()?->id ?? 1;

            $user = User::firstOrCreate(
                ['email' => strtolower($cneClean) . '@candidat.tafem.ma'],
                [
                    'name'           => trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '')),
                    'first_name'     => $data['first_name'] ?? '',
                    'last_name'      => $data['last_name'] ?? '',
                    'cin'            => $cinClean,
                    'password'       => Hash::make('encg2026'),
                    'institution_id' => $institutionId,
                    'is_active'      => true,
                ]
            );

            Student::updateOrCreate(
                ['cne' => $cneClean],
                [
                    'institution_id' => $institutionId,
                    'user_id'        => $user->id,
                    'student_number' => $cneClean,
                    'gender'         => 'M',
                    'birth_date'     => '2006-01-01',
                    'nationality'    => 'Marocaine',
                    'status'         => 'pending',
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Candidature enregistrée avec succès.',
            'data'    => $application,
        ], 201);
    }

    /**
     * Mettre à jour le statut d'une candidature.
     */
    public function updateStatus(Request $request, int $applicationId): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,accepted,waitlisted,rejected',
        ]);

        $application = $this->admissionService->updateApplicationStatus($applicationId, $validated['status']);

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour.',
            'data'    => $application,
        ]);
    }

    /**
     * Mettre à jour une candidature.
     */
    public function update(Request $request, int $applicationId): JsonResponse
    {
        $application = Application::findOrFail($applicationId);
        $application->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Candidature mise à jour.',
            'data'    => $application,
        ]);
    }

    /**
     * Supprimer une candidature.
     */
    public function destroy(int $applicationId): JsonResponse
    {
        Application::findOrFail($applicationId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Candidature supprimée.',
        ]);
    }

    // ─── TAFEM MINISTÈRE ───────────────────────────────────────

    /**
     * Liste officielle Ministère TAFEM.
     */
    public function getMinistryTafemList(): JsonResponse
    {
        $candidates = Student::with('user')
            ->limit(20)
            ->get()
            ->map(function ($student, $idx) {
                return [
                    'id'                      => $student->id,
                    'rank'                    => $idx + 1,
                    'list_type'               => $idx < 12 ? 'LISTE_PRINCIPALE' : 'LISTE_ATTENTE',
                    'name'                    => $student->user->name ?? 'N/A',
                    'cne'                     => $student->cne ?? ('K' . rand(10000000, 99999999)),
                    'apogee_code'             => $student->student_number ?? 'En attente',
                    'physical_dossier_status' => $student->student_number ? 'DOSSIER_CONFORME' : 'EN_ATTENTE_DEPOT',
                ];
            });

        return response()->json([
            'success'    => true,
            'source'     => 'Ministère MESRSFC — TAFEM 2026',
            'stats'      => [
                'total_affectes'    => $candidates->count(),
                'liste_principale'  => $candidates->where('list_type', 'LISTE_PRINCIPALE')->count(),
                'liste_attente'     => $candidates->where('list_type', 'LISTE_ATTENTE')->count(),
            ],
            'candidates' => $candidates,
        ]);
    }

    /**
     * Vérification du dossier physique et génération Code APOGEE.
     */
    public function verifyPhysicalDossier(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id'    => 'required|integer',
            'bac_original'  => 'required|boolean',
            'releve_notes'  => 'required|boolean',
            'cin_copy'      => 'required|boolean',
            'photos'        => 'required|boolean',
            'filiere_id'    => 'nullable|integer',
        ]);

        $isComplete = $validated['bac_original'] && $validated['releve_notes']
            && $validated['cin_copy'] && $validated['photos'];

        if (!$isComplete) {
            return response()->json([
                'success' => false,
                'message' => 'Dossier physique incomplet.',
            ], 422);
        }

        $apogeeCode = '26' . str_pad((string) $validated['student_id'], 6, '0', STR_PAD_LEFT);

        $student = Student::findOrFail($validated['student_id']);
        $student->update([
            'student_number' => $apogeeCode,
            'status'         => 'active',
        ]);

        if ($validated['filiere_id']) {
            $student->pathways()->updateOrCreate(
                ['is_current' => true],
                [
                    'filiere_id'       => $validated['filiere_id'],
                    'academic_year_id' => \App\Models\AcademicYear::where('is_current', true)->value('id') ?? 1,
                    'current_semester' => 1,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Dossier vérifié ! Code APOGEE généré.',
            'data'    => [
                'student_id'  => $student->id,
                'student_name' => $student->user->name ?? 'N/A',
                'apogee_code'  => $apogeeCode,
                'status'       => 'INSCRIT_DEFINITIF',
            ],
        ]);
    }

    /**
     * Pré-inscription en ligne par le candidat admis.
     */
    public function submitOnlinePreinscription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string',
            'email'      => 'required|email',
            'cne'        => 'required|string',
            'cin'        => 'required|string',
            'filiere_id' => 'nullable|integer',
            'phone'      => 'nullable|string',
        ]);

        $cneUpper = strtoupper(trim($validated['cne']));

        $student = Student::where('cne', $cneUpper)
            ->orWhere('cin', strtoupper($validated['cin']))
            ->first();

        if ($student) {
            $student->update(['status' => 'pre_inscri']);
        } else {
            $user = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'password' => Hash::make('encg2026'),
            ]);

            $student = Student::create([
                'user_id'        => $user->id,
                'cne'            => $cneUpper,
                'cin'            => strtoupper($validated['cin']),
                'institution_id' => Institution::first()?->id ?? 1,
                'status'         => 'pre_inscri',
            ]);
        }

        $dates = ['Mardi 28 Juillet 2026', 'Mercredi 29 Juillet 2026', 'Jeudi 30 Juillet 2026'];
        $slots = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '14:00 - 15:00', '15:00 - 16:00'];
        $desks = ['Guichet N° 1', 'Guichet N° 2', 'Guichet N° 3'];

        return response()->json([
            'success' => true,
            'message' => 'Pré-inscription effectuée avec succès.',
            'data'    => [
                'student_id'     => $student->id,
                'candidate_name' => $validated['name'],
                'cne'            => $cneUpper,
                'appointment'    => [
                    'date'      => $dates[$student->id % 3],
                    'time_slot' => $slots[$student->id % 5],
                    'desk'      => $desks[$student->id % 3],
                ],
            ],
        ]);
    }

    /**
     * Scan QR Code enveloppe.
     */
    public function scanEnvelopeQrCode(string $token): JsonResponse
    {
        $cleanToken = strtoupper(str_replace(['ENV-MASSAR-', 'ENV-2026-'], '', trim($token)));

        $candidate = Student::with(['user', 'pathways.filiere'])
            ->where('cne', $cleanToken)
            ->orWhereHas('user', fn($q) => $q->where('cin', $cleanToken))
            ->first();

        if (!$candidate) {
            return response()->json([
                'success' => false,
                'message' => 'Code MASSAR non trouvé.',
            ], 404);
        }

        return response()->json([
            'success'   => true,
            'candidate' => [
                'student_id'  => $candidate->id,
                'name'        => $candidate->user->name ?? 'N/A',
                'cne'         => $candidate->cne,
                'cin'         => $candidate->user->cin ?? 'N/A',
                'filiere_name' => $candidate->pathways->first()?->filiere?->name ?? 'TC',
                'apogee_code' => $candidate->student_number ?? 'Non attribué',
                'status'      => $candidate->status === 'active' ? 'INSCRIT_DEFINITIF' : 'ADMIS',
            ],
        ]);
    }

    /**
     * Statistiques d'inscription TAFEM.
     */
    public function getEnrollmentStats(): JsonResponse
    {
        $students = Student::with('user')->get();

        $inscrits = $students->filter(fn($s) => !empty($s->student_number) || $s->status === 'active');
        $preinscrits = $students->filter(fn($s) => empty($s->student_number) && $s->status === 'pre_inscri');
        $nonPreinscrits = $students->filter(fn($s) => empty($s->student_number) && !in_array($s->status, ['active', 'pre_inscri']));

        return response()->json([
            'success' => true,
            'summary' => [
                'total_admis_ministere'   => $students->count(),
                'inscrits_definitifs'     => $inscrits->count(),
                'preinscrits_sans_dossier' => $preinscrits->count(),
                'non_preinscrits'         => $nonPreinscrits->count(),
                'conversion_rate'         => $students->count() > 0
                    ? round(($inscrits->count() / $students->count()) * 100, 1) . '%'
                    : '0%',
            ],
        ]);
    }

    /**
     * Liste de sécurité pour le contrôle d'accès.
     */
    public function getSecurityDailyList(Request $request): JsonResponse
    {
        $date = $request->query('date', 'Mardi 28 Juillet 2026');
        $slots = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '14:00 - 15:00', '15:00 - 16:00'];
        $desks = ['Guichet N° 1', 'Guichet N° 2', 'Guichet N° 3'];

        $appointments = Student::with('user')
            ->get()
            ->map(function ($s, $idx) use ($date, $slots, $desks) {
                return [
                    'student_id'        => $s->id,
                    'name'              => $s->user->name ?? 'N/A',
                    'cne'               => $s->cne,
                    'cin'               => $s->user->cin ?? 'N/A',
                    'appointment_date'  => $date,
                    'time_slot'         => $slots[$idx % 5],
                    'desk'              => $desks[$idx % 3],
                    'authorized_entry'  => true,
                ];
            });

        return response()->json([
            'success'                => true,
            'title'                  => 'CONTRÔLE D\'ACCÈS — ' . strtoupper($date),
            'total_authorized_today'  => $appointments->count(),
            'appointments'           => $appointments,
        ]);
    }

    /**
     * Suivi du dossier candidat en temps réel.
     */
    public function trackCandidateDossier(Request $request): JsonResponse
    {
        $cne   = strtoupper(trim($request->query('cne', '')));
        $cin   = strtoupper(trim($request->query('cin', '')));
        $email = strtolower(trim($request->query('email', '')));

        if (empty($cne) && empty($cin) && empty($email)) {
            return response()->json(['success' => false, 'message' => 'CNE, CIN ou Email requis.'], 422);
        }

        // Chercher dans Applications
        $application = Application::where(function ($q) use ($cne, $cin, $email) {
            if ($cne) $q->where('cne', $cne);
            if ($cin) $q->orWhere('cin', $cin);
            if ($email) $q->orWhere('email', $email);
        })->first();

        if ($application) {
            return response()->json([
                'success'   => true,
                'found'     => true,
                'type'      => 'application',
                'candidate' => [
                    'id'     => $application->id,
                    'name'   => $application->first_name . ' ' . $application->last_name,
                    'cne'    => $application->cne,
                    'cin'    => $application->cin,
                    'email'  => $application->email,
                    'status' => $application->status,
                    'filiere' => $application->reference_number ?? 'TC',
                ],
            ]);
        }

        // Chercher dans Students
        $student = Student::with('user')
            ->where(function ($q) use ($cne, $cin) {
                if ($cne) $q->where('cne', $cne);
                if ($cin) $q->orWhereHas('user', fn($u) => $u->where('cin', $cin));
            })->first();

        if ($student) {
            return response()->json([
                'success'   => true,
                'found'     => true,
                'type'      => 'student',
                'candidate' => [
                    'id'          => $student->id,
                    'name'        => $student->user->name ?? 'N/A',
                    'cne'         => $student->cne,
                    'cin'         => $student->user->cin ?? 'N/A',
                    'apogee_code' => $student->student_number,
                    'status'      => $student->status,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'found'   => false,
            'message' => 'Aucun dossier trouvé.',
        ], 404);
    }

    /**
     * Promotion des candidats en liste d'attente.
     */
    public function promoteWaitingListCandidates(): JsonResponse
    {
        $waiting = Student::whereNull('student_number')
            ->where('status', '!=', 'active')
            ->limit(5)
            ->get();

        $promoted = [];
        foreach ($waiting as $student) {
            $student->update(['status' => 'pre_inscri']);
            $promoted[] = [
                'student_id' => $student->id,
                'name'       => $student->user->name ?? 'N/A',
                'cne'        => $student->cne,
                'status'     => 'CONVOQUE_LISTE_ATTENTE',
            ];
        }

        return response()->json([
            'success'             => true,
            'message'             => '5 candidats promus de la liste d\'attente.',
            'promoted_candidates' => $promoted,
        ]);
    }

    /**
     * Envoi email de convocation au candidat.
     */
    public function sendCandidateConvocationEmail(Request $request): JsonResponse
    {
        $cne   = strtoupper(trim($request->input('cne', '')));
        $cin   = strtoupper(trim($request->input('cin', '')));
        $email = trim($request->input('email', ''));

        $application = Application::where('cne', $cne)->orWhere('cin', $cin)->first();
        $targetEmail = $email ?: $application?->email;

        if (!$targetEmail) {
            return response()->json(['success' => false, 'message' => 'Email manquant.'], 422);
        }

        $name = $application ? ($application->first_name . ' ' . $application->last_name) : 'Candidat';

        Mail::to($targetEmail)->send(
            new \App\Mail\StudentRegistrationSuccessMail(
                $name,
                $cne ?: 'N142088916',
                $cin ?: 'C3967857',
                $application->reference_number ?? 'TC'
            )
        );

        return response()->json([
            'success' => true,
            'message' => 'Email envoyé à ' . $targetEmail,
        ]);
    }

    // ─── DOCUMENTS ────────────────────────────────────────────

    /**
     * Mettre à jour le dossier candidat.
     */
    public function updateCandidateDossier(Request $request): JsonResponse
    {
        $cne = trim($request->input('cne', ''));
        $cin = trim($request->input('cin', ''));

        if (empty($cne) && empty($cin)) {
            return response()->json(['success' => false, 'message' => 'CNE ou CIN requis.'], 422);
        }

        $fields = $request->only([
            'first_name', 'last_name', 'email', 'phone',
            'birth_date', 'birth_city', 'nationality',
            'address', 'city', 'region',
        ]);

        $filtered = array_filter($fields, fn($v) => $v !== null);

        if (!empty($filtered)) {
            Application::where('cne', $cne)->orWhere('cin', $cin)->update($filtered);
            Student::where('cne', $cne)->update($filtered);
        }

        return response()->json([
            'success' => true,
            'message' => 'Dossier mis à jour.',
        ]);
    }

    /**
     * Upload document candidat.
     */
    public function uploadCandidateDocument(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png',
            'type' => 'required|string|in:bac,cnie,photo,releve_notes,cin,cin_recto_verso',
            'cne'  => 'nullable|string',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');
        $cne  = $request->input('cne');

        $path = $file->store('private_candidate_documents', 'local');

        StudentDocument::updateOrCreate(
            ['cne' => $cne, 'type' => $type],
            [
                'file_path'         => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type'         => $file->getMimeType(),
                'file_size'         => $file->getSize(),
                'status'            => 'pending',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Document '{$type}' uploadé avec succès.",
        ]);
    }

    /**
     * Servir un document privé.
     */
    public function serveCandidateDocument(string $type, string $cne): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié.'], 401);
        }

        $document = StudentDocument::where('cne', $cne)->where('type', $type)->first();

        if (!$document || !Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['success' => false, 'message' => 'Document introuvable.'], 404);
        }

        return response()->file(Storage::disk('local')->path($document->file_path), [
            'Content-Type' => $document->mime_type,
        ]);
    }

    /**
     * Supprimer un document candidat.
     */
    public function deleteCandidateDocument(Request $request): JsonResponse
    {
        $request->validate([
            'cne'  => 'nullable|string',
            'type' => 'required|string',
        ]);

        StudentDocument::where('cne', $request->input('cne'))
            ->where('type', $request->input('type'))
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document supprimé.',
        ]);
    }

    /**
     * Extraction OCR via Gemini AI.
     */
    public function extractDocumentDataOcr(Request $request): JsonResponse
    {
        $request->validate([
            'file'     => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png',
            'doc_type' => 'nullable|string',
        ]);

        $file    = $request->file('file');
        $docType = $request->input('doc_type', $request->input('type', 'bac'));

        $ocrData = $this->geminiService->extractDocumentOcr(
            $file->getRealPath(),
            $file->getClientMimeType() ?: 'application/pdf',
            $file->getClientOriginalName(),
            $docType
        );

        if (empty($ocrData)) {
            return response()->json([
                'success' => false,
                'message' => 'Extraction OCR impossible.',
            ]);
        }

        return response()->json([
            'success'   => true,
            'message'   => 'Extraction réussie.',
            'ocr_data'  => $ocrData,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}