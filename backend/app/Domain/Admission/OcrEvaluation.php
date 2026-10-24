<?php
namespace App\Domain\Admission;

final class OcrEvaluation
{
    public const FIELDS = ['cne', 'cin', 'first_name', 'last_name', 'first_name_fr', 'last_name_fr', 'birth_date', 'bac_average', 'bac_year', 'admission_score', 'tafem_score', 'bac_type'];

    public function evaluate(array $samples, string $kind): array
    {
        $totals = ['labeled' => 0, 'exact' => 0, 'missing' => 0, 'mismatched' => 0, 'critical_mismatches' => 0];
        $byType = []; $byField = [];
        foreach ($samples as $sample) {
            foreach ($sample['expected'] as $field => $expected) {
                $actual = $sample['extracted'][$field] ?? null;
                $missing = $actual === null || trim((string) $actual) === '';
                $exact = ! $missing && $this->normalize($field, $expected) === $this->normalize($field, $actual);
                $counts = ['labeled' => 1, 'exact' => (int) $exact, 'missing' => (int) $missing,
                    'mismatched' => (int) (! $missing && ! $exact), 'critical_mismatches' => (int) (! $exact && in_array($field, ['cne', 'cin', 'birth_date'], true))];
                foreach ($counts as $key => $value) {
                    $totals[$key] += $value;
                    $byType[$sample['document_type']][$key] = ($byType[$sample['document_type']][$key] ?? 0) + $value;
                    $byField[$field][$key] = ($byField[$field][$key] ?? 0) + $value;
                }
            }
        }
        return ['dataset_kind' => $kind, 'samples' => count($samples), 'totals' => $totals,
            'exact_match_percent' => $totals['labeled'] ? round(100 * $totals['exact'] / $totals['labeled'], 2) : null,
            'by_document_type' => $byType, 'by_field' => $byField, 'external_calls' => 0, 'raw_values_stored' => false,
            'notice' => 'Comparaison des annotations fournies, pas une validation de conformité des documents. Aucun moteur OCR n’est appelé par cette comparaison.'];
    }

    private function normalize(string $field, string|int|float $value): string
    {
        $value = trim((string) $value);
        if (in_array($field, ['bac_average', 'admission_score', 'tafem_score'], true)) {
            $number = str_replace(',', '.', $value);
            return is_numeric($number) ? (string) (float) $number : $value;
        }
        if (in_array($field, ['cne', 'cin'], true)) return mb_strtoupper(preg_replace('/\s+/u', '', $value));
        return mb_strtolower(preg_replace('/\s+/u', ' ', $value));
    }
}
