<?php

namespace App\Services;

use App\Models\NotificationLog;

class WhatsAppService
{
    /**
     * Simulates sending a WhatsApp message by logging it to the database.
     *
     * @param int|null $userId
     * @param string $phone
     * @param string $message
     * @return NotificationLog
     */
    public function sendMessage(?int $userId, string $phone, string $message)
    {
        // Mock actual API call here.
        // For now, just log it.
        return NotificationLog::create([
            'user_id' => $userId,
            'type' => 'whatsapp',
            'recipient' => $phone,
            'message' => $message,
            'status' => 'sent',
        ]);
    }
}
