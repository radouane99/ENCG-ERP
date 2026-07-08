<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternshipEvaluation extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'technical_score' => 'decimal:2',
            'behavior_score' => 'decimal:2',
            'initiative_score' => 'decimal:2',
            'report_score' => 'decimal:2',
            'final_score' => 'decimal:2',
        ];
    }

    public function internship(): BelongsTo
    {
        return $this->belongsTo(Internship::class);
    }
}
