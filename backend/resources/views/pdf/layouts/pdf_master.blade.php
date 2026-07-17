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
        .footer-grid td { vertical-align: bottom; }
        .footer-left { width: 55%; font-size: 9px; color: #64748b; line-height: 1.4; }
        .footer-right { width: 45%; text-align: right; font-size: 11px; }

        .encg-contact-info {
            font-size: 8px;
            color: #1e293b;
            text-align: center;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            margin-top: 10px;
        }
        
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
                                <strong style="color:#002e5b; font-size: 11px;">Document numérique officiel sécurisé</strong><br>
                                Généré automatiquement par l'ERP ENCG.<br>
                                <strong>Anti-Fraude :</strong> Scannez le code QR ci-dessus<br>
                                pour valider l'authenticité de ce document.
                            </div>
                        </td>
                        <td class="footer-right">
                            Fait à Fès, le {{ $date ?? now()->format('d/m/Y') }}<br><br>
                            <strong>{{ $signatoryTitle ?? "LE DIRECTEUR DE L'ENCG FÈS" }}</strong><br>
                            <!-- Signature Numérique SVG générée ou image -->
                            <div style="margin-top: 5px; margin-right: 15px;">
                                @if(!empty($signatureBase64))
                                    <img src="{{ $signatureBase64 }}" alt="Signature" style="max-height: 40px; max-width: 120px;">
                                @else
                                    <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10,25 Q15,10 20,20 T30,15 T40,25 T50,15 T60,25 T70,10 T80,25 T90,15 T100,20 T110,25" stroke="#0f2863" stroke-width="2" fill="none" stroke-linecap="round"/>
                                        <path d="M15,30 L105,30" stroke="#0f2863" stroke-width="1" stroke-dasharray="2 2" fill="none"/>
                                    </svg>
                                @endif
                            </div>
                        </td>
                    </tr>
                </table>
                <div class="encg-contact-info">
                    École Nationale de Commerce et de Gestion de Fès - Route d'Imouzzer, B.P. 1255, Fès - Maroc<br>
                    Tél: +212 5 35 64 49 20 | Email: contact@encg-fes.ac.ma | Web: www.encg-fes.ac.ma
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
