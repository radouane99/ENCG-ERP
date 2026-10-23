<?php

namespace App\Jobs;

use App\Models\StudentDocument;
use App\Services\Ocr\AdmissionOcrService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ProcessAdmissionOcrJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public int $tries = 2;
    public int $timeout = 50;
    public function backoff(): array { return [15, 60]; }
    public function __construct(public string $runId) {}
    public function handle(AdmissionOcrService $ocr): void
    {
        $run = DB::table('admission_ocr_runs')->find($this->runId);
        if (! $run || in_array($run->status, ['needs_review', 'succeeded', 'cancelled'])) return;
        $doc = StudentDocument::findOrFail($run->document_id);
        if (! $doc->is_current || $doc->withdrawn_at) {
            DB::table('admission_ocr_runs')->where('id', $this->runId)->update(['status' => 'cancelled', 'finished_at' => now()]);
            return;
        }
        $start = microtime(true);
        DB::table('admission_ocr_runs')->where('id', $this->runId)->update(['status' => 'processing', 'started_at' => now()]);
        try {
            $result = $ocr->extract($doc, $run->mode);
            DB::table('admission_ocr_runs')->where('id', $this->runId)->where('status', 'processing')->update(['status' => $result['status'],
                'engine' => $result['engine'], 'fields' => json_encode($result['fields'], JSON_UNESCAPED_UNICODE),
                'warnings' => json_encode($result['warnings'], JSON_UNESCAPED_UNICODE), 'error_code' => null,
                'finished_at' => now(), 'updated_at' => now(), 'duration_ms' => (int) ((microtime(true) - $start) * 1000)]);
        } catch (\Throwable $e) {
            $this->failed($e);
            // Return an explicit terminal status; the user can retry, without sending documents implicitly.
        }
    }
    public function failed(?\Throwable $e): void
    {
        DB::table('admission_ocr_runs')->where('id', $this->runId)->whereNotIn('status', ['cancelled', 'needs_review', 'succeeded'])->update(['status' => 'failed',
            'error_code' => 'extraction_failed', 'finished_at' => now(), 'updated_at' => now()]);
    }
}
