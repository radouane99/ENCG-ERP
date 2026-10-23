<?php
namespace App\Http\Controllers\Api\Academic;

use App\Actions\Academic\ManageGradeAppealAction;
use App\Http\Controllers\Controller;
use App\Models\{Assessment, Grade, GradeAppeal, Student};
use App\Services\Academic\AcademicContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradeAppealController extends Controller
{
    public function studentIndex(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $targets = DB::table('grade_publications as p')->join('assessments as a', 'p.assessment_id', '=', 'a.id')->join('modules as m', 'a.module_id', '=', 'm.id')
            ->join('grades as g', 'g.assessment_id', '=', 'a.id')->where('g.student_id', $student->id)->where('a.academic_year_id', AcademicContext::yearId())->where('a.needs_review', false)
            ->whereNotNull('g.value')->where('p.published_at', '<=', now())->where('p.appeals_until', '>=', now())
            ->get(['a.id as assessment_id', 'a.module_id', 'm.name as module_name', 'a.type', 'g.value', 'p.appeals_until']);
        return response()->json(['success' => true, 'data' => ['appeals' => GradeAppeal::with('module', 'assessment')->where('student_id', $student->id)->latest()->get(),
            'appeal_targets' => $targets, 'appeal_window' => ['is_open' => $targets->isNotEmpty(), 'duration_hours' => 48, 'closes_at' => $targets->max('appeals_until')]]]);
    }
    public function studentStore(Request $request)
    {
        $data = $request->validate(['module_id' => 'required|integer', 'assessment_id' => 'required|integer', 'claimed_grade' => 'nullable|numeric|min:0|max:20',
            'reason_category' => 'required|in:erreur_materielle,oubli_cc,non_report,autre', 'student_justification' => 'required|string|min:10|max:1000']);
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $appeal = app(ManageGradeAppealAction::class)->create($student, $data);
        $student->user->notify(new \App\Notifications\SystemNotification('Recours enregistré', 'Votre recours est transmis pour examen.', 'info', '/student/grades'));
        return response()->json(['success' => true, 'data' => $appeal, 'message' => 'Recours enregistré.'], 201);
    }
    public function index(Request $request)
    {
        $user = $request->user();
        $q = GradeAppeal::whereHas('student', fn ($s) => $s->where('institution_id', $user->institution_id));
        if (! $user->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'pedagogy_officer', 'department-head', 'scolarite'])) {
            $modules = DB::table('module_professor')->where('professor_id', $user->professor?->id ?? -1)->where('academic_year_id', AcademicContext::yearId())->pluck('module_id');
            $q->whereIn('module_id', $modules);
        }
        $stats = []; foreach (['submitted', 'rectified', 'maintained'] as $state) $stats[$state] = (clone $q)->where('status', $state)->count();
        $stats['total'] = (clone $q)->count();
        if ($request->filled('status')) $q->where('status', $request->input('status'));
        if ($request->filled('module_id')) $q->where('module_id', $request->integer('module_id'));
        return response()->json(['success' => true, 'data' => $q->with('student.user', 'module', 'assessment', 'resolver')->latest()->paginate(max(1, min(100, $request->integer('per_page', 25)))), 'statistics' => $stats]);
    }
    public function resolve(Request $request, int $id)
    {
        $request->merge(['decision' => $request->input('decision', $request->input('status')), 'rectified_grade' => $request->input('rectified_grade', $request->input('new_grade')),
            'professor_comment' => $request->input('professor_comment', $request->input('resolution_notes'))]);
        $data = $request->validate(['decision' => 'required|in:rectified,maintained,rejected', 'rectified_grade' => 'required_if:decision,rectified|nullable|numeric|min:0|max:20', 'professor_comment' => 'required|string|min:5|max:1000']);
        $appeal = app(ManageGradeAppealAction::class)->resolve($request->user(), $id, $data);
        $appeal->student->user->notify(new \App\Notifications\SystemNotification('Décision de recours', $data['professor_comment'], 'info', '/student/grades'));
        return response()->json(['success' => true, 'data' => $appeal, 'message' => 'Décision enregistrée.']);
    }
    public function publish(Request $request)
    {
        abort_unless($request->user()->hasAnyRole(['super-admin', 'institution-admin', 'director', 'admin', 'pedagogy_officer']), 403);
        $data = $request->validate(['assessment_id' => 'required|integer', 'duration_hours' => 'required|integer|min:1|max:168']);
        $a = Assessment::with('module')->findOrFail($data['assessment_id']);
        abort_unless((int) $a->module->institution_id === (int) $request->user()->institution_id, 404);
        abort_if($a->needs_review, 422, 'Évaluation historique à réconcilier.');
        $row = DB::transaction(function () use ($a, $data, $request) {
            \App\Models\Module::whereKey($a->module_id)->lockForUpdate()->firstOrFail();
            $existing = DB::table('grade_publications')->where('assessment_id', $a->id)->first();
            if ($existing) return $existing;
            $id = DB::table('grade_publications')->insertGetId(['assessment_id' => $a->id, 'published_at' => now(), 'appeals_until' => now()->addHours($data['duration_hours']), 'published_by' => $request->user()->id, 'created_at' => now(), 'updated_at' => now()]);
            activity()->causedBy($request->user())->performedOn($a)->log('grade_results_published');
            return DB::table('grade_publications')->find($id);
        });
        return response()->json(['success' => true, 'publication' => $row]);
    }
}
