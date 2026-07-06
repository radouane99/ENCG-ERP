<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternshipDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'internship_id',
        'document_type',
        'file_path',
        'status',
        'feedback'
    ];

    public function internship(): BelongsTo
    {
        return $this->belongsTo(Internship::class);
    }
}
