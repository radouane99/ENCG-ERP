<?php

namespace App\Services;

use App\Models\NotificationLog;

class WhatsAppService
{
    /**
     * Envoyer un message WhatsApp (simulation/log).
     */
    public function sendMessage(?int $userId, string $phone, string $message): NotificationLog
    {
        return NotificationLog::create([
            'user_id'   => $userId,
            'type'      => 'whatsapp',
            'recipient' => $phone,
            'message'   => $message,
            'status'    => 'sent',
        ]);
    }
}