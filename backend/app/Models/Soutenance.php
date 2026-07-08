<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Soutenance extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'date_time' => 'datetime',
        'grade' => 'decimal:2',
    ];
    }

    public function internship(): BelongsTo
    {
        return $this->belongsTo(Internship::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function president(): BelongsTo
    {
        return $this->belongsTo(Professor::class, 'president_id');
    }

    public function examiner(): BelongsTo
    {
        return $this->belongsTo(Professor::class, 'examiner_id');
    }
}
