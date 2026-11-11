<?php

namespace App\Console\Commands;

use App\Services\Security\{CryptoLedgerService, GradeRectificationService};
use Illuminate\Cache\{ArrayStore, RedisStore};
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ImportLegacySecurityRecordsCommand extends Command
{
    protected $signature = 'encg:import-security-records {--document-code=* : Additional legacy document codes to preserve}';
    protected $description = 'Copy legacy cached rectifications and official signatures into durable storage without deleting the cache.';

    public function handle(GradeRectificationService $rectifications, CryptoLedgerService $ledger): int
    {
        $rectified = $rectifications->importLegacy();
        $codes = $this->option('document-code');
        $store = Cache::getStore();
        if ($store instanceof RedisStore) {
            $connection = $store->connection();
            $prefix = (string) config('database.redis.options.prefix', '').$store->getPrefix();
            $cursor = null;
            do {
                $result = $connection->scan($cursor, ['match' => $prefix.'official_doc_registry:*', 'count' => 200]);
                if ($result === false) break;
                [$cursor, $keys] = $result;
                foreach ($keys as $key) {
                    $position = strpos($key, 'official_doc_registry:');
                    if ($position !== false) $codes[] = substr($key, $position + strlen('official_doc_registry:'));
                }
            } while ((string) $cursor !== '0');
        } elseif ($store instanceof ArrayStore) {
            foreach (array_keys($store->all()) as $key) {
                if (str_starts_with($key, 'official_doc_registry:')) $codes[] = substr($key, strlen('official_doc_registry:'));
            }
        } else {
            $this->warn('This cache driver cannot enumerate legacy codes. Pass --document-code for existing document references.');
        }
        $documents = 0;
        foreach (array_unique($codes) as $code) {
            $record = Cache::get('official_doc_registry:'.$code);
            if (! is_array($record)) continue;
            $signature = $ledger->persistOfficialRecord($record, true);
            if ($signature?->wasRecentlyCreated) $documents++;
        }
        $this->info("Preserved rectifications: {$rectified}; preserved document records: {$documents}. No cached records were removed.");
        $this->line('Legacy vacation simulation signatures are retained as revoked pending controlled administrative reissue.');
        return self::SUCCESS;
    }
}
