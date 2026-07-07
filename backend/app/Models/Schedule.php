<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'academic_year_id',
        'semester_id',
        'group_id',
        'module_id',
        'room_id',
        'professor_id',
        'professor_type',
        'day_of_week',
        'start_time',
        'end_time',
        'session_type',
        'recurrence',
        'is_active',
    ];

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
}
