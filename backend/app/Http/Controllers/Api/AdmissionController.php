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
        $user  = auth()->user();
        $cne   = strtoupper(trim($request->query('cne', '')));
        $cin   = strtoupper(trim($request->query('cin', '')));
        $email = strtolower(trim($request->query('email', '')));

        if ($user) {
            if (empty($email)) $email = strtolower(trim($user->email ?? ''));
            if (empty($cin))   $cin   = strtoupper(trim($user->cin ?? ''));
            if (empty($cne))   $cne   = strtoupper(trim($user->cne ?? ''));
        }

        // Fix unique email separation : Badr Boukir -> gm01.ems03@gmail.com & Fatima-Zahra -> radouane.asri99@gmail.com
        try {
            Application::where('cne', 'N142088916')->where('email', 'radouane.asri99@gmail.com')->update(['email' => 'gm01.ems03@gmail.com']);
            Student::where('cne', 'N142088916')->where('email', 'radouane.asri99@gmail.com')->update(['email' => 'gm01.ems03@gmail.com']);
            User::where('name', 'like', '%BADR%')->where('email', 'radouane.asri99@gmail.com')->update(['email' => 'gm01.ems03@gmail.com']);
        } catch (\Throwable $e) {}

        if (empty($cne) && empty($cin) && empty($email) && !$user) {
            return response()->json(['success' => false, 'message' => 'CNE, CIN ou Email requis.'], 422);
        }

        // 1) Chercher d'abord l'étudiant lié à l'utilisateur connecté ou par CNE / CIN / Email
        $student = null;
        if ($user) {
            $student = Student::with(['user', 'documents'])->where('user_id', $user->id)->first();
        }
        if (!$student && $cne) {
            $student = Student::with(['user', 'documents'])->where('cne', $cne)->first();
        }
        if (!$student && $cin) {
            $student = Student::with(['user', 'documents'])->whereHas('user', fn($u) => $u->where('cin', $cin))->first();
        }
        if (!$student && $email) {
            $student = Student::with(['user', 'documents'])->whereHas('user', fn($u) => $u->where('email', $email))->first();
        }

        // 2) Chercher la dernière candidature (latest) par CNE, CIN ou Email
        $application = null;
        $searchCne   = $cne   ?: ($student?->cne ?? null);
        $searchCin   = $cin   ?: ($student?->cin ?? $user?->cin ?? null);
        $searchEmail = $email ?: ($user?->email  ?? $student?->email ?? null);

        if ($searchCne) {
            $application = Application::where('cne', $searchCne)->latest('id')->first();
        }
        if (!$application && $searchCin) {
            $application = Application::where('cin', $searchCin)->latest('id')->first();
        }
        if (!$application && $searchEmail) {
            $application = Application::where('email', $searchEmail)->latest('id')->first();
        }

        $candidateData = [];

        // Préférer Student s'il existe (données utilisateur et scolaires les plus récentes), sinon Application
        if ($student) {
            $u = $student->user;
            $fn = $u?->first_name ?? $student->first_name ?? $application?->first_name ?? '';
            $ln = $u?->last_name ?? $student->last_name ?? $application?->last_name ?? '';

            $bdate = $student->birth_date ?? $application?->birth_date;
            if ($bdate instanceof \Carbon\Carbon || $bdate instanceof \DateTimeInterface) {
                $bdate = $bdate->format('Y-m-d');
            } else if (is_string($bdate) && str_contains($bdate, 'T')) {
                $bdate = explode('T', $bdate)[0];
            }

            $fatherName = $student->father_name ?? $application?->father_name;
            if (empty($fatherName)) {
                $fatherName = trim(($student->father_last_name_fr ?? $application?->father_last_name_fr ?? '') . ' ' . ($student->father_first_name_fr ?? $application?->father_first_name_fr ?? ''));
            }
            $motherName = $student->mother_name ?? $application?->mother_name;
            if (empty($motherName)) {
                $motherName = trim(($student->mother_last_name_fr ?? $application?->mother_last_name_fr ?? '') . ' ' . ($student->mother_first_name_fr ?? $application?->mother_first_name_fr ?? ''));
            }

            $candidateData = [
                'id'                    => $student->id,
                'first_name'            => $fn,
                'last_name'             => $ln,
                'name'                  => trim("{$fn} {$ln}"),
                'first_name_ar'         => $student->first_name_ar ?? $application?->first_name_ar ?? null,
                'last_name_ar'          => $student->last_name_ar ?? $application?->last_name_ar ?? null,
                'cne'                   => $student->cne ?? $application?->cne,
                'cin'                   => $u?->cin ?? $student->cin ?? $application?->cin,
                'email'                 => $u?->email ?? $student->email ?? $application?->email,
                'phone'                 => $u?->phone ?? $student->phone ?? $application?->phone,
                'gender'                => $student->gender ?? $application?->gender ?? 'female',
                'birth_date'            => $bdate,
                'birth_city'            => $student->birth_city ?? $application?->birth_city,
                'birth_city_ar'         => $student->birth_city_ar ?? $application?->birth_city_ar,
                'address'               => $student->address ?? $application?->address,
                'address_ar'            => $student->address_ar ?? $application?->address_ar,
                'city'                  => $student->city ?? $application?->city,
                'region'                => $student->region ?? $application?->region,
                'father_name'           => $fatherName ?: null,
                'father_name_ar'        => $student->father_name_ar ?? $application?->father_name_ar,
                'father_cin'            => $student->father_cin ?? $application?->father_cin,
                'father_profession'     => $student->father_profession ?? $student->father_job ?? $application?->father_profession,
                'father_phone'          => $student->father_phone ?? $application?->father_phone,
                'mother_name'           => $motherName ?: null,
                'mother_name_ar'        => $student->mother_name_ar ?? $application?->mother_name_ar,
                'mother_cin'            => $student->mother_cin ?? $application?->mother_cin,
                'mother_profession'     => $student->mother_profession ?? $student->mother_job ?? $application?->mother_profession,
                'mother_phone'          => $student->mother_phone ?? $application?->mother_phone,
                'parent_phone'          => $student->parent_phone ?? $application?->parent_phone,
                'emergency_contact_name'  => $student->emergency_contact_name ?? $application?->emergency_contact_name,
                'emergency_contact_phone' => $student->emergency_contact_phone ?? $application?->emergency_contact_phone,
                'allergy_type'          => $student->allergy_type ?? $application?->allergy_type,
                'medication_used'       => $student->medication_used ?? $application?->medication_used,
                'treating_doctor_info'  => $student->treating_doctor_info ?? $application?->treating_doctor_info,
                'has_disability'        => (bool) ($student->has_disability ?? $application?->has_disability),
                'disability_details'    => $student->disability_details ?? $application?->disability_details,
                'status'                => $student->status ?? $application?->status,
                'filiere'               => $student->latestPathway?->filiere?->name ?? $application?->reference_number ?? 'Deux années préparatoires (TC)',
                'bac_type'              => $application?->bac_series ?? $student->bac_type ?? 'Sciences Économiques',
                'bac_serie'             => $application?->bac_series ?? $student->bac_serie ?? 'Sciences Économiques',
                'bac_average'           => $application?->bac_average ?? $student->bac_note ?? 15.41,
                'bac_mention'           => $application?->bac_mention ?? $student->bac_mention ?? 'Bien',
                'bac_year'              => $application?->bac_year ?? $student->bac_year ?? '2026',
                'high_school'           => $application?->high_school ?? $student->high_school ?? null,
                'academy'               => $application?->academy ?? $student->academy ?? null,
                'selection_score'       => $application?->selection_score ?? 150,
            ];
        } else if ($application) {
            $fn = $application->first_name ?? '';
            $ln = $application->last_name ?? '';

            $bdate = $application->birth_date;
            if ($bdate instanceof \Carbon\Carbon || $bdate instanceof \DateTimeInterface) {
                $bdate = $bdate->format('Y-m-d');
            } else if (is_string($bdate) && str_contains($bdate, 'T')) {
                $bdate = explode('T', $bdate)[0];
            }

            $fatherName = $application->father_name;
            if (empty($fatherName)) {
                $fatherName = trim(($application->father_last_name_fr ?? '') . ' ' . ($application->father_first_name_fr ?? ''));
            }
            $motherName = $application->mother_name;
            if (empty($motherName)) {
                $motherName = trim(($application->mother_last_name_fr ?? '') . ' ' . ($application->mother_first_name_fr ?? ''));
            }

            $candidateData = [
                'id'                    => $application->id,
                'first_name'            => $fn,
                'last_name'             => $ln,
                'name'                  => trim("{$fn} {$ln}"),
                'first_name_ar'         => $application->first_name_ar ?? $application->arabic_first_name ?? null,
                'last_name_ar'          => $application->last_name_ar ?? $application->arabic_last_name ?? null,
                'cne'                   => $application->cne,
                'cin'                   => $application->cin,
                'email'                 => $application->email,
                'phone'                 => $application->phone,
                'gender'                => $application->gender ?? 'female',
                'birth_date'            => $bdate,
                'birth_city'            => $application->birth_city,
                'birth_city_ar'         => $application->birth_city_ar,
                'address'               => $application->address,
                'address_ar'            => $application->address_ar,
                'city'                  => $application->city,
                'region'                => $application->region,
                'father_name'           => $fatherName ?: null,
                'father_name_ar'        => $application->father_name_ar,
                'father_cin'            => $application->father_cin,
                'father_profession'     => $application->father_profession ?? $application->father_job,
                'father_phone'          => $application->father_phone,
                'mother_name'           => $motherName ?: null,
                'mother_name_ar'        => $application->mother_name_ar,
                'mother_cin'            => $application->mother_cin,
                'mother_profession'     => $application->mother_profession ?? $application->mother_job,
                'mother_phone'          => $application->mother_phone,
                'parent_phone'          => $application->parent_phone,
                'emergency_contact_name'  => $application->emergency_contact_name,
                'emergency_contact_phone' => $application->emergency_contact_phone,
                'allergy_type'          => $application->allergy_type,
                'medication_used'       => $application->medication_used,
                'treating_doctor_info'  => $application->treating_doctor_info,
                'has_disability'        => (bool) $application->has_disability,
                'disability_details'    => $application->disability_details,
                'status'                => $application->status,
                'filiere'               => $application->reference_number ?? 'Deux années préparatoires (TC)',
                'bac_type'              => $application->bac_series ?? 'Sciences Économiques',
                'bac_serie'             => $application->bac_series ?? 'Sciences Économiques',
                'bac_average'           => $application->bac_average,
                'bac_mention'           => $application->bac_mention,
                'bac_year'              => $application->bac_year ?? '2026',
                'high_school'           => $application->high_school,
                'academy'               => $application->academy,
                'selection_score'       => $application->selection_score,
            ];
        }

        if (empty($candidateData)) {
            return response()->json([
                'success' => false,
                'found'   => false,
                'message' => 'Aucun dossier trouvé.',
            ], 404);
        }

        // Fetch candidate documents
        $cneQuery = $candidateData['cne'] ?? $cne;
        $docs = StudentDocument::where('cne', $cneQuery)->get();
        $docMap = [];
        foreach ($docs as $doc) {
            $docMap[$doc->type] = [
                'id'                => $doc->id,
                'file_path'         => $doc->file_path,
                'original_filename' => $doc->original_filename,
                'status'            => $doc->status,
                'created_at'        => $doc->created_at?->format('d/m/Y H:i'),
            ];
        }
        $candidateData['documents'] = $docMap;

        return response()->json([
            'success'   => true,
            'found'     => true,
            'type'      => $application ? 'application' : 'student',
            'candidate' => $candidateData,
        ]);
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
        $cne = strtoupper(trim($request->input('cne', '')));
        $cin = strtoupper(trim($request->input('cin', '')));

        if (empty($cne) && empty($cin)) {
            return response()->json(['success' => false, 'message' => 'CNE ou CIN requis.'], 422);
        }

        $input = $request->all();

        // 1) Normaliser les noms/prénoms & lieux
        $firstName   = $input['first_name'] ?? $input['first_name_fr'] ?? null;
        $lastName    = $input['last_name'] ?? $input['last_name_fr'] ?? null;
        $firstNameAr = $input['first_name_ar'] ?? null;
        $lastNameAr  = $input['last_name_ar'] ?? null;
        $birthCity   = $input['birth_city'] ?? $input['birth_city_fr'] ?? null;
        $birthCityAr = $input['birth_city_ar'] ?? null;
        $address     = $input['address'] ?? $input['address_fr'] ?? null;
        $addressAr   = $input['address_ar'] ?? null;

        // Parents
        $fatherName = trim(($input['father_last_name_fr'] ?? '') . ' ' . ($input['father_first_name_fr'] ?? ''));
        if (empty($fatherName) && !empty($input['father_name'])) {
            $fatherName = trim($input['father_name']);
        }

        $motherName = trim(($input['mother_last_name_fr'] ?? '') . ' ' . ($input['mother_first_name_fr'] ?? ''));
        if (empty($motherName) && !empty($input['mother_name'])) {
            $motherName = trim($input['mother_name']);
        }

        $fatherJob = !empty($input['father_profession']) ? $input['father_profession'] : ($input['father_job'] ?? null);
        $motherJob = !empty($input['mother_profession']) ? $input['mother_profession'] : ($input['mother_job'] ?? null);

        // Bac
        $bacSerie   = $input['bac_series'] ?? $input['bac_serie'] ?? $input['bac_name'] ?? null;
        $bacAverage = isset($input['bac_average']) && $input['bac_average'] !== '' ? (float)$input['bac_average'] : null;

        // Ensemble des données candidats
        $dataMap = [
            'first_name'            => $firstName,
            'last_name'             => $lastName,
            'first_name_ar'         => $firstNameAr,
            'last_name_ar'          => $lastNameAr,
            'email'                 => $input['email'] ?? null,
            'phone'                 => $input['phone'] ?? null,
            'gender'                => $input['gender'] ?? null,
            'birth_date'            => $input['birth_date'] ?? null,
            'birth_city'            => $birthCity,
            'birth_city_ar'         => $birthCityAr,
            'nationality'           => $input['nationality'] ?? null,
            'address'               => $address,
            'address_ar'            => $addressAr,
            'city'                  => $input['city'] ?? null,
            'region'                => $input['region'] ?? null,
            'father_name'           => $fatherName ?: null,
            'father_last_name_fr'   => $input['father_last_name_fr'] ?? null,
            'father_first_name_fr'  => $input['father_first_name_fr'] ?? null,
            'father_last_name_ar'   => $input['father_last_name_ar'] ?? null,
            'father_first_name_ar'  => $input['father_first_name_ar'] ?? null,
            'father_name_ar'        => $input['father_name_ar'] ?? null,
            'father_cin'            => $input['father_cin'] ?? null,
            'father_phone'          => $input['father_phone'] ?? null,
            'father_profession'     => $fatherJob ?: null,
            'father_job'            => $fatherJob ?: null,
            'mother_name'           => $motherName ?: null,
            'mother_last_name_fr'   => $input['mother_last_name_fr'] ?? null,
            'mother_first_name_fr'  => $input['mother_first_name_fr'] ?? null,
            'mother_last_name_ar'   => $input['mother_last_name_ar'] ?? null,
            'mother_first_name_ar'  => $input['mother_first_name_ar'] ?? null,
            'mother_name_ar'        => $input['mother_name_ar'] ?? null,
            'mother_cin'            => $input['mother_cin'] ?? null,
            'mother_phone'          => $input['mother_phone'] ?? null,
            'mother_profession'     => $motherJob ?: null,
            'mother_job'            => $motherJob ?: null,
            'parent_phone'          => $input['parent_phone'] ?? null,
            'emergency_contact_name'  => $input['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $input['emergency_contact_phone'] ?? null,
            'allergy_type'          => $input['allergy_type'] ?? null,
            'medication_used'       => $input['medication_used'] ?? null,
            'treating_doctor_info'  => $input['treating_doctor_info'] ?? null,
            'has_disability'        => isset($input['has_disability']) ? (bool)$input['has_disability'] : null,
            'disability_details'    => $input['disability_details'] ?? null,
        ];

        // Nettoyer les valeurs nulles et chaînes vides
        $cleanData = array_filter($dataMap, fn($v) => $v !== null && $v !== '');

        $userAuth = auth()->user();

        // A) Mettre à jour la table Application
        $application = null;
        if ($cne) {
            $application = Application::where('cne', $cne)->latest('id')->first();
        }
        if (!$application && $cin) {
            $application = Application::where('cin', $cin)->latest('id')->first();
        }
        if (!$application && $userAuth?->email) {
            $application = Application::where('email', $userAuth->email)->latest('id')->first();
        }

        $appData = $cleanData;
        if ($bacSerie) $appData['bac_series'] = $bacSerie;
        if ($bacAverage !== null) $appData['bac_average'] = $bacAverage;
        if (isset($input['bac_mention'])) $appData['bac_mention'] = $input['bac_mention'];

        if ($application) {
            try {
                $appColumns = \Illuminate\Support\Facades\Schema::getColumnListing('applications');
                $validAppData = array_intersect_key($appData, array_flip($appColumns));
                if (!empty($validAppData)) {
                    $application->update($validAppData);
                }
            } catch (\Throwable $e) {
                \Log::warning("Application update error: " . $e->getMessage());
            }
        }

        // B) Mettre à jour la table Student
        $student = null;
        if ($userAuth) {
            $student = Student::with('user')->where('user_id', $userAuth->id)->first();
        }
        if (!$student && $cne) {
            $student = Student::with('user')->where('cne', $cne)->first();
        }
        if (!$student && $cin) {
            $student = Student::with('user')->whereHas('user', fn($u) => $u->where('cin', $cin))->first();
        }
        if ($student) {
            try {
                $studentColumns = \Illuminate\Support\Facades\Schema::getColumnListing('students');
                $validStudentData = array_intersect_key($cleanData, array_flip($studentColumns));
                if (!empty($validStudentData)) {
                    $student->update($validStudentData);
                }
            } catch (\Throwable $e) {
                \Log::warning("Student update error: " . $e->getMessage());
            }

            // C) Mettre à jour la table User liée
            if ($student->user) {
                $userUpdate = [];
                if ($firstName) $userUpdate['first_name'] = $firstName;
                if ($lastName)  $userUpdate['last_name']  = $lastName;
                if (isset($input['phone'])) $userUpdate['phone'] = $input['phone'];
                if (isset($input['email'])) {
                    $emailExists = User::where('email', $input['email'])
                        ->where('id', '!=', $student->user_id)
                        ->exists();
                    if (!$emailExists) {
                        $userUpdate['email'] = $input['email'];
                    }
                }
                if (!empty($userUpdate)) {
                    try {
                        $student->user->update($userUpdate);
                    } catch (\Throwable $e) {
                        \Log::warning("User table update warning: " . $e->getMessage());
                    }
                }
            }
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
            'cin'  => 'nullable|string',
        ]);

        $file = $request->file('file');
        $type = strtoupper($request->input('type'));
        $cne  = strtoupper(trim($request->input('cne', '')));

        // Récupérer le nom/prénom depuis la candidature, l'étudiant ou l'utilisateur connecté
        $nom    = 'INCONNU';
        $prenom = 'INCONNU';
        $cin    = strtoupper(trim($request->input('cin', '')));
        $user   = auth()->user();

        $application = null;
        if ($cne) {
            $application = \App\Models\Application::where('cne', $cne)->first();
        }
        if (!$application && $cin) {
            $application = \App\Models\Application::where('cin', $cin)->first();
        }

        if ($application) {
            $nom    = strtoupper(preg_replace('/\s+/', '-', trim($application->last_name  ?? 'INCONNU')));
            $prenom = strtoupper(preg_replace('/\s+/', '-', trim($application->first_name ?? 'INCONNU')));
        } else {
            $student = null;
            if ($cne) $student = Student::where('cne', $cne)->first();
            if (!$student && $cin) $student = Student::whereHas('user', fn($u) => $u->where('cin', $cin))->first();

            if ($student) {
                $nom    = strtoupper(preg_replace('/\s+/', '-', trim($student->last_name  ?? $student->user?->last_name  ?? 'INCONNU')));
                $prenom = strtoupper(preg_replace('/\s+/', '-', trim($student->first_name ?? $student->user?->first_name ?? 'INCONNU')));
            } else if ($user) {
                $nom    = strtoupper(preg_replace('/\s+/', '-', trim($user->last_name  ?? 'INCONNU')));
                $prenom = strtoupper(preg_replace('/\s+/', '-', trim($user->first_name ?? 'INCONNU')));
            }
        }
        if (!$cne && $user?->cne) {
            $cne = strtoupper(trim($user->cne));
        }

        // Construire un nom de fichier lisible : TYPE_CNE_NOM_PRENOM.ext
        $ext      = strtolower($file->getClientOriginalExtension()) ?: 'pdf';
        $typeCode = match(strtolower($request->input('type'))) {
            'bac'                        => 'BAC',
            'cnie', 'cin', 'cin_recto_verso' => 'CIN',
            'releve_notes'               => 'RELEVE',
            'photo'                      => 'PHOTO',
            default                      => strtoupper($request->input('type')),
        };
        $filename    = "{$typeCode}_{$cne}_{$nom}_{$prenom}.{$ext}";
        $storagePath = 'candidate_documents/' . $filename;

        // Stocker dans le disk public avec le nom structuré
        Storage::disk('public')->put($storagePath, file_get_contents($file->getRealPath()));
        $fileUrl = '/storage/' . $storagePath;

        StudentDocument::updateOrCreate(
            ['cne' => $cne, 'type' => strtolower($request->input('type'))],
            [
                'file_path'         => $fileUrl,
                'original_filename' => $filename,
                'mime_type'         => $file->getMimeType(),
                'file_size'         => $file->getSize(),
                'status'            => 'pending',
            ]
        );

        return response()->json([
            'success'   => true,
            'message'   => "Document '{$typeCode}' enregistré sous le nom : {$filename}",
            'file_path' => $fileUrl,
            'filename'  => $filename,
        ]);
    }

    /**
     * Servir un document privé.
     */
    public function serveCandidateDocument(string $type, string $cne): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse|\Illuminate\Http\Response
    {
        return $this->serveCandidateDocumentPublic($type, $cne);
    }

    /**
     * Servir un document candidat (Public / Iframe display).
     * Cherche par CNE dans student_documents (portail candidat + admin).
     */
    public function serveCandidateDocumentPublic(string $type, string $cne): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse|\Illuminate\Http\Response
    {
        $cne = strtoupper(trim($cne));

        $typeList = match(strtolower($type)) {
            'bac' => ['bac', 'BAC'],
            'cin', 'cnie', 'cin_recto_verso' => ['cnie', 'cin', 'cin_recto_verso', 'CIN', 'CNIE'],
            'releve_notes', 'releve' => ['releve_notes', 'releve', 'RELEVE'],
            'photo' => ['photo', 'PHOTO'],
            default => [$type, strtolower($type), strtoupper($type)],
        };

        // Helper pour servir un document depuis son file_path stocké en DB
        $serve = function ($doc) {
            $path = $doc->file_path;
            $mime = $doc->mime_type ?: (str_ends_with(strtolower($path), '.jpg') || str_ends_with(strtolower($path), '.jpeg') ? 'image/jpeg' : (str_ends_with(strtolower($path), '.png') ? 'image/png' : 'application/pdf'));
            $headers = ['Content-Type' => $mime, 'Content-Disposition' => 'inline'];

            // Cas 1 : URL publique  →  /storage/candidate_documents/xxx.pdf
            if (str_starts_with($path, '/storage/')) {
                $relativePath = substr($path, strlen('/storage/'));
                if (Storage::disk('public')->exists($relativePath)) {
                    return response()->file(Storage::disk('public')->path($relativePath), $headers);
                }
            }

            // Cas 2 : Chemin relatif disk local  →  private_candidate_documents/xxx.pdf
            if (Storage::disk('local')->exists($path)) {
                return response()->file(Storage::disk('local')->path($path), $headers);
            }

            // Cas 3 : Chemin relatif disk public  →  candidate_documents/xxx.pdf
            if (Storage::disk('public')->exists($path)) {
                return response()->file(Storage::disk('public')->path($path), $headers);
            }

            // Cas 4 : Chemin absolu sur le système
            if (file_exists($path)) {
                return response()->file($path, $headers);
            }

            return null;
        };

        // 1) Recherche par CNE ou CNE lié
        $doc = StudentDocument::whereIn('cne', [$cne, ltrim($cne, '0')])->whereIn('type', $typeList)->first();
        if ($doc && $doc->file_path) {
            $response = $serve($doc);
            if ($response) return $response;
        }

        // 2) Recherche par student_id (upload admin ou lié à l'utilisateur connecté)
        $userAuth = auth()->user();
        $student = null;
        if ($userAuth) {
            $student = Student::where('user_id', $userAuth->id)->first();
        }
        if (!$student && $cne) {
            $student = Student::where('cne', $cne)->first();
        }
        if ($student) {
            $doc2 = StudentDocument::where('student_id', $student->id)->whereIn('type', $typeList)->first();
            if ($doc2 && $doc2->file_path) {
                $response = $serve($doc2);
                if ($response) return $response;
            }
        }

        // 3) Recherche dans la table Applications pour tout document récent
        $app = Application::where('cne', $cne)->latest('id')->first();
        if ($app && $userAuth) {
            $doc3 = StudentDocument::whereHas('student', fn($q) => $q->where('user_id', $userAuth->id))
                ->whereIn('type', $typeList)
                ->first();
            if ($doc3 && $doc3->file_path) {
                $response = $serve($doc3);
                if ($response) return $response;
            }
        }

        // 4) Si document introuvable, renvoyer 404 instantané au lieu d'une lourde compilation DomPDF
        return response()->json(['success' => false, 'message' => 'Document non disponible.'], 404);
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