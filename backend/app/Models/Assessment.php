<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademicYear;
use App\Services\Academic\AcademicContext;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assessment extends Model
{
    use BelongsToAcademicYear, HasFactory;

    protected $guarded = ['id'];

    public static function assertNoReview(int $moduleId): void
    {
        $yearId = AcademicContext::yearId();
        abort_if(static::withoutGlobalScopes()->where('module_id', $moduleId)->where('needs_review', true)
            ->where(fn ($q) => $q->where('academic_year_id', $yearId)->orWhereNull('academic_year_id'))->exists(), 409, 'Des modalités doivent être réconciliées avant la saisie ou la signature.');
    }

    public static function assertModuleReady(int $moduleId): void
    {
        static::assertNoReview($moduleId);
        $ordinary = static::where('module_id', $moduleId)->get()->reject(fn ($a) => in_array(strtolower(trim($a->type)), ['rattrapage', 'resit', 'r']));
        abort_unless($ordinary->isNotEmpty() && abs($ordinary->sum('weight') - 100) < 0.01, 422, 'La somme des poids ordinaires doit être égale à 100 %.');
    }

    protected static function booted(): void
    {
        static::addGlobalScope('review', fn ($q) => $q->where('assessments.needs_review', false));
        static::deleting(function ($assessment) {
            abort_if($assessment->grades()->exists(), 409, 'Une évaluation notée doit être conservée.');
        });
    }

    protected function casts(): array
    {
        return [
            'weight' => 'float',
            'date' => 'date',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }
}
