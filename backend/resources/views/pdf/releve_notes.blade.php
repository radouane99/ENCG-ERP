<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Relevé de Notes</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 13px; line-height: 1.4; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 10px; margin-bottom: 20px; }
        h1 { color: #1a365d; font-size: 22px; text-transform: uppercase; margin: 0; }
        h2 { font-size: 16px; color: #4a5568; margin-top: 5px; }
        .student-info { display: table; width: 100%; margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
        .info-col { display: table-cell; width: 50%; }
        .grades-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .grades-table th, .grades-table td { border: 1px solid #000; padding: 8px; text-align: center; }
        .grades-table th { background-color: #f1f5f9; font-weight: bold; }
        .module-name { text-align: left !important; font-weight: bold; }
        .footer { margin-top: 50px; font-size: 12px; }
        .signature-box { float: right; width: 250px; text-align: center; margin-top: 30px; }
        .qr-code { float: left; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relevé de Notes</h1>
        <h2>Année Universitaire : {{ $year }}</h2>
    </div>

    <div class="student-info">
        <div class="info-col">
            <p><strong>Nom et Prénom :</strong> {{ $student->first_name ?? '' }} {{ $student->last_name ?? '' }}</p>
            <p><strong>Code Apogée :</strong> {{ $student->apogee_code ?? 'N/A' }}</p>
            <p><strong>CNE / Massar :</strong> {{ $student->cne ?? 'N/A' }}</p>
        </div>
        <div class="info-col">
            <p><strong>Filière :</strong> {{ $student->filiere->name ?? 'N/A' }}</p>
            <p><strong>Semestre :</strong> S1 & S2</p>
        </div>
    </div>

    <table class="grades-table">
        <thead>
            <tr>
                <th>Code Module</th>
                <th>Intitulé du Module</th>
                <th>Note (/20)</th>
                <th>Résultat</th>
            </tr>
        </thead>
        <tbody>
            @foreach($grades as $grade)
            <tr>
                <td>{{ $grade->module->code ?? 'N/A' }}</td>
                <td class="module-name">{{ $grade->module->name ?? 'N/A' }}</td>
                <td>{{ number_format($grade->value, 2) }}</td>
                <td>
                    @if($grade->value >= 12)
                        <strong>V</strong> (Validé)
                    @elseif($grade->value >= 10)
                        <strong>V.C</strong> (Validé par compensation)
                    @else
                        <strong>N.V</strong> (Non Validé)
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="qr-code">
        <!-- Placeholder pour QR -->
        <p>Token de vérification : {{ $qrCodeToken }}</p>
        <p><small>Scannez le code QR pour vérifier l'authenticité de ce document.</small></p>
    </div>

    <div class="signature-box">
        <p><strong>Le Directeur</strong></p>
        <p><br><br>Fait à Tanger, le {{ $date }}</p>
    </div>

    <div style="clear: both;"></div>

    <div class="footer" style="text-align: center; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 30px;">
        École Nationale de Commerce et de Gestion - Route de l'Aéroport, Tanger
    </div>
</body>
</html>
