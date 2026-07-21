<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class DocumentRequest extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, \App\Traits\HasValidationWorkflow;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'requested_at' => 'datetime',
        'processed_at' => 'datetime',
        'admin_notes' => 'array',
    ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }
}
