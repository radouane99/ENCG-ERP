<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_request_id',
        'file_path',
        'verification_token',
        'verification_url',
        'qr_code_path',
        'expires_at',
        'download_count',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'download_count' => 'integer',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(DocumentRequest::class, 'document_request_id');
    }
}
