<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Bordereau de Vacation & Décompte pour Paiement — {{ $user->first_name }} {{ $user->last_name }}</title>
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
        .header-right { width: 110px; text-align: right; vertical-align: middle; font-size: 7.5px; color: #64748b; }
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
        .doc-subtitle { font-size: 8.5px; color: #fde68a; margin-top: 2px; font-weight: bold; }

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

        /* Financial Metrics Strip */
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
            padding: 4px 5px;
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

        /* Financial Box */
        .financial-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 4px;
            padding: 6px 10px;
            margin-bottom: 8px;
            font-size: 8px;
            color: #166534;
        }

        /* Signatures */
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
                <div class="service-title">Service Financier & Comptabilité · Décompte des Vacataires</div>
            </td>
            <td class="header-right">
                <div>Document Financier Officiel</div>
                <div class="badge-year">Année {{ $academicYear }}</div>
                <div style="margin-top:2px;">Réf : {{ $contractRef }}</div>
            </td>
        </tr>
    </table>

    <!-- Hero Document Title -->
    <div class="doc-hero">
        <div class="doc-title">Bordereau Officiel de Vacation & Décompte pour Paiement</div>
        <div class="doc-subtitle">État Liquidatif des Heures d'Enseignement Réalisées · Enseignants Vacataires</div>
    </div>

    <!-- Teacher Identity Box -->
    <table class="info-box">
        <tr>
            <td style="width: 32%;">
                <div class="info-label">Nom & Prénom du Vacataire</div>
                <div class="info-value">Pr. {{ $user->first_name }} {{ $user->last_name }}</div>
            </td>
            <td style="width: 25%;">
                <div class="info-label">Statut Administratif</div>
                <div class="info-value">Enseignant Vacataire Contractuel</div>
            </td>
            <td style="width: 23%;">
                <div class="info-label">Contrat de Vacation N°</div>
                <div class="info-value" style="font-family: monospace;">{{ $contractRef }}</div>
            </td>
            <td style="width: 20%;">
                <div class="info-label">Identifiant Fiscal / CIN</div>
                <div class="info-value">{{ $user->cin ?? 'CD124578' }}</div>
            </td>
        </tr>
    </table>

    <!-- Financial Metrics Strip -->
    <table class="metrics-table">
        <tr>
            <td style="width: 25%;">
                <div class="metric-cell">
                    <div class="metric-lbl">Total Heures Réalisées</div>
                    <div class="metric-val">{{ $totalHours }} Heures</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="metric-cell">
                    <div class="metric-lbl">Taux Réglementaire Horaire</div>
                    <div class="metric-val">{{ $hourlyRate }} MAD / h</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="metric-cell" style="background:#f0fdf4; border-color:#bbf7d0;">
                    <div class="metric-lbl">Montant Brut Prévisionnel</div>
                    <div class="metric-val" style="color:#15803d;">{{ number_format($totalAmount, 2) }} MAD</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="metric-cell">
                    <div class="metric-lbl">Situation Ordonnancement</div>
                    <div class="metric-val" style="color:#0284c7; font-size:9.5px;">Validé Trésorerie</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Monthly Breakdown Table -->
    <div class="section-bar">I. Décompte Mensuel des Heures de Vacation Assurées</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 25%; text-align: left;">Période d'Enseignement</th>
                <th style="width: 15%;">Volume CM</th>
                <th style="width: 15%;">Volume TD</th>
                <th style="width: 15%;">Total Heures</th>
                <th style="width: 15%;">Taux Horaire</th>
                <th style="width: 15%;">Montant Brut (MAD)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($monthlyBreakdown as $m)
                <tr>
                    <td style="font-weight: bold;">{{ $m['month'] }} 2026</td>
                    <td style="text-align: center;">{{ $m['cm'] }}h</td>
                    <td style="text-align: center;">{{ $m['td'] }}h</td>
                    <td style="text-align: center; font-weight: bold;">{{ $m['total'] }}h</td>
                    <td style="text-align: center;">{{ $hourlyRate }} MAD</td>
                    <td style="text-align: right; font-weight: bold; color: #15803d;">{{ number_format($m['amount'], 2) }} MAD</td>
                </tr>
            @endforeach
            <tr style="background-color: #f8fafc; font-weight: bold;">
                <td colspan="3" style="text-align: right; text-transform: uppercase;">TOTAL GÉNÉRAL À ORDONNANCER :</td>
                <td style="text-align: center;">{{ $totalHours }}h</td>
                <td style="text-align: center;">—</td>
                <td style="text-align: right; color: #15803d; font-size: 9px;">{{ number_format($totalAmount, 2) }} MAD</td>
            </tr>
        </tbody>
    </table>

    <!-- Bank Details & Payment Notice -->
    <div class="financial-box">
        <strong>Références de Paiement Bancaire :</strong> RIB / Compte : <strong>{{ $user->rib ?? '011 780 0000 123456789012 34' }}</strong> (Banque Populaire / BMCE Fès).<br>
        Le paiement est ordonnancé sur les crédits de fonctionnement ouverts au titre de l'exercice budgétaire 2026 pour le compte des vacations d'enseignement supérieur.
    </div>

    <!-- Signatures -->
    <table class="sign-table">
        <tr>
            <td class="sign-cell">
                <div class="sign-role">L'Enseignant Vacataire</div>
                <div class="sign-sub">Pr. {{ $user->first_name }} {{ $user->last_name }}</div>
                <div style="margin-top: 30px; font-size: 6.5px; color: #64748b;">(Émargement certifié)</div>
            </td>
            <td class="sign-cell">
                <div class="sign-role">Le Chef de Département</div>
                <div class="sign-sub">Visa du Service Fait</div>
                <div style="margin-top: 30px; font-size: 6.5px; color: #047857; font-weight: bold;">[SERVICE FAIT CERTIFIÉ]</div>
            </td>
            <td class="sign-cell">
                <div class="sign-role">Service Financier & Trésorerie</div>
                <div class="sign-sub">Bon à Payer & Liquidation</div>
                <div style="margin-top: 25px; font-size: 6.5px; color: #001A4B;">Visa Ordonnateur</div>
            </td>
        </tr>
    </table>

    <!-- Footer & QR Code -->
    <table class="footer-table">
        <tr>
            <td style="vertical-align: middle; font-size: 6.8px; color: #64748b;">
                ENCG FÈS — SERVICE COMPTABILITÉ & FINANCES · Édité le {{ $generationDate }}<br>
                Bordereau officiel liquidatif pour virement bancaire par la Trésorerie Préfectorale de Fès.
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
