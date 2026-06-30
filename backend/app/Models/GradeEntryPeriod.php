<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class GradeEntryPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year_id',
        'semester_id',
        'exam_session_id',
        'start_date',
        'end_date',
        'is_open',
        'opened_by',
        'closed_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_open' => 'boolean',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }

    /**
     * Check if the grading period is currently active and open.
     */
    public function isActive(): bool
    {
        if (!$this->is_open) {
            return false;
        }

        $now = Carbon::now();
        return $now->between($this->start_date->startOfDay(), $this->end_date->endOfDay());
    }
}
