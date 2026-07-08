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

    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
        ];
    }

    public function professor(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Professor::class, 'professor_id');
    }
}
