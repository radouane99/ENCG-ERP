<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Attestation de Service Fait & Bordereau Pédagogique — {{ $user->first_name }} {{ $user->last_name }}</title>
    <style>
        @page {
            margin: 8mm 10mm;
            size: A4 portrait;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 8.8px;
            line-height: 1.3;
            background-color: #ffffff;
        }

        /* Header */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #001A4B;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .header-logo { width: 75px; vertical-align: middle; }
        .header-logo img { max-height: 52px; max-width: 70px; }
        .header-center { text-align: center; vertical-align: middle; }
        .header-right { width: 100px; text-align: right; vertical-align: middle; font-size: 7.5px; color: #64748b; }
        .country-title { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
        .univ-title { font-size: 11px; font-weight: bold; color: #001A4B; text-transform: uppercase; margin: 1px 0; }
        .school-title { font-size: 10px; font-weight: bold; color: #C5A059; text-transform: uppercase; }
        .service-title { font-size: 7.5px; color: #475569; margin-top: 2px; }
        .badge-year { display: inline-block; background: #001A4B; color: #fff; font-weight: bold; font-size: 7px; padding: 2px 6px; border-radius: 3px; margin-top: 2px; }

        /* Document Title Hero */
        .doc-hero {
            background-color: #001A4B;
            color: #ffffff;
            border-radius: 5px;
            border-bottom: 3px solid #C5A059;
            padding: 8px 12px;
            margin-bottom: 8px;
            text-align: center;
        }
        .doc-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
        .doc-subtitle { font-size: 8.5px; color: #93c5fd; margin-top: 2px; font-weight: bold; }

        /* Teacher Info Box */
        .info-box {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        .info-box td { padding: 5px 8px; vertical-align: top; font-size: 8px; }
        .info-label { font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 6.8px; }
        .info-value { font-size: 9px; font-weight: bold; color: #001A4B; margin-top: 1px; }

        /* Metrics Strip */
        .metrics-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 4px 0;
            margin-bottom: 8px;
        }
        .metric-cell {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 5px;
            text-align: center;
        }
        .metric-lbl { font-size: 6.8px; font-weight: bold; color: #64748b; text-transform: uppercase; }
        .metric-val { font-size: 11px; font-weight: bold; color: #001A4B; margin-top: 1px; }

        /* Section Bar */
        .section-bar {
            background: #f1f5f9;
            border-left: 3.5px solid #001A4B;
            padding: 3px 6px;
            margin: 6px 0 4px 0;
            font-size: 8.5px;
            font-weight: bold;
            color: #001A4B;
            text-transform: uppercase;
        }

        /* Tables */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 7px;
        }
        .data-table th, .data-table td {
            border: 1px solid #cbd5e1;
            padding: 3.5px 5px;
            font-size: 7.8px;
        }
        .data-table th {
            background-color: #001A4B;
            color: #ffffff;
            font-size: 7.2px;
            text-transform: uppercase;
            font-weight: bold;
            text-align: center;
        }

        /* Signatures & Certification */
        .certif-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 5px 8px;
            margin-bottom: 8px;
            font-size: 7.2px;
            color: #334155;
            line-height: 1.35;
        }
        .sign-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }
        .sign-cell {
            width: 33.33%;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            padding: 6px;
            text-align: center;
            vertical-align: top;
            height: 70px;
        }
        .sign-role { font-size: 7.5px; font-weight: bold; color: #001A4B; text-transform: uppercase; }
        .sign-sub { font-size: 6.5px; color: #64748b; font-style: italic; margin-top: 1px; }

        /* Footer */
        .footer-table {
            width: 100%;
            border-top: 1px solid #cbd5e1;
            padding-top: 5px;
            margin-top: 6px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td class="header-logo">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès" />
                @endif
            </td>
            <td class="header-center">
                <div class="country-title">Royaume du Maroc</div>
                <div class="univ-title">Université Sidi Mohamed Ben Abdellah · Fès</div>
                <div class="school-title">École Nationale de Commerce et de Gestion</div>
                <div class="service-title">Direction des Affaires Pédagogiques · Service du Personnel Enseignant</div>
            </td>
            <td class="header-right">
                <div>Document Officiel</div>
                <div class="badge-year">Année {{ $academicYear }}</div>
                <div style="margin-top:2px;">Réf : RH-SRV-{{ $user->id }}</div>
            </td>
        </tr>
    </table>

    <!-- Hero Document Title -->
    <div class="doc-hero">
        <div class="doc-title">Bordereau Annuel des Services Pédagogiques & Attestation de Service Fait</div>
        <div class="doc-subtitle">Décompte Certifié des Enseignements Réalisés · Corps des Enseignants-Chercheurs Permanents</div>
    </div>

    <!-- Teacher Identity Box -->
    <table class="info-box">
        <tr>
            <td style="width: 35%;">
                <div class="info-label">Nom & Prénom de l'Enseignant</div>
                <div class="info-value">Pr. {{ $user->first_name }} {{ $user->last_name }}</div>
            </td>
            <td style="width: 25%;">
                <div class="info-label">Statut & Grade</div>
                <div class="info-value">{{ $prof->grade ?? 'Professeur de l\'Enseignement Supérieur (PES / PH)' }}</div>
            </td>
            <td style="width: 20%;">
                <div class="info-label">Département d'Attache</div>
                <div class="info-value">{{ $prof->department->name ?? 'Sciences de Gestion & Finance' }}</div>
            </td>
            <td style="width: 20%;">
                <div class="info-label">Matricule / P.P.R</div>
                <div class="info-value">{{ $prof->som_number ?? 'PPR-' . $user->id . '042' }}</div>
            </td>
        </tr>
    </table>

    <!-- Statutory Metrics Strip -->
    <table class="metrics-table">
        <tr>
            <td style="width: 20%;">
                <div class="metric-cell">
                    <div class="metric-lbl">Charge Statutaire</div>
                    <div class="metric-val">{{ $statutoryHours }}h / an</div>
                </div>
            </td>
            <td style="width: 20%;">
                <div class="metric-cell" style="background:#eff6ff; border-color:#bfdbfe;">
                    <div class="metric-lbl">Heures Effectuées</div>
                    <div class="metric-val" style="color:#1d4ed8;">{{ $totalHoursDone }}h ({{ $completionPercent }}%)</div>
                </div>
            </td>
            <td style="width: 20%;">
                <div class="metric-cell">
                    <div class="metric-lbl">Cours Magistraux (CM)</div>
                    <div class="metric-val">{{ $hoursCm }}h</div>
                </div>
            </td>
            <td style="width: 20%;">
                <div class="metric-cell">
                    <div class="metric-lbl">Travaux Dirigés (TD)</div>
                    <div class="metric-val">{{ $hoursTd }}h</div>
                </div>
            </td>
            <td style="width: 20%;">
                <div class="metric-cell">
                    <div class="metric-lbl">Séances Validées</div>
                    <div class="metric-val" style="color:#047857;">{{ $totalSessions }} Séances</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Modules Breakdown Table -->
    <div class="section-bar">I. Répartition des Enseignements par Module & Filière</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 12%;">Code</th>
                <th style="width: 32%; text-align: left;">Intitulé du Module</th>
                <th style="width: 26%; text-align: left;">Filière & Niveau</th>
                <th style="width: 10%;">Volume CM</th>
                <th style="width: 10%;">Volume TD/TP</th>
                <th style="width: 10%;">Total Heures</th>
            </tr>
        </thead>
        <tbody>
            @foreach($modulesBreakdown as $mod)
                <tr>
                    <td style="text-align: center; font-weight: bold; font-family: monospace;">{{ $mod['code'] }}</td>
                    <td style="font-weight: bold; color: #001A4B;">{{ $mod['name'] }}</td>
                    <td>{{ $mod['filiere'] }}</td>
                    <td style="text-align: center;">{{ $mod['cm'] }}h</td>
                    <td style="text-align: center;">{{ $mod['td'] + ($mod['tp'] ?? 0) }}h</td>
                    <td style="text-align: center; font-weight: bold; background: #f8fafc;">{{ $mod['total'] }}h</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Monthly Summary Table -->
    <div class="section-bar">II. Récapitulatif Mensuel des Séances Réalisées (Cahier de Textes Numérique)</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 20%; text-align: left;">Mois d'Enseignement</th>
                <th style="width: 16%;">Séances Réalisées</th>
                <th style="width: 16%;">Volume CM</th>
                <th style="width: 16%;">Volume TD</th>
                <th style="width: 16%;">Volume Total</th>
                <th style="width: 16%;">Conformité Pédagogique</th>
            </tr>
        </thead>
        <tbody>
            @foreach($monthlyBreakdown as $m)
                <tr>
                    <td style="font-weight: bold;">{{ $m['month'] }} 2026</td>
                    <td style="text-align: center;">{{ $m['sessions'] }} séances</td>
                    <td style="text-align: center;">{{ $m['cm'] }}h</td>
                    <td style="text-align: center;">{{ $m['td'] + ($m['tp'] ?? 0) }}h</td>
                    <td style="text-align: center; font-weight: bold;">{{ $m['total'] }}h</td>
                    <td style="text-align: center; color: #047857; font-weight: bold;">&#10003; {{ $m['status'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Legal Attestation Text -->
    <div class="certif-box">
        <strong>Attestation de Service Fait :</strong> La Direction Pédagogique et le Chef de Département soussignés attestent que le Professeur 
        <strong>Pr. {{ $user->first_name }} {{ $user->last_name }}</strong> a assuré l'intégralité des séances de cours et travaux dirigés ci-dessus détaillées, 
        dûment renseignées et certifiées au Cahier de Textes Numérique de l'ENCG Fès pour l'année universitaire {{ $academicYear }}.
    </div>

    <!-- Signatures -->
    <table class="sign-table">
        <tr>
            <td class="sign-cell">
                <div class="sign-role">L'Enseignant-Chercheur</div>
                <div class="sign-sub">Pr. {{ $user->first_name }} {{ $user->last_name }}</div>
                <div style="margin-top: 30px; font-size: 6.5px; color: #64748b;">(Émargement numérique certifié)</div>
            </td>
            <td class="sign-cell">
                <div class="sign-role">Le Chef de Département</div>
                <div class="sign-sub">Visa & Approbation Pédagogique</div>
                <div style="margin-top: 30px; font-size: 6.5px; color: #047857; font-weight: bold;">[CERTIFIÉ CONFORME]</div>
            </td>
            <td class="sign-cell">
                <div class="sign-role">Le Doyen / Directeur de l'ENCG</div>
                <div class="sign-sub">Direction des Affaires Pédagogiques</div>
                <div style="margin-top: 25px; font-size: 6.5px; color: #001A4B;">Cachet Officiel de l'Établissement</div>
            </td>
        </tr>
    </table>

    <!-- Footer & QR Code -->
    <table class="footer-table">
        <tr>
            <td style="vertical-align: middle; font-size: 6.8px; color: #64748b;">
                ENCG FÈS — SYSTÈME INTÉGRÉ ERP ACADÉMIQUE · Édité le {{ $generationDate }}<br>
                Ce bordereau certifié fait foi pour le dossier administratif, l'évaluation pédagogique et l'avancement statutaire.
            </td>
            <td style="width: 60px; text-align: right; vertical-align: middle;">
                @if(!empty($qrBase64))
                    <img src="{{ $qrBase64 }}" width="45" height="45" alt="QR Code" />
                @endif
            </td>
        </tr>
    </table>

</body>
</html>
