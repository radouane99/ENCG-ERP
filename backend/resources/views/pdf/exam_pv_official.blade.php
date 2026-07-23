<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Procès-Verbal Officiel d'Examen — ENCG Fès</title>
    <style>
        @page {
            margin: 15mm;
            size: A4 portrait;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.5;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        .subtitle {
            text-align: center;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 20px;
        }
        .info-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
        }
        .info-grid {
            width: 100%;
        }
        .info-grid td {
            padding: 4px 8px;
        }
        .label {
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            font-size: 10px;
        }
        .val {
            font-size: 12px;
            font-weight: bold;
            color: #0f2863;
        }
        .stats-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .stats-table td {
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: center;
        }
        .stat-num {
            font-size: 20px;
            font-weight: bold;
            color: #0f2863;
        }
        .signature-box {
            margin-top: 30px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 15px;
            background-color: #ffffff;
        }
        .sig-title {
            font-weight: bold;
            color: #0f2863;
            font-size: 12px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .signature-img {
            max-height: 80px;
            max-width: 250px;
            border: 1px dashed #94a3b8;
            padding: 5px;
            border-radius: 4px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 20%;">
                <img src="{{ public_path('logo-encg.png') }}" style="max-height: 55px;" alt="ENCG Fès">
            </td>
            <td style="width: 80%; text-align: center;">
                <div style="font-size: 14px; font-weight: bold; color: #0f2863;">ROYAUME DU MAROC</div>
                <div style="font-size: 12px; color: #475569;">Université Sidi Mohamed Ben Abdellah — ENCG Fès</div>
                <div style="font-size: 10px; color: #64748b;">Service des Examens & de la Scolarité</div>
            </td>
        </tr>
    </table>

    <div class="title">PROCÈS-VERBAL OFFICIEL D'EXAMEN</div>
    <div class="subtitle">Procès-Verbal de Déroulement & Émargement Numérique</div>

    <div class="info-box">
        <table class="info-grid">
            <tr>
                <td style="width: 50%;">
                    <div class="label">Module d'Examen</div>
                    <div class="val">{{ $exam->module->name ?? 'Module' }}</div>
                </td>
                <td style="width: 50%;">
                    <div class="label">Local / Salle</div>
                    <div class="val">{{ $room->name ?? 'Salle d\'Examen' }}</div>
                </td>
            </tr>
            <tr>
                <td style="padding-top: 8px;">
                    <div class="label">Filière / Spécialité</div>
                    <div class="val">{{ $exam->module->filiere->name ?? 'Tronc Commun' }}</div>
                </td>
                <td style="padding-top: 8px;">
                    <div class="label">Date & Horaire</div>
                    <div class="val">{{ $exam->exam_date }} ({{ $exam->start_time ?? '09:00' }})</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="stats-table">
        <tr>
            <td style="width: 33%; bg-color: #f1f5f9;">
                <div class="label">Inscrits Convroqués</div>
                <div class="stat-num">{{ $totalCount }}</div>
            </td>
            <td style="width: 33%; bg-color: #ecfdf5;">
                <div class="label" style="color: #047857;">Présents Émargés</div>
                <div class="stat-num" style="color: #047857;">{{ $presentCount }}</div>
            </td>
            <td style="width: 33%; bg-color: #fef2f2;">
                <div class="label" style="color: #b91c1c;">Absents Signelés</div>
                <div class="stat-num" style="color: #b91c1c;">{{ $absentCount }}</div>
            </td>
        </tr>
    </table>

    @if(!empty($notes))
        <div style="margin-bottom: 20px; padding: 10px; background-color: #fffbebfb; border: 1px solid #fde68a; border-radius: 8px;">
            <div class="label" style="color: #b45309;">Remarques / Incidents de séance :</div>
            <div style="font-size: 11px; color: #78350f; margin-top: 4px;">{{ $notes }}</div>
        </div>
    @endif

    <div class="signature-box">
        <table style="width: 100%;">
            <tr>
                <td style="width: 50%; vertical-align: top;">
                    <div class="sig-title">Président / Surveillant Responsable</div>
                    <div style="font-weight: bold; font-size: 12px; margin-bottom: 8px; color: #1e293b;">
                        {{ $signedBy->name ?? 'Surveillant de Salle' }}
                    </div>
                    <div class="label" style="margin-bottom: 4px;">Horodatage de Validation :</div>
                    <div style="font-size: 10px; font-family: monospace; color: #64748b;">
                        {{ $signedAt }} (UTC+1)
                    </div>
                </td>
                <td style="width: 50%; text-align: right; vertical-align: top;">
                    <div class="sig-title" style="text-align: right;">Signature Tactile Certifiée</div>
                    @if($signatureData)
                        <img src="{{ $signatureData }}" class="signature-img" alt="Signature">
                    @else
                        <div style="font-style: italic; color: #94a3b8;">Signature Digitale Enregistrée</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">
        Document sécurisé généré par le Portail ENCG ERP Fès — Valide sans rature ni surcharge — {{ date('d/m/Y H:i') }}
    </div>

</body>
</html>
