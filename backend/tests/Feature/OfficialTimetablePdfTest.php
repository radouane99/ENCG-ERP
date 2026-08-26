<?php

namespace Tests\Feature;

use App\Services\Academic\OfficialTimetableMatrixService;
use App\Services\Documents\OfficialPdfFactory;
use Tests\TestCase;

class OfficialTimetablePdfTest extends TestCase
{
    public function test_official_timetable_html_keeps_accents_logo_and_qr(): void
    {
        $catalog = $this->sampleCatalog();
        $html = view('pdf.emploi_du_temps_officiel', [
            'catalog' => $catalog,
            'logoBase64' => 'data:image/png;base64,QQ==',
            'qrBase64' => 'data:image/svg+xml;base64,QQ==',
            'verifyUrl' => 'https://encg-fes.ac.ma/verify/document/edt-test',
            'date' => '26/08/2026',
        ])->render();

        $this->assertStringContainsString('DejaVu Sans', $html);
        $this->assertStringContainsString('Comptabilité Générale', $html);
        $this->assertStringContainsString('Probabilités', $html);
        $this->assertStringContainsString('Amphithéâtre', $html);
        $this->assertStringContainsString('data:image/png;base64,QQ==', $html);
        $this->assertStringContainsString('QR authentification', $html);
        $this->assertStringNotContainsString('Probabilité??', $html);
    }

    public function test_official_timetable_pdf_renders(): void
    {
        $pdf = app(OfficialPdfFactory::class)
            ->make('pdf.emploi_du_temps_officiel', [
                'catalog' => $this->sampleCatalog(),
                'verifyUrl' => 'https://encg-fes.ac.ma/verify/document/edt-test',
            ])
            ->setPaper('a4', 'landscape');

        $binary = $pdf->output();
        $this->assertStringStartsWith('%PDF', $binary);
        $this->assertGreaterThan(2000, strlen($binary));
    }

    private function sampleCatalog(): array
    {
        return [
            'academic_year' => '2024-2025',
            'days' => OfficialTimetableMatrixService::DAYS,
            'sections' => [[
                'title' => 'EMPLOI DU TEMPS S2',
                'filiere_code' => 'TC',
                'filiere_name' => 'Tronc Commun ENCG',
                'academic_year' => '2024-2025',
                'semester_label' => 'S2 AP',
                'rows' => [[
                    'show_module' => true,
                    'module_rowspan' => 1,
                    'module_label' => '1-Comptabilité Générale',
                    'element_name' => 'Probabilités',
                    'professor_name' => 'Pr. Test',
                    'color' => '#1e3a8a',
                    'days' => [
                        1 => ['G1: 08h30-10h30'],
                        2 => [],
                        3 => [],
                        4 => [],
                        5 => [],
                    ],
                    'room_label' => 'Amphithéâtre',
                ]],
                'footer' => ['school' => 'ENCG-FES'],
            ]],
        ];
    }
}
