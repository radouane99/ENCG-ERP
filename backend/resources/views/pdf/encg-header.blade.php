<table class="encg-official-header" style="width:100%;border-collapse:collapse;margin-bottom:10px;">
    <tr>
        <td style="text-align:left;width:36%;vertical-align:middle;">
            <div style="font-size:8pt;font-weight:bold;color:#0f172a;line-height:1.35;">
                ROYAUME DU MAROC<br>
                <span style="font-size:7.5pt;color:#334155;">Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation</span>
            </div>
        </td>
        <td style="text-align:center;width:28%;vertical-align:middle;">
            @if(!empty($logoBase64))
                <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès" style="max-height:52px;max-width:130px;">
            @elseif(!empty($pdfLogoBase64))
                <img src="{{ $pdfLogoBase64 }}" alt="Logo ENCG Fès" style="max-height:52px;max-width:130px;">
            @else
                <strong style="color:#002e5b;font-size:14pt;letter-spacing:1px;">ENCG FÈS</strong>
            @endif
        </td>
        <td style="text-align:right;width:36%;vertical-align:middle;">
            <div style="font-size:8pt;font-weight:bold;color:#0f172a;line-height:1.35;">
                UNIVERSITÉ SIDI MOHAMED<br>
                BEN ABDELLAH DE FÈS<br>
                <span style="font-size:7.5pt;color:#002e5b;font-weight:900;">ENCG FÈS</span>
            </div>
        </td>
    </tr>
    <tr>
        <td colspan="3" style="text-align:center;padding-top:6px;font-size:8pt;color:#334155;">
            Année universitaire {{ $year ?? $academicYear ?? $academic_year ?? now()->format('Y') . '/' . now()->addYear()->format('Y') }}
            @if(!empty($qrBase64))
                <img src="{{ $qrBase64 }}" alt="QR" style="height:36px;vertical-align:middle;margin-left:8px;">
            @endif
        </td>
    </tr>
</table>
