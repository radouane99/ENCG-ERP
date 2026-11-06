<?php

namespace Tests\Unit;

use App\Services\Core\BackupArchiveVerifier;
use PHPUnit\Framework\TestCase;
use ZipArchive;

class BackupArchiveVerifierTest extends TestCase
{
    public function test_restored_document_bytes_are_verified_and_password_is_required_for_encrypted_archives(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'encg_zip_');
        try {
            $zip = new ZipArchive;
            $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
            $zip->addFromString('private/synthetic-document.txt', 'SYNTHETIC-DOCUMENT');
            $zip->setPassword('SyntheticOnlyPassword');
            $zip->setEncryptionName('private/synthetic-document.txt', ZipArchive::EM_AES_256);
            $zip->close();
            $this->assertSame(['readable_files' => 1, 'restored_bytes_verified' => 18], (new BackupArchiveVerifier)->verify($path, 'SyntheticOnlyPassword'));
            $this->expectException(\RuntimeException::class);
            (new BackupArchiveVerifier)->verify($path, 'WrongPassword');
        } finally {
            unlink($path);
        }
    }

    public function test_invalid_archive_is_rejected(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'encg_zip_');
        try {
            file_put_contents($path, 'corrupted');
            $this->expectException(\RuntimeException::class);
            (new BackupArchiveVerifier)->verify($path);
        } finally {
            unlink($path);
        }
    }
}
