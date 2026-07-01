<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'student_id',
        'attempt_number',
        'answers',
        'score',
        'percentage',
        'passed',
        'started_at',
        'submitted_at',
        'time_spent_seconds',
    ];

    protected $casts = [
        'answers' => 'array',
        'score' => 'decimal:2',
        'percentage' => 'decimal:2',
        'passed' => 'boolean',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
