<?php

use App\Models\Complaint;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Student;
use Spatie\Permission\Models\Role;

function portalStudent(array $overrides = []): Student
{
    $student = test()->makeTestStudent($overrides);
    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
    $student->user->assignRole('student');

    return $student->fresh(['user']);
}

it('forbids student A from downloading student B document request', function () {
    $alice = portalStudent(['first_name' => 'Alice']);
    $bob = portalStudent(['first_name' => 'Bob']);

    $docType = DocumentType::firstOrCreate(
        ['code' => 'ATT_SCOL_IDOR'],
        ['name' => 'Attestation', 'view_name' => 'documents.attestation_scolarite', 'is_active' => true]
    );

    $bobsRequest = DocumentRequest::create([
        'student_id' => $bob->id,
        'document_type_id' => $docType->id,
        'status' => 'ready',
        'requested_at' => now(),
    ]);

    $this->actingAs($alice->user, 'sanctum')
        ->getJson("/api/student-portal/document-requests/{$bobsRequest->id}/download")
        ->assertForbidden();
});

it('forbids student A from viewing student B complaint', function () {
    $alice = portalStudent(['first_name' => 'Alice']);
    $bob = portalStudent(['first_name' => 'Bob']);

    $complaint = Complaint::create([
        'student_id' => $bob->id,
        'type' => 'administrative',
        'subject' => 'Dossier confidentiel',
        'message' => 'Ne pas exposer à un autre étudiant.',
        'status' => 'pending',
    ]);

    $this->actingAs($alice->user, 'sanctum')
        ->getJson("/api/student-portal/complaints/{$complaint->id}")
        ->assertForbidden();
});

it('ignores a foreign student_id when a student creates a complaint', function () {
    $alice = portalStudent(['first_name' => 'Alice']);
    $bob = portalStudent(['first_name' => 'Bob']);

    $this->actingAs($alice->user, 'sanctum')
        ->postJson('/api/student-portal/complaints', [
            'student_id' => $bob->id,
            'type' => 'administrative',
            'subject' => 'IDOR attempt',
            'message' => 'Should be attributed to Alice.',
        ])
        ->assertCreated();

    expect(Complaint::where('student_id', $bob->id)->count())->toBe(0)
        ->and(Complaint::where('student_id', $alice->id)->count())->toBe(1);
});
