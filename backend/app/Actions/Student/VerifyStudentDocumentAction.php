<?php

namespace App\Actions\Student;

use App\Models\AuditLog;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

final class VerifyStudentDocumentAction
{
    public function execute(User $actor, Student $student, StudentDocument $document, int $version): StudentDocument
    {
        Gate::forUser($actor)->authorize('update', $student);
        abort_unless($actor->can('admission.review-applications') || $actor->hasAnyRole([
            'super-admin', 'admin', 'institution-admin', 'director', 'scolarite',
        ]), 403);

        return DB::transaction(function () use ($actor, $student, $document, $version) {
            $current = StudentDocument::whereKey($document->id)->where('student_id', $student->id)
                ->whereNull('application_id')->where('is_current', true)->whereNull('withdrawn_at')
                ->lockForUpdate()->firstOrFail();
            abort_unless((int) $current->version === $version, 409, 'La pièce a changé. Rechargez-la avant validation.');
            abort_unless(Storage::disk($current->storage_disk ?: 'private')->exists($current->file_path), 422, 'Fichier de la pièce introuvable.');
            $current->update(['status' => 'verified', 'version' => $version + 1,
                'verified_by' => $actor->id, 'verified_at' => now(), 'rejection_reason' => null]);
            AuditLog::record([
                'user_id' => $actor->id, 'action' => 'student_document_verified',
                'action_type' => 'DATA_MUTATION', 'severity' => 'info',
                'description' => 'Validation administrative explicite d’une pièce étudiant.',
                'payload' => ['document_id' => $current->id, 'student_id' => $student->id, 'version' => $current->version],
            ]);

            return $current;
        });
    }
}
