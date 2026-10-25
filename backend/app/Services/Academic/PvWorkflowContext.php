<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Deliberation;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Semester;
use Illuminate\Http\Request;

class PvWorkflowContext
{
    public function resolve(Request $request): array
    {
        $data = $request->validate(['filiere_id' => 'required|integer', 'academic_year_id' => 'required|integer', 'semester_number' => 'required|integer|between:1,10', 'type' => 'required|in:semestriel,annuel', 'group_id' => 'nullable|integer']);
        $institution = $request->user()->institution_id;
        $filiere = Filiere::where('institution_id', $institution)->findOrFail($data['filiere_id']);
        $year = AcademicYear::where('institution_id', $institution)->findOrFail($data['academic_year_id']);
        $semester = Semester::where('academic_year_id', $year->id)->where('number', $data['semester_number'])->firstOrFail();
        $group = ! empty($data['group_id']) ? Group::where('filiere_id', $filiere->id)->where('academic_year_id', $year->id)->where('semester_number', $data['semester_number'])->findOrFail($data['group_id']) : null;
        $type = $data['type'] === 'annuel' ? 'annual' : 'semester';
        $deliberation = Deliberation::where('institution_id', $institution)->where('filiere_id', $filiere->id)->where('academic_year_id', $year->id)->where('semester_id', $semester->id)->where('type', $type)->where('group_id', $group?->id)->latest('id')->first();

        return compact('filiere', 'year', 'semester', 'group', 'type', 'deliberation');
    }
}
