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
        $this->assertNotSealed($deliberation);

        $payload = DeliberationDecision::where('deliberation_id', $deliberation->id)
            ->orderBy('student_id')
            ->get(['student_id', 'decision', 'semester_average', 'mention'])
            ->toJson();

        $hash = hash('sha256', $payload.'|'.$deliberation->id.'|'.$user->id);

        $deliberation->update([
            'is_sealed' => true,
            'seal_hash' => $hash,
            'sealed_at' => now(),
            'status' => 'sealed',
        ]);

        return $hash;
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
        if ($requester && $requester->id === $approver->id) {
            throw new HttpException(403, 'Le second visa doit être un autre utilisateur (règle 4-yeux).');
        }

        $ok = $this->isFourEyesRole($approver) && $requester && $this->isFourEyesRole($requester);
        if (! $ok) {
            throw new HttpException(403, 'Réouverture réservée à director / filiere-head / super-admin (deux visas).');
        }

        DB::transaction(function () use ($row, $approver) {
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
