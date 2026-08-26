<?php

namespace App\Mail;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email sent when inscription status changes (Recommendation #8).
 * Compatible with Resend transport — uses Blade view, no Mail::raw().
 */
class InscriptionStatusChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $studentName;

    public string $oldStatus;

    public string $newStatus;

    public string $statusLabel;

    public string $statusColor;

    public ?string $studentNumber;

    public string $cne;

    public function __construct(
        public readonly Student $student,
        string $oldStatus,
        string $newStatus
    ) {
        $this->studentName = strtoupper($student->last_name).' '.$student->first_name;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->studentNumber = $student->student_number;
        $this->cne = $student->cne ?? '';
        $this->statusLabel = $this->resolveLabel($newStatus);
        $this->statusColor = $this->resolveColor($newStatus);
    }

    public function envelope(): Envelope
    {
        $subjectMap = [
            'valide' => '✅ Votre dossier d\'inscription a été validé — ENCG Fès',
            'inscrit' => '🎓 Félicitations ! Votre inscription est confirmée — ENCG Fès',
            'dossier_incomplet' => '⚠️ Documents manquants dans votre dossier — ENCG Fès',
            'reinscrit' => '🔁 Réinscription 2026-2027 confirmée — ENCG Fès',
            'dossier_complet' => '📋 Dossier complet — En attente de validation — ENCG Fès',
        ];

        return new Envelope(
            subject: $subjectMap[$this->newStatus] ?? '📋 Mise à jour statut inscription — ENCG Fès',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.inscription_status_changed',
        );
    }

    public function attachments(): array
    {
        return [];
    }

    private function resolveLabel(string $status): string
    {
        return match ($status) {
            'submitted' => '⏳ Dossier Soumis',
            'dossier_incomplet' => '⚠️ Dossier Incomplet',
            'dossier_complet' => '📋 Dossier Complet',
            'valide' => '✅ Dossier Validé',
            'inscrit' => '🎓 Inscription Confirmée',
            'reinscrit' => '🔁 Réinscription Confirmée',
            default => ucfirst($status),
        };
    }

    private function resolveColor(string $status): string
    {
        return match ($status) {
            'inscrit', 'valide', 'reinscrit' => '#10b981',
            'dossier_incomplet' => '#f59e0b',
            'submitted', 'dossier_complet' => '#3b82f6',
            default => '#64748b',
        };
    }
}
