<?php

namespace App\Actions\Document;

use App\Models\User;
use App\Services\Core\OperationalWorkspaceService;
use Illuminate\Support\Facades\DB;

class AssignDocumentFollowupAction
{
    public function execute(User $user, int $id, array $data): void
    {
        $workspace = app(OperationalWorkspaceService::class);
        abort_unless($workspace->isStaff($user), 403);
        DB::transaction(function () use ($user, $id, $data, $workspace) {
            $request = $workspace->requests($user)->whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($request->status, ['pending', 'processing'], true), 409, 'Demande déjà traitée.');
            if ($data['assigned_to']) {
                $agent = User::where('institution_id', $user->institution_id)->where('is_active', true)->findOrFail($data['assigned_to']);
                abort_unless($workspace->isStaff($agent), 422, 'Choisir un agent habilité.');
            }
            $query = DB::table('operational_request_followups')->where('document_request_id', $id);
            $old = $query->lockForUpdate()->first();
            abort_unless(($old?->version ?? 0) === $data['revision'], 409, 'Le suivi a changé. Rechargez la liste.');
            $values = ['assigned_to' => $data['assigned_to'], 'due_at' => $data['due_at'], 'version' => ($old?->version ?? 0) + 1, 'last_reminded_at' => null, 'updated_at' => now()];
            $old ? $query->update($values) : DB::table('operational_request_followups')->insert($values + ['document_request_id' => $id, 'created_at' => now()]);
            activity()->causedBy($user)->performedOn($request)->withProperties(['before' => $old, 'after' => $values, 'reason' => $data['reason']])->log('document_followup_assigned');
        });
    }
}
