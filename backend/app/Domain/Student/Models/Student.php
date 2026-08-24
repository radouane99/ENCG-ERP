<?php

declare(strict_types=1);

namespace App\Domain\Student\Models;

use App\Domain\Academic\Models\FinalProject;
use App\Domain\AI\Models\RiskPrediction;
use App\Domain\Attendance\Models\Attendance;
use App\Domain\Exam\Models\DeliberationDecision;
use App\Domain\Exam\Models\Grade;
use App\Domain\HR\Models\Internship;
use App\Domain\Institution\Models\Institution;
use App\Domain\Shared\Traits\Auditable;
use App\Domain\Shared\Traits\BelongsToInstitution;
use App\Models\StudentDocument;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use Auditable, BelongsToInstitution, SoftDeletes;

    protected $fillable = [
        'institution_id', 'user_id', 'student_number', 'cne', 'cin', 'massar_code',
        'first_name', 'last_name', 'first_name_ar', 'last_name_ar',
        'birth_date', 'birth_city', 'birth_country', 'gender', 'nationality',
        'photo_path', 'email', 'phone', 'address', 'city', 'region', 'postal_code',
        'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
        'status', 'scholarship_type', 'has_disability', 'disability_details',
        // Inscription workflow (Recommendation #2)
        'inscription_status', 'inscription_submitted_at', 'inscription_validated_at',
        'inscription_notes', 'academic_year',
        // RGPD Consent — Loi 09-08 Maroc (Recommendation #6)
        'rgpd_consent_at', 'reglement_interieur_consent_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'has_disability' => 'boolean',
        'inscription_submitted_at' => 'datetime',
        'inscription_validated_at' => 'datetime',
        'rgpd_consent_at' => 'datetime',
        'reglement_interieur_consent_at' => 'datetime',
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
        return $this->belongsTo(Institution::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class, 'student_id');
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
        return $this->hasMany(Grade::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function deliberationDecisions(): HasMany
    {
        return $this->hasMany(DeliberationDecision::class);
    }

    public function internships(): HasMany
    {
        return $this->hasMany(Internship::class);
    }

    public function finalProjects(): HasMany
    {
        return $this->hasMany(FinalProject::class);
    }

    public function riskPredictions(): HasMany
    {
        return $this->hasMany(RiskPrediction::class)->latest();
    }

    public function latestRiskPrediction(): HasOne
    {
        return $this->hasOne(RiskPrediction::class)->latestOfMany();
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

    // ── Inscription Workflow Scopes (Recommendation #2) ───────────────
    public function scopeByInscriptionStatus($query, string $inscriptionStatus)
    {
        return $query->where('inscription_status', $inscriptionStatus);
    }

    public function scopeInscriptionEnCours($query)
    {
        return $query->whereIn('inscription_status', ['submitted', 'dossier_incomplet', 'dossier_complet']);
    }

    public function scopeInscrits($query)
    {
        return $query->whereIn('inscription_status', ['inscrit', 'reinscrit']);
    }

    // ── Audit Log Relationship (Recommendation #5) ────────────────────
    public function dossierAuditLogs(): HasMany
    {
        return $this->hasMany(StudentDossierAuditLog::class)->latest();
    }

    // ── Auto Student Number Generator (Recommendation #7) ─────────────
    public static function generateStudentNumber(string $filiereCode, int $year): string
    {
        $prefix = "ENCG-FES-{$year}-".strtoupper($filiereCode);
        $lastStudent = self::where('student_number', 'like', "{$prefix}-%")
            ->orderByDesc('student_number')
            ->first();

        $seq = 1;
        if ($lastStudent) {
            $parts = explode('-', $lastStudent->student_number);
            $seq = ((int) end($parts)) + 1;
        }

        return $prefix.'-'.str_pad($seq, 5, '0', STR_PAD_LEFT);
    }
}
