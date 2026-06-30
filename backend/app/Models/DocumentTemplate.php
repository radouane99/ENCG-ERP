<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'name',
        'code',
        'type',
        'category',
        'html_template',
        'html_template_ar',
        'has_qr',
        'has_signature',
        'has_stamp',
        'is_active',
    ];

    protected $casts = [
        'has_qr' => 'boolean',
        'has_signature' => 'boolean',
        'has_stamp' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }
}
