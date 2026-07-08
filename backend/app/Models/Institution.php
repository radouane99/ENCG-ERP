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

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];
    }

    public function campuses(): HasMany
    {
        return $this->hasMany(Campus::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}

