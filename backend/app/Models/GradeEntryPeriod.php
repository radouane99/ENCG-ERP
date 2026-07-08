<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class GradeEntryPeriod extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_open' => 'boolean',
    ];
    }

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
