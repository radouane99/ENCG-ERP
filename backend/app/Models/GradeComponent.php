<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradeComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'exam_session_id',
        'name',
        'code',
        'weight',
        'max_grade',
        'is_eliminatory',
        'eliminatory_threshold',
    ];

    protected $casts = [
        'weight' => 'float',
        'max_grade' => 'float',
        'is_eliminatory' => 'boolean',
        'eliminatory_threshold' => 'float',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }
}
