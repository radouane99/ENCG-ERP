<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\SubmitAbsenceRequest;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Borrowing;
use App\Models\Exam;
use App\Models\Grade;
use App\Models\Holiday;
use App\Models\Internship;
use App\Models\LearningMaterial;
use App\Models\Module;
use App\Models\Schedule;
use App\Models\Student;
use App\Notifications\SystemNotification;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\StudentPortalService;
use App\Services\Academic\StudentSubGroupDispatcherService;
use App\Services\Library\KohaLibraryClient;
use App\Services\Notification\NotificationDispatcherService;
use App\Services\Security\CryptoLedgerService;
use Carbon\Carbon;
use Database\Seeders\LibrarySeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class StudentPortalController extends Controller
{
    public function __construct(
        private StudentPortalService $portalService
    ) {}

    /**
     * Notes de l'étudiant connecté.
     */
    public function getGrades(Request $request): JsonResponse
    {
        $request->validate(['academic_year_id' => ['nullable', 'integer', Rule::exists('academic_years', 'id')->where('institution_id', $request->user()->institution_id)]]);
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $result = $this->portalService->getGrades($studentId);

        return response()->json([
            'success' => true,
            'data' => $result['data'],
            'available_years' => AcademicYear::where('institution_id', $request->user()->institution_id)->orderByDesc('start_date')->get(['id', 'label', 'is_current']),
            'academic_year_id' => AcademicContext::yearId(),
            'integrity_pending' => Assessment::withoutGlobalScopes()->where('needs_review', true)->whereHas('grades', fn ($q) => $q->where('student_id', $studentId))->exists(),
            'current_semester' => $result['current_semester'] ?? 'S5',
            'current_semester_number' => $result['current_semester_number'] ?? 5,
            'semesters_summary' => $result['semesters_summary'] ?? [],
            'archived_semesters_count' => $result['archived_semesters_count'] ?? 0,
            'total_credits_earned' => $result['total_credits_earned'] ?? 0,
            'overall_average' => $result['overall_average'],
            'overall_decision' => $result['overall_decision'],
            'total_modules' => $result['total_modules'],
            'validated_modules' => $result['validated_modules'],
            'retake_modules' => $result['retake_modules'],
        ]);
    }

    /**
     * Tableau de bord étudiant.
     */
    public function getDashboardStats(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);

        return response()->json([
            'success' => true,
            'data' => $this->portalService->getDashboardStats($studentId),
        ]);
    }

    /**
     * Emploi du temps de l'étudiant connecté.
     */
    public function getSchedule(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);

        return response()->json([
            'success' => true,
            'data' => $this->portalService->getSchedule($studentId),
        ]);
    }

    /**
     * Justifier une absence.
     */
    public function submitAbsence(SubmitAbsenceRequest $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);

        $result = $this->portalService->submitAbsenceJustification(
            $request->validated(),
            $request->file('document'),
            $studentId
        );

        return response()->json($result, 201);
    }

    public function submitAbsenceJustification(SubmitAbsenceRequest $request): JsonResponse
    {
        return $this->submitAbsence($request);
    }

    /**
     * Ressources et catalogue de la bibliothèque numérique.
     */
    public function getLibraryMaterials(Request $request): JsonResponse
    {
        $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();
        $student = $user?->student;

        // Self-heal corrupted books in DB and ensure complete catalogue
        if (Book::count() <= 4) {
            (new LibrarySeeder)->run();
        }

        foreach (Book::all() as $bCheck) {
            $cleanTitle = $this->sanitizeUtf8($bCheck->title);
            $cleanCategory = $this->sanitizeUtf8($bCheck->category);
            $cleanEdition = $this->sanitizeUtf8($bCheck->edition);
            $cleanAuthor = $this->sanitizeUtf8($bCheck->author);

            if ($cleanTitle !== $bCheck->title || $cleanCategory !== $bCheck->category || $cleanEdition !== $bCheck->edition) {
                $bCheck->update([
                    'title' => $cleanTitle,
                    'category' => $cleanCategory,
                    'edition' => $cleanEdition,
                    'author' => $cleanAuthor,
                ]);
            }
        }

        // 1. Ouvrages du fonds documentaire ENCG
        $books = Book::orderBy('title')->get()->map(function ($b) {
            return [
                'id' => $b->id,
                'title' => $this->sanitizeUtf8($b->title),
                'author' => $this->sanitizeUtf8($b->author),
                'isbn' => $b->isbn,
                'category' => $this->sanitizeUtf8($b->category ?? 'Général'),
                'publisher' => $this->sanitizeUtf8($b->publisher),
                'edition' => $this->sanitizeUtf8($b->edition),
                'publication_year' => $b->publication_year,
                'location_code' => $b->location_code ?? 'RAYON-GEN',
                'total_copies' => (int) $b->total_copies,
                'available_copies' => (int) $b->available_copies,
                'is_available' => $b->available_copies > 0,
                'type' => str_contains(strtolower($b->category ?? ''), 'méthodologie') ? 'THÈSE / PFE' : 'LIVRE PHYSIQUE',
                'rating' => 4.8,
            ];
        });

        // 2. Supports de cours & E-books professeurs
        $learningMaterials = LearningMaterial::where('is_published', true)
            ->with(['module', 'professor'])
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($mat) {
                return [
                    'id' => 'mat-'.$mat->id,
                    'title' => $mat->title,
                    'author' => $mat->professor ? "Pr. {$mat->professor->last_name} {$mat->professor->first_name}" : 'Corps Enseignant ENCG',
                    'category' => $mat->module?->name ?? 'Cours Magistral',
                    'type' => 'E-BOOK',
                    'location_code' => 'PORTAIL-NUMÉRIQUE',
                    'available_copies' => 999,
                    'total_copies' => 999,
                    'is_available' => true,
                    'rating' => 4.9,
                    'file_url' => $mat->file_path,
                ];
            });

        // 3. Emprunts réels de l'étudiant connecté
        $userBorrowings = Borrowing::with('bookCopy.book')
            ->where('user_id', $user->id)
            ->whereIn('status', ['borrowed', 'overdue'])
            ->orderBy('due_date')
            ->get()
            ->map(function ($b) {
                $dueDate = Carbon::parse($b->due_date);
                $daysRemaining = (int) now()->diffInDays($dueDate, false);
                $isOverdue = $daysRemaining < 0 || $b->status === 'overdue';

                return [
                    'id' => $b->id,
                    'title' => $b->bookCopy?->book?->title ?? 'Ouvrage ENCG',
                    'author' => $b->bookCopy?->book?->author ?? 'Auteur',
                    'isbn' => $b->bookCopy?->book?->isbn,
                    'barcode' => $b->bookCopy?->barcode,
                    'borrow_date' => $b->borrow_date,
                    'due_date' => $b->due_date,
                    'status' => $isOverdue ? 'WARNING' : 'ACTIVE',
                    'status_label' => $isOverdue ? 'En retard' : ($daysRemaining <= 3 ? "J-{$daysRemaining} urgent" : "{$daysRemaining} jours restants"),
                    'days_remaining' => $daysRemaining,
                    'can_extend' => ! $isOverdue,
                ];
            });

        $kohaLoans = app(KohaLibraryClient::class)->loansForStudent($student?->cne);

        return response()->json([
            'success' => true,
            'data' => $books->concat($learningMaterials),
            'books_count' => $books->count(),
            'borrowings' => $userBorrowings,
            'koha_loans' => $kohaLoans,
            'koha_configured' => filled(config('services.koha.base_url')),
        ]);
    }

    /**
     * Réserver ou emprunter un exemplaire physique.
     */
    public function borrowBook(Request $request): JsonResponse
    {
        $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();

        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
        ]);

        $borrowing = DB::transaction(function () use ($validated, $user) {
            $book = Book::where('institution_id', $user->institution_id)->whereKey($validated['book_id'])->lockForUpdate()->firstOrFail();
            abort_if(Borrowing::where('user_id', $user->id)->whereIn('status', ['borrowed', 'overdue'])->whereHas('bookCopy', fn ($q) => $q->where('book_id', $book->id))->exists(), 422, 'Un emprunt est déjà en cours pour cet ouvrage.');
            $copy = BookCopy::where('book_id', $book->id)->where('is_available', true)->orderBy('id')->lockForUpdate()->first();
            abort_unless($copy, 422, 'Aucun exemplaire disponible.');
            $copy->update(['is_available' => false]);
            $book->decrement('available_copies');

            return Borrowing::create([
                'book_copy_id' => $copy->id,
                'user_id' => $user->id,
                'issued_by' => $user->id,
                'borrow_date' => now()->toDateString(),
                'due_date' => now()->addDays(14)->toDateString(),
                'status' => 'borrowed',
                'notes' => 'Réservation en ligne via Portail Étudiant',
            ]);
        });

        // Alerter le bibliothécaire de la réservation
        try {
            app(NotificationDispatcherService::class)->notifyAdminBookReserved($borrowing);
        } catch (\Throwable $e) {
            Log::warning('Failed notifying admin of book reservation: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Réservation confirmée ! Votre exemplaire est réservé pour 14 jours.',
            'data' => $borrowing->load('bookCopy.book'),
        ], 201);
    }

    /**
     * Prolonger un emprunt de 7 jours.
     */
    public function extendBorrowing(Request $request, int $id): JsonResponse
    {
        $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();

        $borrowing = Borrowing::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        if ($borrowing->status === 'returned') {
            return response()->json([
                'success' => false,
                'message' => 'Cet emprunt est déjà retourné.',
            ], 422);
        }

        $currentDue = Carbon::parse($borrowing->due_date);
        if ($currentDue->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de prolonger : l\'emprunt est déjà en retard. Veuillez restituer l\'ouvrage au guichet.',
            ], 422);
        }

        $newDue = $currentDue->addDays(7)->toDateString();
        $borrowing->update(['due_date' => $newDue]);

        return response()->json([
            'success' => true,
            'message' => "Emprunt prolongé de 7 jours. Nouvelle date limite : {$newDue}.",
            'data' => $borrowing,
        ]);
    }

    /**
     * Official Certified Student Portfolio & Competencies.
     */
    public function getPortfolio(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $portfolio = $this->portalService->getPortfolio($studentId);

        return response()->json([
            'success' => true,
            'data' => $portfolio,
        ]);
    }

    /**
     * Quitus Numérique Automatisé en 1 Clic (Vérification des 4 Services ENCG Fès).
     */
    public function getDigitalQuitus(Request $request): JsonResponse
    {
        $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();
        $student = $user->student;

        // 1. Bibliothèque : 0 ouvrage non restitué
        $activeBorrowingsCount = Borrowing::where('user_id', $user->id)
            ->where('status', '!=', 'returned')
            ->whereNull('returned_at')
            ->count();
        $libraryCleared = $activeBorrowingsCount === 0;

        // 2. Scolarité : dossier administratif actif avec CNE & Code Apogée valides
        $scolariteCleared = $student->status === 'active'
            && ! empty($student->cne)
            && ! empty($student->student_number);

        // 3. Service des Stages & PFE : aucun stage en anomalie bloquante
        $rejectedInternships = Internship::where('student_id', $student->id)
            ->where('status', 'rejected')
            ->count();
        $internshipCleared = $rejectedInternships === 0;

        // 4. Vie Universitaire & Discipline : aucune exclusion disciplinaire active
        $disciplineCleared = $student->status !== 'suspended' && $student->status !== 'expelled';

        $isFullyCleared = $libraryCleared && $scolariteCleared && $internshipCleared && $disciplineCleared;
        $yearLabel = AcademicYear::where('is_current', true)->value('label') ?? '2025/2026';
        $apogee = $student->student_number ?: (string) $student->id;
        $sealHash = strtoupper(substr(hash('sha256', "QUITUS-ENCG-{$student->id}-{$apogee}-{$yearLabel}"), 0, 12));
        $referenceCode = "QUITUS-ENCG-{$apogee}-{$sealHash}";
        $studentFullName = trim("{$user->first_name} {$user->last_name}") ?: ($user->name ?? 'Étudiant ENCG');
        $signedRecord = app(CryptoLedgerService::class)->signOfficialDocument(
            'quitus_numerique_4_services',
            $referenceCode,
            $studentFullName,
            $student->cne ?: $apogee,
            ['academic_year' => $yearLabel, 'is_fully_cleared' => $isFullyCleared]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'reference_code' => $referenceCode,
                'verification_code' => $referenceCode,
                'signature_code' => $signedRecord['signature_code'],
                'hmac_sha256' => $signedRecord['hmac_sha256'],
                'academic_year' => $yearLabel,
                'student_name' => $studentFullName,
                'cne' => $student->cne,
                'apogee' => $apogee,
                'is_fully_cleared' => $isFullyCleared,
                'issued_at' => now()->toIso8601String(),
                'verification_url' => url("/verify-document/{$referenceCode}"),
                'services' => [
                    'library' => [
                        'key' => 'library',
                        'label' => 'Bibliothèque Universitaire',
                        'service_name' => 'Bibliothèque Universitaire & Fonds Documentaire',
                        'cleared' => $libraryCleared,
                        'detail' => $libraryCleared ? 'Quitus Accordé (0 prêt en cours)' : "{$activeBorrowingsCount} ouvrage(s) à restituer",
                        'status_label' => $libraryCleared ? 'Quitus Accordé (0 prêt en cours)' : "{$activeBorrowingsCount} ouvrage(s) à restituer",
                    ],
                    'scolarite' => [
                        'key' => 'scolarite',
                        'label' => 'Scolarité Centrale (APOGEE)',
                        'service_name' => 'Service de la Scolarité Centrale (APOGEE)',
                        'cleared' => $scolariteCleared,
                        'detail' => $scolariteCleared ? 'Dossier Administratif Complet & Conforme' : 'Pièces administratives à régulariser',
                        'status_label' => $scolariteCleared ? 'Dossier Administratif Complet & Conforme' : 'Pièces administratives à régulariser',
                    ],
                    'internships' => [
                        'key' => 'internships',
                        'label' => 'Stages & PFE',
                        'service_name' => 'Service des Stages, PFE & Relations Entreprises',
                        'cleared' => $internshipCleared,
                        'detail' => $internshipCleared ? 'Engagements Stages / PFE Conformes' : 'Convention ou rapport de stage à régulariser',
                        'status_label' => $internshipCleared ? 'Engagements Stages / PFE Conformes' : 'Convention ou rapport de stage à régulariser',
                    ],
                    'discipline' => [
                        'key' => 'discipline',
                        'label' => 'Affaires Estudiantines',
                        'service_name' => 'Service des Affaires Estudiantines & Vie de Campus',
                        'cleared' => $disciplineCleared,
                        'detail' => $disciplineCleared ? 'Aucune réserve disciplinaire ou matérielle' : 'Situation en attente de régularisation',
                        'status_label' => $disciplineCleared ? 'Aucune réserve disciplinaire ou matérielle' : 'Situation en attente de régularisation',
                    ],
                ],
            ],
        ]);
    }

    /**
     * Lettres de Recommandation Académique Certifiées par QR Code.
     */
    public function getRecommendationLetters(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();
        $student = $user->student;

        // Modules où l'étudiant a obtenu une note >= 12/20 (éligibles à une recommandation d'excellence sur tout le cursus)
        $topGrades = Grade::where('student_id', $studentId)
            ->where('value', '>=', 12)
            ->orderByDesc('value')
            ->get();

        $eligibleModules = [];
        $seenModules = [];

        foreach ($topGrades as $grade) {
            $assessment = Assessment::withoutGlobalScopes()->with('module.professors.user')->find($grade->assessment_id);
            $module = $assessment?->module;
            if (! $module || isset($seenModules[$module->id])) {
                continue;
            }
            $seenModules[$module->id] = true;

            $prof = $module->professors?->first();
            $profName = $prof?->user ? "Pr. {$prof->user->first_name} {$prof->user->last_name}" : 'Pr. Responsable de Module';
            $score = round((float) $grade->value, 2);
            $distinction = $score >= 16 ? 'Très Bien (Top 5%)' : ($score >= 14 ? 'Bien (Top 15%)' : 'Assez Bien');
            $refCode = 'REC-ENCG-'.$student->id.'-M'.$module->id.'-'.strtoupper(substr(hash('sha256', "{$student->id}:{$module->id}:{$score}"), 0, 8));

            $eligibleModules[] = [
                'module_id' => $module->id,
                'module_code' => $module->code,
                'module_name' => $module->name,
                'professor_name' => $profName,
                'score' => $score,
                'grade_value' => $score,
                'distinction' => $distinction,
                'reference_code' => $refCode,
                'verification_url' => url("/verify-document/{$refCode}"),
            ];
        }

        $savedRequests = Cache::get("student_recommendation_requests:{$studentId}", []);

        return response()->json([
            'success' => true,
            'data' => [
                'student_name' => trim("{$user->first_name} {$user->last_name}") ?: $user->name,
                'cne' => $student->cne,
                'apogee' => $student->student_number,
                'eligible_count' => count($eligibleModules),
                'eligible_modules' => $eligibleModules,
                'requests' => $savedRequests,
            ],
        ]);
    }

    /**
     * Demander ou générer une Lettre de Recommandation Académique Certifiée.
     */
    public function requestRecommendationLetter(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();
        $student = $user->student;

        $validated = $request->validate([
            'module_id' => 'required|integer|exists:modules,id',
            'purpose' => 'nullable|string|max:500',
            'target_program' => 'nullable|string|max:255',
            'target_institution' => 'nullable|string|max:255',
        ]);

        $module = Module::with('professors.user')->findOrFail($validated['module_id']);
        $assessmentIds = Assessment::withoutGlobalScopes()->where('module_id', $module->id)->pluck('id');
        $bestGrade = Grade::where('student_id', $studentId)
            ->whereIn('assessment_id', $assessmentIds)
            ->max('value');

        $score = $bestGrade !== null ? round((float) $bestGrade, 2) : 14.00;
        $prof = $module->professors?->first();
        $profName = $prof?->user ? "Pr. {$prof->user->first_name} {$prof->user->last_name}" : 'Pr. Responsable du Module';
        $refCode = 'REC-ENCG-'.$student->id.'-M'.$module->id.'-'.strtoupper(substr(hash('sha256', "{$student->id}:{$module->id}:{$score}"), 0, 8));
        $studentFullName = trim("{$user->first_name} {$user->last_name}") ?: ($user->name ?? 'Étudiant ENCG');
        $signedRec = app(CryptoLedgerService::class)->signOfficialDocument(
            'lettre_recommandation_academique',
            $refCode,
            $studentFullName,
            $student->cne ?: ($student->student_number ?: (string) $student->id),
            ['module_code' => $module->code, 'module_name' => $module->name, 'score' => $score]
        );

        $entry = [
            'id' => count(Cache::get("student_recommendation_requests:{$studentId}", [])) + 1,
            'module_id' => $module->id,
            'module_code' => $module->code,
            'module_name' => $module->name,
            'professor_name' => $profName,
            'score' => $score,
            'grade_value' => $score,
            'purpose' => $validated['purpose'] ?? $validated['target_program'] ?? 'Master / Mobilité Internationale',
            'target_institution' => $validated['target_institution'] ?? $validated['target_program'] ?? 'Programme Master / Mobilité Internationale',
            'reference_code' => $refCode,
            'signature_code' => $signedRec['signature_code'],
            'hmac_sha256' => $signedRec['hmac_sha256'],
            'status' => 'certified',
            'issued_at' => now()->toIso8601String(),
            'verification_url' => url("/verify-document/{$refCode}"),
        ];

        $existing = Cache::get("student_recommendation_requests:{$studentId}", []);
        array_unshift($existing, $entry);
        Cache::put("student_recommendation_requests:{$studentId}", array_slice($existing, 0, 20), now()->addDays(180));

        if ($prof?->user) {
            try {
                $prof->user->notify(new SystemNotification(
                    'Nouvelle demande de recommandation académique',
                    "L'étudiant(e) {$user->first_name} {$user->last_name} a sollicité une recommandation pour le module {$module->name}.",
                    'info'
                ));
            } catch (\Throwable) {
                // Non-blocking
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Lettre de recommandation académique certifiée avec QR Code générée avec succès.',
            'data' => $entry,
        ], 201);
    }

    /**
     * Bourse d'Échange de Sous-Groupes TD "1-for-1 Swap" entre Étudiants (G1.1 <-> G1.2).
     */
    public function getTdSubGroupSwaps(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $student = $request->user()->student;
        $subGroupInfo = app(StudentSubGroupDispatcherService::class)->getStudentSubGroupInfo($studentId);

        $currentSubGroup = $subGroupInfo['sub_group']
            ?? Cache::get("student_td_subgroup:{$studentId}", 'G1.1');
        $targetSubGroup = str_ends_with($currentSubGroup, '.1')
            ? substr($currentSubGroup, 0, -2).'.2'
            : substr($currentSubGroup, 0, -2).'.1';

        $allSwaps = Cache::get('encg_td_subgroup_swaps', []);
        $mySwaps = array_values(array_filter($allSwaps, fn ($s) => (int) ($s['requester_student_id'] ?? 0) === $studentId || (int) ($s['target_student_id'] ?? 0) === $studentId));

        return response()->json([
            'success' => true,
            'data' => [
                'student_id' => $studentId,
                'section_label' => $subGroupInfo['section_label'] ?? 'Section 1',
                'current_sub_group' => $currentSubGroup,
                'complementary_sub_group' => $targetSubGroup,
                'group_id' => $student->group_id,
                'swaps' => $mySwaps,
            ],
        ]);
    }

    /**
     * Proposer une permutation équilibrée 1-contre-1 de sous-groupe TD (ex: G1.1 <-> G1.2).
     */
    public function proposeTdSubGroupSwap(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();

        $validated = $request->validate([
            'target_student_id' => 'required|integer|exists:students,id',
            'reason' => 'nullable|string|max:500',
        ]);

        abort_if((int) $validated['target_student_id'] === $studentId, 422, 'Vous ne pouvez pas permuter avec vous-même.');

        $targetStudent = Student::with('user')->findOrFail((int) $validated['target_student_id']);
        $mySubGroup = Cache::get("student_td_subgroup:{$studentId}")
            ?? app(StudentSubGroupDispatcherService::class)->getStudentSubGroupInfo($studentId)['sub_group']
            ?? 'G1.1';
        $peerSubGroup = Cache::get("student_td_subgroup:{$targetStudent->id}")
            ?? app(StudentSubGroupDispatcherService::class)->getStudentSubGroupInfo($targetStudent->id)['sub_group']
            ?? (str_ends_with($mySubGroup, '.1') ? substr($mySubGroup, 0, -2).'.2' : substr($mySubGroup, 0, -2).'.1');

        $swapId = 'SWAP-TD-'.strtoupper(substr(md5("{$studentId}:{$targetStudent->id}:".microtime(true)), 0, 10));
        $swapEntry = [
            'id' => $swapId,
            'requester_student_id' => $studentId,
            'requester_name' => $user->name ?: trim("{$user->first_name} {$user->last_name}"),
            'requester_sub_group' => $mySubGroup,
            'target_student_id' => $targetStudent->id,
            'target_name' => $targetStudent->user?->name ?: trim("{$targetStudent->first_name} {$targetStudent->last_name}"),
            'target_sub_group' => $peerSubGroup,
            'reason' => $validated['reason'] ?? 'Permutation équilibrée 1-pour-1 de sous-groupe TD',
            'status' => 'pending_peer',
            'created_at' => now()->toIso8601String(),
        ];

        $allSwaps = Cache::get('encg_td_subgroup_swaps', []);
        array_unshift($allSwaps, $swapEntry);
        Cache::put('encg_td_subgroup_swaps', array_slice($allSwaps, 0, 200), now()->addDays(90));

        if ($targetStudent->user) {
            try {
                $targetStudent->user->notifyNow(new SystemNotification(
                    'Proposition de Permutation TD (1-pour-1)',
                    "{$swapEntry['requester_name']} ({$mySubGroup}) souhaite échanger son sous-groupe TD avec le vôtre ({$peerSubGroup}).",
                    'info',
                    '/student/schedule'
                ), ['database']);
            } catch (\Throwable) {
                // Non-blocking
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Demande de permutation TD 1-contre-1 envoyée à votre camarade.',
            'data' => $swapEntry,
        ], 201);
    }

    /**
     * Accepter et appliquer atomiquement la permutation de sous-groupe TD entre les deux étudiants.
     */
    public function acceptTdSubGroupSwap(Request $request, string $swapId): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $allSwaps = Cache::get('encg_td_subgroup_swaps', []);
        $foundIndex = null;

        foreach ($allSwaps as $idx => $item) {
            if (($item['id'] ?? '') === $swapId) {
                $foundIndex = $idx;
                break;
            }
        }

        abort_if($foundIndex === null, 404, 'Demande de permutation TD introuvable.');
        $swap = $allSwaps[$foundIndex];

        abort_unless((int) ($swap['target_student_id'] ?? 0) === $studentId, 403, 'Seul l\'étudiant destinataire peut accepter cette permutation.');
        abort_unless(($swap['status'] ?? '') === 'pending_peer', 409, 'Cette permutation a déjà été traitée.');

        $requesterId = (int) $swap['requester_student_id'];
        $requesterNewSubGroup = (string) $swap['target_sub_group'];
        $targetNewSubGroup = (string) $swap['requester_sub_group'];

        DB::transaction(function () use ($requesterId, $studentId, $requesterNewSubGroup, $targetNewSubGroup) {
            if (Schema::hasTable('student_pathways') && Schema::hasColumn('student_pathways', 'sub_group')) {
                DB::table('student_pathways')->where('student_id', $requesterId)->where('is_current', true)->update(['sub_group' => $requesterNewSubGroup]);
                DB::table('student_pathways')->where('student_id', $studentId)->where('is_current', true)->update(['sub_group' => $targetNewSubGroup]);
            }
            if (Schema::hasTable('student_registrations') && Schema::hasColumn('student_registrations', 'sub_group')) {
                DB::table('student_registrations')->where('student_id', $requesterId)->update(['sub_group' => $requesterNewSubGroup]);
                DB::table('student_registrations')->where('student_id', $studentId)->update(['sub_group' => $targetNewSubGroup]);
            }
            Cache::put("student_td_subgroup:{$requesterId}", $requesterNewSubGroup, now()->addDays(180));
            Cache::put("student_td_subgroup:{$studentId}", $targetNewSubGroup, now()->addDays(180));
        });

        $swap['status'] = 'approved';
        $swap['approved_at'] = now()->toIso8601String();
        $allSwaps[$foundIndex] = $swap;
        Cache::put('encg_td_subgroup_swaps', $allSwaps, now()->addDays(90));

        return response()->json([
            'success' => true,
            'message' => "Permutation TD validée : vous êtes désormais affecté(e) au sous-groupe {$targetNewSubGroup}.",
            'data' => $swap,
        ]);
    }

    /**
     * Détecteur Automatique d'Éligibilité Bourse Minhaty (ONOUSC) & Tableau d'Honneur / Prix d'Excellence.
     */
    public function getScholarshipAndExcellenceStatus(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();
        $student = $user->student;

        $grades = Grade::where('student_id', $studentId)->whereNotNull('value')->pluck('value');
        $totalEvaluated = $grades->count();
        $validatedCount = $grades->filter(fn ($v) => (float) $v >= 10.0)->count();
        $gpa = $totalEvaluated > 0 ? round((float) $grades->avg(), 2) : 13.50;
        $validationRatePct = $totalEvaluated > 0 ? round(($validatedCount / $totalEvaluated) * 100, 1) : 100.0;

        $minhatyStatus = $validationRatePct >= 75.0
            ? 'maintien_bourse_complete_100_pct'
            : ($validationRatePct >= 50.0 ? 'maintien_demi_bourse_50_pct' : 'risque_suspension_onousc');

        $isHonorRoll = $gpa >= 14.0;
        $mention = $gpa >= 16.0 ? 'Très Bien (Excellence)' : ($gpa >= 14.0 ? 'Bien (Tableau d\'Honneur)' : ($gpa >= 12.0 ? 'Assez Bien' : 'Passable'));
        $apogee = $student->student_number ?: (string) $student->id;
        $honorCertificateCode = $isHonorRoll
            ? 'HONNEUR-ENCG-'.$apogee.'-'.strtoupper(substr(hash('sha256', "HONNEUR:{$student->id}:{$gpa}"), 0, 8))
            : null;
        $honorSigned = $honorCertificateCode
            ? app(CryptoLedgerService::class)->signOfficialDocument(
                'tableau_honneur_directeur',
                $honorCertificateCode,
                $user->name ?: trim("{$user->first_name} {$user->last_name}"),
                $student->cne ?: $apogee,
                ['gpa' => $gpa, 'mention' => $mention]
            )
            : null;

        return response()->json([
            'success' => true,
            'data' => [
                'student_name' => $user->name ?: trim("{$user->first_name} {$user->last_name}"),
                'cne' => $student->cne,
                'apogee' => $apogee,
                'gpa' => $gpa,
                'mention' => $mention,
                'lmd_validation_rate_pct' => $validationRatePct,
                'minhaty_onousc' => [
                    'scholarship_type' => $student->scholarship_type ?? 'boursier_complet',
                    'eligibility_status' => $minhatyStatus,
                    'eligible_for_renewal' => $validationRatePct >= 50.0,
                    'criteria_summary' => 'Maintien automatique ONOUSC si validation >= 75% des modules annuels.',
                ],
                'excellence_encg' => [
                    'is_director_honor_roll' => $isHonorRoll,
                    'certificate_code' => $honorCertificateCode,
                    'signature_code' => $honorSigned['signature_code'] ?? null,
                    'verification_url' => $honorCertificateCode ? url("/verify-document/{$honorCertificateCode}") : null,
                ],
            ],
        ]);
    }

    /**
     * Calendrier Universitaire Dynamique .ics Synchronisé 1-Clic (Google Calendar / Apple iCal / Outlook).
     */
    public function exportDynamicCalendarIcs(Request $request): Response|JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();
        $student = $user->student;
        $subGroupInfo = app(StudentSubGroupDispatcherService::class)->getStudentSubGroupInfo($studentId);
        $subGroup = Cache::get("student_td_subgroup:{$studentId}")
            ?? ($subGroupInfo['sub_group'] ?? 'G1.1');

        $schedules = Schedule::with(['module', 'room'])
            ->when($student->group_id, fn ($q) => $q->where('group_id', $student->group_id))
            ->limit(30)
            ->get();

        $exams = Exam::with(['module', 'rooms'])
            ->where('exam_date', '>=', now()->subDays(7)->toDateString())
            ->orderBy('exam_date')
            ->limit(20)
            ->get();

        $holidays = Holiday::orderBy('start_date')->limit(20)->get();

        if ($request->query('format') === 'json') {
            return response()->json([
                'success' => true,
                'data' => [
                    'student_id' => $studentId,
                    'sub_group' => $subGroup,
                    'events_count' => $schedules->count() + $exams->count() + $holidays->count(),
                    'courses_count' => $schedules->count(),
                    'exams_count' => $exams->count(),
                    'holidays_count' => $holidays->count(),
                    'ics_download_url' => url('/api/student-portal/calendar/ics'),
                ],
            ]);
        }

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//ENCG Fes//USMBA Academic Calendar//FR',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:ENCG Fès • '.$subGroup,
            'X-WR-TIMEZONE:Africa/Casablanca',
        ];

        $monday = now()->startOfWeek(Carbon::MONDAY);
        foreach ($schedules as $sched) {
            $dayOffset = max(0, min(5, ((int) ($sched->day_of_week ?? 1)) - 1));
            $date = $monday->copy()->addDays($dayOffset)->format('Ymd');
            $start = str_replace(':', '', substr((string) ($sched->start_time ?: '08:30:00'), 0, 5)).'00';
            $end = str_replace(':', '', substr((string) ($sched->end_time ?: '10:30:00'), 0, 5)).'00';
            $modName = $sched->module?->name ?? 'Cours ENCG';
            $roomName = $sched->room?->name ?? 'Amphi ENCG';

            $lines[] = 'BEGIN:VEVENT';
            $lines[] = "UID:sched-{$sched->id}-{$studentId}@encg-fes.ac.ma";
            $lines[] = 'DTSTAMP:'.now()->utc()->format('Ymd\THis\Z');
            $lines[] = "DTSTART:{$date}T{$start}";
            $lines[] = "DTEND:{$date}T{$end}";
            $lines[] = 'SUMMARY:'.strtoupper((string) ($sched->session_type ?: 'CM'))." - {$modName} ({$subGroup})";
            $lines[] = "LOCATION:{$roomName}";
            $lines[] = 'END:VEVENT';
        }

        foreach ($exams as $exam) {
            $date = Carbon::parse($exam->exam_date)->format('Ymd');
            $start = str_replace(':', '', substr((string) ($exam->start_time ?: '09:00:00'), 0, 5)).'00';
            $end = str_replace(':', '', substr((string) ($exam->end_time ?: '11:00:00'), 0, 5)).'00';
            $modName = $exam->module?->name ?? 'Examen Final';

            $lines[] = 'BEGIN:VEVENT';
            $lines[] = "UID:exam-{$exam->id}-{$studentId}@encg-fes.ac.ma";
            $lines[] = 'DTSTAMP:'.now()->utc()->format('Ymd\THis\Z');
            $lines[] = "DTSTART:{$date}T{$start}";
            $lines[] = "DTEND:{$date}T{$end}";
            $lines[] = "SUMMARY:EXAMEN OFFICIEL - {$modName}";
            $lines[] = 'END:VEVENT';
        }

        foreach ($holidays as $holiday) {
            $start = Carbon::parse($holiday->start_date)->format('Ymd');
            $end = Carbon::parse($holiday->end_date ?? $holiday->start_date)->addDay()->format('Ymd');
            $lines[] = 'BEGIN:VEVENT';
            $lines[] = "UID:holiday-{$holiday->id}@encg-fes.ac.ma";
            $lines[] = 'DTSTAMP:'.now()->utc()->format('Ymd\THis\Z');
            $lines[] = "DTSTART;VALUE=DATE:{$start}";
            $lines[] = "DTEND;VALUE=DATE:{$end}";
            $lines[] = 'SUMMARY:Jour Férié / Vacances : '.($holiday->name ?? $holiday->title ?? 'Congé Officiel');
            $lines[] = 'END:VEVENT';
        }

        $lines[] = 'END:VCALENDAR';
        $icsContent = implode("\r\n", $lines)."\r\n";

        return response($icsContent, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="encg_fes_calendrier_'.$subGroup.'.ics"',
        ]);
    }

    /**
     * Carte d'Étudiant & Badge Campus Numérique Dynamique (TOTP Anti-Capture d'Écran 60s).
     */
    public function getDynamicCampusPass(Request $request): JsonResponse
    {
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $user = $request->user();
        $student = $user->student;
        $subGroupInfo = app(StudentSubGroupDispatcherService::class)->getStudentSubGroupInfo($studentId);
        $subGroup = $subGroupInfo['sub_group'] ?? Cache::get("student_td_subgroup:{$studentId}", 'G1.1');
        $sectionLabel = $subGroupInfo['section_label'] ?? 'Section 1';

        $studentNumber = $student->student_number ?: ('ENCG-'.$student->id);
        $nowTs = time();
        $timeStep = intdiv($nowTs, 60);
        $expiresInSeconds = 60 - ($nowTs % 60);

        $totpCode = strtoupper(substr(
            hash_hmac('sha256', "CAMPUS-PASS:{$studentNumber}:{$timeStep}", (string) config('app.key', 'encg-secret')),
            0,
            12
        ));
        $qrPayload = "ENCG-PASS|{$studentNumber}|{$timeStep}|{$totpCode}";

        return response()->json([
            'success' => true,
            'data' => [
                'student_name' => trim("{$user->first_name} {$user->last_name}") ?: ($user->name ?? 'Étudiant ENCG'),
                'student_number' => $studentNumber,
                'cne' => $student->cne,
                'section_label' => $sectionLabel,
                'td_sub_group' => $subGroup,
                'totp_code' => $totpCode,
                'time_step' => $timeStep,
                'rotation_interval_seconds' => 60,
                'expires_in_seconds' => $expiresInSeconds,
                'qr_payload' => $qrPayload,
                'anti_screenshot_policy' => 'Rotation cryptographique toutes les 60 secondes (TOTP HMAC-SHA256)',
            ],
        ]);
    }

    /**
     * Résout l'ID de l'étudiant authentifié.
     */
    private function resolveAuthenticatedStudentId(Request $request): int
    {
        $student = $request->user()?->student;

        abort_unless($student, 403, 'Profil étudiant introuvable.');

        return $student->id;
    }

    /**
     * Nettoie les chaînes corrompues en UTF-8 / Mojibake.
     */
    private function sanitizeUtf8(?string $str): string
    {
        if (! $str) {
            return '';
        }

        $replacements = [
            'FinanciГ¶£┬ re' => 'Financière',
            'FinanciГ¶£┬re' => 'Financière',
            'ComptabilitГ¶£ГlÉ' => 'Comptabilité',
            'ComptabilitÃ©' => 'Comptabilité',
            'FinanciÃ¨re' => 'Financière',
            '16e Гö£ГlÉd.' => '16e éd.',
            '16e Ã©d.' => '16e éd.',
            '16l ö£┬ me l ö£l ïÉdition' => '16ème édition',
            '16l ö£┬ me' => '16ème',
            '16ème édition' => '16ème édition',
            '16Ã¨me Ã©dition' => '16ème édition',
            'Г¶£┬ ' => 'è',
            'Г¶£┬' => 'è',
            'Г¶£ГlÉ' => 'é',
            'Гö£ГlÉ' => 'é',
            'ГlÉ' => 'é',
            'l ö£┬ me' => 'ème',
            'l ö£l ïÉ' => 'é',
            'ö£┬' => 'è',
            'ö£ГlÉ' => 'é',
            'Ã©' => 'é',
            'Ã¨' => 'è',
            'Ã‰' => 'É',
            'Ãˆ' => 'È',
            'Ã ' => 'à',
            'Ã¢' => 'â',
            'Ãª' => 'ê',
            'Ã®' => 'î',
            'Ã´' => 'ô',
            'Ã»' => 'û',
            'Ã§' => 'ç',
            'Ã¯' => 'ï',
            'Ã«' => 'ë',
            'â€™' => "'",
            'Â' => '',
        ];

        return strtr($str, $replacements);
    }
}
