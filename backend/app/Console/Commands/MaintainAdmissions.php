<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MaintainAdmissions extends Command
{
    protected $signature = 'admissions:maintain';
    protected $description = 'Expire stalled OCR runs and redact extracted fields after the configured retention period.';
    public function handle(): int
    {
        $stalled = DB::table('admission_ocr_runs')->whereIn('status', ['queued', 'processing'])->where('updated_at', '<', now()->subMinutes(10))
            ->update(['status' => 'failed', 'error_code' => 'processing_expired', 'finished_at' => now(), 'updated_at' => now()]);
        $redacted = DB::table('admission_ocr_runs')->whereNotNull('fields')->whereNotNull('finished_at')
            ->where('finished_at', '<', now()->subDays(config('admissions.ocr_retention_days', 30)))->update(['fields' => null, 'warnings' => null, 'updated_at' => now()]);
        $this->info("Stalled runs: {$stalled}; expired extraction payloads redacted: {$redacted}.");
        return self::SUCCESS;
    }
}
