<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class RattrapageSessionScheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public array $details
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'rattrapage_session_scheduled',
            'title' => 'Nouvelle séance de rattrapage programmée',
            'message' => "Séance de rattrapage : {$this->details['purpose']} en {$this->details['room_name']} le {$this->details['date']} ({$this->details['time']}).",
            'room_name' => $this->details['room_name'] ?? 'Salle',
            'date' => $this->details['date'] ?? '',
            'time' => $this->details['time'] ?? '',
            'purpose' => $this->details['purpose'] ?? '',
            'icon' => 'calendar',
            'action_url' => '/student/schedule',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
