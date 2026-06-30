<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Deliberation extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'academic_year_id',
        'semester_id',
        'filiere_id',
        'group_id',
        'type',
        'status',
        'deliberation_date',
        'pv_content',
        'pv_file_path',
        'president_id',
    ];

    protected $casts = [
        'deliberation_date' => 'date',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function president(): BelongsTo
    {
        return $this->belongsTo(User::class, 'president_id');
    }

    public function decisions(): HasMany
    {
        return $this->hasMany(DeliberationDecision::class);
    }
}
