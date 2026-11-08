<?php

namespace Tests\Unit;

use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\User;
use App\Notifications\DocumentRequestCreatedNotification;
use App\Notifications\RattrapageSessionScheduledNotification;
use Tests\TestCase;

class BilingualNotificationTest extends TestCase
{
    public function test_document_request_notification_keeps_both_languages_and_document_name(): void
    {
        $request = new DocumentRequest(['status' => 'pending']);
        $request->setRelation('documentType', new DocumentType(['name' => 'Attestation synthétique']));
        $payload = (new DocumentRequestCreatedNotification($request))->toArray(new User);

        $this->assertSame('Demande de document enregistrée', $payload['title']);
        $this->assertSame('تم تسجيل طلب الوثيقة', $payload['title_ar']);
        $this->assertStringContainsString('Attestation synthétique', $payload['message_ar']);
        $this->assertSame('/student/documents', $payload['action_url']);
    }

    public function test_makeup_session_broadcast_keeps_the_same_bilingual_payload(): void
    {
        $notification = new RattrapageSessionScheduledNotification([
            'purpose' => 'Module synthétique', 'room_name' => 'S1', 'date' => '2026-11-08', 'time' => '10:00',
        ]);
        $user = new User;
        $payload = $notification->toArray($user);

        $this->assertSame('تمت برمجة حصة تعويضية جديدة', $payload['title_ar']);
        $this->assertStringContainsString('Module synthétique', $payload['message_ar']);
        $this->assertStringContainsString('10:00', $payload['message_ar']);
        $this->assertSame($payload, $notification->toBroadcast($user)->data);
    }
}
