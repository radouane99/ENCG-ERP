<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Borrowing;
use App\Models\Institution;
use Database\Seeders\LibrarySeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LibraryController extends Controller
{
    /**
     * Obtenir les statistiques du fonds documentaire.
     */
    public function getStats(): JsonResponse
    {
        if (Book::count() === 0) {
            (new LibrarySeeder)->run();
        }

        $totalBooks = Book::count();
        $totalCopies = Book::sum('total_copies');
        $availableCopies = Book::sum('available_copies');
        $activeBorrowings = Borrowing::where('status', 'borrowed')->count();
        $overdueBorrowings = Borrowing::where('status', 'overdue')
            ->orWhere(function ($q) {
                $q->where('status', 'borrowed')->where('due_date', '<', now()->toDateString());
            })
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_books' => $totalBooks,
                'total_copies' => (int) $totalCopies,
                'available_copies' => (int) $availableCopies,
                'borrowed_copies' => max(0, (int) ($totalCopies - $availableCopies)),
                'active_borrowings' => $activeBorrowings,
                'overdue_borrowings' => $overdueBorrowings,
            ],
        ]);
    }

    /**
     * Liste des livres avec recherche et filtres.
     */
    public function indexBooks(Request $request): JsonResponse
    {
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

        $query = Book::with(['copies' => function ($q) {
            $q->orderBy('barcode');
        }]);

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                    ->orWhere('author', 'like', "%{$s}%")
                    ->orWhere('isbn', 'like', "%{$s}%")
                    ->orWhere('category', 'like', "%{$s}%");
            });
        }

        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', $request->input('category'));
        }

        $books = $query->orderBy('title')->get();

        $categories = Book::whereNotNull('category')
            ->distinct()
            ->pluck('category');

        return response()->json([
            'success' => true,
            'data' => $books,
            'categories' => $categories,
        ]);
    }

    /**
     * Créer un nouvel ouvrage avec ses exemplaires physiques.
     */
    public function storeBook(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'isbn' => 'nullable|string|max:50|unique:books,isbn',
            'category' => 'nullable|string|max:100',
            'publisher' => 'nullable|string|max:150',
            'publication_year' => 'nullable|integer|min:1900|max:2099',
            'edition' => 'nullable|string|max:100',
            'location_code' => 'nullable|string|max:50',
            'total_copies' => 'required|integer|min:1|max:100',
        ]);

        $institutionId = Institution::first()?->id ?? 1;

        $book = DB::transaction(function () use ($validated, $institutionId) {
            $totalCopies = (int) $validated['total_copies'];
            $book = Book::create(array_merge($validated, [
                'institution_id' => $institutionId,
                'available_copies' => $totalCopies,
            ]));

            for ($i = 1; $i <= $totalCopies; $i++) {
                BookCopy::create([
                    'book_id' => $book->id,
                    'barcode' => 'ENCG-BC-'.strtoupper(Str::random(6)).'-'.$i,
                    'condition' => 'good',
                    'is_available' => true,
                ]);
            }

            return $book;
        });

        return response()->json([
            'success' => true,
            'message' => 'Ouvrage et exemplaires ajoutés au catalogue avec succès.',
            'data' => $book->load('copies'),
        ], 201);
    }

    /**
     * Mettre à jour un ouvrage.
     */
    public function updateBook(Request $request, int $id): JsonResponse
    {
        $book = Book::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'isbn' => "nullable|string|max:50|unique:books,isbn,{$id}",
            'category' => 'nullable|string|max:100',
            'publisher' => 'nullable|string|max:150',
            'publication_year' => 'nullable|integer|min:1900|max:2099',
            'edition' => 'nullable|string|max:100',
            'location_code' => 'nullable|string|max:50',
            'total_copies' => 'required|integer|min:1|max:100',
        ]);

        DB::transaction(function () use ($book, $validated) {
            $oldTotal = $book->total_copies;
            $newTotal = (int) $validated['total_copies'];
            $diff = $newTotal - $oldTotal;

            if ($diff > 0) {
                // Ajouter des exemplaires
                $currentCopiesCount = BookCopy::where('book_id', $book->id)->count();
                for ($i = 1; $i <= $diff; $i++) {
                    BookCopy::create([
                        'book_id' => $book->id,
                        'barcode' => 'ENCG-BC-'.strtoupper(Str::random(6)).'-'.($currentCopiesCount + $i),
                        'condition' => 'good',
                        'is_available' => true,
                    ]);
                }
                $book->available_copies += $diff;
            } elseif ($diff < 0) {
                // Supprimer des exemplaires disponibles non empruntés
                $toDelete = abs($diff);
                $availableCopies = BookCopy::where('book_id', $book->id)
                    ->where('is_available', true)
                    ->take($toDelete)
                    ->get();

                foreach ($availableCopies as $copy) {
                    $copy->delete();
                }
                $book->available_copies = max(0, $book->available_copies - $availableCopies->count());
            }

            $book->update($validated);
        });

        return response()->json([
            'success' => true,
            'message' => 'Ouvrage mis à jour avec succès.',
            'data' => $book->fresh('copies'),
        ]);
    }

    /**
     * Supprimer un ouvrage.
     */
    public function deleteBook(int $id): JsonResponse
    {
        $book = Book::with('copies')->findOrFail($id);

        $copyIds = $book->copies->pluck('id');
        $activeBorrowings = Borrowing::whereIn('book_copy_id', $copyIds)
            ->whereIn('status', ['borrowed', 'overdue'])
            ->exists();

        if ($activeBorrowings) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cet ouvrage : des exemplaires sont actuellement empruntés.',
            ], 422);
        }

        $book->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ouvrage retiré du catalogue.',
        ]);
    }

    /**
     * Liste des emprunts de la bibliothèque.
     */
    public function indexBorrowings(Request $request): JsonResponse
    {
        $query = Borrowing::with([
            'bookCopy.book',
            'user.student',
            'issuer',
        ]);

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $st = $request->input('status');
            if ($st === 'overdue') {
                $query->where(function ($q) {
                    $q->where('status', 'overdue')
                        ->orWhere(function ($q2) {
                            $q2->where('status', 'borrowed')
                                ->where('due_date', '<', now()->toDateString());
                        });
                });
            } else {
                $query->where('status', $st);
            }
        }

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->whereHas('bookCopy.book', function ($bq) use ($s) {
                    $bq->where('title', 'like', "%{$s}%")
                        ->orWhere('author', 'like', "%{$s}%");
                })->orWhereHas('user', function ($uq) use ($s) {
                    $uq->where('first_name', 'like', "%{$s}%")
                        ->orWhere('last_name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhereHas('student', function ($sq) use ($s) {
                            $sq->where('cne', 'like', "%{$s}%");
                        });
                });
            });
        }

        $borrowings = $query->orderBy('borrow_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $borrowings,
        ]);
    }

    /**
     * Créer un nouvel emprunt (guichet bibliothécaire).
     */
    public function storeBorrowing(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'book_id' => 'required|exists:books,id',
            'borrow_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $book = Book::findOrFail($validated['book_id']);

        $copy = BookCopy::where('book_id', $book->id)
            ->where('is_available', true)
            ->first();

        if (! $copy) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun exemplaire physique n\'est actuellement disponible pour cet ouvrage.',
            ], 422);
        }

        $borrowing = DB::transaction(function () use ($validated, $book, $copy, $request) {
            $copy->update(['is_available' => false]);
            $book->decrement('available_copies');

            $borrowDate = $validated['borrow_date'] ?? now()->toDateString();
            $dueDate = $validated['due_date'] ?? now()->addDays(14)->toDateString();

            return Borrowing::create([
                'book_copy_id' => $copy->id,
                'user_id' => $validated['user_id'],
                'issued_by' => $request->user()?->id ?? 1,
                'borrow_date' => $borrowDate,
                'due_date' => $dueDate,
                'status' => 'borrowed',
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Emprunt enregistré avec succès.',
            'data' => $borrowing->load(['bookCopy.book', 'user.student']),
        ], 201);
    }

    /**
     * Enregistrer le retour d'un livre emprunté.
     */
    public function returnBorrowing(int $id): JsonResponse
    {
        $borrowing = Borrowing::with(['bookCopy.book'])->findOrFail($id);

        if ($borrowing->status === 'returned') {
            return response()->json([
                'success' => false,
                'message' => 'Cet emprunt est déjà marqué comme retourné.',
            ], 422);
        }

        DB::transaction(function () use ($borrowing) {
            $borrowing->update([
                'return_date' => now()->toDateString(),
                'status' => 'returned',
            ]);

            if ($borrowing->bookCopy) {
                $borrowing->bookCopy->update(['is_available' => true]);
                if ($borrowing->bookCopy->book) {
                    $borrowing->bookCopy->book->increment('available_copies');
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Retour de livre enregistré. L\'exemplaire est de nouveau disponible en rayon.',
            'data' => $borrowing->fresh(['bookCopy.book', 'user.student']),
        ]);
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
