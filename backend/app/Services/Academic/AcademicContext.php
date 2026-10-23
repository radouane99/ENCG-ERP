<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;

class AcademicContext
{
    public static function yearId(): ?int
    {
        if (app()->bound('academic.context.year')) {
            return (int) app('academic.context.year');
        }
        $institution = config('erp.institution_id', 1);
        $requested = app()->bound('request') ? request()->input('academic_year_id') : null;
        $query = AcademicYear::where('institution_id', $institution);

        return $requested
            ? $query->whereKey($requested)->value('id')
            : $query->where('is_current', true)->value('id');
    }

    public static function run(int $yearId, callable $operation): mixed
    {
        abort_unless(AcademicYear::whereKey($yearId)->where('institution_id', config('erp.institution_id', 1))->exists(), 422, 'Année universitaire invalide.');
        $previous = app()->bound('academic.context.year') ? app('academic.context.year') : null;
        app()->instance('academic.context.year', $yearId);
        try {
            return $operation();
        } finally {
            app()->forgetInstance('academic.context.year');
            if ($previous !== null) {
                app()->instance('academic.context.year', $previous);
            }
        }
    }
}
