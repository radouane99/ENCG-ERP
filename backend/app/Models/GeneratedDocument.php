<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedDocument extends Model implements HasMedia
{
    use InteractsWithMedia;
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'expires_at' => 'datetime',
        'download_count' => 'integer',
    ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(DocumentRequest::class, 'document_request_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}

