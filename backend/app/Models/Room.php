<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Room extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['id'];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }
}
