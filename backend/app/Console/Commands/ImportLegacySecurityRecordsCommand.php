<?php

namespace App\Console\Commands;

use App\Services\Security\CryptoLedgerService;
use App\Services\Security\GradeRectificationService;
use Illuminate\Cache\ArrayStore;
use Illuminate\Cache\DatabaseStore;
use Illuminate\Cache\FileStore;
use Illuminate\Cache\RedisStore;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

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
                if ($result === false) {
                    break;
                }
                [$cursor, $keys] = $result;
                foreach ($keys as $key) {
                    $position = strpos($key, 'official_doc_registry:');
                    if ($position !== false) {
                        $codes[] = substr($key, $position + strlen('official_doc_registry:'));
                    }
                }
            } while ((string) $cursor !== '0');
        } elseif ($store instanceof ArrayStore) {
            foreach (array_keys($store->all()) as $key) {
                if (str_starts_with($key, 'official_doc_registry:')) {
                    $codes[] = substr($key, strlen('official_doc_registry:'));
                }
            }
        } elseif ($store instanceof DatabaseStore) {
            $prefix = $store->getPrefix();
            $table = config('cache.stores.'.config('cache.default').'.table', 'cache');
            foreach ($store->getConnection()->table($table)->where('key', 'like', $prefix.'official_doc_registry:%')->where('expiration', '>=', time())->pluck('key') as $key) {
                if (str_starts_with($key, $prefix.'official_doc_registry:')) {
                    $codes[] = substr($key, strlen($prefix.'official_doc_registry:'));
                }
            }
        } elseif ($store instanceof FileStore) {
            // Laravel file-cache keys are hashed; only safe arrays are inspected.
            foreach (File::allFiles($store->getDirectory()) as $file) {
                if (! preg_match('/^[a-f0-9]{40}$/', $file->getFilename()) || $file->getSize() > 2097152) {
                    continue;
                }
                $contents = File::get($file->getPathname());
                if (! ctype_digit(substr($contents, 0, 10)) || (int) substr($contents, 0, 10) < time()) {
                    continue;
                }
                $record = @unserialize(substr($contents, 10), ['allowed_classes' => false]);
                if (is_array($record) && isset($record['signature_code'], $record['reference_code'])) {
                    $codes[] = $record['signature_code'];
                }
            }
        } else {
            $this->warn('Cache driver '.get_debug_type($store).' cannot enumerate legacy codes. Pass --document-code for existing document references.');
        }
        $documents = 0;
        foreach (array_unique($codes) as $code) {
            $record = Cache::get('official_doc_registry:'.$code);
            if (! is_array($record)) {
                continue;
            }
            $signature = $ledger->persistOfficialRecord($record, true);
            if ($signature?->wasRecentlyCreated) {
                $documents++;
            }
        }
        $this->info("Preserved rectifications: {$rectified}; preserved document records: {$documents}. No cached records were removed.");
        $this->line('Legacy vacation simulation signatures are retained as revoked pending controlled administrative reissue.');

        return self::SUCCESS;
    }
}
