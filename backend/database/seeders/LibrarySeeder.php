<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Borrowing;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LibrarySeeder extends Seeder
{
    public function run(): void
    {
        $institution = Institution::first();
        $institutionId = $institution?->id ?? 1;

        $adminUser = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['admin', 'super-admin', 'library-manager']);
        })->first() ?? User::first();

        $issuedById = $adminUser?->id ?? 1;

        // Sample real ENCG university academic books
        $booksData = [
            [
                'isbn' => '978-2247223015',
                'title' => 'Finance d\'Entreprise (Vernimmen)',
                'author' => 'Pierre Vernimmen, Pascal Quiry, Yann Le Fur',
                'publisher' => 'Dalloz',
                'publication_year' => 2024,
                'edition' => '22ème édition',
                'language' => 'fr',
                'category' => 'Finance',
                'location_code' => 'RAYON-FIN-01',
                'total_copies' => 6,
                'available_copies' => 4,
            ],
            [
                'isbn' => '978-2100854127',
                'title' => 'Comptabilité Approfondie - DCG 10',
                'author' => 'Robert Obert, Marie-Pierre Mairesse',
                'publisher' => 'Dunod',
                'publication_year' => 2023,
                'edition' => 'Édition 2023/2024',
                'language' => 'fr',
                'category' => 'Comptabilité & Audit',
                'location_code' => 'RAYON-CPT-03',
                'total_copies' => 5,
                'available_copies' => 3,
            ],
            [
                'isbn' => '978-2100815579',
                'title' => 'Mercator - Tout le Marketing à l\'Ère Digitale',
                'author' => 'Arnaud de Baynast, Jacques Lendrevie, Julien Lévy',
                'publisher' => 'Dunod',
                'publication_year' => 2022,
                'edition' => '13ème édition',
                'language' => 'fr',
                'category' => 'Marketing',
                'location_code' => 'RAYON-MKT-02',
                'total_copies' => 4,
                'available_copies' => 2,
            ],
            [
                'isbn' => '978-9954003421',
                'title' => 'Droit des Sociétés Commerciales au Maroc',
                'author' => 'Pr. Mohamed Drissi Alami Machichi',
                'publisher' => 'Éditions Maghrébines Casablanca',
                'publication_year' => 2022,
                'edition' => '4ème édition refondue',
                'language' => 'fr',
                'category' => 'Droit des Affaires',
                'location_code' => 'RAYON-DRT-05',
                'total_copies' => 4,
                'available_copies' => 3,
            ],
            [
                'isbn' => '978-2744076848',
                'title' => 'Macroéconomie - Théories et Politiques',
                'author' => 'Olivier Blanchard, Daniel Cohen',
                'publisher' => 'Pearson Éducation',
                'publication_year' => 2021,
                'edition' => '7ème édition',
                'language' => 'fr',
                'category' => 'Économie',
                'location_code' => 'RAYON-ECO-01',
                'total_copies' => 5,
                'available_copies' => 5,
            ],
            [
                'isbn' => '978-2100824908',
                'title' => 'Contrôle de Gestion et Pilotage de la Performance',
                'author' => 'Claude Alazard, Sabine Sépari',
                'publisher' => 'Dunod',
                'publication_year' => 2023,
                'edition' => '5ème édition',
                'language' => 'fr',
                'category' => 'Contrôle de Gestion',
                'location_code' => 'RAYON-CG-02',
                'total_copies' => 4,
                'available_copies' => 3,
            ],
            [
                'isbn' => '978-2100790883',
                'title' => 'Méthodologie de la Thèse et du Mémoire de Recherche',
                'author' => 'Michel Kalika',
                'publisher' => 'Dunod',
                'publication_year' => 2022,
                'edition' => '4ème édition',
                'language' => 'fr',
                'category' => 'Méthodologie & PFE',
                'location_code' => 'RAYON-PFE-01',
                'total_copies' => 8,
                'available_copies' => 6,
            ],
            [
                'isbn' => '978-2807331587',
                'title' => 'Management Stratégique des Organisations',
                'author' => 'Gerry Johnson, Richard Whittington',
                'publisher' => 'De Boeck Supérieur',
                'publication_year' => 2023,
                'edition' => '12ème édition',
                'language' => 'fr',
                'category' => 'Management',
                'location_code' => 'RAYON-MGT-04',
                'total_copies' => 3,
                'available_copies' => 2,
            ],
        ];

        $createdBooks = [];

        foreach ($booksData as $bData) {
            $book = Book::firstOrCreate(
                ['isbn' => $bData['isbn']],
                array_merge($bData, ['institution_id' => $institutionId])
            );

            $createdBooks[] = $book;

            // Generate copies if they do not exist
            $existingCopiesCount = BookCopy::where('book_id', $book->id)->count();
            $copiesNeeded = $book->total_copies - $existingCopiesCount;

            for ($i = 1; $i <= $copiesNeeded; $i++) {
                BookCopy::create([
                    'book_id' => $book->id,
                    'barcode' => 'ENCG-BC-'.strtoupper(Str::random(6)).'-'.($existingCopiesCount + $i),
                    'condition' => 'good',
                    'is_available' => true,
                ]);
            }
        }

        // Create sample active and historical borrowings for students, especially student@encg-fes.ma
        $yassineUser = User::where('email', 'student@encg-fes.ma')->first();
        $studentUsers = User::whereHas('roles', fn ($q) => $q->where('name', 'student'))
            ->take(5)
            ->get();

        if ($yassineUser && ! $studentUsers->contains('id', $yassineUser->id)) {
            $studentUsers->push($yassineUser);
        }

        if ($yassineUser && count($createdBooks) >= 2) {
            // Check if Yassine already has active borrowings
            $hasBorrowing = Borrowing::where('user_id', $yassineUser->id)->exists();

            if (! $hasBorrowing) {
                // Borrowing 1: Finance d'Entreprise (Active, due in 6 days)
                $finBook = $createdBooks[0];
                $finCopy = BookCopy::where('book_id', $finBook->id)->where('is_available', true)->first();
                if ($finCopy) {
                    $finCopy->update(['is_available' => false]);
                    $finBook->decrement('available_copies');

                    Borrowing::create([
                        'book_copy_id' => $finCopy->id,
                        'user_id' => $yassineUser->id,
                        'issued_by' => $issuedById,
                        'borrow_date' => now()->subDays(8)->format('Y-m-d'),
                        'due_date' => now()->addDays(6)->format('Y-m-d'),
                        'status' => 'borrowed',
                        'notes' => 'Prêt ordinaire semestriel S5',
                    ]);
                }

                // Borrowing 2: Comptabilité Approfondie (Active, due in 2 days)
                $cptBook = $createdBooks[1];
                $cptCopy = BookCopy::where('book_id', $cptBook->id)->where('is_available', true)->first();
                if ($cptCopy) {
                    $cptCopy->update(['is_available' => false]);
                    $cptBook->decrement('available_copies');

                    Borrowing::create([
                        'book_copy_id' => $cptCopy->id,
                        'user_id' => $yassineUser->id,
                        'issued_by' => $issuedById,
                        'borrow_date' => now()->subDays(12)->format('Y-m-d'),
                        'due_date' => now()->addDays(2)->format('Y-m-d'),
                        'status' => 'borrowed',
                        'notes' => 'Préparation examen S5',
                    ]);
                }
            }
        }

        // Add 3 other student borrowings to enrich admin view
        foreach ($studentUsers as $u) {
            if ($u->id === $yassineUser?->id) {
                continue;
            }

            if (! Borrowing::where('user_id', $u->id)->exists() && count($createdBooks) > 2) {
                $randomBook = $createdBooks[array_rand($createdBooks)];
                $copy = BookCopy::where('book_id', $randomBook->id)->where('is_available', true)->first();

                if ($copy) {
                    $copy->update(['is_available' => false]);
                    $randomBook->decrement('available_copies');

                    $isOverdue = (rand(1, 3) === 1);
                    Borrowing::create([
                        'book_copy_id' => $copy->id,
                        'user_id' => $u->id,
                        'issued_by' => $issuedById,
                        'borrow_date' => $isOverdue ? now()->subDays(20)->format('Y-m-d') : now()->subDays(5)->format('Y-m-d'),
                        'due_date' => $isOverdue ? now()->subDays(5)->format('Y-m-d') : now()->addDays(9)->format('Y-m-d'),
                        'status' => $isOverdue ? 'overdue' : 'borrowed',
                        'notes' => 'Prêt régulier',
                    ]);
                }
            }
        }
    }
}
