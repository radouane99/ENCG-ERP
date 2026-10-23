<?php

namespace App\Models\Concerns;

use App\Services\Academic\AcademicContext;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToAcademicYear
{
    protected static function bootBelongsToAcademicYear(): void
    {
        static::addGlobalScope('academic_year', function (Builder $query) {
            $year = AcademicContext::yearId();
            $query->where($query->getModel()->qualifyColumn('academic_year_id'), $year ?? -1);
        });
        static::creating(function ($model) {
            $model->academic_year_id ??= AcademicContext::yearId();
            abort_unless($model->academic_year_id, 422, 'Année universitaire requise.');
        });
    }
}
