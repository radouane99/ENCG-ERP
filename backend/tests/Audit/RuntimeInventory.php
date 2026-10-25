<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

// Read-only runtime inventory. Never output credentials or candidate identifiers.
$summary = [
    'gemini_configured' => (bool) config('services.gemini.key'),
    'groq_configured' => (bool) (config('services.groq.key') ?: config('services.groq.api_key')),
    'ai_driver' => config('services.ai.driver'),
    'queue_connection' => config('queue.default'),
    'cache_store' => config('cache.default'),
];
DB::statement('BEGIN READ ONLY');
try {
    $db = DB::class;
    $summary['applications'] = $db::table('applications')->count();
    $summary['documents'] = $db::table('student_documents')->count();
    $summary['documents_without_relational_owner'] = $db::table('student_documents')->whereNull('student_id')->whereNull('application_id')->count();
    $summary['document_duplicate_keys'] = $db::selectOne('SELECT count(*) AS n FROM (SELECT cne,type FROM student_documents GROUP BY cne,type HAVING count(*)>1) x')->n;
    $summary['application_duplicate_campaign_cne'] = $db::selectOne('SELECT count(*) AS n FROM (SELECT admission_campaign_id,cne FROM applications GROUP BY admission_campaign_id,cne HAVING count(*)>1) x')->n;
    $summary['existing_document_files'] = 0;
    foreach ($db::table('student_documents')->pluck('file_path') as $relative) {
        foreach (['private', 'local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($relative)) {
                $summary['existing_document_files']++;
                break;
            }
        }
    }
    $summary['application_status_counts'] = $db::table('applications')->selectRaw('status,count(*) as count')->groupBy('status')->get();
    $summary['student_status_counts'] = $db::table('students')->selectRaw('status,inscription_status,count(*) as count')->groupBy('status', 'inscription_status')->get();
    $summary['document_status_counts'] = $db::table('student_documents')->selectRaw('type,status,count(*) as count')->groupBy('type', 'status')->get();
    $summary['campaigns'] = $db::table('admission_campaigns')->get(['id', 'academic_year_id', 'status', 'open_date', 'close_date', 'target_capacity']);
    $summary['indexes'] = $db::select("SELECT indexdef FROM pg_indexes WHERE tablename IN ('student_documents','applications')");
} finally {
    DB::statement('ROLLBACK');
}
echo json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
