<?php

namespace App\Console\Commands;

use App\Models\DocumentRequest;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Services\Core\OperationalWorkspaceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RemindDocumentFollowupsCommand extends Command
{
    protected $signature = 'documents:remind-followups';

    protected $description = 'Rappeler dans le portail les demandes échues, au plus une fois par jour et par demande';

    public function handle(): int
    {
        $count = 0;
        DB::table('operational_request_followups')->whereNotNull('assigned_to')->where('due_at', '<', now())
            ->where(fn ($q) => $q->whereNull('last_reminded_at')->orWhere('last_reminded_at', '<=', now()->subDay()))
            ->orderBy('id')->chunkById(100, function ($rows) use (&$count) {
                foreach ($rows as $row) {
                    DB::transaction(function () use ($row, &$count) {
                        $follow = DB::table('operational_request_followups')->where('id', $row->id)->lockForUpdate()->first();
                        if (! $follow || ! $follow->due_at || now()->lte($follow->due_at) || ($follow->last_reminded_at && now()->subDay()->lt($follow->last_reminded_at))) {
                            return;
                        }
                        $document = DocumentRequest::with('student')->find($follow->document_request_id);
                        $agent = User::find($follow->assigned_to);
                        if (! $document || ! in_array($document->status, ['pending', 'processing'], true) || ! $agent?->is_active
                            || ! app(OperationalWorkspaceService::class)->isStaff($agent) || (int) $agent->institution_id !== (int) $document->student?->institution_id) {
                            return;
                        }
                        $agent->notify(new SystemNotification('Demande arrivée à échéance', 'La demande #'.$document->id.' attend votre traitement.', 'warning', '/admin/guichet'));
                        DB::table('operational_request_followups')->where('id', $follow->id)->update(['last_reminded_at' => now()]);
                        $count++;
                    });
                }
            });
        $this->info($count.' rappels portail enregistrés.');

        return self::SUCCESS;
    }
}
