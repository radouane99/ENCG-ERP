<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <title>@yield('title', 'Document Officiel — ENCG Fès')</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 4mm 8mm 4mm 8mm;
        }
        * { 
            box-sizing: border-box; 
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #1e293b;
            background-color: #ffffff;
            font-size: 8pt;
            line-height: 1.2;
        }
        
        /* Full Page Double Border Frame */
        .page-border-frame {
            position: fixed;
            top: -3mm;
            left: -5mm;
            right: -5mm;
            bottom: -3mm;
            border: 2.5px double #002e5b;
            pointer-events: none;
            z-index: -100;
        }

        /* Standardized Header */
        .official-logos-header {
            width: 100%;
            border-bottom: 1.2px solid #002e5b;
            padding-bottom: 3px;
            margin-bottom: 4px;
        }

        /* Watermark Background */
        .watermark-bg {
            position: fixed;
            top: 40%;
            left: 5%;
            width: 90%;
            text-align: center;
            opacity: 0.035;
            font-size: 30pt;
            font-weight: 900;
            color: #002e5b;
            transform: rotate(-30deg);
            z-index: -50;
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        /* Standardized Footer */
        .footer-container {
            margin-top: 4px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 3px;
            page-break-inside: avoid;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-table td {
            vertical-align: middle;
        }
        .footer-left {
            width: 50%;
            font-size: 6.8pt;
            color: #475569;
            line-height: 1.2;
        }
        .footer-right {
            width: 50%;
            text-align: right;
            vertical-align: middle;
        }

        .qr-box {
            width: 46px;
            height: 46px;
            float: left;
            margin-right: 8px;
        }
        .qr-box img {
            width: 100%;
            height: 100%;
        }

        .encg-bottom-bar {
            margin-top: 2px;
            padding-top: 2px;
            border-top: 0.5px solid #e2e8f0;
            text-align: center;
            font-size: 6pt;
            color: #64748b;
        }

        /* Relevé: footer flush to bottom border, no trailing blank band */
        body.releve-doc .page-border-frame {
            top: -2mm;
            left: -4mm;
            right: -4mm;
            bottom: -1mm;
        }
        body.releve-doc .page-fill-shell {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        body.releve-doc .page-fill-shell > tbody > tr:first-child > td {
            vertical-align: top;
        }
        body.releve-doc .page-fill-shell > tbody > tr:last-child > td {
            vertical-align: bottom;
            padding-top: 4px;
        }
        body.releve-doc .footer-container {
            margin-top: 0;
            margin-bottom: 0;
            padding-top: 4px;
            padding-bottom: 0;
            border-top: 1px dashed #cbd5e1;
        }
        body.releve-doc .encg-bottom-bar {
            margin-top: 2px;
            margin-bottom: 0;
            padding-bottom: 0;
        }
    </style>
    @yield('styles')
</head>
<body@if(trim($__env->yieldContent('fill_page'))) class="releve-doc"@endif>

    <!-- Full Page Double Border -->
    <div class="page-border-frame"></div>

    <!-- Subtle Watermark -->
    <div class="watermark-bg">ROYAUME DU MAROC • ENCG FÈS</div>

    @hasSection('fill_page')
    <table class="page-fill-shell" height="287mm">
        <tr>
            <td>
                <div class="official-logos-header">
                    @include('pdf.encg-header')
                </div>
                <div class="main-doc-content">
                    @yield('content')
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="footer-container">
                    <table class="footer-table">
                        <tr>
                            <td class="footer-left">
                                <div class="qr-box">
                                    @if(!empty($qrBase64))
                                        <img src="{{ $qrBase64 }}" alt="QR Code Sécurité">
                                    @endif
                                </div>
                                <div>
                                    <strong style="color: #002e5b; font-size: 7.2pt; text-transform: uppercase;">Document Officiel Vérifié</strong><br>
                                    <span style="font-size: 6.2pt; color: #64748b;">
                                        Généré par le Système ERP ENCG Fès.<br>
                                        <strong>Anti-Fraude :</strong> Scannez le code QR pour vérifier l'authenticité numérique (Loi 53-05).
                                    </span>
                                </div>
                            </td>
                            <td class="footer-right">
                                @hasSection('signature_right')
                                    @yield('signature_right')
                                @else
                                    <div style="font-size: 7.2pt; color: #334155; font-weight: bold;">
                                        Fait à Fès, le {{ $date ?? now()->format('d/m/Y') }}
                                    </div>
                                    <div style="font-size: 6.5pt; font-weight: bold; color: #64748b; margin-top: 1px;">
                                        Pour le Directeur et par délégation
                                    </div>
                                    <div style="font-size: 7.8pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 1px;">
                                        {{ $signatoryTitle ?? 'LE SECRÉTAIRE GÉNÉRAL' }}
                                    </div>
                                    <div style="margin-top: 2px;">
                                        <svg width="85" height="22" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8,22 C16,10 24,4 30,4 C35,4 32,22 36,24 C40,26 45,14 50,10 C55,4 60,18 65,16 C70,14 82,6 90,14 C98,10 102,4 112,8" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                @endif
                            </td>
                        </tr>
                    </table>
                    <div class="encg-bottom-bar">
                        École Nationale de Commerce et de Gestion de Fès — Route d'Imouzzer, B.P. 1255, Fès - Maroc | Tél: +212 5 35 64 49 20 | https://encg-fes.ac.ma
                    </div>
                </div>
            </td>
        </tr>
    </table>
    @else
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
                    <div>
                        <strong style="color: #002e5b; font-size: 7.2pt; text-transform: uppercase;">Document Officiel Vérifié</strong><br>
                        <span style="font-size: 6.2pt; color: #64748b;">
                            Généré par le Système ERP ENCG Fès.<br>
                            <strong>Anti-Fraude :</strong> Scannez le code QR pour vérifier l'authenticité numérique (Loi 53-05).
                        </span>
                    </div>
                </td>
                <td class="footer-right">
                    @hasSection('signature_right')
                        @yield('signature_right')
                    @else
                        <div style="font-size: 7.2pt; color: #334155; font-weight: bold;">
                            Fait à Fès, le {{ $date ?? now()->format('d/m/Y') }}
                        </div>
                        <div style="font-size: 6.5pt; font-weight: bold; color: #64748b; margin-top: 1px;">
                            Pour le Directeur et par délégation
                        </div>
                        <div style="font-size: 7.8pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 1px;">
                            {{ $signatoryTitle ?? 'LE SECRÉTAIRE GÉNÉRAL' }}
                        </div>
                        <div style="margin-top: 2px;">
                            <svg width="85" height="22" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    @endif

</body>
</html>
