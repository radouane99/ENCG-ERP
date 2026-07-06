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

    protected $fillable = [
        'module_id',
        'academic_year_id',
        'professor_id',
        'professor_type',
        'title',
        'description',
        'type', // document, video, link, quiz_bank
        'file_path',
        'external_url',
        'is_published',
        'order',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

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

