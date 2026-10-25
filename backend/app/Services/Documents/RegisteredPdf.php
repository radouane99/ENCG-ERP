<?php

namespace App\Services\Documents;

use App\Models\PdfDocumentRecord;
use Barryvdh\DomPDF\PDF;
use Illuminate\Database\Eloquent\Model;

/** Adapter around the existing Dompdf binding, shared by every PDF facade entry point. */
class RegisteredPdf extends PDF
{
    private string $sourceHtml = '';
    private ?string $sourceView = null;
    private ?int $institutionId = null;
    private ?int $actorId = null;
    private ?PdfDocumentRecord $record = null;
    private ?string $archivedOutput = null;
    private ?int $expectedPages = null;
    private bool $paperConfigured = false;

    public function setPaper(string|array $paper, string $orientation = 'portrait'): self
    {
        $orientation = in_array(strtolower($orientation), ['landscape', 'paysage', 'l'], true) ? 'landscape' : 'portrait';
        $this->dompdf->setPaper($paper, $orientation);
        $this->paperConfigured = true;
        return $this;
    }

    public function withDocumentContext(?int $institutionId, ?int $actorId = null): self
    {
        $this->institutionId = $institutionId ?? $this->institutionId;
        $this->actorId = $actorId ?? $this->actorId;
        return $this;
    }

    public function loadHTML(string $string, ?string $encoding = null): self
    {
        $this->sourceHtml = $string;
        $this->record = null;
        $this->archivedOutput = null;
        $this->institutionId ??= auth()->user()?->institution_id;
        $this->actorId ??= auth()->id();
        return parent::loadHTML($string, $encoding);
    }

    public function loadView(string $view, array $data = [], array $mergeData = [], ?string $encoding = null): self
    {
        $this->sourceView = $view;
        $this->expectedPages = $view === 'pdf.emploi_du_temps_officiel' && !empty($data['catalog']['sections']) ? count($data['catalog']['sections']) : null;
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
        // Titles often contain a person's name. Public registry labels describe the type only.
        $label = $this->sourceView ? ucfirst(str_replace(['pdf.', 'reports.', '_', '-'], ['', '', ' ', ' '], $this->sourceView)) : 'Document PDF';
        $fingerprint = hash('sha256', json_encode([
            'design' => 'encg-pdf-v1', 'institution' => $this->institutionId, 'view' => $this->sourceView,
            'html' => $this->sourceHtml, 'paper' => $this->dompdf->getPaperSize(),
            'orientation' => $this->dompdf->getPaperOrientation(),
        ], JSON_INVALID_UTF8_SUBSTITUTE));
        $this->record = app(PdfDocumentRegistry::class)->reserve($fingerprint, $this->institutionId, $this->sourceView, $label, $this->actorId);
        $landscape = $this->dompdf->getPaperOrientation() === 'landscape' || str_contains($this->sourceView ?? '', 'emploi_du_temps');
        $paper = $this->dompdf->getPaperSize();
        $compact = $this->sourceView === 'pdf.carte_etudiant_cr80' || max($paper[2], $paper[3]) < 320;
        $html = app(PdfPresentationService::class)->prepare($this->sourceHtml, $this->sourceView, $landscape, $this->paperConfigured ? $paper : null, $compact);
        parent::loadHTML($html, 'UTF-8');
        parent::render();
        if ($this->expectedPages && $this->dompdf->getCanvas()->get_page_count() > $this->expectedPages) {
            throw \Illuminate\Validation\ValidationException::withMessages(['pdf' => 'Grille trop dense pour une page A4 par filière/semestre. Vérifiez le périmètre et les libellés avant édition.']);
        }
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
