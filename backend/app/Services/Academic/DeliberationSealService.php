<?php

namespace App\Services\Academic;

use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeliberationSealService
{
    public function vote(Deliberation $deliberation, User $user, string $decision, ?string $comment = null): void
    {
        $this->assertNotSealed($deliberation);

        $now = now();
        DB::table('deliberation_votes')->upsert(
            [[
                'deliberation_id' => $deliberation->id,
                'user_id' => $user->id,
                'decision' => $decision,
                'comment' => $comment,
                'created_at' => $now,
                'updated_at' => $now,
            ]],
            ['deliberation_id', 'user_id'],
            ['decision', 'comment', 'updated_at']
        );
    }

    public function seal(Deliberation $deliberation, User $user): string
    {
        return DB::transaction(function () use ($deliberation, $user) {
            abort_unless((int) $deliberation->institution_id === (int) $user->institution_id, 403);
            $modules = \App\Models\Module::where('filiere_id', $deliberation->filiere_id)->when($deliberation->type !== 'annual', fn ($q) => $q->where('semester_number', $deliberation->semester->number))->orderBy('id')->lockForUpdate()->get();
            $deliberation = Deliberation::whereKey($deliberation->id)->lockForUpdate()->firstOrFail();
            if ($deliberation->is_sealed) return $deliberation->seal_hash;
            $decisions = DeliberationDecision::where('deliberation_id', $deliberation->id)->orderBy('student_id')->get();
            $payload = json_encode([
                'deliberation_id' => $deliberation->id, 'academic_year_id' => $deliberation->academic_year_id,
                'decisions' => $decisions->toArray(),
                'votes' => DB::table('deliberation_votes')->where('deliberation_id', $deliberation->id)->orderBy('user_id')->get()->toArray(),
                'grades' => DB::table('grades as g')->join('assessments as a', 'a.id', '=', 'g.assessment_id')->where('a.academic_year_id', $deliberation->academic_year_id)->whereIn('a.module_id', $modules->pluck('id'))->whereIn('g.student_id', $decisions->pluck('student_id'))->orderBy('g.id')->get(['g.id', 'g.student_id', 'g.assessment_id', 'g.value', 'g.absent', 'g.version'])->toArray(),
            ], JSON_THROW_ON_ERROR);
            $hash = hash('sha256', $payload);
            $deliberation->update(['is_sealed' => true, 'seal_hash' => $hash, 'sealed_at' => now(), 'status' => 'sealed']);
            activity()->causedBy($user)->performedOn($deliberation)->withProperties(['seal_hash' => $hash])->log('deliberation_sealed');
            return $hash;
        });
    }

    public function assertModuleOpen(int $moduleId, int $studentId, int $yearId): void
    {
        $module = \App\Models\Module::whereKey($moduleId)->lockForUpdate()->firstOrFail();
        $groups = \App\Models\StudentRegistration::where('student_id', $studentId)->where('academic_year_id', $yearId)->pluck('group_id');
        $sealed = Deliberation::where('filiere_id', $module->filiere_id)->where('academic_year_id', $yearId)->where('is_sealed', true)
            ->where(fn ($q) => $q->whereNull('group_id')->orWhereIn('group_id', $groups))
            ->where(fn ($q) => $q->where('type', 'annual')->orWhereHas('semester', fn ($s) => $s->where('number', $module->semester_number)))->exists();
        abort_if($sealed, 423, 'PV scellé : une réouverture validée est requise avant modification des notes.');
    }
    public function requestReopen(Deliberation $deliberation, User $user, string $motif): int
    {
        if (! $deliberation->is_sealed) {
            throw new HttpException(422, 'Cette délibération n\'est pas scellée.');
        }

        return (int) DB::table('deliberation_reopen_requests')->insertGetId([
            'deliberation_id' => $deliberation->id,
            'requested_by' => $user->id,
            'motif' => $motif,
            'seal_hash' => $deliberation->seal_hash,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function approveReopen(int $requestId, User $approver): void
    {
        $row = DB::table('deliberation_reopen_requests')->where('id', $requestId)->first();
        if (! $row) {
            throw new HttpException(404, 'Demande introuvable.');
        }

        $requester = User::find($row->requested_by);
        $deliberation = Deliberation::findOrFail($row->deliberation_id);
        abort_unless($row->status === 'pending', 409, 'Demande déjà traitée.');
        abort_unless((int) $deliberation->institution_id === (int) $approver->institution_id && (int) $requester?->institution_id === (int) $deliberation->institution_id, 403);
        if ($requester && $requester->id === $approver->id) {
            throw new HttpException(403, 'Le second visa doit être un autre utilisateur (règle 4-yeux).');
        }

        $ok = $this->isFourEyesRole($approver) && $requester && $this->isFourEyesRole($requester);
        if (! $ok) {
            throw new HttpException(403, 'Réouverture réservée à director / filiere-head / super-admin (deux visas).');
        }

        DB::transaction(function () use ($row, $approver) {
            $row = DB::table('deliberation_reopen_requests')->where('id', $row->id)->lockForUpdate()->first();
            abort_unless($row->status === 'pending', 409, 'Demande déjà traitée.');
            $deliberation = Deliberation::whereKey($row->deliberation_id)->lockForUpdate()->firstOrFail();
            abort_unless($deliberation->is_sealed && (!$row->seal_hash || hash_equals($row->seal_hash, $deliberation->seal_hash)), 409, 'Le scellé a changé. Une nouvelle demande est requise.');
            DB::table('deliberation_reopen_requests')->where('id', $row->id)->update([
                'second_approver_id' => $approver->id,
                'status' => 'approved',
                'approved_at' => now(),
                'updated_at' => now(),
            ]);
            Deliberation::where('id', $row->deliberation_id)->update([
                'is_sealed' => false,
                'status' => 'reopened',
            ]);
        });
    }

    public function assertNotSealed(Deliberation $deliberation): void
    {
        if (Schema::hasColumn('deliberations', 'is_sealed') && $deliberation->is_sealed) {
            throw new HttpException(423, 'PV scellé — réouverture 4-yeux requise.');
        }
    }

    private function isFourEyesRole(User $user): bool
    {
        return $user->hasAnyRole(['super-admin', 'director', 'filiere-head', 'institution-admin']);
    }
}
