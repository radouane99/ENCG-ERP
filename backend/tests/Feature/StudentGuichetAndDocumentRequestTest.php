<?php

namespace Tests\Feature;

use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentGuichetAndDocumentRequestTest extends TestCase
{
    use RefreshDatabase;

    private Student $student;

    private DocumentType $docType;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = $this->makeTestStudent([
            'first_name' => 'Nawfal',
            'last_name' => 'CHRAIBI',
            'cne' => 'N334455667',
        ]);

        $this->docType = DocumentType::create([
            'name' => 'Attestation de Scolarité',
            'code' => 'ATT_SCOL',
            'view_name' => 'documents.attestation_scolarite',
            'is_active' => true,
        ]);
    }

    /**
     * Test de demande d'attestation administrative au guichet numérique.
     */
    public function test_student_can_request_administrative_document(): void
    {
        $request = DocumentRequest::create([
            'student_id' => $this->student->id,
            'document_type_id' => $this->docType->id,
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        $this->assertDatabaseHas('document_requests', [
            'student_id' => $this->student->id,
            'document_type_id' => $this->docType->id,
            'status' => 'pending',
        ]);
    }

    /**
     * Test de traitement et validation de la demande par l'agent de scolarité.
     */
    public function test_scolarite_agent_can_approve_document_request(): void
    {
        $request = DocumentRequest::create([
            'student_id' => $this->student->id,
            'document_type_id' => $this->docType->id,
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        $request->update([
            'status' => 'ready',
            'processed_at' => now(),
        ]);

        $this->assertDatabaseHas('document_requests', [
            'id' => $request->id,
            'status' => 'ready',
        ]);
    }
}
