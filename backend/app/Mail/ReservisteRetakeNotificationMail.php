<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReservisteRetakeNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $student;
    public $debtModules;

    /**
     * Create a new message instance.
     */
    public function __construct($student, $debtModules)
    {
        $this->student = $student;
        $this->debtModules = $debtModules;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->from(config('mail.from.address', 'no-reply@benadadarentcar.com'), config('mail.from.name', 'ENCG Portail'))
                    ->subject('▶ Convocation & Notification pour Examen des Dettes — ENCG')
                    ->view('emails.reserviste_retake');
    }
}
