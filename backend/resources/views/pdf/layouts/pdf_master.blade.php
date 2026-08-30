<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <title>@yield('title', 'Document Officiel — ENCG Fès')</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 7mm 10mm 7mm 10mm;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #1e293b;
            background-color: #ffffff;
            font-size: 8.5pt;
            line-height: 1.3;
        }
        
        /* Full Page Double Border Frame covering 100% of A4 */
        .page-border-frame {
            position: fixed;
            top: -4.5mm;
            left: -6mm;
            right: -6mm;
            bottom: -4.5mm;
            border: 3px double #002e5b;
            pointer-events: none;
            z-index: -100;
        }

        /* Standardized Header */
        .official-logos-header {
            width: 100%;
            border-bottom: 1.5px solid #002e5b;
            padding-bottom: 5px;
            margin-bottom: 8px;
        }

        /* Watermark Background */
        .watermark-bg {
            position: fixed;
            top: 40%;
            left: 5%;
            width: 90%;
            text-align: center;
            opacity: 0.035;
            font-size: 34pt;
            font-weight: 900;
            color: #002e5b;
            transform: rotate(-30deg);
            z-index: -50;
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        /* Standardized Footer */
        .footer-container {
            margin-top: 10px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 6px;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-table td {
            vertical-align: top;
        }
        .footer-left {
            width: 48%;
            font-size: 7.2pt;
            color: #475569;
            line-height: 1.35;
        }
        .footer-right {
            width: 52%;
            text-align: right;
            vertical-align: top;
        }

        .qr-box {
            width: 58px;
            height: 58px;
            float: left;
            margin-right: 10px;
        }
        .qr-box img {
            width: 100%;
            height: 100%;
        }

        .encg-bottom-bar {
            margin-top: 6px;
            padding-top: 4px;
            border-top: 0.5px solid #e2e8f0;
            text-align: center;
            font-size: 6.8pt;
            color: #64748b;
        }
    </style>
    @yield('styles')
</head>
<body>

    <!-- Full Page Double Border -->
    <div class="page-border-frame"></div>

    <!-- Subtle Watermark -->
    <div class="watermark-bg">ROYAUME DU MAROC • ENCG FÈS</div>

    <div class="official-logos-header">
        @include('pdf.encg-header')
    </div>

    <!-- Dynamic Document Body Content -->
    <div class="main-doc-content">
        @yield('content')
    </div>

    <!-- Standardized Signature & Security Footer Section -->
    <div class="footer-container">
        <table class="footer-table">
            <tr>
                <td class="footer-left">
                    <div class="qr-box">
                        @if(!empty($qrBase64))
                            <img src="{{ $qrBase64 }}" alt="QR Code Sécurité">
                        @endif
                    </div>
                    <div style="padding-top: 2px;">
                        <strong style="color: #002e5b; font-size: 8pt; text-transform: uppercase;">Document Officiel Vérifié</strong><br>
                        <span style="font-size: 7pt; color: #64748b;">
                            Généré par le Système ERP ENCG Fès.<br>
                            <strong>Anti-Fraude :</strong> Scannez le code QR pour vérifier l'authenticité numérique (Loi 53-05).
                        </span>
                    </div>
                </td>
                <td class="footer-right">
                    @hasSection('signature_right')
                        @yield('signature_right')
                    @else
                        <div style="font-size: 8pt; color: #334155; font-weight: bold;">
                            Fait à Fès, le {{ $date ?? now()->format('d/m/Y') }}
                        </div>
                        <div style="font-size: 7pt; font-weight: bold; color: #64748b; margin-top: 2px;">
                            Pour le Directeur et par délégation
                        </div>
                        <div style="font-size: 8.5pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 2px;">
                            {{ $signatoryTitle ?? 'LE SECRÉTAIRE GÉNÉRAL' }}
                        </div>
                        <div style="margin-top: 4px;">
                            <svg width="100" height="26" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8,22 C16,10 24,4 30,4 C35,4 32,22 36,24 C40,26 45,14 50,10 C55,4 60,18 65,16 C70,14 82,6 90,14 C98,10 102,4 112,8" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                    @endif
                </td>
            </tr>
        </table>

        <!-- Legal & Contact Footer Line -->
        <div class="encg-bottom-bar">
            École Nationale de Commerce et de Gestion de Fès — Route d'Imouzzer, B.P. 1255, Fès - Maroc | Tél: +212 5 35 64 49 20 | https://encg-fes.ac.ma
        </div>
    </div>

</body>
</html>
