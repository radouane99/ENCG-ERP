<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\DocumentRequest;
use App\Enums\ValidationStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ValidationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_audit_log_on_status_change()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);

        // We use DocumentRequest as a concrete example of a model using the trait
        $documentRequest = DocumentRequest::factory()->create([
            'status' => 'pending'
        ]);

        $this->assertEquals('pending', $documentRequest->status);
        $this->assertCount(0, $documentRequest->validationAudits);

        // Transition to reviewed
        $documentRequest->markAsReviewed('Everything looks fine');

        $documentRequest->refresh();
        $this->assertEquals(ValidationStatus::REVIEWED->value, $documentRequest->status);
        $this->assertCount(1, $documentRequest->validationAudits);
        
        $audit = $documentRequest->validationAudits->first();
        $this->assertEquals('pending', $audit->old_status);
        $this->assertEquals(ValidationStatus::REVIEWED->value, $audit->new_status);
        $this->assertEquals('Everything looks fine', $audit->comment);
        $this->assertEquals($admin->id, $audit->user_id);
    }
}
