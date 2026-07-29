<?php

declare(strict_types=1);

namespace App\Domain\Student\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * StudentDossierAuditLog — Journal d'audit des dossiers étudiants (Recommendation #5)
 *
 * Tracks every admin action on a student dossier:
 * - Status changes (inscription_status, status)
 * - Document uploads / verifications
 * - Data edits (cin, cne, etc.)
 */
class StudentDossierAuditLog extends Model
{
    protected $fillable = [
        'student_id', 'admin_id',
        'action', 'field_changed',
        'old_value', 'new_value',
        'comment', 'ip_address', 'user_agent',
    ];

    // Action constants for consistency
    public const ACTION_STATUS_CHANGED      = 'status_changed';
    public const ACTION_INSCRIPTION_STATUS  = 'inscription_status_changed';
    public const ACTION_DOCUMENT_UPLOADED   = 'document_uploaded';
    public const ACTION_DOCUMENT_VERIFIED   = 'document_verified';
    public const ACTION_DOCUMENT_REJECTED   = 'document_rejected';
    public const ACTION_DATA_EDITED         = 'data_edited';
    public const ACTION_VALIDATED           = 'inscription_validated';
    public const ACTION_REJECTED            = 'inscription_rejected';
    public const ACTION_CARD_GENERATED      = 'carte_etudiant_generated';
    public const ACTION_REINSCRIPTION       = 'reinscription_opened';

    // ── Relationships ──────────────────────────────────────────
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'admin_id');
    }

    // ── Static helper for easy log creation ───────────────────
    public static function log(
        int|string $studentId,
        string $action,
        ?string $fieldChanged = null,
        mixed $oldValue = null,
        mixed $newValue = null,
        ?string $comment = null
    ): static {
        return static::create([
            'student_id'    => $studentId,
            'admin_id'      => auth()->id(),
            'action'        => $action,
            'field_changed' => $fieldChanged,
            'old_value'     => is_array($oldValue) ? json_encode($oldValue) : (string)($oldValue ?? ''),
            'new_value'     => is_array($newValue) ? json_encode($newValue) : (string)($newValue ?? ''),
            'comment'       => $comment,
            'ip_address'    => request()->ip(),
            'user_agent'    => substr(request()->userAgent() ?? '', 0, 500),
        ]);
    }

    // ── Accessor: human-readable action label ─────────────────
    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            self::ACTION_STATUS_CHANGED     => '🔄 Statut modifié',
            self::ACTION_INSCRIPTION_STATUS => '📋 Statut inscription modifié',
            self::ACTION_DOCUMENT_UPLOADED  => '📤 Document téléversé',
            self::ACTION_DOCUMENT_VERIFIED  => '✅ Document vérifié',
            self::ACTION_DOCUMENT_REJECTED  => '❌ Document rejeté',
            self::ACTION_DATA_EDITED        => '✏️ Données modifiées',
            self::ACTION_VALIDATED          => '🎓 Inscription validée',
            self::ACTION_REJECTED           => '🚫 Inscription rejetée',
            self::ACTION_CARD_GENERATED     => '🎴 Carte étudiant générée',
            self::ACTION_REINSCRIPTION      => '🔁 Réinscription ouverte',
            default                          => "🔵 {$this->action}",
        };
    }
}
