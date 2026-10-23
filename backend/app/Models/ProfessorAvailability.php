<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessorAvailability extends Model
{
    use HasFactory;

    protected $table = 'professor_availabilities';

    protected $guarded = ['id'];

    public function setAvailabilityDataAttribute($value): void
    {
        $this->attributes['availability_data'] = json_encode(is_string($value) ? json_decode($value, true, flags: JSON_THROW_ON_ERROR) : $value);
    }

    protected function casts(): array
    {
        return [
            'availability_data' => 'array',
            'is_available' => 'boolean',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id');
    }
}
