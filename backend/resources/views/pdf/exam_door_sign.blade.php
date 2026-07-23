<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Affiche de Porte — {{ $room->name ?? 'Salle' }}</title>
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
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 12px;
            margin-bottom: 15px;
        }
        .header-title {
            text-align: center;
        }
        .header-title h1 {
            margin: 0;
            font-size: 18px;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header-title h2 {
            margin: 4px 0 0 0;
            font-size: 13px;
            color: #475569;
            font-weight: normal;
        }
        .banner {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 20px;
        }
        .banner-table {
            width: 100%;
        }
        .banner-label {
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
        }
        .banner-val {
            font-size: 13px;
            font-weight: bold;
            color: #0f2863;
        }
        .seats-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .seats-table th {
            background-color: #0f2863;
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            padding: 8px 10px;
            text-align: left;
            letter-spacing: 0.5px;
        }
        .seats-table td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
        }
        .seats-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .seat-badge {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            font-weight: bold;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            text-align: center;
        }
        .footer {
            margin-top: 25px;
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
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" style="max-height: 50px;" alt="ENCG Fès">
                @endif
            </td>
            <td class="header-title" style="width: 80%;">
                <h1>Royaume du Maroc — ENCG Fès</h1>
                <h2>Plan de Placement d'Examen — Affiche de Porte</h2>
            </td>
        </tr>
    </table>

    <div class="banner">
        <table class="banner-table">
            <tr>
                <td style="width: 30%;">
                    <div class="banner-label">Local / Salle</div>
                    <div class="banner-val">{{ $room->name ?? 'Salle d\'Examen' }}</div>
                </td>
                <td style="width: 45%;">
                    <div class="banner-label">Module / Examen</div>
                    <div class="banner-val">{{ $exam->module->name ?? 'Examen' }}</div>
                </td>
                <td style="width: 25%;">
                    <div class="banner-label">Capacité / Effectif</div>
                    <div class="banner-val">{{ count($seatings) }} Étudiants</div>
                </td>
            </tr>
            <tr>
                <td style="padding-top: 8px;">
                    <div class="banner-label">Date & Horaire</div>
                    <div class="banner-val">{{ $exam->exam_date ?? $exam->date ?? date('d/m/Y') }} ({{ $exam->start_time ?? '09:00' }} - {{ $exam->end_time ?? '11:00' }})</div>
                </td>
                <td style="padding-top: 8px;" colspan="2">
                    <div class="banner-label">Groupe / Filière</div>
                    <div class="banner-val">{{ $exam->group->name ?? 'Tous les groupes' }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="seats-table">
        <thead>
            <tr>
                <th style="width: 20%; text-align: center;">N° Siège</th>
                <th style="width: 50%;">Nom & Prénom</th>
                <th style="width: 30%;">CNE / Massar</th>
            </tr>
        </thead>
        <tbody>
            @forelse($seatings as $seating)
                <tr>
                    <td style="text-align: center;">
                        <span class="seat-badge">Siège {{ sprintf('%02d', $seating->seat_number ?? 1) }}</span>
                    </td>
                    <td style="font-weight: bold; color: #1e293b;">
                        @if(!empty($seating->last_name) || !empty($seating->first_name))
                            {{ strtoupper($seating->last_name ?? '') }} {{ ucfirst($seating->first_name ?? '') }}
                        @else
                            {{ $seating->full_name ?? $seating->student_name ?? 'Étudiant' }}
                        @endif
                    </td>
                    <td style="font-family: monospace; color: #475569;">
                        {{ $seating->cne ?? $seating->cin ?? 'N/A' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px;">
                        Aucun étudiant placé dans cette salle.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Document officiel généré automatiquement par le Système ERP ENCG Fès — {{ date('d/m/Y H:i') }}
    </div>

</body>
</html>
