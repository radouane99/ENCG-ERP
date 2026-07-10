<?php
use Illuminate\Support\Facades\Route;

Route::get('/test-doc', function() {
    try {
        $reqs = \App\Models\DocumentRequest::where('status', 'pending')->get();
        if ($reqs->isEmpty()) return 'No pending requests found';
        $out = [];
        foreach ($reqs as $req) {
            try {
                app(\App\Services\DocumentRequestService::class)->processRequest($req, 'ready');
                $out[] = "Success for {$req->id} ({$req->documentType->name})";
            } catch (\Exception $e) {
                $out[] = "Error for {$req->id}: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine();
            }
        }
        return response()->json($out);
    } catch (\Exception $e) {
        return 'Global Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
    }
});


Route::get('/seed-students', function() {
    try {
        $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
        if (!$academicYear) return 'No current academic year.';

        $filieres = \App\Models\Filiere::all();
        $students = \App\Models\Student::all();
        $studentIndex = 0;
        $log = [];

        foreach ($filieres as $filiere) {
            $assignedCount = 0;
            for ($i = 1; $i <= 2; $i++) {
                $group = \App\Models\Group::firstOrCreate(
                    [
                        'name' => 'Groupe ' . $i . ' - ' . $filiere->code,
                        'academic_year_id' => $academicYear->id,
                    ],
                    [
                        'filiere_id' => $filiere->id,
                        'semester_number' => 1,
                    ]
                );
                for ($j = 0; $j < 10; $j++) {
                    if (!isset($students[$studentIndex])) break 3;
                    $student = $students[$studentIndex++];
                    \App\Models\StudentPathway::updateOrCreate(
                        ['student_id' => $student->id, 'academic_year_id' => $academicYear->id],
                        ['filiere_id' => $filiere->id, 'current_semester' => 1, 'group_id' => $group->id, 'is_current' => true]
                    );
                    $assignedCount++;
                }
            }
            $log[] = "Assigned {$assignedCount} students to {$filiere->name}.";
        }
        return implode('<br>', $log) . '<br>Total: ' . $studentIndex;
    } catch (\Throwable $e) {
        return $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine();
    }
});

// Routes are now modularized in routes/api/
// See bootstrap/app.php for registration.
// [AUDIT SEC-03] Debug route removed — was a public data exfiltration risk.
