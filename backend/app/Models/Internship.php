<?php

namespace App\Models;

use App\Enums\InternshipStatus;
use App\Traits\HasValidationWorkflow;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Internship extends Model
{
    use HasFactory, HasValidationWorkflow;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'status' => InternshipStatus::class,
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Professor::class, 'supervisor_id');
    }

    public function internshipDocuments(): HasMany
    {
        return $this->hasMany(InternshipDocument::class);
    }

    public function soutenance(): HasOne
    {
        return $this->hasOne(Soutenance::class);
    }

    public function internshipReports(): HasMany
    {
        return $this->hasMany(InternshipReport::class);
    }

    public function internshipEvaluations(): HasMany
    {
        return $this->hasMany(InternshipEvaluation::class);
    }
}
