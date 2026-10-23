<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\{AcademicYear, FinalProject, Student, User};
use App\Support\InternshipAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinalProjectController extends Controller
{
    public function index(Request $r)
    {
        $this->authorize('viewAny', FinalProject::class); $user = $r->user();
        $q = FinalProject::with('student.user', 'supervisor', 'projectDefenses')->whereNull('archived_at')->whereHas('student', fn ($s) => $s->where('institution_id', $user->institution_id));
        if (! InternshipAccess::staff($user) && ! $user->hasRole('scolarite')) $q->where(fn ($s) => $s->where('supervisor_id', $user->id)->orWhere('student_id', $user->student?->id ?? -1));
        if ($r->filled('search')) $q->where('title', 'like', '%'.$r->input('search').'%');
        if ($r->filled('status')) $q->where('status', $r->input('status'));
        $rows = $q->latest()->paginate(max(1, min(100, $r->integer('per_page', 25))));
        return response()->json(['success' => true, 'data' => $rows->items(), 'can_create' => $r->user()->can('create', FinalProject::class), 'meta' => ['total' => $rows->total(), 'last_page' => $rows->lastPage()]]);
    }
    public function show(int $id)
    {
        $p = FinalProject::with('student.user', 'supervisor', 'projectDefenses')->whereNull('archived_at')->findOrFail($id); $this->authorize('view', $p);
        return response()->json(['success' => true, 'data' => $p]);
    }
    public function store(Request $r)
    {
        $this->authorize('create', FinalProject::class);
        $data = $r->validate(['student_id' => 'required|integer', 'title' => 'required|string|max:255', 'description' => 'nullable|string|max:10000', 'supervisor_id' => 'nullable|integer']);
        if ($r->user()->hasRole('student')) $data['student_id'] = $r->user()->student?->id ?? -1;
        Student::where('institution_id', $r->user()->institution_id)->findOrFail($data['student_id']);
        if ($data['supervisor_id'] ?? null) { abort_unless(InternshipAccess::staff($r->user()), 403); User::where('institution_id', $r->user()->institution_id)->whereHas('professor')->findOrFail($data['supervisor_id']); }
        $data['academic_year_id'] = AcademicYear::where('institution_id', $r->user()->institution_id)->where('is_current', true)->firstOrFail()->id;
        $p = FinalProject::create($data + ['status' => 'submitted']); activity()->causedBy($r->user())->performedOn($p)->log('final_project_created');
        return response()->json(['success' => true, 'data' => $p], 201);
    }
    public function update(Request $r, int $id)
    {
        $p = FinalProject::whereNull('archived_at')->findOrFail($id); $this->authorize('update', $p);
        $data = $r->validate(['version' => 'required|integer|min:1', 'title' => 'sometimes|required|string|max:255', 'description' => 'nullable|string|max:10000',
            'status' => 'sometimes|in:submitted,in_progress,defended,validated', 'defense_date' => 'nullable|date', 'room_id' => 'nullable|integer|exists:rooms,id', 'supervisor_id' => 'nullable|integer']);
        if (isset($data['status']) && in_array($data['status'], ['defended', 'validated'], true)) abort_unless(InternshipAccess::staff($r->user()) && $p->projectDefenses()->whereNotNull('final_score')->exists(), 422, 'Une soutenance notée et une validation administrative sont requises.');
        if ($data['supervisor_id'] ?? null) { abort_unless(InternshipAccess::staff($r->user()), 403); User::where('institution_id', $r->user()->institution_id)->whereHas('professor')->findOrFail($data['supervisor_id']); }
        if (array_key_exists('defense_date', $data) || array_key_exists('room_id', $data)) abort_unless(InternshipAccess::staff($r->user()), 403);
        $p = DB::transaction(function () use ($r, $id, $data) {
            $p = FinalProject::whereKey($id)->lockForUpdate()->firstOrFail(); abort_unless((int) $p->version === $data['version'], 409, 'Le projet a été modifié ; rechargez.');
            abort_if($p->archived_at || in_array($p->status->value, ['defended', 'validated'], true), 409, 'Projet archivé ou évalué : une revue administrative est requise.');
            $p->fill(array_diff_key($data, ['version' => true]) + ['version' => $p->version + 1])->save();
            activity()->causedBy($r->user())->performedOn($p)->log('final_project_updated'); return $p;
        });
        return response()->json(['success' => true, 'data' => $p]);
    }
    public function destroy(Request $r, int $id)
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($r, $id) {
        $p = FinalProject::whereKey($id)->lockForUpdate()->firstOrFail(); $this->authorize('delete', $p);
        abort_if(in_array($p->status->value, ['defended', 'validated'], true), 422, 'Un projet soutenu ou validé reste dans l’historique.');
        $p->update(['archived_at' => now()]); activity()->causedBy($r->user())->performedOn($p)->log('final_project_archived');
        });
        return response()->json(['success' => true, 'message' => 'Projet archivé.']);
    }
    public function options(Request $request)
    {
        $this->authorize('create', FinalProject::class);
        $students = Student::with('user')->where('institution_id', $request->user()->institution_id);
        if (! InternshipAccess::staff($request->user())) $students->where('id', $request->user()->student?->id ?? -1);
        if ($request->filled('search')) $students->whereHas('user', fn ($q) => $q->whereLike('name', '%'.mb_substr($request->input('search'), 0, 100).'%'));
        return response()->json(['students' => $students->limit(100)->get()->map(fn ($s) => ['id' => $s->id, 'name' => $s->user->name, 'cne' => $s->cne])]);
    }}
