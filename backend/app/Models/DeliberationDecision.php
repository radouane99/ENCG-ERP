<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliberationDecision extends Model
{
    use HasFactory;

    protected $fillable = [
        'deliberation_id',
        'student_id',
        'semester_average',
        'annual_average',
        'compensated_average',
        'decision',
        'was_compensated',
        'was_rachat',
        'mention',
        'next_semester',
        'jury_notes',
    ];

    protected $casts = [
        'semester_average' => 'float',
        'annual_average' => 'float',
        'compensated_average' => 'float',
        'was_compensated' => 'boolean',
        'was_rachat' => 'boolean',
        'next_semester' => 'integer',
    ];

    public function deliberation(): BelongsTo
    {
        return $this->belongsTo(Deliberation::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
