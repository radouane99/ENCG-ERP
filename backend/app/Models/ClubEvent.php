<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ClubEvent extends Model implements HasMedia
{
    use InteractsWithMedia;
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];
    }

    public function club()
    {
        return $this->belongsTo(Club::class);
    }
}

