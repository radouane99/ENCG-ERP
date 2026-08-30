<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_current' => 'boolean',
            'is_locked' => 'boolean',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function semesters(): HasMany
    {
        return $this->hasMany(Semester::class);
    }

    /**
     * Libellé affichable (colonne `label`, sinon start_year-end_year).
     */
    public function displayLabel(): string
    {
        if (! empty($this->label)) {
            return (string) $this->label;
        }

        if ($this->start_year && $this->end_year) {
            return "{$this->start_year}-{$this->end_year}";
        }

        return now()->year.'-'.(now()->year + 1);
    }

    /**
     * Format officiel court pour tableaux PDF (2024-2025 → 24-25).
     */
    public static function toShortLabel(?string $name): string
    {
        if ($name === null || trim($name) === '') {
            return '—';
        }

        if (preg_match('/(\d{4})\s*[\/\-–—]\s*(\d{2,4})/u', $name, $m)) {
            $start = substr($m[1], -2);
            $end = strlen($m[2]) === 4 ? substr($m[2], -2) : str_pad($m[2], 2, '0', STR_PAD_LEFT);

            return "{$start}-{$end}";
        }

        return $name;
    }

    public static function currentShortLabel(): string
    {
        $year = static::query()->where('is_current', true)->first();

        return static::toShortLabel($year?->displayLabel());
    }
}
