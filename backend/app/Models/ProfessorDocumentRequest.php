<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessorDocumentRequest extends Model
{
    use HasFactory;

    protected $table = 'professor_document_requests';

    protected $fillable = [
        'user_id',
        'professor_id',
        'document_type',
        'tracking_code',
        'purpose',
        'destination',
        'start_date',
        'end_date',
        'transport_mode',
        'status',
        'admin_notes',
        'signed_by',
        'signed_at',
        'file_path',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'signed_at'  => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function professor(): BelongsTo
    {
        return $this->belongsTo(Professor::class);
    }
}
