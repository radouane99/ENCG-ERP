<?php

namespace App\Actions\Admission;

use App\Jobs\ProcessAdmissionOcrJob;
use App\Models\StudentDocument;
use App\Services\Ocr\AdmissionOcrPolicy;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class QueueAutomaticOcrAction
{
    // Called while the application is locked by the upload transaction.
    public function execute(StudentDocument $document): void
    {
        if ($document->type === 'photo' || ! $document->application_id) {
            return;
        }
        if (DB::table('admission_ocr_runs')->where('document_id', $document->id)->exists()) {
            return;
        }
        $id = (string) Str::uuid();
        $mode = AdmissionOcrPolicy::available($document->application->campaign->institution_id) ? 'cloud' : 'local';
        DB::table('admission_ocr_runs')->insert([
            'id' => $id, 'application_id' => $document->application_id, 'document_id' => $document->id,
            'status' => 'queued', 'mode' => $mode, 'parser_version' => 'admissions-ai-v3',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('admission_events')->insert([
            'application_id' => $document->application_id, 'actor_id' => auth()->id(),
            'type' => 'ocr_queued_automatically', 'details' => json_encode(['document_id' => $document->id, 'mode' => $mode]),
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::afterCommit(fn () => ProcessAdmissionOcrJob::dispatch($id));
    }
}
