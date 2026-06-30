<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Convocation aux Examens</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 14px; line-height: 1.5; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { max-width: 150px; }
        h1 { color: #1a365d; font-size: 24px; text-transform: uppercase; }
        .student-info { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; background: #f9fafb; }
        .exam-details { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .exam-details th, .exam-details td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .exam-details th { background-color: #1a365d; color: white; }
        .footer { position: absolute; bottom: 30px; width: 100%; text-align: center; font-size: 12px; color: #666; }
        .qr-code { text-align: right; margin-top: -80px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Convocation aux Examens</h1>
        <p>École Nationale de Commerce et de Gestion</p>
    </div>

    <div class="student-info">
        <h3>Informations de l'étudiant</h3>
        <p><strong>Nom et Prénom :</strong> {{ $student->first_name ?? 'Étudiant' }} {{ $student->last_name ?? '' }}</p>
        <p><strong>Code Apogée :</strong> {{ $student->apogee_code ?? 'N/A' }}</p>
        <p><strong>Filière :</strong> {{ $student->filiere->name ?? 'N/A' }}</p>
    </div>

    <div class="qr-code">
        <!-- In a real scenario we'd use a QR generation library, e.g. simple-qrcode -->
        <p><i>[QR CODE: {{ $qrCodeToken }}]</i></p>
    </div>

    <h3>Détails de la session</h3>
    <table class="exam-details">
        <thead>
            <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>Module</th>
                <th>Salle (N° de Place)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ \Carbon\Carbon::parse($session->date)->format('d/m/Y') }}</td>
                <td>{{ \Carbon\Carbon::parse($session->start_time)->format('H:i') }} - {{ \Carbon\Carbon::parse($session->end_time)->format('H:i') }}</td>
                <td>{{ $session->exam->module->name ?? 'Module N/A' }}</td>
                <td>Salle N/A (Place N/A)</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 50px;">
        <p><strong>Important :</strong></p>
        <ul>
            <li>La présentation de la carte d'étudiant est obligatoire.</li>
            <li>Aucun retard ne sera toléré après la distribution des sujets.</li>
            <li>Les téléphones portables et montres connectées sont strictement interdits.</li>
        </ul>
    </div>

    <div class="footer">
        Document généré électroniquement par ENCG ERP - Date : {{ now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
