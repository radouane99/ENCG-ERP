<?php

namespace Tests\Unit;

use App\OCR\Parsers\AdmissionFieldsParser;
use PHPUnit\Framework\TestCase;

class AdmissionFieldsParserTest extends TestCase
{
    public function test_cnie_keeps_both_languages_and_separates_birthplace_from_residence(): void
    {
        $text = "Nom : EL TEST\nPrénom : SARA\nالنسب : الاختبار\nالاسم الشخصي : سارة\nLieu de naissance : MEKNES\nمكان الازدياد : مكناس\nAdresse : 12 RUE TEST FES\nالعنوان : 12 زنقة الاختبار فاس";
        $fields = (new AdmissionFieldsParser)->canonicalize(['gender' => 'Female'], $text, 'cnie');
        $this->assertSame('female', $fields['gender']);
        $this->assertSame('MEKNES', $fields['birth_city']);
        $this->assertSame('مكناس', $fields['birth_city_ar']);
        $this->assertSame('12 RUE TEST FES', $fields['address']);
        $this->assertSame('12 زنقة الاختبار فاس', $fields['address_ar']);
        $this->assertSame('سارة', $fields['first_name_ar']);
        $this->assertSame('SARA', $fields['first_name_fr']);
    }

    public function test_bac_and_transcript_aliases_keep_averages_and_school_province_distinct(): void
    {
        $text = "Province : FES\nMention : Très Bien\nLycée : LYCEE TEST\nSpécialité : Sciences Mathématiques\nMoyenne générale : 16,50 /20\nMoyenne régionale : 15,25\nMoyenne nationale : 17,00\nContrôle continu : 16,75";
        $fields = (new AdmissionFieldsParser)->canonicalize([], $text, 'releve_notes');
        $this->assertSame('FES', $fields['bac_province']);
        $this->assertArrayNotHasKey('address', $fields);
        $this->assertSame('Très Bien', $fields['bac_mention']);
        $this->assertSame(16.5, $fields['bac_average']);
        $this->assertSame(15.25, $fields['bac_regional_average']);
        $this->assertSame(17.0, $fields['bac_national_average']);
        $this->assertSame(16.75, $fields['bac_continuous_average']);
        $this->assertSame('Sciences Mathématiques', $fields['bac_type']);
    }

    public function test_invalid_grades_and_non_scalar_or_administrative_fields_are_not_proposals(): void
    {
        $fields = (new AdmissionFieldsParser)->canonicalize(['moyenne_bac' => 99, 'status' => 'approved'], 'Moyenne générale : impossible', 'bac');
        $this->assertArrayNotHasKey('bac_average', $fields);
        $this->assertArrayNotHasKey('status', $fields);
    }
}
