<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\SubmitAbsenceRequest;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Borrowing;
use App\Models\Grade;
use App\Models\Internship;
use App\Models\LearningMaterial;
use App\Models\Module;
use App\Notifications\SystemNotification;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\StudentPortalService;
use App\Services\Library\KohaLibraryClient;
use App\Services\Notification\NotificationDispatcherService;
use Carbon\Carbon;
use Database\Seeders\LibrarySeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

        return response()->json([
            'success' => true,
            'data' => [
                'reference_code' => $referenceCode,
                'verification_code' => $referenceCode,
                'academic_year' => $yearLabel,
                'student_name' => trim("{$user->first_name} {$user->last_name}") ?: $user->name,
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
