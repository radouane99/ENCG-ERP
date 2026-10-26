<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Group extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['id'];

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function studentRegistrations(): HasMany
    {
        return $this->hasMany(StudentRegistration::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'student_pathways', 'group_id', 'student_id')
            ->where('student_pathways.is_current', true)
            ->withPivot(['academic_year_id', 'current_semester', 'is_current']);
    }

    public function pathways(): HasMany
    {
        return $this->hasMany(StudentPathway::class);
    }

    public function studentPathways(): HasMany
    {
        return $this->hasMany(StudentPathway::class);
    }

    public function speciality(): BelongsTo
    {
        return $this->belongsTo(Speciality::class);
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

        return $this->where($field ?? $this->getRouteKeyName(), $value)->first();
    }
}
