<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Contrat de Vacation</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; line-height: 1.5; color: #333; }
        .header { width: 100%; border-bottom: 2px solid #004488; padding-bottom: 15px; margin-bottom: 30px; }
        .logo-container { width: 60%; float: left; }
        .logo { max-height: 80px; }
        .qr-container { width: 40%; float: right; text-align: right; }
        .title { text-align: center; font-size: 22px; font-weight: bold; color: #004488; margin-top: 50px; text-transform: uppercase; }
        .section { margin-top: 30px; }
        .section-title { font-size: 16px; font-weight: bold; color: #004488; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 8px; vertical-align: top; }
        .info-table td.label { font-weight: bold; width: 35%; color: #555; }
        .signatures { margin-top: 60px; width: 100%; }
        .signature-box { width: 45%; float: left; text-align: center; }
        .signature-box.right { float: right; }
        .footer { position: fixed; bottom: -20px; left: 0px; right: 0px; height: 40px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
        .clearfix::after { content: ""; clear: both; display: table; }
    </style>
</head>
<body>
    <div class="header clearfix">
        <div class="logo-container">
            <h2>ENCG - ERP</h2>
            <p style="font-size: 12px; color: #666; margin: 0;">École Nationale de Commerce et de Gestion</p>
        </div>
        <div class="qr-container">
            <img src="data:image/svg+xml;base64,{{ $qrCode }}" alt="QR Code" width="80" height="80" />
            <div style="font-size: 10px; color: #666; margin-top: 5px;">Vérification Numérique</div>
        </div>
    </div>

    <div class="title">Contrat de Vacation</div>

    <div class="section">
        <div class="section-title">Entre les soussignés :</div>
        <p>L'École Nationale de Commerce et de Gestion (ENCG), représentée par son Directeur, d'une part,</p>
        <p>Et</p>
        <table class="info-table">
            <tr><td class="label">M./Mme :</td><td>{{ $professor->first_name }} {{ $professor->last_name }}</td></tr>
            <tr><td class="label">Qualification :</td><td>{{ $professor->specialty ?? 'Non spécifié' }}</td></tr>
            <tr><td class="label">Département :</td><td>{{ $professor->department->name ?? 'Non spécifié' }}</td></tr>
            <tr><td class="label">Téléphone :</td><td>{{ $professor->phone ?? 'Non spécifié' }}</td></tr>
            <tr><td class="label">Email :</td><td>{{ $professor->email }}</td></tr>
        </table>
        <p>Il a été convenu et arrêté ce qui suit :</p>
    </div>

    <div class="section">
        <div class="section-title">Article 1 : Objet du contrat</div>
        <p>Le vacataire s'engage à assurer les enseignements suivants pour le compte de l'ENCG :</p>
        <table class="info-table">
            <tr><td class="label">Module :</td><td>{{ $contract->module ? $contract->module->code . ' - ' . $contract->module->name : 'Non spécifié' }}</td></tr>
            <tr><td class="label">Volume horaire convenu :</td><td>{{ $contract->agreed_hours }} heures</td></tr>
            <tr><td class="label">Période :</td><td>Du {{ \Carbon\Carbon::parse($contract->contract_start)->format('d/m/Y') }} au {{ \Carbon\Carbon::parse($contract->contract_end)->format('d/m/Y') }}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Article 2 : Rémunération</div>
        <p>La rémunération brute est fixée à <strong>{{ number_format($contract->hourly_rate, 2, ',', ' ') }} MAD</strong> par heure de vacation assurée. Le règlement s'effectuera après attestation de service fait.</p>
    </div>

    <div class="section">
        <div class="section-title">Article 3 : Résiliation</div>
        <p>Le présent contrat peut être résilié par l'une ou l'autre des parties moyennant un préavis raisonnable.</p>
    </div>

    <div class="signatures clearfix">
        <div class="signature-box">
            <p><strong>Le Vacataire</strong></p>
            <p style="font-size: 12px; margin-top: 5px;">(Lu et approuvé)</p>
            <div style="height: 80px; border-bottom: 1px dotted #ccc; margin: 10px 20px;"></div>
        </div>
        <div class="signature-box right">
            <p><strong>L'Administration</strong></p>
            <p style="font-size: 12px; margin-top: 5px;">Fait le {{ $date }}</p>
            <div style="height: 80px; border-bottom: 1px dotted #ccc; margin: 10px 20px;"></div>
        </div>
    </div>

    <div class="footer">
        Document généré électroniquement par ENCG ERP - Réf: {{ $contract->id }} - {{ $professor->employee_number }}
    </div>
</body>
</html>
