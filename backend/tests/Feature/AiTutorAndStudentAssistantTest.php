<?php

namespace Tests\Feature;

use App\Models\AiChatMessage;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AiTutorAndStudentAssistantTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;

    protected User $studentUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-ai-tutor']
        );

        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $this->studentUser = User::factory()->create([
            'email' => 'student.ai@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->studentUser->assignRole($studentRole);
    }

    public function test_ai_tutor_conversation_and_message_logging(): void
    {
        Sanctum::actingAs($this->studentUser);

        $userMsg = AiChatMessage::create([
            'user_id' => $this->studentUser->id,
            'role' => 'user',
            'content' => 'Comment comptabiliser un droit d\'utilisation selon IFRS 16 ?',
        ]);

        $aiMsg = AiChatMessage::create([
            'user_id' => $this->studentUser->id,
            'role' => 'assistant',
            'content' => 'Selon IFRS 16, à la date de mise à disposition, le preneur comptabilise un actif au titre du droit d\'utilisation et une dette de loyer au passif.',
        ]);

        $this->assertEquals('user', $userMsg->role);
        $this->assertEquals('assistant', $aiMsg->role);
        $this->assertEquals($this->studentUser->id, $aiMsg->user_id);
    }
}
