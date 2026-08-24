<?php

namespace Database\Factories;

use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentRequest>
 */
class DocumentRequestFactory extends Factory
{
    protected $model = DocumentRequest::class;

    public function definition(): array
    {
        $docType = DocumentType::firstOrCreate(
            ['code' => 'ATTESTATION_SCO'],
            [
                'name' => 'Attestation de Scolarité',
                'view_name' => 'documents.attestation_scolarite',
                'is_active' => true,
            ]
        );

        return [
            'student_id' => Student::factory(),
            'document_type_id' => $docType->id,
            'status' => 'pending',
            'requested_at' => now(),
            'processed_at' => null,
            'admin_notes' => null,
        ];
    }
}
