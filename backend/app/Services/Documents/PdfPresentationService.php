<?php

namespace App\Services\Documents;

use App\Models\PdfDocumentRecord;
use Dompdf\Dompdf;
use Illuminate\Support\Facades\File;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class PdfPresentationService
{
    public function prepare(string $html, ?string $view, bool $landscape = false, ?array $paper = null, bool $compact = false): string
    {
        // Dompdf has normal/bold font faces; unsupported heavy weights can fall back to Times.
        $html = preg_replace('/font-weight\s*:\s*(?:[6-9]00|1000)\b/i', 'font-weight: bold', $html);
        $css = <<<'CSS'
<style id="encg-pdf-design">
@page { margin-top: 64pt; margin-right: 32pt; margin-bottom: 82pt; margin-left: 32pt; }
* { font-family: 'DejaVu Sans', sans-serif !important; }
body { color: #17243a; }
h1, h2, h3 { font-weight: bold; }
table { border-collapse: collapse; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
.encg-official-header, .official-logos-header, .page-border-frame, .encg-bottom-bar { display: none !important; }
.watermark-bg { opacity: 0.02; }
</style>
CSS;
        if ($landscape) {
            $css = str_replace('margin-top: 64pt', 'margin-top: 38pt', $css);
        }
        if ($view === 'pdf.emploi_du_temps_officiel') {
            $css = str_replace('</style>', '.foot { display: none; }</style>', $css);
        }
        if ($paper) {
            $css = str_replace('@page {', '@page { size: '.($paper[2] - $paper[0]).'pt '.($paper[3] - $paper[1]).'pt;', $css);
        }
        if ($compact) {
            $size = $paper ? 'size: '.($paper[2] - $paper[0]).'pt '.($paper[3] - $paper[1]).'pt;' : '';
            $css = '<style id="encg-pdf-design">@page {'.$size.'margin:0;} * {font-family:"DejaVu Sans",sans-serif !important;}</style>';
        }

        return str_contains(strtolower($html), '</head>')
            ? preg_replace('/<\/head>/i', $css.'</head>', $html, 1)
            : '<meta charset="utf-8">'.$css.$html;
    }

    public function stamp(Dompdf $pdf, PdfDocumentRecord $record): void
    {
        $url = url('/verify/document/'.$record->verification_token);
        $qr = (string) QrCode::format('svg')->size(180)->margin(3)->generate($url);
        $qrDirectory = storage_path('app/private/pdf-registry-qr');
        File::ensureDirectoryExists($qrDirectory, 0700);
        $qrPath = $qrDirectory.'/'.hash('sha256', $record->verification_token).'.svg';
        file_put_contents($qrPath, $qr);
        $logo = public_path('logo-encg.png');
        $identifier = $record->digital_identifier;
        $date = $record->created_at->format('d/m/Y H:i');
        $demo = app()->environment('testing');
        $pdf->getCanvas()->page_script(function ($number, $count, $canvas, $fonts) use ($logo, $identifier, $date, $qrPath, $demo) {
            $width = $canvas->get_width();
            $height = $canvas->get_height();
            $font = $fonts->getFont('DejaVu Sans', 'normal');
            $bold = $fonts->getFont('DejaVu Sans', 'bold');
            $navy = [0.102, 0.212, 0.451];
            $gray = [0.31, 0.37, 0.45];
            if (max($width, $height) < 320) {
                $canvas->filled_rectangle(0, $height - 12, $width, 12, $navy);
                $canvas->text(8, $height - 9, 'ID PDF : '.$identifier, $bold, 6, [1, 1, 1]);
                $canvas->image($qrPath, $width - 42, $height - 51, 36, 36);
                if ($demo) {
                    $canvas->set_opacity(0.12);
                    $canvas->text(65, 95, 'DÉMONSTRATION', $bold, 13, $gray, 0, 0, -25);
                    $canvas->set_opacity(1);
                }

                return;
            }
            $landscape = $width > $height;
            if (is_file($logo)) {
                $canvas->image($logo, 32, $landscape ? 6 : 12, $landscape ? 130 : 170, $landscape ? 25 : 35);
            }
            $canvas->text($width - 244, $landscape ? 7 : 14, 'Université Sidi Mohamed Ben Abdellah', $bold, 8, $navy);
            $canvas->text($width - 244, $landscape ? 20 : 27, 'École Nationale de Commerce et de Gestion - Fès', $font, 7, $gray);
            $canvas->line(32, $landscape ? 33 : 53, $width - 32, $landscape ? 33 : 53, $navy, 1);
            $canvas->line(32, $height - 72, $width - 32, $height - 72, [0.8, 0.84, 0.9], 0.6);
            $canvas->text(32, $height - 61, 'Identifiant numérique : '.$identifier, $bold, 8, $navy);
            $canvas->text(32, $height - 46, 'Exemplaire enregistré le '.$date.' - Vérification de référence par QR', $font, 6.5, $gray);
            $canvas->text(32, $height - 33, 'La référence numérique ne remplace pas les visas et signatures requis.', $font, 6.3, $gray);
            $canvas->text(32, $height - 17, 'ENCG Fès - Registre documentaire', $font, 6, $gray);
            $canvas->text($width - 180, $height - 17, 'Page '.$number.' / '.$count, $font, 6.5, $gray);
            $canvas->image($qrPath, $width - 86, $height - 67, 52, 52);
            if ($demo) {
                $canvas->set_opacity(0.08);
                $canvas->text($width / 2 - 125, $height / 2, 'DÉMONSTRATION', $bold, 28, $gray, 0, 0, -30);
                $canvas->set_opacity(1);
            }
        });
    }
}
