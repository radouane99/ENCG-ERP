<?php

declare(strict_types=1);

namespace App\Domain\Student\Models;

use App\Domain\Shared\Traits\BelongsToInstitution;
use App\Domain\Shared\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use SoftDeletes, BelongsToInstitution, Auditable;

    protected $fillable = [
        'institution_id', 'user_id', 'student_number', 'cne', 'cin', 'massar_code',
        'first_name', 'last_name', 'first_name_ar', 'last_name_ar',
        'birth_date', 'birth_city', 'birth_country', 'gender', 'nationality',
        'photo_path', 'email', 'phone', 'address', 'city', 'region', 'postal_code',
        'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
        'status', 'scholarship_type', 'has_disability', 'disability_details',
    ];

    protected $casts = [
        'birth_date'  => 'date',
        'has_disability' => 'boolean',
    ];

    protected $hidden = [
        'cin', 'massar_code',   // Sensitive data — only accessible with permission
    ];

    // ── Accessors ──────────────────────────────────────────────
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getFullNameArAttribute(): string
    {
        return "{$this->first_name_ar} {$this->last_name_ar}";
    }

    // ── Relationships ──────────────────────────────────────────
    public function institution(): BelongsTo
    {
        return $this->belongsTo(\App\Domain\Institution\Models\Institution::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class);
    }

    public function pathways(): HasMany
    {
        return $this->hasMany(StudentPathway::class);
    }

    public function currentPathway(): HasOne
    {
        return $this->hasOne(StudentPathway::class)->where('is_current', true);
    }

    public function academicHistory(): HasMany
    {
        return $this->hasMany(StudentAcademicHistory::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(StudentRegistration::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(\App\Domain\Exam\Models\Grade::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(\App\Domain\Attendance\Models\Attendance::class);
    }

    public function deliberationDecisions(): HasMany
    {
        return $this->hasMany(\App\Domain\Exam\Models\DeliberationDecision::class);
    }

    public function internships(): HasMany
    {
        return $this->hasMany(\App\Domain\HR\Models\Internship::class);
    }

    public function finalProjects(): HasMany
    {
        return $this->hasMany(\App\Domain\Academic\Models\FinalProject::class);
    }

    public function riskPredictions(): HasMany
    {
        return $this->hasMany(\App\Domain\AI\Models\RiskPrediction::class)->latest();
    }

    public function latestRiskPrediction(): HasOne
    {
        return $this->hasOne(\App\Domain\AI\Models\RiskPrediction::class)->latestOfMany();
    }

    // ── Scopes ────────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForFiliere($query, int $filiereId)
    {
        return $query->whereHas('currentPathway', fn ($q) => $q->where('filiere_id', $filiereId));
    }

    public function scopeForGroup($query, int $groupId)
    {
        return $query->whereHas('currentPathway', fn ($q) => $q->where('group_id', $groupId));
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'ilike', "%{$search}%")
              ->orWhere('last_name', 'ilike', "%{$search}%")
              ->orWhere('student_number', 'ilike', "%{$search}%")
              ->orWhere('cne', 'ilike', "%{$search}%")
              ->orWhere('email', 'ilike', "%{$search}%");
        });
    }
}
