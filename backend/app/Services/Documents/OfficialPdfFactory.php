<?php

namespace App\Services\Documents;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
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
            $data['verifyUrl'] = url('/verify/document/'.Str::random(10));
        }

        try {
            $qrSvg = QrCode::size(150)->margin(0)->generate($data['verifyUrl']);
            $data['qrBase64'] = 'data:image/svg+xml;base64,'.base64_encode($qrSvg);
        } catch (\Throwable) {
            $data['qrBase64'] = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='.urlencode($data['verifyUrl']);
        }

        return Pdf::setOption([
            'isRemoteEnabled' => true,
            'chroot' => public_path(),
        ])->loadView($view, $data);
    }
}
