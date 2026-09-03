<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class BackupDatabaseDailyCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup-daily {--silent : Do not output progress to console}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sauvegarde quotidienne automatique de la base de données PostgreSQL avec rétention 30 jours';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $silent = $this->option('silent');
        $startTime = microtime(true);
        $stamp = date('Ymd_His');
        $dateHuman = date('Y-m-d H:i:s');

        $backupsDir = storage_path('app/backups');
        if (!File::isDirectory($backupsDir)) {
            File::makeDirectory($backupsDir, 0777, true, true);
        }

        $backupFile = "{$backupsDir}/encg_erp_{$stamp}.sql";
        $latestFile = "{$backupsDir}/backup_encg_erp_latest.sql";
        $baseLatest = base_path('backup_encg_erp_latest.sql');

        if (!$silent) {
            $this->info("================================================================");
            $this->info("  ENCG ERP - Sauvegarde Automatique Quotidienne");
            $this->info("  Date : {$dateHuman}");
            $this->info("================================================================");
        }

        $host = config('database.connections.pgsql.host', 'postgres');
        $port = config('database.connections.pgsql.port', '5432');
        $database = config('database.connections.pgsql.database', 'encg_erp');
        $username = config('database.connections.pgsql.username', 'encg');
        $password = config('database.connections.pgsql.password', 'secret');

        $cmd = sprintf(
            'PGPASSWORD=%s pg_dump -h %s -p %s -U %s %s > %s',
            escapeshellarg($password),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($backupFile)
        );

        exec($cmd, $output, $returnVar);

        if ($returnVar !== 0 || !file_exists($backupFile) || filesize($backupFile) < 10000) {
            $errorMsg = "Échec de la sauvegarde quotidienne PostgreSQL (code: {$returnVar}).";
            Log::error($errorMsg);
            if (!$silent) {
                $this->error("❌ {$errorMsg}");
            }
            return self::FAILURE;
        }

        $sizeBytes = filesize($backupFile);
        $sizeMB = round($sizeBytes / (1024 * 1024), 2);
        $durationMs = round((microtime(true) - $startTime) * 1000, 2);

        // Synchroniser vers backup_encg_erp_latest.sql
        File::copy($backupFile, $latestFile);
        File::copy($backupFile, $baseLatest);

        // Rotation : purger les sauvegardes de plus de 30 jours
        $cutoff = time() - (30 * 86400);
        $deletedCount = 0;
        foreach (File::glob("{$backupsDir}/encg_erp_*.sql") as $file) {
            if (filemtime($file) < $cutoff) {
                File::delete($file);
                $deletedCount++;
            }
        }

        // Journalisation dans l'Audit Log
        try {
            AuditLog::create([
                'user_id' => null,
                'user_name' => 'Système Automatique (CRON)',
                'user_role' => 'SYSTEM',
                'action' => 'AUTOMATED_DAILY_BACKUP',
                'category' => 'SYSTEM',
                'description' => "Sauvegarde quotidienne réussie : encg_erp_{$stamp}.sql ({$sizeMB} Mo en {$durationMs} ms)",
                'status' => 'SUCCESS',
                'severity' => 'INFO',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'CLI/Artisan (db:backup-daily)',
                'payload' => [
                    'backup_file' => "encg_erp_{$stamp}.sql",
                    'size_mb' => $sizeMB,
                    'execution_time_ms' => $durationMs,
                    'purged_old_backups' => $deletedCount,
                ],
                'execution_time_ms' => $durationMs,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning("Impossible d'enregistrer l'audit de sauvegarde : " . $e->getMessage());
        }

        if (!$silent) {
            $this->info("✅ Sauvegarde réussie : {$sizeMB} Mo");
            $this->info("📁 Fichier archive  : {$backupFile}");
            $this->info("🔄 Fichier récent   : {$latestFile}");
            if ($deletedCount > 0) {
                $this->info("🧹 Sauvegardes purgées (>30 jours) : {$deletedCount}");
            }
        }

        return self::SUCCESS;
    }
}
