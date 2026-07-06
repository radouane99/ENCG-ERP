<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institution extends Model implements HasMedia
{
    use InteractsWithMedia;
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'name_ar',
        'code',
        'slug',
        'type',
        'logo_path',
        'stamp_path',
        'signature_path',
        'address',
        'city',
        'phone',
        'email',
        'website',
        'fax',
        'rector_name',
        'director_name',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public function campuses(): HasMany
    {
        return $this->hasMany(Campus::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}

