<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResitEligibility extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $fillable = [
        'student_id', 'module_id', 'exam_session_id',
        'is_eligible', 'reason', 'status',
        // #8 — Decision tracking
        'decided_by', 'decided_at',
        // #6 — Justification document upload
        'justification_document',
    ];

    protected function casts(): array
    {
        return [
            'is_eligible' => 'boolean',
            'decided_at'  => 'datetime',
        ];
    }

    // ── Relationships ─────────────────────────────────────────────────────

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }

    /** #8 — Who made the decision */
    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
