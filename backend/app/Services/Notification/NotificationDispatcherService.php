<?php

namespace App\Services\Notification;

use App\Models\AbsenceJustification;
use App\Models\Assessment;
use App\Models\Borrowing;
use App\Models\DocumentRequest;
use App\Models\Module;
use App\Models\Student;
use App\Models\User;
use App\Notifications\DocumentRequestStatusUpdatedNotification;
use App\Notifications\NewDocumentRequestAdminNotification;
use App\Notifications\SystemNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NotificationDispatcherService
{
    /**
     * Obtenir la liste des administrateurs et agents de scolarité pour les alertes.
     */
    protected function getAdminUsers()
    {
        return User::role(['super-admin', 'institution-admin', 'director', 'admin', 'pedagogy_officer', 'library-manager'])
            ->where('is_active', true)
            ->get();
    }

    /* ══════════════════════════════════════════════════════════════
     * 1. PROFESSEUR ➔ ÉTUDIANT
     * ══════════════════════════════════════════════════════════════ */

    /**
     * Alerte les étudiants de la publication ou mise à jour de leurs notes.
     */
    public function notifyStudentsGradePublished(Assessment $assessment, array $studentIds): int
    {
        $module = $assessment->module;
        $moduleName = $module?->name ?? 'Module académique';
        $assessmentTitle = $assessment->title ?? $assessment->type ?? 'Évaluation';

        $students = Student::with('user')->whereIn('id', $studentIds)->get();
        $notifiedCount = 0;

        foreach ($students as $student) {
            $user = $student->user;
            if (! $user) {
                continue;
            }

            try {
                $user->notify(new SystemNotification(
                    "Nouvelle note publiée : {$moduleName}",
                    "Votre note pour \"{$assessmentTitle}\" a été saisie par le professeur et est consultable sur votre relevé.",
                    'academic',
                    '/student/grades'
                ));
                $notifiedCount++;
            } catch (\Throwable $e) {
                Log::warning("Notification grade student failed: {$e->getMessage()}");
            }
        }

        return $notifiedCount;
    }

    /**
     * Alerte un étudiant lors du signalement d'une absence en cours/TD/TP.
     */
    public function notifyStudentAbsenceMarked(Student $student, string $moduleName, string $date, string $sessionType = 'CM'): void
    {
        $user = $student->user;
        if (! $user) {
            return;
        }

        try {
            $user->notify(new SystemNotification(
                "Absence signalée : {$moduleName}",
                "Une absence a été enregistrée pour la séance de {$sessionType} du {$date}. Conformément au règlement, vous avez 48h pour déposer votre justificatif.",
                'danger',
                '/student/absences'
            ));
        } catch (\Throwable $e) {
            Log::warning("Notification absence student failed: {$e->getMessage()}");
        }
    }

    /**
     * Alerte les étudiants du dépôt d'un nouveau support de cours ou syllabus.
     */
    public function notifyStudentsCourseMaterial(array $studentUserIds, string $moduleName, string $materialTitle): void
    {
        $users = User::whereIn('id', $studentUserIds)->where('is_active', true)->get();
        foreach ($users as $user) {
            try {
                $user->notify(new SystemNotification(
                    "Nouveau support de cours : {$moduleName}",
                    "Le professeur a partagé un nouveau document d'étude : \"{$materialTitle}\".",
                    'academic',
                    '/student/library'
                ));
            } catch (\Throwable $e) {
                Log::warning("Notification material student failed: {$e->getMessage()}");
            }
        }
    }

    /* ══════════════════════════════════════════════════════════════
     * 2. ÉTUDIANT ➔ ADMINISTRATION
     * ══════════════════════════════════════════════════════════════ */

    /**
     * Alerte l'administration lorsqu'un étudiant soumet une demande de document.
     */
    public function notifyAdminDocumentRequested(DocumentRequest $request): void
    {
        $studentUser = $request->student?->user;
        $admins = $this->getAdminUsers();

        foreach ($admins as $admin) {
            try {
                $admin->notify(new NewDocumentRequestAdminNotification($request, $studentUser));
            } catch (\Throwable $e) {
                Log::warning("Notification admin doc request failed: {$e->getMessage()}");
            }
        }
    }

    /**
     * Alerte l'administration lors du dépôt d'un justificatif d'absence par un étudiant.
     */
    public function notifyAdminAbsenceJustificationSubmitted(AbsenceJustification $justification): void
    {
        $student = $justification->student;
        $studentName = $student?->user?->name ?? "Étudiant #{$student?->id}";
        $cne = $student?->cne ?? '';

        $admins = $this->getAdminUsers();
        foreach ($admins as $admin) {
            try {
                $admin->notify(new SystemNotification(
                    "Justificatif d'absence déposé",
                    "{$studentName}".($cne ? " ({$cne})" : '')." a déposé un justificatif d'absence nécessitant examen sous 48h.",
                    'document_pending',
                    '/admin/absences'
                ));
            } catch (\Throwable $e) {
                Log::warning("Notification admin absence failed: {$e->getMessage()}");
            }
        }
    }

    /**
     * Alerte le bibliothécaire lors d'une réservation de livre physique en rayon.
     */
    public function notifyAdminBookReserved(Borrowing $borrowing): void
    {
        $bookTitle = $borrowing->bookCopy?->book?->title ?? 'Ouvrage';
        $student = $borrowing->student;
        $studentName = $student?->user?->name ?? 'Un étudiant';

        $admins = User::role(['library-manager', 'super-admin', 'admin'])
            ->where('is_active', true)
            ->get();

        foreach ($admins as $admin) {
            try {
                $admin->notify(new SystemNotification(
                    "Réservation d'ouvrage physique",
                    "{$studentName} a réservé l'exemplaire de \"{$bookTitle}\". Préparer le livre pour retrait au comptoir.",
                    'financial',
                    '/admin/library'
                ));
            } catch (\Throwable $e) {
                Log::warning("Notification admin book reservation failed: {$e->getMessage()}");
            }
        }
    }

    /* ══════════════════════════════════════════════════════════════
     * 3. ADMINISTRATION ➔ ÉTUDIANT
     * ══════════════════════════════════════════════════════════════ */

    /**
     * Alerte l'étudiant lorsque son document est prêt (validé) ou rejeté.
     */
    public function notifyStudentDocumentStatusUpdated(DocumentRequest $request): void
    {
        $studentUser = $request->student?->user;
        if (! $studentUser) {
            return;
        }

        try {
            $studentUser->notify(new DocumentRequestStatusUpdatedNotification($request));
        } catch (\Throwable $e) {
            Log::warning("Notification student doc status failed: {$e->getMessage()}");
        }
    }

    /**
     * Alerte l'étudiant de la décision sur son justificatif d'absence.
     */
    public function notifyStudentAbsenceDecision(AbsenceJustification $justification, bool $approved, ?string $reason = null): void
    {
        $studentUser = $justification->student?->user;
        if (! $studentUser) {
            return;
        }

        $statusText = $approved ? 'validé et accepté' : 'refusé';
        $type = $approved ? 'academic' : 'danger';
        $message = $approved
            ? "Votre justificatif d'absence a été validé par la scolarité. Votre statut de présence est désormais régularisé."
            : "Votre justificatif d'absence a été refusé par l'administration.".($reason ? " Motif : {$reason}" : '');

        try {
            $studentUser->notify(new SystemNotification(
                "Justificatif d'absence ".($approved ? 'validé' : 'refusé'),
                $message,
                $type,
                '/student/absences'
            ));
        } catch (\Throwable $e) {
            Log::warning("Notification student absence decision failed: {$e->getMessage()}");
        }
    }

    /**
     * Rappel de retour d'emprunt de livre ou prolongation.
     */
    public function notifyStudentBookDueReminder(Borrowing $borrowing, string $alertType = 'upcoming'): void
    {
        $studentUser = $borrowing->student?->user;
        if (! $studentUser) {
            return;
        }

        $bookTitle = $borrowing->bookCopy?->book?->title ?? 'Ouvrage de bibliothèque';
        $dueDate = $borrowing->due_date ? Carbon::parse($borrowing->due_date)->format('d/m/Y') : 'prochainement';

        if ($alertType === 'overdue') {
            $title = "Échéance dépassée : {$bookTitle}";
            $message = "La date d'échéance ({$dueDate}) pour l'ouvrage \"{$bookTitle}\" est dépassée. Merci de le rapporter au comptoir de prêt dès que possible.";
            $type = 'danger';
        } else {
            $title = "Rappel de prêt : {$bookTitle}";
            $message = "Votre emprunt de \"{$bookTitle}\" arrive à échéance le {$dueDate}. Vous pouvez prolonger votre prêt de 7 jours depuis votre tableau de bord.";
            $type = 'financial';
        }

        try {
            $studentUser->notify(new SystemNotification($title, $message, $type, '/student/library'));
        } catch (\Throwable $e) {
            Log::warning("Notification book reminder failed: {$e->getMessage()}");
        }
    }

    /* ══════════════════════════════════════════════════════════════
     * 4. PROFESSEUR ➔ ADMINISTRATION & VICE-VERSA
     * ══════════════════════════════════════════════════════════════ */

    /**
     * Alerte l'administration lorsque le professeur finalise la saisie des notes pour délibération.
     */
    public function notifyAdminGradesSubmittedForDeliberation(Module $module, ?string $profName = null): void
    {
        $admins = $this->getAdminUsers();
        $profStr = $profName ? "par Pr. {$profName}" : '';

        foreach ($admins as $admin) {
            try {
                $admin->notify(new SystemNotification(
                    "Procès-Verbal de notes soumis : {$module->name}",
                    "Les notes du module {$module->name} ont été finalisées et signées {$profStr} pour délibération officielle.",
                    'academic',
                    '/admin/grades'
                ));
            } catch (\Throwable $e) {
                Log::warning("Notification admin grade deliberation failed: {$e->getMessage()}");
            }
        }
    }

    /**
     * Alerte un professeur lors de la validation administrative de ses documents ou vacation.
     */
    public function notifyProfessorDocumentVisa(User $profUser, string $docTitle, string $status = 'validé'): void
    {
        try {
            $profUser->notify(new SystemNotification(
                "Document académique {$status} : {$docTitle}",
                "Votre demande pour le document \"{$docTitle}\" a été visée et approuvée par la direction.",
                'document_approved',
                '/professor/vacation'
            ));
        } catch (\Throwable $e) {
            Log::warning("Notification prof visa failed: {$e->getMessage()}");
        }
    }
}
