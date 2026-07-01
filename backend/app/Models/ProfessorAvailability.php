<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessorAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'professor_id',
        'academic_year_id',
        'semester_id',
        'status', // pending, submitted
        'available_slots_count',
        'availability_data', // JSON structure of their slots
    ];

    protected $casts = [
        'availability_data' => 'array',
    ];

    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id');
    }
}
