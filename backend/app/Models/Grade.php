<?php

namespace App\Models;

use App\Services\Academic\DeliberationSealService;
use App\Traits\Auditable;
use App\Traits\HasValidationWorkflow;
use App\Traits\OptimisticLocking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Support\Facades\DB;

class Grade extends Model
{
    use Auditable, HasFactory, HasValidationWorkflow, OptimisticLocking;

    protected $guarded = ['id'];

    public function save(array $options = [])
    {
        return DB::transaction(function () use ($options) {
            $assessment = Assessment::withoutGlobalScopes()->find($this->assessment_id);
            if ($assessment && (! $this->exists || $this->isDirty(['value', 'absent', 'student_id', 'assessment_id']))) {
                app(DeliberationSealService::class)->assertModuleOpen((int) $assessment->module_id, (int) $this->student_id, (int) $assessment->academic_year_id);
            }

            return parent::save($options);
        });
    }

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
