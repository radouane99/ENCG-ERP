<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class LearningMaterial extends Model implements HasMedia
{
    use InteractsWithMedia;
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'is_published' => 'boolean',
    ];
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function professor()
    {
        return $this->morphTo();
    }
}

