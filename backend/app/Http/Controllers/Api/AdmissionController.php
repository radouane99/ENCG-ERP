<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Jobs\ProcessOcrDocumentJob;
use App\Mail\StudentRegistrationSuccessMail;
use App\Models\AcademicYear;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Institution;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\User;
use App\Services\Academic\AdmissionService;
use App\Services\AI\GeminiApiService;
use App\Services\Ocr\OcrExtractionService;
use App\Support\CandidateDossierGate;
use App\Support\SignedDocumentUrl;
use App\Support\TemporaryPassword;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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
            'data' => $applications,
            'stats' => [
                'total' => $applications->count(),
                'pending' => $applications->where('status', 'pending')->count(),
                'accepted' => $applications->where('status', 'accepted')->count(),
                'rejected' => $applications->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Créer une nouvelle candidature.
     */
    public function store(StoreApplicationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $cneClean = strtoupper(trim($data['cne'] ?? ''));
        $cinClean = strtoupper(trim($data['cin'] ?? ''));
        $refNumber = 'TAFEM-'.date('Y').'-'.strtoupper(substr(md5(($cneClean ?: uniqid()).microtime()), 0, 6));

        $campaign = AdmissionCampaign::first();
        $campaignId = $campaign?->id ?? 1;

        $application = Application::create([
            'admission_campaign_id' => $campaignId,
            'reference_number' => $refNumber,
            'first_name' => $data['first_name'] ?? '',
            'last_name' => $data['last_name'] ?? '',
            'cne' => $cneClean,
            'cin' => $cinClean,
            'email' => $data['email'] ?? ($cneClean ? strtolower($cneClean).'@candidat.tafem.ma' : null),
            'phone' => $data['phone'] ?? null,
            'bac_average' => ! empty($data['bac_average']) ? (float) $data['bac_average'] : null,
            'selection_score' => ! empty($data['selection_score']) ? (float) $data['selection_score'] : null,
            'status' => $data['status'] ?? 'submitted',
        ]);

        // Créer le User + Student associé
        if (! empty($cneClean)) {
            $institutionId = Institution::first()?->id ?? 1;

            $user = User::firstOrCreate(
                ['email' => strtolower($cneClean).'@candidat.tafem.ma'],
                [
                    'name' => trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? '')),
                    'first_name' => $data['first_name'] ?? '',
                    'last_name' => $data['last_name'] ?? '',
                    'cin' => $cinClean,
                    'password' => TemporaryPassword::hash(),
                    'must_change_password' => true,
                    'institution_id' => $institutionId,
                    'is_active' => true,
                ]
            );

            Student::updateOrCreate(
                ['cne' => $cneClean],
                [
                    'institution_id' => $institutionId,
                    'user_id' => $user->id,
                    'student_number' => $cneClean,
                    'gender' => 'M',
                    'birth_date' => '2006-01-01',
                    'nationality' => 'Marocaine',
                    'status' => 'pending',
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Candidature enregistrée avec succès.',
            'data' => $application,
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
            'data' => $application,
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
            'data' => $application,
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
                    'id' => $student->id,
                    'rank' => $idx + 1,
                    'list_type' => $idx < 12 ? 'LISTE_PRINCIPALE' : 'LISTE_ATTENTE',
                    'name' => $student->user->name ?? 'N/A',
                    'cne' => $student->cne ?? ('K'.rand(10000000, 99999999)),
                    'apogee_code' => $student->student_number ?? 'En attente',
                    'physical_dossier_status' => $student->student_number ? 'DOSSIER_CONFORME' : 'EN_ATTENTE_DEPOT',
                ];
            });

        return response()->json([
            'success' => true,
            'source' => 'Ministère MESRSFC — TAFEM 2026',
            'stats' => [
                'total_affectes' => $candidates->count(),
                'liste_principale' => $candidates->where('list_type', 'LISTE_PRINCIPALE')->count(),
                'liste_attente' => $candidates->where('list_type', 'LISTE_ATTENTE')->count(),
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
            'student_id' => 'required|integer',
            'bac_original' => 'required|boolean',
            'releve_notes' => 'required|boolean',
            'cin_copy' => 'required|boolean',
            'photos' => 'required|boolean',
            'filiere_id' => 'nullable|integer',
        ]);

        $isComplete = $validated['bac_original'] && $validated['releve_notes']
            && $validated['cin_copy'] && $validated['photos'];

        if (! $isComplete) {
            return response()->json([
                'success' => false,
                'message' => 'Dossier physique incomplet.',
            ], 422);
        }

        $apogeeCode = '26'.str_pad((string) $validated['student_id'], 6, '0', STR_PAD_LEFT);

        $student = Student::findOrFail($validated['student_id']);
        $student->update([
            'student_number' => $apogeeCode,
            'status' => 'active',
        ]);

        if ($validated['filiere_id']) {
            $student->pathways()->updateOrCreate(
                ['is_current' => true],
                [
                    'filiere_id' => $validated['filiere_id'],
                    'academic_year_id' => AcademicYear::where('is_current', true)->value('id') ?? 1,
                    'current_semester' => 1,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Dossier vérifié ! Code APOGEE généré.',
            'data' => [
                'student_id' => $student->id,
                'student_name' => $student->user->name ?? 'N/A',
                'apogee_code' => $apogeeCode,
                'status' => 'INSCRIT_DEFINITIF',
            ],
        ]);
    }

    /**
     * Pré-inscription en ligne par le candidat admis.
     */
    public function submitOnlinePreinscription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'cne' => 'required|string',
            'cin' => 'required|string',
            'filiere_id' => 'nullable|integer',
            'phone' => 'nullable|string',
        ]);

        $cneUpper = strtoupper(trim($validated['cne']));

        $student = Student::where('cne', $cneUpper)
            ->orWhere('cin', strtoupper($validated['cin']))
            ->first();

        if ($student) {
            $student->update(['status' => 'pre_inscri']);
        } else {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => TemporaryPassword::hash(),
                'must_change_password' => true,
            ]);

            $student = Student::create([
                'user_id' => $user->id,
                'cne' => $cneUpper,
                'cin' => strtoupper($validated['cin']),
                'institution_id' => Institution::first()?->id ?? 1,
                'status' => 'pre_inscri',
            ]);
        }

        $dates = ['Mardi 28 Juillet 2026', 'Mercredi 29 Juillet 2026', 'Jeudi 30 Juillet 2026'];
        $slots = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '14:00 - 15:00', '15:00 - 16:00'];
        $desks = ['Guichet N° 1', 'Guichet N° 2', 'Guichet N° 3'];

        return response()->json([
            'success' => true,
            'message' => 'Pré-inscription effectuée avec succès.',
            'data' => [
                'student_id' => $student->id,
                'candidate_name' => $validated['name'],
                'cne' => $cneUpper,
                'appointment' => [
                    'date' => $dates[$student->id % 3],
                    'time_slot' => $slots[$student->id % 5],
                    'desk' => $desks[$student->id % 3],
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
            ->orWhereHas('user', fn ($q) => $q->where('cin', $cleanToken))
            ->first();

        if (! $candidate) {
            return response()->json([
                'success' => false,
                'message' => 'Code MASSAR non trouvé.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'candidate' => [
                'student_id' => $candidate->id,
                'name' => $candidate->user->name ?? 'N/A',
                'cne' => $candidate->cne,
                'cin' => $candidate->user->cin ?? 'N/A',
                'filiere_name' => $candidate->pathways->first()?->filiere?->name ?? 'TC',
                'apogee_code' => $candidate->student_number ?? 'Non attribué',
                'status' => $candidate->status === 'active' ? 'INSCRIT_DEFINITIF' : 'ADMIS',
            ],
        ]);
    }

    /**
     * Statistiques d'inscription TAFEM.
     */
    public function getEnrollmentStats(): JsonResponse
    {
        $students = Student::with('user')->get();

        $inscrits = $students->filter(fn ($s) => ! empty($s->student_number) || $s->status === 'active');
        $preinscrits = $students->filter(fn ($s) => empty($s->student_number) && $s->status === 'pre_inscri');
        $nonPreinscrits = $students->filter(fn ($s) => empty($s->student_number) && ! in_array($s->status, ['active', 'pre_inscri']));

        return response()->json([
            'success' => true,
            'summary' => [
                'total_admis_ministere' => $students->count(),
                'inscrits_definitifs' => $inscrits->count(),
                'preinscrits_sans_dossier' => $preinscrits->count(),
                'non_preinscrits' => $nonPreinscrits->count(),
                'conversion_rate' => $students->count() > 0
                    ? round(($inscrits->count() / $students->count()) * 100, 1).'%'
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
                    'student_id' => $s->id,
                    'name' => $s->user->name ?? 'N/A',
                    'cne' => $s->cne,
                    'cin' => $s->user->cin ?? 'N/A',
                    'appointment_date' => $date,
                    'time_slot' => $slots[$idx % 5],
                    'desk' => $desks[$idx % 3],
                    'authorized_entry' => true,
                ];
            });

        return response()->json([
            'success' => true,
            'title' => 'CONTRÔLE D\'ACCÈS — '.strtoupper($date),
            'total_authorized_today' => $appointments->count(),
            'appointments' => $appointments,
        ]);
    }

    private function ensureSchemaColumnsExist(): void
    {
        try {
            if (! Schema::hasColumn('applications', 'high_school')) {
                Schema::table('applications', function (Blueprint $table) {
                    if (! Schema::hasColumn('applications', 'high_school')) {
                        $table->string('high_school')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'lycee')) {
                        $table->string('lycee')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'academy')) {
                        $table->string('academy')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'delegation')) {
                        $table->string('delegation')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'province')) {
                        $table->string('province')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'bac_year')) {
                        $table->string('bac_year')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'bac_type')) {
                        $table->string('bac_type')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'bac_serie')) {
                        $table->string('bac_serie')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'blood_type')) {
                        $table->string('blood_type')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'filiere')) {
                        $table->string('filiere')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'father_name')) {
                        $table->string('father_name')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'mother_name')) {
                        $table->string('mother_name')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'father_cin')) {
                        $table->string('father_cin')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'mother_cin')) {
                        $table->string('mother_cin')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'father_profession')) {
                        $table->string('father_profession')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'mother_profession')) {
                        $table->string('mother_profession')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'first_name_ar')) {
                        $table->string('first_name_ar')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'last_name_ar')) {
                        $table->string('last_name_ar')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'birth_city')) {
                        $table->string('birth_city')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'birth_city_ar')) {
                        $table->string('birth_city_ar')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'address')) {
                        $table->string('address')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'address_ar')) {
                        $table->string('address_ar')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'city')) {
                        $table->string('city')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'region')) {
                        $table->string('region')->nullable();
                    }
                    if (! Schema::hasColumn('applications', 'is_locked')) {
                        $table->boolean('is_locked')->default(false);
                    }
                });
            }

            if (! Schema::hasColumn('students', 'high_school')) {
                Schema::table('students', function (Blueprint $table) {
                    if (! Schema::hasColumn('students', 'high_school')) {
                        $table->string('high_school')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'lycee')) {
                        $table->string('lycee')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'academy')) {
                        $table->string('academy')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'delegation')) {
                        $table->string('delegation')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'province')) {
                        $table->string('province')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'bac_year')) {
                        $table->string('bac_year')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'bac_type')) {
                        $table->string('bac_type')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'bac_serie')) {
                        $table->string('bac_serie')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'blood_type')) {
                        $table->string('blood_type')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'father_last_name_fr')) {
                        $table->string('father_last_name_fr')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'father_first_name_fr')) {
                        $table->string('father_first_name_fr')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'father_last_name_ar')) {
                        $table->string('father_last_name_ar')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'father_first_name_ar')) {
                        $table->string('father_first_name_ar')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'mother_last_name_fr')) {
                        $table->string('mother_last_name_fr')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'mother_first_name_fr')) {
                        $table->string('mother_first_name_fr')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'mother_last_name_ar')) {
                        $table->string('mother_last_name_ar')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'mother_first_name_ar')) {
                        $table->string('mother_first_name_ar')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'father_name')) {
                        $table->string('father_name')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'mother_name')) {
                        $table->string('mother_name')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'father_cin')) {
                        $table->string('father_cin')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'mother_cin')) {
                        $table->string('mother_cin')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'father_profession')) {
                        $table->string('father_profession')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'mother_profession')) {
                        $table->string('mother_profession')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'address_ar')) {
                        $table->string('address_ar')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'birth_city_ar')) {
                        $table->string('birth_city_ar')->nullable();
                    }
                    if (! Schema::hasColumn('students', 'is_locked')) {
                        $table->boolean('is_locked')->default(false);
                    }
                });
            }
        } catch (\Throwable $e) {
            \Log::warning('ensureSchemaColumnsExist warning: '.$e->getMessage());
        }
    }

    /**
     * Suivi du dossier candidat en temps réel.
     */
    public function trackCandidateDossier(Request $request): JsonResponse
    {
        $this->ensureSchemaColumnsExist();
        $user = auth()->user();
        $identity = CandidateDossierGate::requireIdentity($request, false);
        $cne = $identity['cne'];
        $cin = $identity['cin'];
        $email = CandidateDossierGate::isStaff($user)
            ? strtolower(trim((string) $request->query('email', '')))
            : '';

        if ($user && ! CandidateDossierGate::isStaff($user)) {
            if (empty($email)) {
                $email = strtolower(trim($user->email ?? ''));
            }
            if (empty($cin)) {
                $cin = strtoupper(trim($user->cin ?? ''));
            }
            if (empty($cne)) {
                $cne = strtoupper(trim($user->cne ?? ''));
            }
        }

        // 1) Chercher d'abord l'étudiant lié à l'utilisateur connecté ou par CNE / CIN / Email
        $student = null;
        if ($user && ! CandidateDossierGate::isStaff($user)) {
            $student = Student::with(['user', 'documents', 'latestPathway.filiere'])->where('user_id', $user->id)->first();
        } elseif (CandidateDossierGate::isStaff($user)) {
            if ($cne) {
                $student = Student::with(['user', 'documents', 'latestPathway.filiere'])->where('cne', $cne)->first();
            }
            if (! $student && $cin) {
                $student = Student::with(['user', 'documents', 'latestPathway.filiere'])
                    ->where('cin', $cin)
                    ->orWhereHas('user', fn ($u) => $u->where('cin', $cin))
                    ->first();
            }
            if (! $student && $email) {
                $student = Student::with(['user', 'documents', 'latestPathway.filiere'])
                    ->whereHas('user', fn ($u) => $u->where('email', $email))
                    ->first();
            }
        } else {
            $student = Student::with(['user', 'documents', 'latestPathway.filiere'])
                ->where('cne', $cne)
                ->where(function ($q) use ($cin) {
                    $q->where('cin', $cin)->orWhereHas('user', fn ($u) => $u->where('cin', $cin));
                })
                ->first();
        }

        // 2) Chercher la dernière candidature (latest) par CNE, CIN ou Email
        $application = null;
        $searchCne = $cne ?: ($student?->cne ?? null);
        $searchCin = $cin ?: ($student?->cin ?? $user?->cin ?? null);
        $searchEmail = $email ?: ($user?->email ?? $student?->email ?? null);

        if ($searchCne && (CandidateDossierGate::isStaff($user) || $user)) {
            $application = Application::where('cne', $searchCne)->latest('id')->first();
        }
        if (! $application && $searchCne && $searchCin && ! $user) {
            $application = Application::where('cne', $searchCne)->where('cin', $searchCin)->latest('id')->first();
        }
        if (! $application && $searchCin && CandidateDossierGate::isStaff($user)) {
            $application = Application::where('cin', $searchCin)->latest('id')->first();
        }
        if (! $application && $searchEmail && CandidateDossierGate::isStaff($user)) {
            $application = Application::where('email', $searchEmail)->latest('id')->first();
        }

        $candidateData = [];

        // Dynamic ordering: prioritize the most recently updated source (Student vs Application)
        $sources = [$application, $student];
        if ($application && $student) {
            $appTime = $application->updated_at ? Carbon::parse($application->updated_at) : null;
            $stuTime = $student->updated_at ? Carbon::parse($student->updated_at) : null;
            if ($stuTime && $appTime && $stuTime->gt($appTime)) {
                $sources = [$student, $application];
            }
        }

        // Helper pour extraire la première valeur réelle non-vide
        $getVal = function ($field, ...$fallbacks) use ($sources) {
            foreach ($sources as $source) {
                if (! $source) {
                    continue;
                }
                foreach (array_merge([$field], $fallbacks) as $f) {
                    $v = $source->{$f} ?? null;
                    if ($v !== null && $v !== '' && $v !== 'Non renseigné' && $v !== 'Non renseignée') {
                        return $v;
                    }
                }
            }

            return null;
        };

        if ($student || $application) {
            $u = $student?->user;
            $fn = $getVal('first_name') ?? $u?->first_name ?? '';
            $ln = $getVal('last_name') ?? $u?->last_name ?? '';

            $bdate = $student?->birth_date ?? $application?->birth_date;
            if ($bdate instanceof Carbon || $bdate instanceof \DateTimeInterface) {
                $bdate = $bdate->format('Y-m-d');
            } elseif (is_string($bdate) && str_contains($bdate, 'T')) {
                $bdate = explode('T', $bdate)[0];
            }

            $fatherName = $getVal('father_name');
            if (empty($fatherName)) {
                $fatherName = trim(($getVal('father_last_name_fr') ?? '').' '.($getVal('father_first_name_fr') ?? ''));
            }
            $motherName = $getVal('mother_name');
            if (empty($motherName)) {
                $motherName = trim(($getVal('mother_last_name_fr') ?? '').' '.($getVal('mother_first_name_fr') ?? ''));
            }

            $highSchoolVal = $getVal('high_school', 'lycee');
            $academyVal = $getVal('academy', 'region');
            $delegationVal = $getVal('delegation', 'province', 'prefecture');
            $bacSerieVal = $getVal('bac_type', 'bac_serie', 'bac_series', 'bac_name');
            $bacAvgVal = $getVal('bac_average', 'bac_note');
            $bacMentionVal = $getVal('bac_mention');
            $bacYearVal = $getVal('bac_year');

            $isLocked = (bool) (
                ($student?->is_locked) ||
                ($application?->is_locked) ||
                ($student?->status === 'active') ||
                ($student?->inscription_status === 'valide') ||
                ($application?->status === 'accepted') ||
                ($application?->status === 'enrolled') ||
                ($application?->status === 'valide')
            );

            $candidateData = [
                'id' => $student?->id ?? $application?->id,
                'first_name' => $fn,
                'last_name' => $ln,
                'name' => trim("{$fn} {$ln}"),
                'first_name_ar' => $getVal('first_name_ar') ?? $u?->first_name_ar,
                'last_name_ar' => $getVal('last_name_ar') ?? $u?->last_name_ar,
                'cne' => $getVal('cne') ?? $cne,
                'cin' => $u?->cin ?? $getVal('cin') ?? $cin,
                'email' => $u?->email ?? $getVal('email') ?? $email,
                'phone' => $u?->phone ?? $getVal('phone'),
                'gender' => $getVal('gender'),
                'birth_date' => $bdate,
                'birth_city' => $getVal('birth_city', 'birth_city_fr'),
                'birth_city_ar' => $getVal('birth_city_ar'),
                'address' => $getVal('address', 'address_fr'),
                'address_ar' => $getVal('address_ar'),
                'city' => $getVal('city'),
                'region' => $academyVal,
                'father_name' => $fatherName ?: null,
                'father_name_ar' => $getVal('father_name_ar'),
                'father_cin' => $getVal('father_cin'),
                'father_profession' => $getVal('father_profession', 'father_job'),
                'father_phone' => $getVal('father_phone'),
                'mother_name' => $motherName ?: null,
                'mother_name_ar' => $getVal('mother_name_ar'),
                'mother_cin' => $getVal('mother_cin'),
                'mother_profession' => $getVal('mother_profession', 'mother_job'),
                'mother_phone' => $getVal('mother_phone'),
                'parent_phone' => $getVal('parent_phone') ?? $getVal('father_phone'),
                'emergency_contact_name' => $getVal('emergency_contact_name'),
                'emergency_contact_phone' => $getVal('emergency_contact_phone'),
                'allergy_type' => $getVal('allergy_type', 'allergies'),
                'medication_used' => $getVal('medication_used', 'chronic_diseases'),
                'treating_doctor_info' => $getVal('treating_doctor_info'),
                'has_disability' => (bool) ($getVal('has_disability')),
                'disability_details' => $getVal('disability_details'),
                'blood_type' => $getVal('blood_type', 'groupe_sanguin'),
                'status' => $student?->status ?? $application?->status ?? 'submitted',
                'status_label' => ($student?->status === 'active' || $application?->status === 'accepted') ? 'Inscrit définitif' : 'En cours de traitement',
                'filiere' => $student?->latestPathway?->filiere?->name ?? $getVal('filiere', 'reference_number') ?? 'Deux années préparatoires (TC)',
                'bac_type' => $bacSerieVal,
                'bac_serie' => $bacSerieVal,
                'bac_average' => $bacAvgVal,
                'bac_mention' => $bacMentionVal,
                'bac_year' => $bacYearVal,
                'high_school' => $highSchoolVal,
                'academy' => $academyVal,
                'delegation' => $delegationVal,
                'selection_score' => $getVal('selection_score'),
                'is_locked' => $isLocked,
                'is_validated' => $isLocked,
            ];
        }

        if (empty($candidateData)) {
            return response()->json([
                'success' => false,
                'found' => false,
                'message' => 'Aucun dossier trouvé.',
            ], 404);
        }

        // Fetch candidate documents
        $cneQuery = $candidateData['cne'] ?? $cne;
        $docs = StudentDocument::where('cne', $cneQuery)->orWhere('student_id', $student?->id)->get();
        $docMap = [];
        foreach ($docs as $doc) {
            $docMap[$doc->type] = [
                'id' => $doc->id,
                'file_path' => SignedDocumentUrl::make((string) $doc->type, (string) $cneQuery),
                'signed_url' => SignedDocumentUrl::make((string) $doc->type, (string) $cneQuery),
                'original_filename' => $doc->original_filename,
                'status' => $doc->status,
                'created_at' => $doc->created_at?->format('d/m/Y H:i'),
            ];
        }
        $candidateData['documents'] = $docMap;

        return response()->json([
            'success' => true,
            'found' => true,
            'type' => $student ? 'student' : 'application',
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
                'name' => $student->user->name ?? 'N/A',
                'cne' => $student->cne,
                'status' => 'CONVOQUE_LISTE_ATTENTE',
            ];
        }

        return response()->json([
            'success' => true,
            'message' => '5 candidats promus de la liste d\'attente.',
            'promoted_candidates' => $promoted,
        ]);
    }

    /**
     * Envoi email de convocation au candidat.
     */
    public function sendCandidateConvocationEmail(Request $request): JsonResponse
    {
        $cne = strtoupper(trim($request->input('cne', '')));
        $cin = strtoupper(trim($request->input('cin', '')));
        $email = trim($request->input('email', ''));

        $application = Application::where('cne', $cne)->orWhere('cin', $cin)->first();
        $targetEmail = $email ?: $application?->email;

        if (! $targetEmail) {
            return response()->json(['success' => false, 'message' => 'Email manquant.'], 422);
        }

        $name = $application ? ($application->first_name.' '.$application->last_name) : 'Candidat';

        Mail::to($targetEmail)->send(
            new StudentRegistrationSuccessMail(
                $name,
                $cne ?: 'N142088916',
                $cin ?: 'C3967857',
                $application->reference_number ?? 'TC',
                null,
                AcademicYear::where('is_current', true)->value('label')
            )
        );

        return response()->json([
            'success' => true,
            'message' => 'Email envoyé à '.$targetEmail,
        ]);
    }

    // ─── DOCUMENTS ────────────────────────────────────────────

    /**
     * Mettre à jour le dossier candidat.
     */
    public function updateCandidateDossier(Request $request): JsonResponse
    {
        $this->ensureSchemaColumnsExist();
        CandidateDossierGate::requireIdentity($request, true);
        $userAuth = auth()->user();
        $cne = strtoupper(trim($request->input('cne', '')));
        $cin = strtoupper(trim($request->input('cin', '')));
        $emailInput = strtolower(trim($request->input('email', '')));

        if (empty($cne) && $userAuth?->cne) {
            $cne = strtoupper(trim($userAuth->cne));
        }
        if (empty($cin) && $userAuth?->cin) {
            $cin = strtoupper(trim($userAuth->cin));
        }
        if (empty($emailInput) && $userAuth?->email) {
            $emailInput = strtolower(trim($userAuth->email));
        }

        // Vérifier si le dossier est déjà verrouillé/validé par l'administration
        $studentCheck = null;
        if ($userAuth) {
            $studentCheck = Student::where('user_id', $userAuth->id)->first();
        }
        if (! $studentCheck && $cne) {
            $studentCheck = Student::where('cne', $cne)->first();
        }
        if (! $studentCheck && $cin) {
            $studentCheck = Student::where('cin', $cin)->orWhereHas('user', fn ($u) => $u->where('cin', $cin))->first();
        }
        $appCheck = null;
        if ($cne) {
            $appCheck = Application::where('cne', $cne)->latest('id')->first();
        }
        if (! $appCheck && $cin) {
            $appCheck = Application::where('cin', $cin)->latest('id')->first();
        }

        $isAlreadyLocked = (bool) (
            ($studentCheck?->is_locked) ||
            ($appCheck?->is_locked) ||
            ($studentCheck?->status === 'active') ||
            ($studentCheck?->inscription_status === 'valide') ||
            ($appCheck?->status === 'accepted') ||
            ($appCheck?->status === 'enrolled') ||
            ($appCheck?->status === 'valide')
        );

        if ($isAlreadyLocked) {
            return response()->json([
                'success' => false,
                'is_locked' => true,
                'message' => 'Votre dossier d\'inscription a été officiellement validé par le service scolarité et ne peut plus être modifié (Mode Lecture Seule).',
            ], 403);
        }

        $input = $request->all();

        // 1) Normaliser les nom/prénom & lieux
        $firstName = $input['first_name'] ?? $input['first_name_fr'] ?? $userAuth?->first_name ?? null;
        $lastName = $input['last_name'] ?? $input['last_name_fr'] ?? $userAuth?->last_name ?? null;
        $firstNameAr = $input['first_name_ar'] ?? null;
        $lastNameAr = $input['last_name_ar'] ?? null;
        $birthCity = $input['birth_city'] ?? $input['birth_city_fr'] ?? null;
        $birthCityAr = $input['birth_city_ar'] ?? null;
        $address = $input['address'] ?? $input['address_fr'] ?? null;
        $addressAr = $input['address_ar'] ?? null;
        $fatherName = trim(($input['father_last_name_fr'] ?? '').' '.($input['father_first_name_fr'] ?? ''));
        if (empty(trim($fatherName))) {
            $fatherName = $input['father_name'] ?? null;
        }
        $motherName = trim(($input['mother_last_name_fr'] ?? '').' '.($input['mother_first_name_fr'] ?? ''));
        if (empty(trim($motherName))) {
            $motherName = $input['mother_name'] ?? null;
        }

        $fatherJob = $input['father_profession'] ?? $input['father_job'] ?? null;
        $motherJob = $input['mother_profession'] ?? $input['mother_job'] ?? null;

        $highSchool = $input['high_school'] ?? $input['lycee'] ?? null;
        $academy = $input['academy'] ?? $input['region'] ?? null;
        $delegation = $input['delegation'] ?? $input['province'] ?? $input['prefecture'] ?? null;
        $bacSerie = $input['bac_type'] ?? $input['bac_name'] ?? $input['bac_serie'] ?? $input['bac_series'] ?? null;
        $bacAverage = isset($input['bac_average']) && $input['bac_average'] !== '' ? (float) $input['bac_average'] : null;
        $bacMention = $input['bac_mention'] ?? null;
        $bacYear = $input['bac_year'] ?? null;
        $filiereVal = $input['filiere'] ?? null;

        // Map complet pour synchronisation 100% transparente
        $dataMap = [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'first_name_ar' => $firstNameAr,
            'last_name_ar' => $lastNameAr,
            'cne' => $cne ?: null,
            'cin' => $cin ?: null,
            'email' => $emailInput ?: null,
            'phone' => $input['phone'] ?? null,
            'gender' => $input['gender'] ?? null,
            'birth_date' => $input['birth_date'] ?? null,
            'birth_city' => $birthCity,
            'birth_city_ar' => $birthCityAr,
            'nationality' => $input['nationality'] ?? 'Marocaine',
            'address' => $address,
            'address_ar' => $addressAr,
            'city' => $input['city'] ?? $input['province'] ?? null,
            'region' => $academy,
            'academy' => $academy,
            'delegation' => $delegation,
            'province' => $delegation,
            'high_school' => $highSchool,
            'lycee' => $highSchool,
            'bac_year' => $bacYear,
            'bac_type' => $bacSerie,
            'bac_serie' => $bacSerie,
            'bac_series' => $bacSerie,
            'bac_average' => $bacAverage,
            'bac_note' => $bacAverage,
            'bac_mention' => $bacMention,
            'filiere' => $filiereVal,
            'father_name' => $fatherName ?: null,
            'father_last_name_fr' => $input['father_last_name_fr'] ?? null,
            'father_first_name_fr' => $input['father_first_name_fr'] ?? null,
            'father_last_name_ar' => $input['father_last_name_ar'] ?? null,
            'father_first_name_ar' => $input['father_first_name_ar'] ?? null,
            'father_name_ar' => $input['father_name_ar'] ?? null,
            'father_cin' => $input['father_cin'] ?? null,
            'father_phone' => $input['father_phone'] ?? null,
            'father_profession' => $fatherJob ?: null,
            'father_job' => $fatherJob ?: null,
            'mother_name' => $motherName ?: null,
            'mother_last_name_fr' => $input['mother_last_name_fr'] ?? null,
            'mother_first_name_fr' => $input['mother_first_name_fr'] ?? null,
            'mother_last_name_ar' => $input['mother_last_name_ar'] ?? null,
            'mother_first_name_ar' => $input['mother_first_name_ar'] ?? null,
            'mother_name_ar' => $input['mother_name_ar'] ?? null,
            'mother_cin' => $input['mother_cin'] ?? null,
            'mother_phone' => $input['mother_phone'] ?? null,
            'mother_profession' => $motherJob ?: null,
            'mother_job' => $motherJob ?: null,
            'parent_phone' => $input['parent_phone'] ?? $input['father_phone'] ?? null,
            'emergency_contact_name' => $input['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $input['emergency_contact_phone'] ?? null,
            'allergy_type' => $input['allergy_type'] ?? null,
            'medication_used' => $input['medication_used'] ?? null,
            'treating_doctor_info' => $input['treating_doctor_info'] ?? null,
            'has_disability' => isset($input['has_disability']) ? (bool) $input['has_disability'] : null,
            'disability_details' => $input['disability_details'] ?? null,
            'blood_type' => $input['blood_type'] ?? $input['groupe_sanguin'] ?? null,
        ];

        // Mettre à jour avec toutes les clés fournies (sans null ni chaine vide)
        $cleanData = array_filter($dataMap, fn ($v) => $v !== null && $v !== '');

        // A) Mettre à jour / Créer dans la table Application
        $application = null;
        if ($cne) {
            $application = Application::where('cne', $cne)->latest('id')->first();
        }
        if (! $application && $cin) {
            $application = Application::where('cin', $cin)->latest('id')->first();
        }
        if (! $application && $emailInput) {
            $application = Application::where('email', $emailInput)->latest('id')->first();
        }

        try {
            $appColumns = Schema::getColumnListing('applications');
            $validAppData = array_intersect_key($cleanData, array_flip($appColumns));

            if ($application) {
                if (! empty($validAppData)) {
                    $application->update($validAppData);
                    $application->touch();
                }
            } elseif ($cne || $userAuth) {
                $refNumber = 'TAFEM-'.date('Y').'-'.strtoupper(substr(md5(($cne ?: uniqid()).microtime()), 0, 6));
                $application = Application::create(array_merge($validAppData, [
                    'admission_campaign_id' => 1,
                    'reference_number' => $refNumber,
                    'cne' => $cne ?: ($userAuth?->cne ?? 'CNE_TEMP'),
                    'cin' => $cin ?: ($userAuth?->cin ?? 'CIN_TEMP'),
                    'email' => $emailInput ?: ($userAuth?->email ?? 'email@temp.com'),
                    'first_name' => $firstName ?: 'Candidat',
                    'last_name' => $lastName ?: 'Admis',
                    'status' => 'submitted',
                ]));
            }
        } catch (\Throwable $e) {
            \Log::warning('Application update/create error: '.$e->getMessage());
        }

        // B) Mettre à jour / Créer dans la table Student
        $student = null;
        if ($userAuth) {
            $student = Student::with('user')->where('user_id', $userAuth->id)->first();
        }
        if (! $student && $cne) {
            $student = Student::with('user')->where('cne', $cne)->first();
        }
        if (! $student && $cin) {
            $student = Student::with('user')->whereHas('user', fn ($u) => $u->where('cin', $cin))->orWhere('cin', $cin)->first();
        }

        if ($student) {
            try {
                $studentColumns = Schema::getColumnListing('students');
                $validStudentData = array_intersect_key($cleanData, array_flip($studentColumns));
                if (! empty($validStudentData)) {
                    $student->update($validStudentData);
                    $student->touch();
                }
            } catch (\Throwable $e) {
                \Log::warning('Student update error: '.$e->getMessage());
            }

            // C) Mettre à jour la table User liée
            if ($student->user) {
                $userUpdate = [];
                if ($firstName) {
                    $userUpdate['first_name'] = $firstName;
                }
                if ($lastName) {
                    $userUpdate['last_name'] = $lastName;
                }
                if ($firstNameAr) {
                    $userUpdate['first_name_ar'] = $firstNameAr;
                }
                if ($lastNameAr) {
                    $userUpdate['last_name_ar'] = $lastNameAr;
                }
                if ($firstName || $lastName) {
                    $userUpdate['name'] = trim(($firstName ?: $student->user->first_name).' '.($lastName ?: $student->user->last_name));
                }
                if (isset($input['phone'])) {
                    $userUpdate['phone'] = $input['phone'];
                }
                if ($cin) {
                    $userUpdate['cin'] = $cin;
                }
                if ($cne) {
                    $userUpdate['cne'] = $cne;
                }
                if (! empty($emailInput)) {
                    $emailExists = User::where('email', $emailInput)
                        ->where('id', '!=', $student->user_id)
                        ->exists();
                    if (! $emailExists) {
                        $userUpdate['email'] = $emailInput;
                    }
                }
                if (! empty($userUpdate)) {
                    try {
                        $student->user->update($userUpdate);
                    } catch (\Throwable $e) {
                        \Log::warning('User table update warning: '.$e->getMessage());
                    }
                }
            }

            // D) Audit Log
            try {
                if (Schema::hasTable('student_dossier_audit_logs')) {
                    DB::table('student_dossier_audit_logs')->insert([
                        'student_id' => $student->id,
                        'admin_id' => $userAuth?->id,
                        'action' => 'data_edited',
                        'comment' => 'Modification du dossier par le candidat',
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->header('User-Agent'),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            } catch (\Throwable $e) {
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Dossier mis à jour avec succès dans PostgreSQL.',
            'candidate' => $cleanData,
        ]);
    }

    /**
     * Upload document candidat.
     */
    public function uploadCandidateDocument(Request $request): JsonResponse
    {
        $typeInput = strtolower($request->input('type', ''));
        $allowedMimes = ($typeInput === 'photo') ? 'mimes:jpg,jpeg,png,webp' : 'mimes:pdf';

        $request->validate([
            'file' => "required|file|max:10240|{$allowedMimes}",
            'type' => 'required|string|in:bac,cnie,photo,releve_notes,cin,cin_recto_verso',
            'cne' => 'required|string',
            'cin' => 'required|string',
        ], [
            'file.mimes' => ($typeInput === 'photo') ? 'Format de photo invalide (JPG/PNG/WEBP accepté).' : 'Format non autorisé. Seuls les documents au format PDF (.pdf) sont acceptés.',
        ]);

        $file = $request->file('file');
        $type = strtoupper($request->input('type'));
        $cne = strtoupper(trim($request->input('cne', '')));

        // Récupérer le nom/prénom depuis la candidature, l'étudiant ou l'utilisateur connecté
        $nom = 'INCONNU';
        $prenom = 'INCONNU';
        $cin = strtoupper(trim($request->input('cin', '')));
        $user = auth()->user();

        $application = null;
        if ($cne) {
            $application = Application::where('cne', $cne)->first();
        }
        if (! $application && $cin) {
            $application = Application::where('cin', $cin)->first();
        }

        if ($application) {
            $nom = strtoupper(preg_replace('/\s+/', '-', trim($application->last_name ?? 'INCONNU')));
            $prenom = strtoupper(preg_replace('/\s+/', '-', trim($application->first_name ?? 'INCONNU')));
        } else {
            $student = null;
            if ($cne) {
                $student = Student::where('cne', $cne)->first();
            }
            if (! $student && $cin) {
                $student = Student::whereHas('user', fn ($u) => $u->where('cin', $cin))->first();
            }

            if ($student) {
                $nom = strtoupper(preg_replace('/\s+/', '-', trim($student->last_name ?? $student->user?->last_name ?? 'INCONNU')));
                $prenom = strtoupper(preg_replace('/\s+/', '-', trim($student->first_name ?? $student->user?->first_name ?? 'INCONNU')));
            } elseif ($user) {
                $nom = strtoupper(preg_replace('/\s+/', '-', trim($user->last_name ?? 'INCONNU')));
                $prenom = strtoupper(preg_replace('/\s+/', '-', trim($user->first_name ?? 'INCONNU')));
            }
        }
        if (! $cne && $user?->cne) {
            $cne = strtoupper(trim($user->cne));
        }

        // Construire un nom de fichier lisible : TYPE_CNE_NOM_PRENOM.ext
        $ext = strtolower($file->getClientOriginalExtension()) ?: 'pdf';
        $typeCode = match (strtolower($request->input('type'))) {
            'bac' => 'BAC',
            'cnie', 'cin', 'cin_recto_verso' => 'CIN',
            'releve_notes' => 'RELEVE',
            'photo' => 'PHOTO',
            default => strtoupper($request->input('type')),
        };
        $filename = "{$typeCode}_{$cne}_{$nom}_{$prenom}.{$ext}";
        $storagePath = 'candidate_documents/'.$filename;

        Storage::disk('private')->put($storagePath, file_get_contents($file->getRealPath()));

        StudentDocument::updateOrCreate(
            ['cne' => $cne, 'type' => strtolower($request->input('type'))],
            [
                'file_path' => $storagePath,
                'original_filename' => $filename,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'status' => 'pending',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Document '{$typeCode}' enregistré sous le nom : {$filename}",
            'file_path' => SignedDocumentUrl::make(strtolower($request->input('type')), $cne),
            'filename' => $filename,
        ]);
    }

    /**
     * Servir un document privé.
     */
    public function serveCandidateDocument(string $type, string $cne): BinaryFileResponse|JsonResponse|Response
    {
        return $this->serveCandidateDocumentPublic($type, $cne);
    }

    /**
     * Servir un document candidat (Public / Iframe display).
     * Cherche par CNE dans student_documents (portail candidat + admin).
     */
    public function serveCandidateDocumentPublic(Request $request, string $type, string $cne): BinaryFileResponse|JsonResponse|Response
    {
        $cne = strtoupper(trim($cne));
        $userAuth = $request->user();
        $hasSignedAccess = SignedDocumentUrl::isValid($type, $cne, $request->query('exp'), $request->query('sig'));
        $isOwner = $userAuth && strtoupper(trim((string) $userAuth->cne)) === $cne;
        $isStaff = CandidateDossierGate::isStaff($userAuth);

        if (! $hasSignedAccess && ! $isOwner && ! $isStaff) {
            return response()->json(['success' => false, 'message' => 'Accès au document refusé.'], 403);
        }

        $typeList = match (strtolower($type)) {
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
            if (Storage::disk('private')->exists($path)) {
                return response()->file(Storage::disk('private')->path($path), $headers);
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
            if ($response) {
                return $response;
            }
        }

        // 2) Recherche par student_id (upload admin ou lié à l'utilisateur connecté)
        $userAuth = auth()->user();
        $student = null;
        if ($userAuth) {
            $student = Student::where('user_id', $userAuth->id)->first();
        }
        if (! $student && $cne) {
            $student = Student::where('cne', $cne)->first();
        }
        if ($student) {
            $doc2 = StudentDocument::where('student_id', $student->id)->whereIn('type', $typeList)->first();
            if ($doc2 && $doc2->file_path) {
                $response = $serve($doc2);
                if ($response) {
                    return $response;
                }
            }
        }

        // 3) Recherche dans la table Applications pour tout document récent
        $app = Application::where('cne', $cne)->latest('id')->first();
        if ($app && $userAuth) {
            $doc3 = StudentDocument::whereHas('student', fn ($q) => $q->where('user_id', $userAuth->id))
                ->whereIn('type', $typeList)
                ->first();
            if ($doc3 && $doc3->file_path) {
                $response = $serve($doc3);
                if ($response) {
                    return $response;
                }
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
            'cne' => 'required|string',
            'cin' => 'required|string',
            'type' => 'required|string',
        ]);

        $cne = strtoupper(trim($request->input('cne', '')));
        $student = Student::where('cne', $cne)->first();
        $application = Application::where('cne', $cne)->first();

        if ($student?->is_locked || $application?->is_locked || $student?->status === 'active' || $student?->inscription_status === 'valide' || $application?->status === 'accepted') {
            return response()->json([
                'success' => false,
                'message' => 'Suppression impossible : Votre dossier d\'inscription a été validé et verrouillé par la scolarité.',
            ], 403);
        }

        StudentDocument::where('cne', $cne)
            ->where('type', $request->input('type'))
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document supprimé.',
        ]);
    }

    /**
     * Verrouiller / Déverrouiller le dossier candidat (Admin / Scolarité).
     */
    public function toggleLockCandidateDossier(Request $request): JsonResponse
    {
        $cne = strtoupper(trim($request->input('cne', '')));
        $cin = strtoupper(trim($request->input('cin', '')));
        $studentId = $request->input('student_id');
        $lockState = (bool) $request->input('is_locked', true);

        $student = null;
        if ($studentId) {
            $student = Student::find($studentId);
        }
        if (! $student && $cne) {
            $student = Student::where('cne', $cne)->first();
        }
        if (! $student && $cin) {
            $student = Student::whereHas('user', fn ($u) => $u->where('cin', $cin))->first();
        }

        $application = null;
        if ($cne) {
            $application = Application::where('cne', $cne)->first();
        }
        if (! $application && $cin) {
            $application = Application::where('cin', $cin)->first();
        }

        if ($student) {
            $student->update([
                'is_locked' => $lockState,
                'inscription_status' => $lockState ? 'valide' : 'en_attente',
            ]);
            $student->touch();
        }

        if ($application) {
            $application->update([
                'is_locked' => $lockState,
                'status' => $lockState ? 'accepted' : 'submitted',
            ]);
            $application->touch();
        }

        return response()->json([
            'success' => true,
            'is_locked' => $lockState,
            'message' => $lockState ? 'Dossier verrouillé avec succès par la Scolarité.' : 'Dossier déverrouillé avec succès.',
        ]);
    }

    /**
     * Extraction OCR via Gemini AI.
     * Sync par défaut (tunnel TAFEM). ?async=1 enqueue le job Horizon.
     */
    public function extractDocumentDataOcr(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf',
            'doc_type' => 'nullable|string',
            'async' => 'sometimes|boolean',
        ], [
            'file.mimes' => 'Format non autorisé. Seuls les fichiers scannés au format PDF (.pdf) sont acceptés.',
        ]);

        $file = $request->file('file');
        $docType = $request->input('doc_type', $request->input('type', 'bac'));
        $ocr = app(OcrExtractionService::class);

        if ($request->boolean('async')) {
            $token = (string) Str::uuid();
            $path = $file->storeAs('ocr-inbox', $token.'.pdf', 'local');
            ProcessOcrDocumentJob::dispatch(
                $path,
                $file->getClientMimeType() ?: 'application/pdf',
                $file->getClientOriginalName(),
                $docType,
                'ocr:'.$token
            );

            return response()->json([
                'success' => true,
                'queued' => true,
                'token' => $token,
                'message' => 'Extraction OCR mise en file d’attente.',
            ], 202);
        }

        $result = $ocr->extractFromUpload($file, $docType);
        $status = $result['success'] ? 200 : 422;

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'ocr_data' => $result['ocr_data'],
            'debug_info' => $result['debug_info'],
        ], $status, [], JSON_UNESCAPED_UNICODE);
    }
}
