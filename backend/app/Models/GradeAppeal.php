<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeAppeal extends Model
{
    use HasFactory;

    protected $table = 'grade_appeals';

    protected $fillable = [
        'student_id',
        'module_id',
        'assessment_id',
        'grade_id',
        'professor_id',
        'original_grade',
        'old_grade',
        'claimed_grade',
        'new_grade',
        'rectified_grade',
        'reason',
        'reason_category',
        'student_justification',
        'status',
        'professor_notes',
        'professor_comment',
        'resolved_by',
        'resolved_at',
        'appeal_deadline_at',
    ];

    protected $casts = [
        'original_grade' => 'float',
        'claimed_grade' => 'float',
        'rectified_grade' => 'float',
        'resolved_at' => 'datetime',
        'appeal_deadline_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function professor(): BelongsTo
    {
        return $this->belongsTo(Professor::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
