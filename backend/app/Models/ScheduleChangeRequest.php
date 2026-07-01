<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'professor_id',
        'exam_id',
        'old_date',
        'old_start_time',
        'proposed_date',
        'proposed_start_time',
        'reason',
        'status', // pending, approved, rejected
    ];

    protected $casts = [
        'old_date' => 'date',
        'proposed_date' => 'date',
    ];

    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
