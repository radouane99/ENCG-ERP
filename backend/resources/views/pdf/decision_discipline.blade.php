<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Décision Officielle du Conseil de Discipline - ENCG Fès</title>
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
            background-color: #b91c1c;
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
            color: #fecdd3;
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
        .sanction-card {
            border: 2px dashed #991b1b;
            background-color: #fef2f2;
            padding: 14px;
            border-radius: 8px;
            margin-bottom: 18px;
            text-align: center;
        }
        .sanction-card h4 {
            margin: 0 0 6px 0;
            color: #991b1b;
            font-size: 10pt;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .sanction-badge {
            display: inline-block;
            background-color: #991b1b;
            color: #ffffff;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 6px;
        }
        .sanction-desc {
            font-size: 9.5pt;
            color: #7f1d1d;
            font-weight: bold;
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
            border-left: 3px solid #b91c1c;
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
        <h3>Procès-Verbal de Décision Disciplinaire</h3>
        <div class="ref-no">Extrait Officiel N° DEC-2026/{{ str_pad($incident->id ?? 1, 4, '0', STR_PAD_LEFT) }} — Conseil de Discipline</div>
    </div>

    <!-- Student Info -->
    <div class="section-box">
        <div class="section-title">Identité du Candidat Sanctionné</div>
        <table class="info-table">
            <tr>
                <td class="info-label">Nom & Prénom :</td>
                <td class="info-val">{{ strtoupper($student->last_name ?? $user->name ?? '') }} {{ ucfirst($student->first_name ?? '') }}</td>
                <td class="info-label">Code Apogée / CNE :</td>
                <td class="info-val">{{ $student->cne ?? $student->student_number ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="info-label">Filière / Promotion :</td>
                <td class="info-val">{{ $module->filiere->name ?? 'ENCG Grande École' }}</td>
                <td class="info-label">Session Académique :</td>
                <td class="info-val">2025 / 2026</td>
            </tr>
        </table>
    </div>

    <!-- Sanction Pronounced Box -->
    <div class="sanction-card">
        <h4>Décision Définitive Prononcée par le Jury Disciplinaire</h4>
        <div class="sanction-badge">
            @if(($incident->sanction_scope ?? '') === 'semestre')
                SANCTION : INVALIDATION DU SEMESTRE (NOTE 00/20 À TOUS LES MODULES)
            @elseif(($incident->sanction_scope ?? '') === 'annee')
                SANCTION : EXCLUSION ANNUELLE (NOTE 00/20 ANNEE UNIVERSTAIRE)
            @else
                SANCTION : INVALIDATION DU MODULE CONCERNÉ (NOTE 00/20)
            @endif
        </div>
        <div class="sanction-desc">
            {{ $incident->decision ?? 'Attribution d\'office de la note 00/20 pour motif de Fraude aux Examens' }}
        </div>
    </div>

    <!-- Details -->
    <div class="section-box">
        <div class="section-title">Synthèse du Dossier & Motif</div>
        <p style="font-size: 9pt; margin: 0 0 6px 0;">
            <strong>Module Concerné :</strong> {{ $module->name ?? 'Examen Officiel' }} ({{ $module->code ?? 'MOD' }})<br>
            <strong>Consignation du PV :</strong> {{ $incident->description ?? 'Incident consigné au PV de surveillance d\'examen' }}<br>
            <strong>Observations du Jury :</strong> {{ $incident->hearing_notes ?? 'Réunion du Conseil de Discipline statuant conformément au statut des examens' }}
        </p>
    </div>

    <div class="legal-notice">
        Cette décision est exécutoire immédiatement. Elle est portée au dossier académique de l'étudiant(e) et transmise aux services de la scolarité et de la présidence de l'Université.
    </div>

    <!-- Signatures -->
    <table class="signatures-table">
        <tr>
            <td>
                <div class="sign-title">Le Président du Conseil de Discipline</div>
                <div style="font-size: 8.5pt; color: #64748b;">(Signature & Tampon Officiel)</div>
            </td>
            <td>
                <div class="sign-title">Le Directeur de l'ENCG Fès</div>
                <div style="font-size: 8.5pt; color: #64748b;">(Signature et Sceau Institutionnel)</div>
            </td>
        </tr>
    </table>

    <!-- Cryptographic Seal -->
    <div class="seal-box">
        SCEAU DE SÉCURITÉ DIGITALE SHA-256 : {{ $sealHash ?? 'ENCG-DECISION-SEAL' }}<br>
        Document juridique certifié généré par ENCG Fès ERP — {{ date('d/m/Y H:i:s') }}
    </div>

</body>
</html>
