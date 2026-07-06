<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Club extends Model implements HasMedia
{
    use InteractsWithMedia;
    use HasFactory;

    protected $fillable = [
        'institution_id', 'name', 'name_ar', 'category', 'description', 
        'logo_path', 'president_name', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function members()
    {
        return $this->hasMany(ClubMember::class);
    }

    public function events()
    {
        return $this->hasMany(ClubEvent::class);
    }
}

