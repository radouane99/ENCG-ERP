<?php

namespace App\Services\Document;

use Barryvdh\DomPDF\Facade\Pdf;

final class WorkflowDocumentExportService
{
    public function pdf(string $title, array $facts, array $headers = [], array $rows = [], string $notice = ''): string
    {
        return Pdf::loadView('pdf.workflow_record', compact('title', 'facts', 'headers', 'rows', 'notice'))->setPaper('a4')->output();
    }

    public function zip(array $files, string $name)
    {
        abort_if(empty($files), 422, 'Aucun document à exporter pour ce périmètre.');
        $path = tempnam(storage_path('app'), 'academic-zip-');
        $zip = new \ZipArchive;
        try {
            if ($zip->open($path, \ZipArchive::OVERWRITE) !== true) {
                throw new \RuntimeException('Archive indisponible.');
            }
            foreach ($files as $filename => $content) {
                $zip->addFromString($filename, $content);
            }
            $zip->close();

            return response()->download($path, $name, ['Content-Type' => 'application/zip', 'Cache-Control' => 'private, no-store'])->deleteFileAfterSend(true);
        } catch (\Throwable $exception) {
            if (is_file($path)) {
                unlink($path);
            } throw $exception;
        }
    }
}
