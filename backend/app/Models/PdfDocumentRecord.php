<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdfDocumentRecord extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['file_path', 'created_by', 'revoked_by', 'revocation_reason', 'content_fingerprint'];

    protected function casts(): array
    {
        return ['issued_at' => 'datetime', 'revoked_at' => 'datetime'];
    }
}
