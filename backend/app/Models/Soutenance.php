<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Soutenance extends Model
{
    use HasFactory;

    protected $fillable = [
        'internship_id',
        'date_time',
        'room_id',
        'president_id',
        'examiner_id',
        'grade',
        'status',
        'remarks'
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'grade' => 'decimal:2',
    ];

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
