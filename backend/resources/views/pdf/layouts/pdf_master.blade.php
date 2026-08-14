<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Document Officiel — ENCG Fès')</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 12mm;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 12px 16px;
            color: #1e293b;
            background-color: #ffffff;
            font-size: 10.5pt;
            line-height: 1.5;
        }
        
        /* Full Page Double Border Frame covering 100% of A4 */
        .page-border-frame {
            position: fixed;
            top: -2mm;
            left: -2mm;
            right: -2mm;
            bottom: -2mm;
            border: 3.5px double #002e5b;
            pointer-events: none;
            z-index: -100;
        }

        /* Standardized Header */
        .official-logos-header {
            width: 100%;
            border-bottom: 2px solid #002e5b;
            padding-bottom: 8px;
            margin-bottom: 14px;
        }
        .logos-table {
            width: 100%;
            border-collapse: collapse;
        }
        .logos-table td {
            vertical-align: middle;
            text-align: center;
        }

        /* Watermark Background */
        .watermark-bg {
            position: fixed;
            top: 38%;
            left: 5%;
            width: 90%;
            text-align: center;
            opacity: 0.04;
            font-size: 38pt;
            font-weight: 900;
            color: #002e5b;
            transform: rotate(-30deg);
            z-index: -50;
            text-transform: uppercase;
            letter-spacing: 4px;
        }

        /* Standardized Footer */
        .footer-container {
            margin-top: 20px;
            border-top: 1.5px dashed #cbd5e1;
            padding-top: 12px;
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
            font-size: 8pt;
            color: #475569;
            line-height: 1.4;
        }
        .footer-right {
            width: 52%;
            text-align: right;
            vertical-align: top;
        }

        .qr-box {
            width: 85px;
            height: 85px;
            float: left;
            margin-right: 12px;
        }
        .qr-box img {
            width: 100%;
            height: 100%;
        }

        .encg-bottom-bar {
            margin-top: 12px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 7.5pt;
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

    <!-- Official Moroccan Ministry & University Header -->
    <div class="official-logos-header">
        <table class="logos-table">
            <tr>
                <td style="text-align: left; width: 36%;">
                    <div style="font-size: 8pt; font-weight: bold; color: #0f172a; line-height: 1.35;">
                        ROYAUME DU MAROC<br>
                        <span style="font-size: 7.5pt; color: #334155;">Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation</span>
                    </div>
                </td>
                <td style="text-align: center; width: 28%;">
                    @if(!empty($logoBase64))
                        <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès" style="max-height: 52px; max-width: 130px;">
                    @else
                        <strong style="color: #002e5b; font-size: 14pt; letter-spacing: 1px;">ENCG FÈS</strong>
                    @endif
                </td>
                <td style="text-align: right; width: 36%;">
                    <div style="font-size: 8pt; font-weight: bold; color: #0f172a; line-height: 1.35;">
                        UNIVERSITÉ SIDI MOHAMED<br>
                        BEN ABDELLAH DE FÈS<br>
                        <span style="font-size: 7.5pt; color: #002e5b; font-weight: 900;">ENCG FÈS</span>
                    </div>
                </td>
            </tr>
        </table>
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
                        <strong style="color: #002e5b; font-size: 9pt; text-transform: uppercase;">Document Officiel Vérifié</strong><br>
                        <span style="font-size: 7.5pt; color: #64748b;">
                            Généré par le Système ERP ENCG Fès.<br>
                            <strong>Anti-Fraude :</strong> Scannez le code QR pour vérifier l'authenticité et l'intégrité de ce document.
                        </span>
                    </div>
                </td>
                <td class="footer-right">
                    @hasSection('signature_right')
                        @yield('signature_right')
                    @else
                        <div style="font-size: 9pt; color: #334155; font-weight: bold;">
                            Fait à Fès, le {{ $date ?? now()->format('d/m/Y') }}
                        </div>
                        <div style="font-size: 8pt; font-weight: bold; color: #64748b; margin-top: 4px;">
                            Pour le Directeur et par délégation
                        </div>
                        <div style="font-size: 10pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 2px;">
                            {{ $signatoryTitle ?? 'LE SECRÉTAIRE GÉNÉRAL' }}
                        </div>
                        <div style="margin-top: 6px;">
                            <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8,22 C16,10 24,4 30,4 C35,4 32,22 36,24 C40,26 45,14 50,10 C55,4 60,18 65,16 C70,14 82,6 90,14 C98,10 102,4 112,8" stroke="#059669" stroke-width="2.2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div style="font-size: 7pt; color: #059669; font-weight: bold;">
                            [Signature Numérique &amp; Cachet Officiel]
                        </div>
                    @endif
                </td>
            </tr>
        </table>

        <!-- Legal & Contact Footer Line -->
        <div class="encg-bottom-bar">
            École Nationale de Commerce et de Gestion de Fès — Route d'Imouzzer, B.P. 1255, Fès - Maroc<br>
            Tél: +212 5 35 64 49 20 | Email: contact@encg-fes.ac.ma | Portail: https://encg-fes.ac.ma
        </div>
    </div>

</body>
</html>
