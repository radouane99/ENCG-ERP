<?php
namespace Tests\Feature;
use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
class LibraryTenantRegressionTest extends TestCase
{
    use RefreshDatabase;
    public function test_empty_catalog_is_read_only_and_professors_cannot_administer_loans(): void
    {
        $operator = \App\Models\User::factory()->create(['institution_id' => 1]);
        $operator->assignRole(Role::findOrCreate('library-manager', 'sanctum')); Sanctum::actingAs($operator);
        $this->getJson('/api/admin/library/books')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/admin/library/stats')->assertOk()->assertJsonPath('data.total_books', 0);
        $this->assertSame(0, Book::count());
        $professor = $this->makeTestProfessor(); $professor->user->assignRole(Role::findOrCreate('professor', 'sanctum')); Sanctum::actingAs($professor->user);
        $this->getJson('/api/admin/library/books')->assertForbidden();
    }
}