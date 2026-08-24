<?php

namespace App\Services\Campus;

use App\Models\NotificationLog;
use App\Models\User;

class CampusAlertService
{
    public const TEMPLATE_CONVOCATION = 'convocation';

    public const TEMPLATE_GRADE_DEADLINE = 'grade_deadline';

    public const TEMPLATE_REINSCRIPTION = 'reinscription';

    /**
     * @var array<string, string>
     */
    private const TEMPLATES = [
        self::TEMPLATE_CONVOCATION => 'ENCG Fès — Convocation examen. Consultez votre convocation PDF sur le portail.',
        self::TEMPLATE_GRADE_DEADLINE => 'ENCG Fès — Clôture de la saisie des notes ({session}) le {date}. Merci de finaliser vos grilles.',
        self::TEMPLATE_REINSCRIPTION => 'ENCG Fès — Réinscription {year} ouverte. Connectez-vous au portail pour valider votre dossier.',
    ];

    /**
     * @param  array<string, string>  $placeholders
     */
    public function send(string $template, ?int $userId, ?string $phone, array $placeholders = []): NotificationLog
    {
        $body = $this->render($template, $placeholders);
        $recipient = trim((string) $phone);

        if ($recipient === '') {
            return NotificationLog::create([
                'user_id' => $userId,
                'type' => 'sms',
                'recipient' => 'none',
                'message' => $body,
                'status' => 'skipped',
            ]);
        }

        $driver = config('services.sms.driver', 'log');

        return NotificationLog::create([
            'user_id' => $userId,
            'type' => 'sms',
            'recipient' => $recipient,
            'message' => '['.$driver.'] '.$body,
            'status' => 'sent',
        ]);
    }

    /**
     * @param  iterable<array{user_id?: int|null, phone?: string|null}>  $recipients
     * @param  array<string, string>  $placeholders
     */
    public function sendMany(string $template, iterable $recipients, array $placeholders = []): int
    {
        $count = 0;
        foreach ($recipients as $row) {
            $this->send($template, $row['user_id'] ?? null, $row['phone'] ?? null, $placeholders);
            $count++;
        }

        return $count;
    }

    public function notifyProfessorsGradeDeadline(string $endDate, string $sessionLabel): int
    {
        $professors = User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['professor', 'vacataire', 'professeur']))
            ->get();

        return $this->sendMany(self::TEMPLATE_GRADE_DEADLINE, $professors->map(fn (User $u) => [
            'user_id' => is_numeric($u->id) ? (int) $u->id : null,
            'phone' => $u->getAttribute('phone') ?? $u->getAttribute('telephone'),
        ]), [
            'date' => $endDate,
            'session' => $sessionLabel,
        ]);
    }

    /**
     * @param  array<string, string>  $placeholders
     */
    public function render(string $template, array $placeholders = []): string
    {
        $body = self::TEMPLATES[$template] ?? $template;
        foreach ($placeholders as $key => $value) {
            $body = str_replace('{'.$key.'}', $value, $body);
        }

        return $body;
    }
}
