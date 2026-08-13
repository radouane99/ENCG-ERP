<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessorSubstitution extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function originalProfessor(): BelongsTo
    {
        return $this->belongsTo(Professor::class, 'original_professor_id');
    }

    public function substituteProfessor(): BelongsTo
    {
        return $this->belongsTo(Professor::class, 'substitute_professor_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeCurrentlyActive($query)
    {
        $today = now()->format('Y-m-d');
        return $query->where('status', 'active')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today);
    }
}
