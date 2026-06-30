<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'grade_component_id',
        'student_id',
        'exam_session_id',
        'score',
        'is_absent',
        'is_justified_absence',
        'final_score',
        'notes',
        'entered_by',
        'entered_at',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'score' => 'float',
        'is_absent' => 'boolean',
        'is_justified_absence' => 'boolean',
        'final_score' => 'float',
        'entered_at' => 'datetime',
        'validated_at' => 'datetime',
    ];

    public function component(): BelongsTo
    {
        return $this->belongsTo(GradeComponent::class, 'grade_component_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }

    public function enterer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
