<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\SubmitAbsenceRequest;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Borrowing;
use App\Models\LearningMaterial;
use App\Services\Academic\StudentPortalService;
use App\Services\Library\KohaLibraryClient;
use App\Services\Notification\NotificationDispatcherService;
use Carbon\Carbon;
use Database\Seeders\LibrarySeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
        $studentId = $this->resolveAuthenticatedStudentId($request);
        $result = $this->portalService->getGrades($studentId);

        return response()->json([
            'success' => true,
            'data' => $result['data'],
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

        $book = Book::findOrFail($validated['book_id']);

        // Vérifier si l'étudiant a déjà un emprunt en cours sur ce livre
        $alreadyBorrowed = Borrowing::where('user_id', $user->id)
            ->whereIn('status', ['borrowed', 'overdue'])
            ->whereHas('bookCopy', fn ($q) => $q->where('book_id', $book->id))
            ->exists();

        if ($alreadyBorrowed) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà un exemplaire de cet ouvrage en cours d\'emprunt.',
            ], 422);
        }

        $copy = BookCopy::where('book_id', $book->id)
            ->where('is_available', true)
            ->first();

        if (! $copy) {
            return response()->json([
                'success' => false,
                'message' => 'Tous les exemplaires physiques de cet ouvrage sont actuellement en prêt.',
            ], 422);
        }

        $adminUser = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['admin', 'super-admin', 'library-manager']))->first() ?? $user;

        $borrowing = DB::transaction(function () use ($book, $copy, $user, $adminUser) {
            $copy->update(['is_available' => false]);
            $book->decrement('available_copies');

            return Borrowing::create([
                'book_copy_id' => $copy->id,
                'user_id' => $user->id,
                'issued_by' => $adminUser->id,
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
