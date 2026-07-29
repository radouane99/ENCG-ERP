<?php

namespace App\Services\Core;

use Illuminate\Support\Facades\Log;

class WhatsAppNotificationService
{
    /**
     * Send WhatsApp / SMS notification to student.
     */
    public function sendRegistrationSuccess(string $phone, string $studentName, string $cne, string $filiere): bool
    {
        $message = "🎉 Félicitations {$studentName} ! Votre dossier d'inscription à l'ENCG Fès (CNE: {$cne}, Filière: {$filiere}) a été enregistré avec succès. Consultez votre email pour télécharger votre attestation officielle.";

        return $this->dispatchNotification($phone, $message);
    }

    /**
     * Send Dossier Validated notification.
     */
    public function sendDossierValidated(string $phone, string $studentName, string $cne): bool
    {
        $message = "✅ Votre dossier physique d'inscription à l'ENCG Fès (CNE: {$cne}) a été VALIDÉ et votre carte étudiant RFID est disponible au guichet de scolarité.";

        return $this->dispatchNotification($phone, $message);
    }

    /**
     * Mock / Webhook Gateway Dispatcher.
     */
    protected function dispatchNotification(string $phone, string $message): bool
    {
        // Sanitize phone number
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        
        Log::info(" [WhatsApp & SMS Gateway Dispatch] Destination: {$cleanPhone} | Message: {$message}");

        // Store dispatch log in system_notifications or session cache for UI feedback
        try {
            \Illuminate\Support\Facades\DB::table('system_notifications')->insert([
                'type' => 'whatsapp_sms',
                'recipient' => $cleanPhone,
                'message' => $message,
                'status' => 'sent',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Table might not exist or optional logging
        }

        return true;
    }
}
