<?php

namespace App\Services\Documents;

use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class OfficialPdfFactory
{
    public function make(string $view, array $data = []): \Barryvdh\DomPDF\PDF
    {
        $logoPath = public_path('logo-encg.png');
        $data['logoBase64'] = file_exists($logoPath)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($logoPath))
            : '';

        if (! isset($data['verifyUrl'])) {
            $data['verifyUrl'] = '';
        }

        try {
            $data['qrBase64'] = $data['verifyUrl'] !== ''
                ? 'data:image/svg+xml;base64,'.base64_encode(QrCode::format('svg')->size(150)->margin(0)->generate($data['verifyUrl']))
                : '';
        } catch (\Throwable) {
            $data['qrBase64'] = '';
        }

        $pdf = Pdf::loadView($view, $data);
        if ($view === 'pdf.carte_etudiant_cr80') { return $pdf->setPaper([0, 0, 153.01, 242.64], 'landscape'); }
        return $pdf->setPaper('a4', str_contains($view, 'emploi_du_temps') ? 'landscape' : 'portrait');
    }
}
