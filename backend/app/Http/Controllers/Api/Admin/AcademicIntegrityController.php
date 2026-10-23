<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Module;
use App\Models\ModulePvSignature;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AcademicIntegrityController extends Controller
{
    public function resolveIdentity(Request $request, int $issueId)
    {
        abort_unless($request->user()->hasAnyRole(['super-admin', 'institution-admin', 'director', 'admin']), 403);

        return DB::transaction(function () use ($request, $issueId) {
            $issue = DB::table('data_integrity_issues')->where('id', $issueId)->where('entity', 'students')->whereNull('resolved_at')->lockForUpdate()->first();
            abort_unless($issue, 404);
            $field = match ($issue->reason) {
                'duplicate_legacy_cin' => 'cin', 'invalid_legacy_birth_date' => 'birth_date',
                default => str_replace('identity_conflict_', '', $issue->reason),
            };
            abort_unless(in_array($field, ['cin', 'birth_date', 'address', 'city']), 422);
            $student = Student::whereKey($issue->entity_id)->where('institution_id', $request->user()->institution_id)->lockForUpdate()->firstOrFail();
            $rules = $field === 'birth_date' ? ['required', 'date_format:Y-m-d', 'before:today'] : ['required', 'string', 'max:255'];
            if ($field === 'cin') {
                $rules = ['required', 'string', 'max:32', Rule::unique('users', 'cin')->ignore($student->user_id)];
            }
            if ($field === 'cin') {
                $request->merge(['value' => strtoupper(trim((string) $request->input('value')))]);
            }
            $data = $request->validate(['value' => $rules]);
            $student->update([$field => $data['value']]);
            DB::table('data_integrity_issues')->where('id', $issueId)->update(['resolved_at' => now(), 'updated_at' => now()]);
            activity()->causedBy($request->user())->performedOn($student)->withProperties(['field' => $field, 'issue_id' => $issueId])->log('canonical_identity_reconciled');

            return response()->json(['success' => true]);
        });
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->hasAnyRole(['super-admin', 'institution-admin', 'director', 'admin']), 403);
        $query = DB::table('data_integrity_issues')->whereNull('resolved_at');

        return response()->json(['success' => true, 'count' => (clone $query)->count(), 'data' => $query->orderBy('id')->paginate(50),
            'assessments' => Assessment::withoutGlobalScopes()->where('needs_review', true)->whereHas('module', fn ($q) => $q->where('institution_id', $request->user()->institution_id))->get(['id', 'module_id', 'type', 'date', 'academic_year_id']),
            'years' => AcademicYear::where('institution_id', $request->user()->institution_id)->get(['id', 'label'])]);
    }

    public function resolve(Request $request, int $id)
    {
        abort_unless($request->user()->hasAnyRole(['super-admin', 'institution-admin', 'director', 'admin']), 403);
        $data = $request->validate(['academic_year_id' => 'required|integer', 'type' => 'required|string|max:50', 'weight' => 'required|numeric|between:0,100']);

        return DB::transaction(function () use ($request, $id, $data) {
            $a = Assessment::withoutGlobalScopes()->lockForUpdate()->findOrFail($id);
            abort_unless($a->needs_review, 409, 'Cette modalité est déjà réconciliée.');
            $module = Module::whereKey($a->module_id)->where('institution_id', $request->user()->institution_id)->lockForUpdate()->firstOrFail();
            AcademicYear::whereKey($data['academic_year_id'])->where('institution_id', $module->institution_id)->firstOrFail();
            abort_if(ModulePvSignature::withoutGlobalScopes()->where('module_id', $module->id)->whereIn('academic_year_id', array_filter([$data['academic_year_id'], $a->academic_year_id]))->exists(), 409, 'Année déjà signée.');
            abort_if(Assessment::withoutGlobalScopes()->where('module_id', $module->id)->where('academic_year_id', $data['academic_year_id'])->where('type', $data['type'])->where('id', '!=', $a->id)->where('needs_review', false)->exists(), 409, 'Cette modalité existe déjà dans cette année.');
            $a->fill($data + ['needs_review' => false])->save();
            DB::table('data_integrity_issues')->where('entity', 'assessments')->where('entity_id', $a->id)->update(['resolved_at' => now(), 'updated_at' => now()]);
            activity()->causedBy($request->user())->performedOn($a)->withProperties($data)->log('assessment_integrity_resolved');

            return response()->json(['success' => true]);
        });
    }
}
