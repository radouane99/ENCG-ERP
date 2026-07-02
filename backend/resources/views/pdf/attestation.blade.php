<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Attestation de Réussite</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            color: #1e293b;
        }
        .border-container {
            border: 4px double #002e5b;
            padding: 40px;
            min-height: 800px;
            position: relative;
        }
        .header {
            width: 100%;
            margin-bottom: 40px;
            border-bottom: 2px solid #002e5b;
            padding-bottom: 20px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-left {
            font-size: 28px;
            font-weight: 800;
            color: #002e5b;
            text-transform: uppercase;
        }
        .header-left span { color: #d4a373; }
        .header-left-sub { font-size: 11px; color: #555; margin-top: 5px; font-weight: 600; letter-spacing: 1.5px;}
        .header-right {
            text-align: right;
            font-size: 11px;
            color: #4a5568;
            line-height: 1.8;
        }
        
        .doc-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #002e5b;
            letter-spacing: 2px;
            margin: 40px 0 60px 0;
            text-transform: uppercase;
        }

        .text-content {
            font-size: 16px;
            line-height: 2;
            text-align: justify;
            margin-bottom: 60px;
        }
        .text-content strong {
            font-size: 18px;
            color: #002e5b;
        }

        .footer-grid {
            width: 100%;
            margin-top: 60px;
            position: absolute;
            bottom: 40px;
            left: 40px;
            right: 40px;
            width: calc(100% - 80px);
        }
        .footer-grid td { vertical-align: bottom; }
        .footer-left { width: 50%; font-size: 9px; color: #64748b; }
        .footer-right { width: 50%; text-align: right; font-size: 11px; }
        
        .qr-placeholder {
            width: 80px;
            height: 80px;
            float: left;
            margin-right: 15px;
        }
        .qr-placeholder img {
            width: 100%;
            height: 100%;
        }
        .footer-text-block {
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="border-container">
        <div class="header">
            <table class="header-table">
                <tr>
                    <td class="header-left">
                        ENCG <span>FÈS</span><br>
                        <div class="header-left-sub">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</div>
                    </td>
                    <td class="header-right">
                        Année Académique: <strong>{{ $year }}</strong><br>
                        Date d'édition: <strong>{{ now()->format('d/m/Y') }}</strong>
                    </td>
                </tr>
            </table>
        </div>

        <div class="doc-title">
            Attestation de Réussite
        </div>

        <div class="text-content">
            Le Directeur de l'École Nationale de Commerce et de Gestion de Fès atteste que l'étudiant(e) :<br><br>
            <div style="text-align: center; margin: 20px 0;">
                <strong>{{ strtoupper($student->last_name) }} {{ $student->first_name }}</strong><br>
                <span style="font-size: 14px; color: #64748b;">N° Matricule: {{ $student->student_number ?? 'N/A' }} | CNE: {{ $student->cne ?? 'N/A' }}</span>
            </div>
            inscrit(e) en filière <strong>{{ $student->latestPathway ? $student->latestPathway->filiere->name : 'Non affecté' }}</strong> a validé son année universitaire <strong>{{ $year }}</strong> avec succès.<br><br>
            Fait pour valoir et servir ce que de droit.
        </div>

        <table class="footer-grid">
            <tr>
                <td class="footer-left">
                    <div class="qr-placeholder">
                        @php
                            $verifyUrl = isset($verifyUrl) ? $verifyUrl : url('/verify/document/' . ($student->student_number ?? '000'));
                            $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verifyUrl);
                        @endphp
                        <img src="{{ $qrUrl }}" alt="QR Code">
                    </div>
                    <div class="footer-text-block">
                        <strong style="color:#002e5b; font-size: 11px;">Document numérique officiel</strong><br>
                        Généré par le portail universitaire de l'ENCG.<br>
                        Scannez le code QR ci-dessus pour vérifier l'authenticité de cette<br>
                        attestation en ligne.
                    </div>
                </td>
                <td class="footer-right">
                    Fait à Fès, le {{ now()->format('d/m/Y') }}<br><br>
                    <strong>LE DIRECTEUR DE L'ENCG FÈS</strong><br><br>
                    <div style="font-size:8px; color:#cbd5e1; border: 1px dashed #cbd5e1; padding: 5px; display:inline-block; margin-top:30px;">
                        Signé numériquement<br>par la Direction
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
