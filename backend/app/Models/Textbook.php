<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Textbook extends Model
{
    use HasFactory;

    protected $table = 'textbooks';

    protected $fillable = [
        'professor_id',
        'user_id',
        'module_id',
        'group_id',
        'schedule_id',
        'session_date',
        'session_duration_hours',
        'session_type',
        'chapter_title',
        'key_concepts',
        'pedagogical_goals',
        'homework_assigned',
        'syllabus_percentage',
        'status',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'session_date' => 'date',
        'session_duration_hours' => 'float',
        'syllabus_percentage' => 'integer',
        'validated_at' => 'datetime',
    ];

    public function professor(): BelongsTo
    {
        return $this->belongsTo(Professor::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
