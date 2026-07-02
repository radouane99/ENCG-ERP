<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Relevé de Notes</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 30px;
            color: #1e293b;
        }
        .header {
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 15px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-left {
            font-size: 26px;
            font-weight: 800;
            color: #002e5b;
            text-transform: uppercase;
        }
        .header-left span { color: #d4a373; }
        .header-left-sub { font-size: 10px; color: #555; margin-top: 5px; font-weight: 600; letter-spacing: 1.5px;}
        .header-right {
            text-align: right;
            font-size: 10px;
            color: #4a5568;
            line-height: 1.8;
        }
        
        .doc-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #0f2863;
            letter-spacing: 1px;
            margin: 20px 0 30px 0;
        }

        .student-info {
            width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background-color: #f8fafc;
            margin-bottom: 30px;
            font-size: 10px;
        }
        .student-info table { width: 100%; }
        .student-info td { padding: 4px; }
        .student-info .label { color: #64748b; font-weight: bold; width: 20%; }
        .student-info .val { font-weight: bold; color: #1e293b; }

        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9px;
            border: 1px solid #0f2863;
        }
        .grades-header {
            background-color: #0f2863;
            color: white;
        }
        .grades-header th {
            padding: 8px;
            text-align: left;
            font-size: 10px;
        }
        .grades-sub-header th {
            padding: 8px;
            background-color: #f1f5f9;
            color: #64748b;
            font-weight: bold;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .grades-table td {
            padding: 8px;
            border-bottom: 1px solid #f1f5f9;
        }
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .text-green { color: #059669; font-weight: bold; }
        .text-red { color: #dc2626; font-weight: bold; }

        .result-box {
            border: 2px solid #0f2863;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin-bottom: 40px;
        }
        .result-main {
            font-size: 12px;
            font-weight: bold;
            color: #0f2863;
            margin-bottom: 5px;
        }
        .result-main span {
            color: #059669;
        }
        .result-sub {
            font-size: 10px;
            color: #64748b;
        }
        .result-sub span {
            color: #059669;
            font-weight: bold;
        }

        .footer-grid {
            width: 100%;
            margin-top: 40px;
        }
        .footer-grid td { vertical-align: top; }
        .footer-left { width: 50%; font-size: 9px; color: #64748b; }
        .footer-right { width: 50%; text-align: right; font-size: 10px; }
        
        .qr-placeholder {
            width: 70px;
            height: 70px;
            float: left;
            margin-right: 15px;
        }
        .qr-placeholder img {
            width: 100%;
            height: 100%;
        }
        .footer-text-block {
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="header-left">
                    ENCG <span>FÈS</span><br>
                    <div class="header-left-sub">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</div>
                </td>
                <td class="header-right">
                    Année Académique: <strong>{{ $year }}</strong><br>
                    Session: <strong>Principale</strong><br>
                    Date d'édition: <strong>{{ now()->format('d/m/Y') }}</strong>
                </td>
            </tr>
        </table>
    </div>

    <div class="doc-title">
        RELEVÉ DE NOTES - SEMESTRE S1
    </div>

    <div class="student-info">
        <table>
            <tr>
                <td class="label">Nom & Prénom :</td>
                <td class="val">{{ strtoupper($student->last_name) }} {{ $student->first_name }}</td>
                <td class="label">N° Étudiant :</td>
                <td class="val">{{ $student->student_number ?? 'N/A' }} (CNE: {{ $student->cne ?? 'N/A' }})</td>
            </tr>
            <tr>
                <td class="label">Filière :</td>
                <td class="val">{{ $student->latestPathway ? $student->latestPathway->filiere->name : 'Non affecté' }}</td>
                <td class="label"></td>
                <td class="val"></td>
            </tr>
        </table>
    </div>

    <table class="grades-table">
        <tr class="grades-header">
            <th colspan="2">📝 Résultats</th>
            <th colspan="2" class="text-right">Moyenne: {{ number_format($avgGrade, 2) }} / 20</th>
        </tr>
        <tr class="grades-sub-header">
            <th>CODE MODULE</th>
            <th>INTITULÉ DU MODULE</th>
            <th class="text-center">NOTE / 20</th>
            <th class="text-center">RÉSULTAT</th>
        </tr>
        @forelse($modules as $module)
        <tr>
            <td>{{ $module['code'] }}</td>
            <td>{{ $module['name'] }}</td>
            <td class="text-center {{ $module['is_validated'] ? 'text-green' : 'text-red' }}">{{ number_format($module['score'], 2) }}</td>
            <td class="text-center {{ $module['is_validated'] ? 'text-green' : 'text-red' }}">{{ $module['is_validated'] ? 'Validé' : 'Rattrapage' }}</td>
        </tr>
        @empty
        <tr>
            <td colspan="4" class="text-center">Aucune note enregistrée pour ce semestre.</td>
        </tr>
        @endforelse
    </table>

    <div class="result-box">
        <div class="result-main">RÉSULTAT DU SEMESTRE : <span>MOYENNE GÉNÉRALE = {{ number_format($avgGrade, 2) }} / 20</span></div>
        <div class="result-sub">Décision du Jury : <span>{{ $avgGrade >= 10 ? 'ADMIS(E) AU NIVEAU SUPÉRIEUR' : 'NON ADMIS(E) / RATTRAPAGE' }}</span></div>
    </div>

    <table class="footer-grid">
        <tr>
            <td class="footer-left">
                <div class="qr-placeholder">
                    @php
                        $verifyUrl = url('/verify/document/' . ($student->student_number ?? '000'));
                        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=" . urlencode($verifyUrl);
                    @endphp
                    <img src="{{ $qrUrl }}" alt="QR Code">
                </div>
                <div class="footer-text-block">
                    <strong style="color:#0f2863; font-size: 10px;">Document numérique officiel</strong><br>
                    Généré par le portail universitaire de l'ENCG.<br>
                    Scannez le code QR ci-dessus pour vérifier l'authenticité de ce<br>
                    relevé de notes en ligne.
                </div>
            </td>
            <td class="footer-right">
                Fait à Fès, le {{ now()->format('d/m/Y') }}<br><br>
                <strong>LE DIRECTEUR DE L'ENCG FÈS</strong><br><br>
                <div style="font-size:7px; color:#cbd5e1; border: 1px dashed #cbd5e1; padding: 5px; display:inline-block; margin-top:20px;">
                    Signé numériquement<br>par la Direction
                </div>
            </td>
        </tr>
    </table>

    <div style="text-align: center; font-size: 7px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
        École Nationale de Commerce et de Gestion de Fès - Route d'Imouzzer, B.P. 1255, Fès, Maroc - Tél: +212 5 35 64 49 20 - www.encg-fes.ac.ma
    </div>
</body>
</html>
