<?php

namespace App\Console\Commands;

use App\Services\Core\BackupArchiveVerifier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class VerifyBackupFilesCommand extends Command
{
    protected $signature = 'backup:verify-files';

    protected $description = 'Lire et contrôler chaque contenu de la dernière archive locale, sans afficher de données privées';

    public function handle(BackupArchiveVerifier $verifier): int
    {
        try {
            $disk = Storage::disk('local');
            $files = array_filter($disk->files(config('backup.backup.name')), fn ($path) => str_ends_with($path, '.zip'));
            usort($files, fn ($a, $b) => $disk->lastModified($b) <=> $disk->lastModified($a));
            if (! $files) {
                throw new \RuntimeException('Aucune archive locale disponible.');
            }
            $this->line(json_encode($verifier->verify($disk->path($files[0]), config('backup.backup.password')), JSON_PRETTY_PRINT));

            return self::SUCCESS;
        } catch (\Throwable) {
            $this->error('Vérification échouée : contrôler archive, espace disque et clé de déchiffrement.');

            return self::FAILURE;
        }
    }
}
