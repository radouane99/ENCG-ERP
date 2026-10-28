<?php

namespace App\Services\Documents;

use App\Models\PdfDocumentRecord;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfDocumentRegistry
{
    public function reserve(string $fingerprint, ?int $institutionId, ?string $view, string $label, ?int $actorId = null): PdfDocumentRecord
    {
        return DB::transaction(function () use ($fingerprint, $institutionId, $view, $label, $actorId) {
            $actorId ??= auth()->id();
            if ($actorId && ! User::whereKey($actorId)->where('institution_id', $institutionId)->exists()) {
                $actorId = null;
            }
            $record = PdfDocumentRecord::firstOrCreate(['content_fingerprint' => $fingerprint], [
                'institution_id' => $institutionId, 'created_by' => $actorId,
                'verification_token' => 'DOC-'.Str::random(48), 'source_view' => $view,
                'document_label' => mb_substr($label ?: 'Document ENCG', 0, 200),
            ]);
            if (! $record->digital_identifier) {
                $record->update(['digital_identifier' => $record->created_at->format('Ymd').str_pad((string) $record->id, 10, '0', STR_PAD_LEFT)]);
            }
            abort_if($record->status === 'revoked', 409, 'Cet exemplaire a été retiré. Une nouvelle version du document est nécessaire.');

            return $record;
        });
    }

    public function finalize(PdfDocumentRecord $record, string $bytes, int $pages): string
    {
        return DB::transaction(function () use ($record, $bytes, $pages) {
            $record = PdfDocumentRecord::whereKey($record->id)->lockForUpdate()->firstOrFail();
            abort_if($record->status === 'revoked', 409, 'Document retiré.');
            if ($record->status === 'issued' && $record->file_path) {
                $stored = Storage::disk('private')->get($record->file_path);
                if (! hash_equals($record->file_sha256, hash('sha256', $stored))) {
                    throw new \RuntimeException('Archive PDF incohérente : restauration requise.');
                }

                return $stored;
            }
            $path = 'pdf-registry/'.hash('sha256', DB::connection()->getDatabaseName()).'/'.$record->verification_token.'.pdf';
            if (! Storage::disk('private')->put($path, $bytes)) {
                throw new \RuntimeException('Archivage PDF impossible.');
            }
            $record->update(['status' => 'issued', 'file_path' => $path, 'file_sha256' => hash('sha256', $bytes), 'file_bytes' => strlen($bytes), 'page_count' => $pages, 'issued_at' => now()]);

            return $bytes;
        });
    }
}
