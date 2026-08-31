<table class="encg-official-header" style="width:100%;border-collapse:collapse;margin-bottom:2px;">
    <tr>
        <td style="text-align:left;width:38%;vertical-align:middle;">
            <div style="font-size:7pt;font-weight:bold;color:#0f172a;line-height:1.2;">
                ROYAUME DU MAROC<br>
                <span style="font-size:6.2pt;color:#334155;">Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation</span>
            </div>
        </td>
        <td style="text-align:center;width:24%;vertical-align:middle;">
            @if(!empty($logoBase64))
                <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès" style="max-height:36px;max-width:100px;">
            @elseif(!empty($pdfLogoBase64))
                <img src="{{ $pdfLogoBase64 }}" alt="Logo ENCG Fès" style="max-height:36px;max-width:100px;">
            @else
                <strong style="color:#002e5b;font-size:11pt;letter-spacing:1px;">ENCG FÈS</strong>
            @endif
        </td>
        <td style="text-align:right;width:38%;vertical-align:middle;">
            <div style="font-size:7pt;font-weight:bold;color:#0f172a;line-height:1.2;">
                UNIVERSITÉ SIDI MOHAMED<br>
                BEN ABDELLAH DE FÈS<br>
                <span style="font-size:6.5pt;color:#002e5b;font-weight:900;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</span>
            </div>
        </td>
    </tr>
</table>
