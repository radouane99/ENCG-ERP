<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\OptimisticLocking;

class Schedule extends Model
{
    use HasFactory, HasUuids, OptimisticLocking;

    protected $guarded = ['id'];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function professor(): BelongsTo
    {
        // Polymorphic relation
        return $this->morphTo();
    }

    public function changes(): HasMany
    {
        return $this->hasMany(ScheduleChange::class);
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
