<?php

namespace App\Services\Documents;

use App\Models\PdfDocumentRecord;
use Barryvdh\DomPDF\PDF;
use Illuminate\Database\Eloquent\Model;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/** Adapter around the existing Dompdf binding, shared by every PDF facade entry point. */
class RegisteredPdf extends PDF
{
    private string $sourceHtml = '';
    private ?string $sourceView = null;
    private ?int $institutionId = null;
    private ?PdfDocumentRecord $record = null;
    private ?string $archivedOutput = null;

    public function loadHTML(string $string, ?string $encoding = null): self
    {
        $this->sourceHtml = $string;
        $this->record = null;
        $this->archivedOutput = null;
        $this->institutionId ??= auth()->user()?->institution_id;
        return parent::loadHTML($string, $encoding);
    }

    public function loadView(string $view, array $data = [], array $mergeData = [], ?string $encoding = null): self
    {
        $this->sourceView = $view;
        $this->institutionId = auth()->user()?->institution_id;
        foreach ($data as $value) {
            if (! $this->institutionId && $value instanceof Model && $value->getAttribute('institution_id')) {
                $this->institutionId = (int) $value->getAttribute('institution_id');
            }
        }
        return $this->loadHTML($this->view->make($view, $data, $mergeData)->render(), $encoding);
    }

    public function loadFile(string $file): self
    {
        // Keep file input local, matching the application's generated document use-cases.
        if (! is_file($file)) { throw new \InvalidArgumentException('Fichier HTML local introuvable.'); }
        return $this->loadHTML((string) file_get_contents($file));
    }

    public function render(): void
    {
        if ($this->rendered) { return; }
        preg_match('/<title[^>]*>(.*?)<\/title>/is', $this->sourceHtml, $title);
        $label = html_entity_decode(strip_tags($title[1] ?? str_replace(['pdf.', '_', '-'], ['', ' ', ' '], $this->sourceView ?? 'Document ENCG')), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $fingerprint = hash('sha256', json_encode([
            'design' => 'encg-pdf-v1', 'institution' => $this->institutionId, 'view' => $this->sourceView,
            'html' => $this->sourceHtml, 'paper' => $this->dompdf->getPaperSize(),
            'orientation' => $this->dompdf->getPaperOrientation(),
        ], JSON_INVALID_UTF8_SUBSTITUTE));
        $this->record = app(PdfDocumentRegistry::class)->reserve($fingerprint, $this->institutionId, $this->sourceView, $label);
        $html = app(PdfPresentationService::class)->prepare($this->sourceHtml, $this->sourceView);
        parent::loadHTML($html, 'UTF-8');
        parent::render();
        $this->dompdf->add_info('Title', $label);
        $this->dompdf->add_info('Subject', 'Identifiant numérique '.$this->record->digital_identifier);
        $this->dompdf->add_info('Creator', 'ENCG - Registre documentaire');
        app(PdfPresentationService::class)->stamp($this->dompdf, $this->record);
    }

    public function output(array $options = []): string
    {
        if ($this->archivedOutput !== null) { return $this->archivedOutput; }
        $bytes = parent::output($options);
        return $this->archivedOutput = app(PdfDocumentRegistry::class)->finalize($this->record, $bytes, $this->dompdf->getCanvas()->get_page_count());
    }
}
