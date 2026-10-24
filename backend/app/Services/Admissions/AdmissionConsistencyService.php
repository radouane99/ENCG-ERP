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
        $values = [];
        foreach ($map as $field => $profileKey) {
            $baseline = in_array($field, ['cne', 'cin']) ? $app->{$field} : ($app->profile[$profileKey] ?? (in_array($profileKey, ['first_name', 'last_name']) ? $app->{$profileKey} : null));
            if ($baseline !== null && trim((string) $baseline) !== '') $values[$field][] = ['source' => 'dossier', 'value' => $baseline, 'document_id' => null];
        }
        foreach ($runs as $run) {
            foreach (json_decode($run->fields ?? '{}', true) ?: [] as $field => $data) {
                $value = $data['value'] ?? null;
                if (! isset($map[$field]) || ! is_scalar($value) || trim((string) $value) === '') continue;
                $values[$field][] = ['source' => $docs[$run->document_id]->type, 'value' => $value, 'document_id' => $run->document_id];
            }
        }
        $alerts = [];
        foreach ($values as $field => $sources) {
            $distinct = array_unique(array_map(fn ($item) => $this->normalize($field, $item['value']), $sources));
            if (count($distinct) > 1) $alerts[] = ['field' => $field, 'sources' => $sources, 'severity' => in_array($field, ['cne', 'cin', 'birth_date']) ? 'identity' : 'review'];
        }
        return $alerts;
    }

    private function normalize(string $field, mixed $value): string
    {
        if ($field === 'bac_average') return number_format((float) str_replace(',', '.', (string) $value), 2, '.', '');
        return preg_replace('/[\s\p{P}]+/u', '', mb_strtoupper(Str::ascii(trim((string) $value))));
    }
}
