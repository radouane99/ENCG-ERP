<?php

namespace App\Actions\Exam;

use App\Http\Controllers\Api\PdfExportController;
use App\Models\ExamSeating;
use App\Models\ExamSession;
use App\Services\Academic\ExamWorkflowGuard;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportExamConvocationsAction
{
    public function execute(int $sessionId, array $studentIds = [], ?int $filiereId = null): BinaryFileResponse
    {
        $guard = app(ExamWorkflowGuard::class);
        $guard->manage();
        $guard->session(ExamSession::findOrFail($sessionId));
        $seats = ExamSeating::whereHas('exam', fn ($q) => $q->where('exam_session_id', $sessionId)
            ->when($filiereId, fn ($q) => $q->whereHas('module', fn ($m) => $m->where('filiere_id', $filiereId))))
            ->when($studentIds, fn ($q) => $q->whereIn('student_id', $studentIds))->orderBy('id')->get()->unique('student_id');
        abort_if($seats->isEmpty(), 422, 'Aucune convocation à exporter.');
        abort_if($seats->count() > 150, 422, 'Limiter chaque ZIP à 150 étudiants en sélectionnant une filière ou une liste.');
        File::ensureDirectoryExists(storage_path('app/private/exam-exports'));
        $path = tempnam(storage_path('app/private/exam-exports'), 'convocations-');
        $zip = new \ZipArchive;
        if ($zip->open($path, \ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Création du ZIP impossible.');
        }
        try {
            foreach ($seats as $seat) {
                $pdf = app(PdfExportController::class)->studentConvocationPdf($seat->id)->getContent();
                if (! str_starts_with($pdf, '%PDF')) {
                    throw new \RuntimeException('Un document de convocation est invalide.');
                }
                $zip->addFromString('Convocation_'.$seat->student_id.'.pdf', $pdf);
            }
            $zip->close();
        } catch (\Throwable $error) {
            $zip->close();
            File::delete($path);
            throw $error;
        }

        return response()->download($path, 'Convocations_session_'.$sessionId.'.zip', ['Content-Type' => 'application/zip'])->deleteFileAfterSend(true);
    }
}
