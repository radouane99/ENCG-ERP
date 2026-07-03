<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Document')</title>
    <style>
        @page {
            size: A4;
            margin: 10mm; /* Standard margin */
        }
        tr {
            page-break-inside: avoid;
            page-break-after: avoid;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #1e293b;
            background-color: #fff;
        }
        .page-container {
            width: 100%;
            height: 258mm;
            border: 4px double #002e5b;
            border-collapse: collapse;
        }
        .content-td {
            padding: 20px 25px;
            vertical-align: top;
        }
        .footer-td {
            padding: 20px 25px;
            vertical-align: bottom;
            height: 130px; /* Force footer to stay at bottom */
        }
        
        /* Header specific */
        .official-logos-header {
            width: 100%;
            margin-bottom: 20px;
        }
        .logos-table {
            width: 100%;
            border-collapse: collapse;
        }
        .logos-table td {
            vertical-align: middle;
            text-align: center;
        }
        
        /* Footer specific */
        .footer-grid {
            width: 100%;
            border-collapse: collapse;
            border-top: 1px dashed #e2e8f0;
            padding-top: 15px;
        }
        .footer-grid td { vertical-align: top; }
        .footer-left { width: 55%; font-size: 9px; color: #64748b; line-height: 1.4; }
        .footer-right { width: 45%; text-align: right; font-size: 11px; }
        
        .qr-placeholder {
            width: 85px;
            height: 85px;
            float: left;
            margin-right: 15px;
        }
        .qr-placeholder img {
            width: 100%;
            height: 100%;
        }
    </style>
    @yield('styles')
</head>
<body>
    <table class="page-container">
        <tr>
            <td class="content-td">
                <!-- Standardized Top Header -->
                <div class="official-logos-header">
                    <table class="logos-table">
                        <tr>
                            <td style="text-align: left; width: 35%;">
                                <span style="font-size: 9px; font-weight: bold; color: #1e293b; line-height: 1.3;">
                                    ROYAUME DU MAROC<br>
                                    Ministère de l'Enseignement Supérieur,<br>
                                    de la Recherche Scientifique et de l'Innovation
                                </span>
                            </td>
                            <td style="text-align: center; width: 30%;">
                                @if(!empty($logoBase64))
                                    <img src="{{ $logoBase64 }}" alt="Logo ENCG" style="height: 45px;">
                                @else
                                    <strong style="color: #002e5b;">ENCG FÈS</strong>
                                @endif
                            </td>
                            <td style="text-align: right; width: 35%;">
                                <span style="font-size: 9px; font-weight: bold; color: #1e293b; line-height: 1.3;">
                                    UNIVERSITÉ SIDI MOHAMED<br>
                                    BEN ABDELLAH DE FÈS
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Dynamic Content Injection -->
                @yield('content')
            </td>
        </tr>
        <tr>
            <td class="footer-td">
                <!-- Standardized Footer -->
                <table class="footer-grid">
                    <tr>
                        <td class="footer-left">
                            <div class="qr-placeholder">
                                @if(!empty($qrBase64))
                                    <img src="{{ $qrBase64 }}" alt="QR Code">
                                @endif
                            </div>
                            <div style="padding-top: 5px;">
                                <strong style="color:#002e5b; font-size: 11px;">Document numérique officiel</strong><br>
                                Généré par le portail universitaire de l'ENCG.<br>
                                Scannez le code QR ci-dessus pour vérifier l'authenticité de ce<br>
                                document en ligne.
                            </div>
                        </td>
                        <td class="footer-right">
                            Fait à Fès, le {{ now()->format('d/m/Y') }}<br><br>
                            <strong>LE DIRECTEUR DE L'ENCG FÈS</strong><br><br>
                            <div style="font-size:8px; color:#94a3b8; border: 1px dashed #cbd5e1; padding: 5px; display:inline-block; margin-top:15px;">
                                Signé numériquement<br>par la Direction
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
