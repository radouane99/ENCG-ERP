<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'author_id',
        'title',
        'body',
        'type',
        'target_roles',
        'target_filieres',
        'is_pinned',
        'is_published',
        'published_at',
        'expires_at',
        'attachment_path',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'target_roles' => 'array',
            'target_filieres' => 'array',
            'is_pinned' => 'boolean',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
