<?php

namespace App\Models;

use App\Traits\Auditable;
use App\Traits\HasValidationWorkflow;
use App\Traits\OptimisticLocking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Grade extends Model
{
    use Auditable, HasFactory, HasValidationWorkflow, OptimisticLocking;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'value' => 'float',
            'absent' => 'boolean',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function module(): HasOneThrough
    {
        return $this->hasOneThrough(
            Module::class,
            Assessment::class,
            'id',
            'id',
            'assessment_id',
            'module_id'
        );
    }

    public function getModuleAttribute(): ?Module
    {
        return $this->relationLoaded('module')
            ? $this->getRelation('module')
            : $this->assessment?->module;
    }
}
