@php
    $resolvedLogoSrc = null;

    if (! empty($logoBase64)) {
        $resolvedLogoSrc = $logoBase64;
    } elseif (! empty($pdfLogoBase64)) {
        $resolvedLogoSrc = $pdfLogoBase64;
    } else {
        foreach (['logo-encg.png', 'images/encg_logo.png', 'images/logo-encg.png', 'images/logo.png'] as $candidate) {
            $fullPath = public_path($candidate);
            if (file_exists($fullPath)) {
                $resolvedLogoSrc = $fullPath;
                break;
            }
        }
    }
@endphp

<table class="encg-official-header" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border-bottom:1.5px solid #1a3a5c;padding-bottom:5px;margin-bottom:6px;">
    <tr>
        <td style="width:58%;vertical-align:middle;text-align:left;padding:0;">
            @if($resolvedLogoSrc)
                <img
                    src="{{ $resolvedLogoSrc }}"
                    alt="Université Sidi Mohamed Ben Abdellah — ENCG Fès"
                    style="display:block;max-height:58px;max-width:100%;height:auto;width:auto;"
                >
            @else
                <div style="font-size:8pt;font-weight:bold;color:#1a3a5c;line-height:1.35;text-transform:uppercase;">
                    ENCG Fès<br>
                    <span style="font-size:6pt;color:#4a6b8a;font-weight:normal;text-transform:none;">
                        École Nationale de Commerce et de Gestion — Fès
                    </span>
                </div>
            @endif
        </td>
        <td style="width:42%;vertical-align:middle;text-align:right;padding:0;">
            <div style="font-family:'DejaVu Sans',Arial,Helvetica,sans-serif;font-size:6.8pt;line-height:1.5;color:#4a6b8a;">
                <strong style="color:#1a3a5c;font-size:7.2pt;">Royaume du Maroc</strong><br>
                Ministère de l'Enseignement Supérieur<br>
                Université Sidi Mohamed Ben Abdellah<br>
                <strong style="color:#1a3a5c;font-size:7.2pt;">ENCG — Fès</strong>
            </div>
        </td>
    </tr>
</table>
