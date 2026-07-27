<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Convocation au Conseil de Discipline - ENCG Fès</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10.5pt;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 8px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo-img {
            max-height: 65px;
            width: auto;
        }
        .header-title {
            text-align: center;
        }
        .header-title h1 {
            font-size: 11pt;
            font-weight: bold;
            color: #0f2863;
            margin: 0;
            text-transform: uppercase;
        }
        .header-title h2 {
            font-size: 12pt;
            font-weight: bold;
            color: #1e3a8a;
            margin: 2px 0 0 0;
        }
        .header-title p {
            font-size: 8.5pt;
            color: #64748b;
            margin: 1px 0 0 0;
        }
        .doc-title-box {
            background-color: #0f2863;
            color: #ffffff;
            text-align: center;
            padding: 8px;
            border-radius: 6px;
            margin-bottom: 18px;
        }
        .doc-title-box h3 {
            margin: 0;
            font-size: 13pt;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .ref-no {
            font-size: 8.5pt;
            color: #e2e8f0;
            margin-top: 3px;
        }
        .section-box {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
            background-color: #f8fafc;
        }
        .section-title {
            font-size: 10pt;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 8px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 4px 6px;
            font-size: 9.5pt;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            width: 32%;
        }
        .info-val {
            color: #0f172a;
            font-weight: bold;
        }
        .hearing-card {
            border: 2px solid #b91c1c;
            background-color: #fef2f2;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            text-align: center;
        }
        .hearing-card h4 {
            margin: 0 0 6px 0;
            color: #991b1b;
            font-size: 11pt;
            text-transform: uppercase;
        }
        .hearing-details {
            font-size: 11pt;
            font-weight: bold;
            color: #7f1d1d;
        }
        .body-text {
            font-size: 9.5pt;
            text-align: justify;
            margin-bottom: 15px;
        }
        .legal-notice {
            font-size: 8.5pt;
            color: #64748b;
            font-style: italic;
            border-left: 3px solid #0f2863;
            padding-left: 8px;
            margin-bottom: 20px;
        }
        .signatures-table {
            width: 100%;
            margin-top: 25px;
            border-collapse: collapse;
        }
        .signatures-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
        }
        .sign-title {
            font-weight: bold;
            font-size: 9.5pt;
            color: #0f2863;
            margin-bottom: 45px;
            text-transform: uppercase;
        }
        .seal-box {
            font-size: 7.5pt;
            font-family: monospace;
            color: #94a3b8;
            margin-top: 15px;
            text-align: center;
            border-top: 1px dashed #cbd5e1;
            padding-top: 6px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 25%;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo ENCG">
                @else
                    <strong style="color:#0f2863;">ENCG FÈS</strong>
                @endif
            </td>
            <td class="header-title" style="width: 50%;">
                <h1>Royaume du Maroc</h1>
                <p>Université Sidi Mohamed Ben Abdellah de Fès</p>
                <h2>École Nationale de Commerce et de Gestion</h2>
            </td>
            <td style="width: 25%; text-align: right;">
                @if(!empty($qrBase64))
                    <img src="{{ $qrBase64 }}" style="height: 55px; width: 55px;" alt="QR Code">
                @endif
            </td>
        </tr>
    </table>

    <!-- Title -->
    <div class="doc-title-box">
        <h3>Convocation Officielle au Conseil de Discipline</h3>
        <div class="ref-no">Dossier Disciplinaire N° CD-2026/{{ str_pad($incident->id ?? 1, 4, '0', STR_PAD_LEFT) }} — Session d'Examen</div>
    </div>

    <!-- Student Info -->
    <div class="section-box">
        <div class="section-title">Identité du Candidat Convoqué</div>
        <table class="info-table">
            <tr>
                <td class="info-label">Nom & Prénom :</td>
                <td class="info-val">{{ strtoupper($student->last_name ?? $user->name ?? '') }} {{ ucfirst($student->first_name ?? '') }}</td>
                <td class="info-label">Code Apogée / CNE :</td>
                <td class="info-val">{{ $student->cne ?? $student->student_number ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="info-label">Filière / Spécialité :</td>
                <td class="info-val">{{ $module->filiere->name ?? 'ENCG Grande École' }}</td>
                <td class="info-label">Année Académique :</td>
                <td class="info-val">2025 / 2026</td>
            </tr>
        </table>
    </div>

    <!-- Incident Info -->
    <div class="section-box" style="background-color: #fff font-size: 9pt;">
        <div class="section-title">Motif du Signalement (Incident d'Examen)</div>
        <table class="info-table">
            <tr>
                <td class="info-label">Module Concerné :</td>
                <td class="info-val">{{ $module->name ?? 'Examen Officiel' }} ({{ $module->code ?? 'MOD' }})</td>
            </tr>
            <tr>
                <td class="info-label">Nature de la Fraude :</td>
                <td class="info-val" style="color: #b91c1c;">{{ $incident->type === 'fraude' ? 'FRAUDE CONSTATÉE LORS DE L\'ÉPREUVE' : ucfirst($incident->type) }}</td>
            </tr>
            <tr>
                <td class="info-label">Description / Pièces :</td>
                <td class="info-val" style="font-weight: normal;">{{ $incident->description ?? 'Incident consigné au Procès-Verbal de Surveillance' }} {{ $incident->confiscated_items ? " (Saisie : {$incident->confiscated_items})" : '' }}</td>
            </tr>
        </table>
    </div>

    <!-- Hearing Appointment Box -->
    <div class="hearing-card">
        <h4>Date & Lieu de Comparution Obligatoire</h4>
        <div class="hearing-details">
            Date : {{ $incident->hearing_date ?? date('d/m/Y à 10h00') }}<br>
            Lieu : {{ $incident->hearing_room ?? 'Salle des Actes — Présidence ENCG Fès' }}
        </div>
    </div>

    <!-- Legal Text -->
    <div class="body-text">
        Vous êtes convoqué(e) à comparaître devant les membres du <strong>Conseil de Discipline de l'ENCG Fès</strong> afin d'être entendu(e) au sujet des faits qui vous sont reprochés. Vous avez la possibilité de présenter vos observations écrites ou orales et de consulter les pièces de votre dossier auprès du Secrétariat de la Direction.
    </div>

    <div class="legal-notice">
        NB : En application du Règlement Intérieur de l'ENCG Fès et des directives du MESRSFC, la non-comparution non justifiée ne fait pas obstacle au déroulement de la délibération disciplinaire et aux sanctions statutaires applicables.
    </div>

    <!-- Signatures -->
    <table class="signatures-table">
        <tr>
            <td>
                <div class="sign-title">Le Président du Conseil de Discipline</div>
                <div style="font-size: 8.5pt; color: #64748b;">(Signature et Cachet Officiel)</div>
            </td>
            <td>
                <div class="sign-title">Le Directeur de l'ENCG Fès</div>
                <div style="font-size: 8.5pt; color: #64748b;">(Signature et Empreinte Institutionnelle)</div>
            </td>
        </tr>
    </table>

    <!-- Cryptographic Seal -->
    <div class="seal-box">
        EMPREINTE CRYPTOGRAPHIQUE SHA-256 : {{ $sealHash ?? 'ENCG-DISCIPLINE-SEAL' }}<br>
        Document institutionnel officiel généré par le Système ERP ENCG Fès — {{ date('d/m/Y H:i:s') }}
    </div>

</body>
</html>
