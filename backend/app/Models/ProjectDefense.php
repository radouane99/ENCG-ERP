<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectDefense extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'presentation_score' => 'decimal:2',
            'report_score' => 'decimal:2',
            'final_score' => 'decimal:2',
        ];
    }

    public function finalProject(): BelongsTo
    {
        return $this->belongsTo(FinalProject::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
