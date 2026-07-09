<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\OptimisticLocking;

class Grade extends Model
{
    use HasFactory, OptimisticLocking;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'value' => 'float',
            'absent' => 'boolean',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }
}
