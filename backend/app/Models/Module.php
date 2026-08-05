<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Module extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'coefficient' => 'float',
            'credit_hours' => 'float',
            'is_elective' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function speciality(): BelongsTo
    {
        return $this->belongsTo(Speciality::class);
    }

    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(
            Module::class,
            'module_prerequisites',
            'module_id',
            'prerequisite_module_id'
        );
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }

    /**
     * Professors assigned to this module via the module_professor pivot table.
     */
    public function professors(): BelongsToMany
    {
        return $this->belongsToMany(
            Professor::class,
            'module_professor',
            'module_id',
            'professor_id'
        );
    }

    /**
     * Resit eligibility records for students in this module.
     */
    public function resitEligibilities(): HasMany
    {
        return $this->hasMany(ResitEligibility::class);
    }

    public function uniqueIds(): array
    {
        return ['uuid'];
    }
}