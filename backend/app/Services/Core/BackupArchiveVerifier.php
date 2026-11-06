<?php

namespace App\Services\Core;

use ZipArchive;

final class BackupArchiveVerifier
{
    /** Read every restored entry without exposing private file names or extracting to the public disk. */
    public function verify(string $path, ?string $password = null): array
    {
        $zip = new ZipArchive;
        if ($zip->open($path, ZipArchive::RDONLY) !== true) {
            throw new \RuntimeException('Archive ZIP illisible.');
        }
        try {
            if ($password) {
                $zip->setPassword($password);
            }
            $files = 0;
            $bytes = 0;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                if (! $entry || str_ends_with($entry['name'], '/')) {
                    continue;
                }
                $stream = $zip->getStream($entry['name']);
                if (! is_resource($stream)) {
                    throw new \RuntimeException('Entrée ZIP illisible ou mot de passe incorrect.');
                }
                try {
                    $hash = hash_init('crc32b');
                    $read = hash_update_stream($hash, $stream);
                    $crc = hash_final($hash);
                    // AE-2 authenticates content with AES and deliberately omits CRC.
                    $aesWithoutCrc = in_array($entry['encryption_method'] ?? 0, [ZipArchive::EM_AES_128, ZipArchive::EM_AES_192, ZipArchive::EM_AES_256], true)
                        && $entry['crc'] === 0;
                    if ($read !== $entry['size'] || (! $aesWithoutCrc && $crc !== substr(sprintf('%08x', $entry['crc']), -8))) {
                        throw new \RuntimeException('Contenu ZIP incomplet ou corrompu.');
                    }
                    $bytes += $read;
                    $files++;
                } finally {
                    fclose($stream);
                }
            }
            if ($files === 0) {
                throw new \RuntimeException('Archive vide.');
            }

            return ['readable_files' => $files, 'restored_bytes_verified' => $bytes];
        } finally {
            $zip->close();
        }
    }
}
