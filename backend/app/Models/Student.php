<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\StudentPathway;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Student extends Model
{
    use HasFactory, SoftDeletes, LogsActivity, HasUuids;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty();
    }

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'has_disability' => 'boolean',
        ];
    }

    public function getUserAttributeSafely(string $attribute)
    {
        $userVal = null;
        if ($this->relationLoaded('user')) {
            $userVal = $this->user?->{$attribute};
        } elseif (!\Illuminate\Database\Eloquent\Model::preventsLazyLoading()) {
            $userVal = $this->user?->{$attribute};
        }
        return $userVal ?? $this->attributes[$attribute] ?? null;
    }

    protected function firstName(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->getUserAttributeSafely('first_name'),
        );
    }

    protected function lastName(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->getUserAttributeSafely('last_name'),
        );
    }

    protected function email(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->getUserAttributeSafely('email'),
        );
    }

    protected function phone(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->getUserAttributeSafely('phone'),
        );
    }

    protected function cin(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->getUserAttributeSafely('cin'),
        );
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function internships(): HasMany
    {
        return $this->hasMany(Internship::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function blockchainCertificates(): HasMany
    {
        return $this->hasMany(BlockchainCertificate::class);
    }

    public function pathways(): HasMany
    {
        return $this->hasMany(StudentPathway::class);
    }

    public function latestPathway(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(StudentPathway::class)->latestOfMany();
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(StudentRegistration::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    // ✅ AJOUTÉ : Relation pour les pointages de présence
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function resitEligibilities(): HasMany
    {
        return $this->hasMany(ResitEligibility::class, 'student_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class, 'student_id');
    }

    public function documentRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class, 'student_id');
    }

    public function studentDocuments(): HasMany
    {
        return $this->hasMany(StudentDocument::class, 'student_id');
    }

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    public function resolveRouteBinding($value, $field = null)
    {
        if (is_numeric($value)) {
            return $this->where('id', (int) $value)->first();
        }

        if (\Illuminate\Support\Str::isUuid($value)) {
            return $this->where('uuid', $value)->first();
        }

        return $this->where('student_number', $value)->first();
    }
}