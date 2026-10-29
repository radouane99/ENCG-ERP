<?php

namespace App\Services\Admissions;

use App\Models\Application;
use App\Models\StudentDocument;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdmissionConsistencyService
{
    public function inspect(Application $app): array
    {
        $docs = StudentDocument::where('application_id', $app->id)->where('is_current', true)->whereNull('withdrawn_at')->get()->keyBy('id');
        $runs = DB::table('admission_ocr_runs')->where('application_id', $app->id)->whereIn('document_id', $docs->keys())
            ->whereIn('status', ['needs_review', 'succeeded'])->orderByDesc('created_at')->get()->unique('document_id');
        $map = ['cne' => 'cne', 'cin' => 'cin', 'first_name_fr' => 'first_name', 'last_name_fr' => 'last_name', 'birth_date' => 'birth_date', 'bac_average' => 'bac_average'];
        foreach (['first_name_ar', 'last_name_ar', 'birth_city', 'birth_city_ar', 'address', 'address_ar',
            'nationality', 'nationality_ar', 'gender', 'bac_mention', 'bac_year', 'high_school', 'academy',
            'bac_province', 'bac_regional_average', 'bac_national_average', 'bac_continuous_average'] as $field) {
            $map[$field] = $field;
        }
        $map['bac_type'] = 'bac_series';
        $values = [];
        foreach ($map as $field => $profileKey) {
            $baseline = in_array($field, ['cne', 'cin']) ? $app->{$field} : ($app->profile[$profileKey] ?? (in_array($profileKey, ['first_name', 'last_name']) ? $app->{$profileKey} : null));
            if ($baseline !== null && trim((string) $baseline) !== '') {
                $values[$field][] = ['source' => 'dossier', 'value' => $baseline, 'document_id' => null];
            }
        }
        foreach ($runs as $run) {
            foreach (json_decode($run->fields ?? '{}', true) ?: [] as $field => $data) {
                $value = $data['value'] ?? null;
                if (! isset($map[$field]) || ! is_scalar($value) || trim((string) $value) === '') {
                    continue;
                }
                $values[$field][] = ['source' => $docs[$run->document_id]->type, 'value' => $value, 'document_id' => $run->document_id];
            }
        }
        $alerts = [];
        foreach ($values as $field => $sources) {
            $distinct = array_unique(array_map(fn ($item) => $this->normalize($field, $item['value']), $sources));
            if (count($distinct) > 1) {
                // If birth city differs only by municipality/arrondissement granularity (e.g. JNANATE FES vs FES), do not raise alert
                if (($field === 'birth_city' || $field === 'birth_city_ar') && count($distinct) === 2) {
                    [$c1, $c2] = array_values($distinct);
                    if (str_contains($c1, $c2) || str_contains($c2, $c1)) {
                        continue;
                    }
                }
                $alerts[] = ['field' => $field, 'sources' => $sources, 'severity' => in_array($field, ['cne', 'cin', 'birth_date']) ? 'identity' : 'review'];
            }
        }

        return $alerts;
    }

    private function normalize(string $field, mixed $value): string
    {
        if (str_ends_with($field, '_average')) {
            return number_format((float) str_replace(',', '.', (string) $value), 2, '.', '');
        }

        if ($field === 'bac_type') {
            $val = Str::ascii(trim((string) $value));
            $val = preg_replace('/\b(?:2(?:[eè]me)?\s+ann[eé]e(?:\s+du)?\s+bac(?:calaur[eé]at)?|bac(?:calaur[eé]at)?|s[eé]rie|fili[eè]re|option|branche|sp[eé]cialit[eé])\b/iu', '', $val);
            if (preg_match('/sciences\s+physiques/i', $val)) {
                return 'SCIENCESPHYSIQUES';
            }
            if (preg_match('/sciences\s+math[eé]matiques\s*(?:a|b)?/i', $val, $m)) {
                return preg_replace('/[\s\p{P}]+/u', '', mb_strtoupper($m[0]));
            }
            if (preg_match('/sciences\s+(?:de\s+la\s+vie|svt)/i', $val)) {
                return 'SCIENCESDELAVIEETDELATERRE';
            }
            if (preg_match('/sciences\s+[eé]conomiques/i', $val)) {
                return 'SCIENCESECONOMIQUES';
            }
            if (preg_match('/techniques?\s+de\s+gestion/i', $val)) {
                return 'TECHNIQUESDEGESTIONETCOMPTABILITE';
            }

            return preg_replace('/[\s\p{P}]+/u', '', mb_strtoupper($val));
        }

        if ($field === 'high_school') {
            $val = Str::ascii(trim((string) $value));
            $val = preg_split('/(?:niveau|\n|\r|\|)/iu', $val)[0];
            $val = preg_replace('/[\s\p{P}]+/u', '', mb_strtoupper($val));
            // Correct common character confusions in OCR for Moroccan high schools
            $val = str_replace(['HADJ', 'MCU'], ['HADI', 'MOU'], $val);

            return $val;
        }

        return preg_replace('/[\s\p{P}]+/u', '', mb_strtoupper(Str::ascii(trim((string) $value))));
    }
}
