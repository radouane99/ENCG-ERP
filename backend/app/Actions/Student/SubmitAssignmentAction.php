<?php

namespace App\Actions\Student;

use App\Models\LearningMaterial;
use App\Models\LmsSubmission;
use App\Models\User;
use App\Services\Academic\AcademicContext;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SubmitAssignmentAction
{
    public function execute(User $user, int $moduleId, int $assignmentId, array $data, ?UploadedFile $file): LmsSubmission
    {
        abort_unless($user->student, 403, 'Compte étudiant requis.');
        $path = null;
        try {
            return DB::transaction(function () use ($user, $moduleId, $assignmentId, $data, $file, &$path) {
                $assignment = LearningMaterial::whereKey($assignmentId)->where('module_id', $moduleId)->where('type', 'assignment')
                    ->where('academic_year_id', AcademicContext::yearId())->where('is_published', true)->lockForUpdate()->firstOrFail();
                abort_unless($assignment->due_date, 422, 'Échéance à configurer par l’enseignant.');
                abort_if($assignment->due_date->isPast(), 422, 'Délai de soumission dépassé.');
                $submission = LmsSubmission::where('learning_material_id', $assignmentId)->where('student_id', $user->student->id)->lockForUpdate()->first();
                if ($submission) {
                    abort(409, 'Travail déjà transmis.');
                }
                if ($file) {
                    $path = $file->store('lms/submissions', 'local');
                }

                return LmsSubmission::create(['learning_material_id' => $assignmentId, 'student_id' => $user->student->id,
                    'submission_text' => $data['text'] ?? null, 'file_path' => $path, 'file_name' => $file?->getClientOriginalName(), 'submitted_at' => now()]);
            });
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }
            throw $e;
        }
    }
}
