<?php

namespace App\Models;

use App\Domain\Deliberation\LmdRules;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Filiere extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'accreditation_expiry' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function requiresTuitionPayment(): bool
    {
        return LmdRules::filiereRequiresPayment($this->type ?? null);
    }

    public function specialities(): HasMany
    {
        return $this->hasMany(Speciality::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }

    public function studentPathways(): HasMany
    {
        return $this->hasMany(StudentPathway::class);
    }
}
