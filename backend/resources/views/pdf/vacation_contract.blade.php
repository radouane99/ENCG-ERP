<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Contrat de Vacation — ENCG Fès</title>
    <style>
        @page {
            size: A4;
            margin: 10mm;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1e293b;
            background: #fff;
        }
        .page-border {
            border: 4px double #002e5b;
            padding: 18px 22px;
        }
        /* Official Kingdom Header */
        .official-header {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #002e5b;
            padding-bottom: 12px;
            margin-bottom: 18px;
        }
        .official-header td { vertical-align: middle; }
        .kingdom-text {
            font-size: 8.5px;
            font-weight: bold;
            color: #1e293b;
            line-height: 1.4;
            text-transform: uppercase;
        }
        .logo-cell { text-align: center; }
        .doc-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            color: #002e5b;
            margin: 16px 0 22px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 10px;
        }
        .section { margin-top: 22px; }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #002e5b;
            border-left: 4px solid #002e5b;
            padding-left: 8px;
            margin-bottom: 10px;
        }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
        .info-table td.label { font-weight: bold; width: 38%; color: #475569; font-size: 11px; }
        .info-table td.val { color: #0f172a; }
        .signatures-table { width: 100%; border-collapse: collapse; margin-top: 50px; }
        .signatures-table td { vertical-align: top; text-align: center; padding: 0 20px; }
        .sig-line {
            border-top: 1px dashed #94a3b8;
            margin-top: 55px;
            padding-top: 8px;
            font-size: 10px;
            color: #334155;
            font-weight: bold;
        }
        .footer {
            margin-top: 25px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
        }
        .qr-img { width: 75px; height: 75px; }
    </style>
</head>
<body>
<div class="page-border">
    {{-- Official Kingdom of Morocco Header --}}
    <table class="official-header">
        <tr>
            <td style="width: 35%; text-align: left;">
                <span class="kingdom-text">
                    ROYAUME DU MAROC<br>
                    Ministère de l'Enseignement Supérieur,<br>
                    de la Recherche Scientifique et de l'Innovation
                </span>
            </td>
            <td class="logo-cell" style="width: 30%;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG" style="height: 50px;">
                @else
                    <strong style="font-size: 14px; color: #002e5b;">ENCG FÈS</strong>
                @endif
            </td>
            <td style="width: 35%; text-align: right;">
                <span class="kingdom-text">
                    UNIVERSITÉ SIDI MOHAMED<br>
                    BEN ABDELLAH DE FÈS<br>
                    ENCG — École Nationale de Commerce<br>
                    et de Gestion
                </span>
            </td>
        </tr>
    </table>

    <div class="doc-title">Contrat de Vacation</div>

    <div class="section">
        <div class="section-title">Entre les soussignés :</div>
        <p>L'École Nationale de Commerce et de Gestion (ENCG) de Fès, représentée par son Directeur, d'une part,</p>
        <p style="margin: 8px 0;">Et</p>
        <table class="info-table">
            <tr><td class="label">M./Mme :</td><td class="val"><strong>{{ strtoupper($professor->last_name ?? '') }} {{ ucfirst($professor->first_name ?? '') }}</strong></td></tr>
            <tr><td class="label">CIN :</td><td class="val">{{ $professor->cin ?? 'Non spécifié' }}</td></tr>
            <tr><td class="label">Qualification :</td><td class="val">{{ $professor->specialty ?? 'Non spécifié' }}</td></tr>
            <tr><td class="label">Département :</td><td class="val">{{ $professor->department->name ?? 'Non spécifié' }}</td></tr>
            <tr><td class="label">Téléphone :</td><td class="val">{{ $professor->phone ?? 'Non spécifié' }}</td></tr>
            <tr><td class="label">Email :</td><td class="val">{{ $professor->email ?? 'Non spécifié' }}</td></tr>
        </table>
        <p style="margin-top: 12px;">Il a été convenu et arrêté ce qui suit :</p>
    </div>

    <div class="section">
        <div class="section-title">Article 1 : Objet du contrat</div>
        <p>Le vacataire s'engage à assurer les enseignements suivants pour le compte de l'ENCG :</p>
        <table class="info-table">
            <tr>
                <td class="label">Module :</td>
                <td class="val">{{ $contract->module ? ($contract->module->code . ' — ' . $contract->module->name) : 'Non spécifié' }}</td>
            </tr>
            <tr>
                <td class="label">Volume horaire convenu :</td>
                <td class="val"><strong>{{ $contract->agreed_hours ?? '—' }} heures</strong></td>
            </tr>
            <tr>
                <td class="label">Période :</td>
                <td class="val">
                    Du {{ $contract->contract_start ? \Carbon\Carbon::parse($contract->contract_start)->format('d/m/Y') : '—' }}
                    au {{ $contract->contract_end ? \Carbon\Carbon::parse($contract->contract_end)->format('d/m/Y') : '—' }}
                </td>
            </tr>
            <tr>
                <td class="label">Année universitaire :</td>
                <td class="val">{{ $contract->academicYear->name ?? date('Y') . '/' . (date('Y') + 1) }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Article 2 : Rémunération</div>
        <p>
            La rémunération brute est fixée à
            <strong style="color: #002e5b; font-size: 13px;">{{ number_format($contract->hourly_rate ?? 0, 2, ',', ' ') }} MAD</strong>
            par heure de vacation assurée.<br>
            Le règlement s'effectuera après attestation de service fait.
            @if(isset($contract->agreed_hours) && isset($contract->hourly_rate))
            <br><em style="color: #475569; font-size: 10px;">
                Montant total estimé : {{ number_format(($contract->agreed_hours * $contract->hourly_rate), 2, ',', ' ') }} MAD brut.
            </em>
            @endif
        </p>
    </div>

    <div class="section">
        <div class="section-title">Article 3 : Résiliation</div>
        <p>Le présent contrat peut être résilié par l'une ou l'autre des parties moyennant un préavis raisonnable.</p>
    </div>

    {{-- Signature area --}}
    <table class="signatures-table">
        <tr>
            <td>
                <div class="sig-line">
                    LE VACATAIRE<br>
                    <span style="font-size: 9px; font-weight: normal; color: #64748b;">(Lu et approuvé)</span>
                </div>
            </td>
            <td style="text-align: center; vertical-align: bottom; padding-bottom: 8px;">
                @if(!empty($qrCode))
                    <img src="data:image/svg+xml;base64,{{ $qrCode }}" alt="QR Vérification" class="qr-img">
                    <div style="font-size: 8px; color: #64748b; margin-top: 4px;">Vérification numérique</div>
                @endif
            </td>
            <td>
                <div class="sig-line">
                    L'ADMINISTRATION<br>
                    <span style="font-size: 9px; font-weight: normal; color: #64748b;">Fait à Fès, le {{ $date }}</span>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Document généré électroniquement par l'ERP ENCG Fès &mdash;
        Réf: {{ $contract->id ?? 'N/A' }} &mdash;
        {{ $professor->employee_number ?? ($professor->user->employee_id ?? 'N/A') }} &mdash;
        {{ $date }}
    </div>
</div>
</body>
</html>
