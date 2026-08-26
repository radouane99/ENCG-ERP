<?php

namespace Tests\Unit;

use App\Domain\Shared\Traits\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuditableTraitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('auditable_dummies', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('auditable_dummies');

        parent::tearDown();
    }

    public function test_creating_sets_created_by_from_authenticated_user(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $record = $this->newDummy();
        $record->name = 'PV délibération';
        $record->save();

        $this->assertSame($user->id, $record->created_by);
        $this->assertNull($record->updated_by);
    }

    public function test_updating_sets_updated_by_from_authenticated_user(): void
    {
        $creator = User::factory()->create();
        $editor = User::factory()->create();

        $this->actingAs($creator);
        $record = $this->newDummy();
        $record->name = 'PV initial';
        $record->save();

        $this->actingAs($editor);
        $record->name = 'PV corrigé';
        $record->save();

        $this->assertSame($creator->id, $record->created_by);
        $this->assertSame($editor->id, $record->updated_by);
    }

    public function test_creating_does_not_overwrite_explicit_created_by(): void
    {
        $actor = User::factory()->create();
        $author = User::factory()->create();
        $this->actingAs($actor);

        $record = $this->newDummy();
        $record->name = 'Import Massar';
        $record->created_by = $author->id;
        $record->save();

        $this->assertSame($author->id, $record->created_by);
    }

    private function newDummy(): Model
    {
        return new class extends Model
        {
            use Auditable;

            protected $table = 'auditable_dummies';

            protected $guarded = [];
        };
    }
}
