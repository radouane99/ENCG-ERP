<?php

namespace App\Services\Ocr;

use App\Models\Application;
use App\Models\StudentDocument;
use App\OCR\Contracts\DocumentParserManager;
use App\OCR\Engines\PdfTextEngine;
use App\OCR\Engines\TesseractEngine;
use App\OCR\OcrProcess;
use App\OCR\Parsers\AdmissionFieldsParser;
use App\Services\AI\GeminiApiService;
use Illuminate\Support\Facades\Storage;

class AdmissionOcrService
{
    public function extract(StudentDocument $doc, string $mode): array
    {
        $path = Storage::disk($doc->storage_disk)->path($doc->file_path);
        $app = Application::findOrFail($doc->application_id);
        $text = '';
        $engine = 'pdf-text';
        OcrProcess::budget($mode === 'cloud' ? 15 : 35);
        try {
            if ($doc->mime_type === 'application/pdf') {
                $text = (new PdfTextEngine)->extract($path, $doc->mime_type, $doc->type)->text;
            }
            if (mb_strlen(trim($text)) < 30) {
                $engine = 'tesseract';
                $text = (new TesseractEngine(['max_pages' => 6]))->extract($path, $doc->mime_type, $doc->type)->text;
            }
        } finally {
            OcrProcess::reset();
        }
        $warnings = [];
        if (trim($text) === '' && $mode !== 'cloud') {
            return ['engine' => $engine, 'fields' => [], 'warnings' => ['Document illisible. Utilisez une image plus nette ou la saisie manuelle.'], 'status' => 'needs_review'];
        }
        try {
            $parsed = (new DocumentParserManager)->parse($doc->type, $text)->fields;
        } catch (\Throwable $e) {
            if ($mode !== 'cloud' || ! AdmissionOcrPolicy::available($app->campaign->institution_id)) {
                throw $e;
            }
            $parsed = [];
            $warnings[] = 'Lecture locale partielle ; extraction visuelle IA utilisée.';
        }
        $parsed = (new AdmissionFieldsParser)->canonicalize($parsed, $text, $doc->type);
        $normalizer = app(GeminiApiService::class);
        $values = $normalizer->cleanAndNormalizeOcrData($parsed, $text);
        $allowed = AdmissionFieldsParser::FIELDS;
        // A mention is documentary data; do not invent it from the average.
        $values['bac_mention'] = $parsed['bac_mention'] ?? null;
        // Preserve the printed speciality/option (e.g. Mathématiques A/B).
        $values['bac_type'] = $parsed['bac_type'] ?? null;
        if ($mode === 'cloud' && AdmissionOcrPolicy::available($app->campaign->institution_id)) {
            $cloud = app(AdmissionVisionExtractor::class)->extract($doc, $path);
            $warnings = array_merge($warnings, $cloud['warnings']);
            $cloudValues = $normalizer->cleanAndNormalizeOcrData($cloud['fields'], '');
            $cloudValues['bac_mention'] = $cloud['fields']['bac_mention'] ?? null;
            $cloudValues['bac_type'] = $cloud['fields']['bac_type'] ?? null;
            $usable = array_filter(array_intersect_key($cloudValues, array_flip($allowed)), fn ($value) => $value !== null && $value !== '' && is_scalar($value));
            if ($usable !== []) {
                $values = array_replace($values, $usable);
                $engine .= '+'.$cloud['engine'];
            } elseif (! $cloud['warnings']) {
                $warnings[] = 'Réponse IA sans champ exploitable ; extraction locale conservée.';
            }
        } elseif ($mode === 'cloud') {
            $warnings[] = 'Mode cloud indisponible ou désactivé ; extraction locale conservée.';
        }
        $fields = [];
        $limits = ['first_name_fr' => 100, 'last_name_fr' => 100, 'first_name_ar' => 100, 'last_name_ar' => 100,
            'birth_city' => 120, 'birth_city_ar' => 120, 'address' => 500, 'address_ar' => 500,
            'nationality' => 100, 'nationality_ar' => 100, 'bac_type' => 120, 'bac_mention' => 100,
            'high_school' => 180, 'academy' => 120, 'bac_province' => 120];
        foreach ($allowed as $name) {
            $value = $values[$name] ?? null;
            if ($value === null || $value === '' || ! is_scalar($value)) {
                continue;
            }
            if (isset($limits[$name]) && mb_strlen((string) $value) > $limits[$name]) {
                $warnings[] = 'Champ à vérifier manuellement : '.$name;

                continue;
            }
            $conflict = in_array($name, ['cin', 'cne']) && strtoupper((string) $app->{$name}) !== strtoupper((string) $value);
            if ($conflict) {
                $warnings[] = 'Identifiant différent du dossier : '.$name;
            }
            $fields[$name] = ['value' => $value, 'document_id' => $doc->id, 'version' => $doc->version,
                'page' => null, 'confidence' => null, 'requires_confirmation' => true, 'conflict' => $conflict];
        }
        $warnings[] = 'Vérifiez chaque proposition. L’extraction ne certifie pas l’authenticité du document.';

        return ['engine' => $engine, 'fields' => $fields, 'warnings' => $warnings, 'status' => 'needs_review'];
    }
}
