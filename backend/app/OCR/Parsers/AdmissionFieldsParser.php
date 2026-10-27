<?php

namespace App\OCR\Parsers;

/** Canonical admission keys, preserving FR/AR fields and explicitly printed values. */
final class AdmissionFieldsParser
{
    public const FIELDS = ['cin', 'cne', 'first_name_fr', 'last_name_fr', 'first_name_ar', 'last_name_ar',
        'birth_date', 'birth_city', 'birth_city_ar', 'address', 'address_ar', 'gender', 'nationality', 'nationality_ar',
        'bac_average', 'bac_type', 'bac_mention', 'bac_year', 'high_school', 'academy', 'bac_province',
        'bac_regional_average', 'bac_national_average', 'bac_continuous_average'];

    public function canonicalize(array $fields, string $text, string $type): array
    {
        $fields = array_filter($fields, fn ($value) => is_scalar($value));
        $aliases = ['birth_city' => ['birth_city_fr', 'birth_place_fr'], 'birth_city_ar' => ['birth_place_ar'],
            'address' => ['address_fr'], 'bac_mention' => ['mention'], 'bac_average' => ['moyenne_bac'],
            'bac_regional_average' => ['note_regional'], 'bac_national_average' => ['note_national'],
            'bac_continuous_average' => ['note_controle']];
        if ($type !== 'cnie') {
            $aliases['bac_province'] = ['province', 'prefecture'];
        }
        foreach ($aliases as $target => $sources) {
            foreach ($sources as $source) {
                if (empty($fields[$target]) && isset($fields[$source]) && is_scalar($fields[$source])) {
                    $fields[$target] = $fields[$source];
                }
            }
        }
        $labels = [
            'last_name_fr' => 'Nom(?: de famille)?(?: \(Fr\))?', 'first_name_fr' => 'Pr[eé]nom(?:s)?(?: \(Fr\))?',
            'last_name_ar' => 'النسب|الاسم العائلي', 'first_name_ar' => 'الاسم الشخصي',
            'birth_city' => 'Lieu de naissance(?: \(Fr\))?|Lieu de naissance en fran[cç]ais',
            'birth_city_ar' => 'مكان الازدياد|مكان الولادة|Lieu de naissance \(Ar\)',
            'birth_date' => 'Date de naissance|N[eé]e? le|تاريخ الازدياد|تاريخ الولادة',
            'address' => 'Adresse(?: de r[eé]sidence)?(?: \(Fr\))?',
            'address_ar' => 'العنوان|عنوان السكن|عنوان الإقامة|Adresse \(Ar\)',
            'nationality' => 'Nationalit[eé](?: \(Fr\))?', 'nationality_ar' => 'الجنسية|Nationalit[eé] \(Ar\)',
        ];
        if ($type !== 'cnie') {
            $labels += ['bac_province' => 'Province|Pr[eé]fecture|Direction provinciale|المديرية الإقليمية|الإقليم',
                'academy' => 'Acad[eé]mie(?: r[eé]gionale)?|الأكاديمية(?: الجهوية)?',
                'high_school' => '[EÉ]tablissement(?: d’origine)?|Lyc[eé]e|الثانوية|المؤسسة',
                'bac_type' => 'S[eé]rie(?: du bac)?|Fili[eè]re|Sp[eé]cialit[eé]|الشعبة|المسلك',
                'bac_mention' => 'Mention(?: du bac)?|الميزة', 'bac_year' => 'Ann[eé]e(?: du bac)?|سنة البكالوريا',
                'bac_average' => 'Moyenne g[eé]n[eé]rale(?: du bac)?|المعدل العام',
                'bac_regional_average' => 'Moyenne r[eé]gionale|Note r[eé]gionale|المعدل الجهوي',
                'bac_national_average' => 'Moyenne nationale|Note nationale|المعدل الوطني',
                'bac_continuous_average' => 'Contr[oô]le continu|Moyenne du contr[oô]le continu|المراقبة المستمرة'];
        }
        foreach ($labels as $key => $label) {
            if (preg_match('/^[ \t]*(?:'.$label.')[ \t]*[:：][ \t]*([^\r\n\f]+)/imu', $text, $match)) {
                $value = trim(preg_split('/[ \t]{2,}/u', $match[1])[0]);
                if ($value !== '') {
                    $fields[$key] = $value;
                }
            }
        }
        foreach (['bac_average', 'bac_regional_average', 'bac_national_average', 'bac_continuous_average'] as $key) {
            if (isset($fields[$key])) {
                $value = trim(str_replace(',', '.', (string) $fields[$key]));
                if (preg_match('/^(\d{1,2}(?:\.\d{1,3})?)(?:\s*\/\s*20)?$/', $value, $match) && (float) $match[1] <= 20) {
                    $fields[$key] = (float) $match[1];
                } else {
                    unset($fields[$key]);
                }
            }
        }
        if (isset($fields['bac_year']) && (! preg_match('/^\d{4}$/', (string) $fields['bac_year']) || $fields['bac_year'] < 1980 || $fields['bac_year'] > now()->year)) {
            unset($fields['bac_year']);
        }
        if (! empty($fields['gender'])) {
            $fields['gender'] = match (mb_strtolower(trim((string) $fields['gender']))) {
                'male', 'masculin', 'm', 'ذكر' => 'male',
                'female', 'féminin', 'feminin', 'f', 'أنثى' => 'female',
                default => null,
            };
        }

        return array_intersect_key($fields, array_flip(self::FIELDS));
    }
}
