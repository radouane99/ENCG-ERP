<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Internship extends Model
{
    use HasFactory, \App\Traits\HasValidationWorkflow;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'status' => \App\Enums\InternshipStatus::class,
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function internshipDocuments(): HasMany
    {
        return $this->hasMany(InternshipDocument::class);
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