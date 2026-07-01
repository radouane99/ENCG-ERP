<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DisciplinaryDecision extends Model
{
    use HasFactory;

    protected $fillable = [
        'disciplinary_case_id', 'sanction_type', 'suspension_days',
        'decision_text', 'decision_date', 'is_appealed', 'appeal_notes', 'decided_by'
    ];

    protected $casts = [
        'decision_date' => 'date',
        'is_appealed' => 'boolean',
    ];

    public function disciplinaryCase()
    {
        return $this->belongsTo(DisciplinaryCase::class);
    }

    public function decidedBy()
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
