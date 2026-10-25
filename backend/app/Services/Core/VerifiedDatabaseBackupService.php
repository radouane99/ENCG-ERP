<?php

namespace App\Services\Core;

use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

class VerifiedDatabaseBackupService
{
    public function latestStatus(): ?array
    {
        $files = glob(storage_path('app/private/database-backups/encg_*.dump.json')) ?: [];
        rsort($files);
        if (! $files) { return null; }
        $manifest = json_decode(File::get($files[0]), true, flags: JSON_THROW_ON_ERROR);
        return array_intersect_key($manifest, array_flip(['created_at', 'bytes', 'archive_readable', 'restore_verified', 'restored_at', 'restored_grades']));
    }

    private function process(array $arguments): void
    {
        $connection = config('database.connections.pgsql');
        $process = new Process($arguments, null, ['PGPASSWORD' => $connection['password'] ?? '']);
        $process->setTimeout(600);
        $process->run();
        if (! $process->isSuccessful()) {
            throw new \RuntimeException('Commande PostgreSQL échouée : '.mb_substr($process->getErrorOutput(), 0, 2000));
        }
    }

    private function connectionArguments(): array
    {
        $connection = config('database.connections.pgsql');

        return ['-h', $connection['host'], '-p', (string) $connection['port'], '-U', $connection['username']];
    }

    public function create(): array
    {
        if (config('database.default') !== 'pgsql') {
            throw new \RuntimeException('Sauvegarde PostgreSQL uniquement.');
        }
        $directory = storage_path('app/private/database-backups');
        File::ensureDirectoryExists($directory, 0700);
        $name = 'encg_'.now()->format('Ymd_His').'_'.bin2hex(random_bytes(4)).'.dump';
        $path = $directory.'/'.$name;
        try {
            $this->process(['pg_dump', ...$this->connectionArguments(), '--format=custom', '--no-owner', '--no-acl', '--file='.$path, config('database.connections.pgsql.database')]);
            chmod($path, 0600);
            $this->process(['pg_restore', '--list', $path]);
            $manifest = ['file' => $name, 'database' => config('database.connections.pgsql.database'), 'created_at' => now()->toIso8601String(), 'bytes' => filesize($path), 'sha256' => hash_file('sha256', $path), 'archive_readable' => true, 'restore_verified' => false];
            File::put($path.'.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            chmod($path.'.json', 0600);

            return $manifest;
        } catch (\Throwable $e) {
            if (is_file($path)) {
                unlink($path);
            }
            throw $e;
        }
    }

    public function verifyRestore(string $name, string $target): array
    {
        if (! preg_match('/^encg_[0-9]{8}_[0-9]{6}_[a-f0-9]{8}\.dump$/D', $name)
            || ! preg_match('/^[a-z][a-z0-9_]*_restore_test$/D', $target)
            || $target === config('database.connections.pgsql.database')) {
            throw new \InvalidArgumentException('Archive privée valide et nouvelle base suffixée _restore_test requises.');
        }
        $path = storage_path('app/private/database-backups/'.$name);
        $manifest = json_decode(File::get($path.'.json'), true, flags: JSON_THROW_ON_ERROR);
        if (! hash_equals($manifest['sha256'], hash_file('sha256', $path))) {
            throw new \RuntimeException('Empreinte de sauvegarde incorrecte.');
        }
        // createdb refuses an existing database. Never drop, overwrite or clean any database.
        $this->process(['createdb', ...$this->connectionArguments(), '--template=template0', $target]);
        $sql = tempnam(storage_path('app/private/database-backups'), 'restore_');
        $filtered = $sql.'.compatible.sql';
        try {
            $this->process(['pg_restore', '--no-owner', '--no-acl', '--file='.$sql, $path]);
            $input = fopen($sql, 'rb');
            $output = fopen($filtered, 'xb');
            chmod($filtered, 0600);
            while (($line = fgets($input)) !== false) {
                // pg_dump 17+ emits this session-only setting even for a PG16 source.
                // Removing the zero/default setting changes no schema or business data.
                if (trim($line) !== 'SET transaction_timeout = 0;') {
                    fwrite($output, $line);
                }
            }
            fclose($input);
            fclose($output);
            $this->process(['psql', ...$this->connectionArguments(), '--dbname='.$target, '--no-psqlrc', '--single-transaction', '--set=ON_ERROR_STOP=1', '--file='.$filtered]);
        } finally {
            if (is_file($sql)) {
                unlink($sql);
            }
            if (is_file($filtered)) {
                unlink($filtered);
            }
        }
        $probe = new Process(['psql', ...$this->connectionArguments(), '--dbname='.$target, '--no-psqlrc', '--tuples-only', '--no-align', '--command=SELECT COUNT(*) FROM grades']);
        $probe->setEnv(['PGPASSWORD' => config('database.connections.pgsql.password', '')]);
        $probe->mustRun();
        $manifest['restore_verified'] = true;
        $manifest['restore_compatibility'] = 'session transaction_timeout=0 omitted; schema/data unchanged';
        $manifest['restore_database'] = $target;
        $manifest['restored_grades'] = (int) trim($probe->getOutput());
        $manifest['restored_at'] = now()->toIso8601String();
        File::put($path.'.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return $manifest;
    }
}
