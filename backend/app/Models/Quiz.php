<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'academic_year_id',
        'title',
        'instructions',
        'duration_minutes',
        'max_attempts',
        'pass_score',
        'randomize_questions',
        'show_results_immediately',
        'available_from',
        'available_until',
        'is_published',
        'ai_generated',
    ];

    protected $casts = [
        'available_from' => 'datetime',
        'available_until' => 'datetime',
        'randomize_questions' => 'boolean',
        'show_results_immediately' => 'boolean',
        'is_published' => 'boolean',
        'ai_generated' => 'boolean',
        'pass_score' => 'decimal:2',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class);
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }
}
