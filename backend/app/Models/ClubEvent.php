<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClubEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'club_id', 'title', 'description', 'start_at', 'end_at', 
        'location', 'status', 'poster_path'
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }
}
