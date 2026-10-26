<?php

namespace App\Actions\Admission;

use App\Models\ContactSubmission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class UpdatePublicSupportStatusAction
{
    public function execute(User $actor, int $id, string $status): void
    {
        DB::transaction(function () use ($actor, $id, $status) {
            $submission = ContactSubmission::where('institution_id', $actor->institution_id)->lockForUpdate()->findOrFail($id);
            $submission->update(['status' => $status]);
            activity()->causedBy($actor)->performedOn($submission)->withProperties(['status' => $status])->log('public_support_status_updated');
        });
    }
}
