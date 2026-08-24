<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Borrowing;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DigitalLibraryAndKohaLoansTest extends TestCase
{
    use RefreshDatabase;

    private Student $student;

    private Book $book;

    private BookCopy $bookCopy;

    private User $librarian;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = $this->makeTestStudent([
            'first_name' => 'Houda',
            'last_name' => 'TAHIRI',
            'cne' => 'N776655443',
            'gender' => 'female',
        ]);

        $this->librarian = User::factory()->create();

        $this->book = Book::create([
            'institution_id' => 1,
            'title' => 'Finance d\'Entreprise — Pierre Vernimmen',
            'isbn' => '978-2047338520',
            'author' => 'Pascal Quiry & Yann Le Fur',
            'category' => 'Finance',
            'total_copies' => 10,
            'available_copies' => 9,
        ]);

        $this->bookCopy = BookCopy::create([
            'book_id' => $this->book->id,
            'barcode' => 'ENCG-LIB-00142',
            'condition' => 'good',
            'is_available' => true,
        ]);
    }

    /**
     * Test d'emprunt et de retour d'un ouvrage de la bibliothèque.
     */
    public function test_can_borrow_and_return_library_book(): void
    {
        $borrowing = Borrowing::create([
            'book_copy_id' => $this->bookCopy->id,
            'user_id' => $this->student->user_id,
            'issued_by' => $this->librarian->id,
            'borrow_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'borrowed',
        ]);

        $this->assertDatabaseHas('borrowings', [
            'book_copy_id' => $this->bookCopy->id,
            'user_id' => $this->student->user_id,
            'status' => 'borrowed',
        ]);

        $borrowing->update([
            'return_date' => now()->toDateString(),
            'status' => 'returned',
        ]);

        $this->assertDatabaseHas('borrowings', [
            'id' => $borrowing->id,
            'status' => 'returned',
        ]);
    }
}
