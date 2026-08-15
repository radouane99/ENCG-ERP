<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function copies(): HasMany
    {
        return $this->hasMany(BookCopy::class);
    }
}
