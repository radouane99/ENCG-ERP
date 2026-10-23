<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentDocument extends Model
{
    use HasFactory;

    protected $table = 'student_documents';

    protected $fillable = [
        'student_id',
        'application_id',
        'cne',
        'type',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'status',
        'version', 'is_current', 'content_hash', 'storage_disk', 'withdrawn_at', 'uploaded_by',
    ];

    protected function casts(): array
    {
        return ['is_current' => 'boolean', 'version' => 'integer', 'withdrawn_at' => 'datetime'];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
