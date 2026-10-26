<?php

namespace App\Services\Admissions;

use App\Models\AcademicYear;
use App\Models\Application;
use App\Models\Institution;
use App\Models\Student;
use App\Models\StudentRegistration;

final class AdmissionAdministrativeContext
{
    public function read(Application $application): array
    {
        $campaign = $application->campaign;
        $institution = Institution::find($campaign->institution_id);
        $student = $application->student_id ? Student::whereKey($application->student_id)->where('institution_id', $campaign->institution_id)->where('user_id', $application->owner_user_id)->first() : null;
        $registrations = $student ? StudentRegistration::with('academicYear:id,label', 'filiere:id,name,type')->where('student_id', $student->id)->orderByDesc('academic_year_id')->orderBy('semester_number')->get() : collect();
        $initial = $registrations->where('registration_type', 'initial')->where('academic_year_id', $campaign->academic_year_id);

        return [
            'gender_ar' => match ($application->profile['gender'] ?? null) {
                'male' => 'ذكر', 'female' => 'أنثى', default => null
            },
            'entry_route' => $campaign->entry_route, 'planned_entry_semester' => $campaign->entry_semester,
            'academic_year' => AcademicYear::whereKey($campaign->academic_year_id)->value('label'),
            'university' => $institution?->settings['university_name'] ?? null,
            'filiere' => $campaign->filiere?->name, 'cycle' => $campaign->filiere?->type,
            'registration_status' => $initial->first()?->status ?? $application->dossier_status,
            'registration_date' => $initial->first()?->admin_validated_at?->toIso8601String() ?? $application->approved_at?->toIso8601String(),
            'registration_semesters' => $initial->pluck('semester_number')->unique()->values()->all(),
            'renewals' => $registrations->where('registration_type', 're_enrollment')->values()->map(fn ($row) => [
                'academic_year' => $row->academicYear?->label, 'semester' => $row->semester_number,
                'filiere' => $row->filiere?->name, 'cycle' => $row->filiere?->type,
                'date' => $row->admin_validated_at?->toIso8601String(), 'status' => $row->status,
            ])->all(),
            'created_at' => $application->created_at?->toIso8601String(), 'updated_at' => $application->updated_at?->toIso8601String(),
        ];
    }
}
