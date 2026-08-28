<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Affiche de Porte Officielle — {{ $room->name }}</title>
    <style>
        @page {
            margin: 12mm;
            size: A4 portrait;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 11px;
            background-color: #ffffff;
        }
        .header {
            border-bottom: 2.5px solid #001A4B;
            padding-bottom: 10px;
            margin-bottom: 15px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 16px;
            color: #001A4B;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        .header h2 {
            margin: 3px 0 0 0;
            font-size: 11px;
            color: #475569;
            font-weight: 600;
        }
        .room-hero {
            background-color: #001A4B;
            color: #ffffff;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 15px;
            text-align: center;
        }
        .room-title {
            font-size: 26px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
        }
        .room-meta {
            font-size: 12px;
            color: #93c5fd;
            margin-top: 5px;
            font-weight: bold;
        }
        .meta-boxes {
            width: 100%;
            margin-bottom: 15px;
        }
        .meta-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            text-align: center;
        }
        .meta-label {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
        }
        .meta-val {
            font-size: 14px;
            font-weight: bold;
            color: #001A4B;
            margin-top: 2px;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: #001A4B;
            border-left: 4px solid #003087;
            padding-left: 8px;
            margin: 15px 0 10px 0;
        }
        .timetable-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .timetable-table th, .timetable-table td {
            border: 1px solid #cbd5e1;
            padding: 7px 6px;
            text-align: left;
            font-size: 10px;
        }
        .timetable-table th {
            background-color: #001A4B;
            color: #ffffff;
            text-transform: uppercase;
            font-size: 9px;
            font-weight: bold;
            text-align: center;
        }
        .day-cell {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #0f172a;
            width: 14%;
        }
        .session-block {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 4px;
            padding: 4px 6px;
            margin-bottom: 3px;
        }
        .session-module {
            font-weight: bold;
            color: #1e3a8a;
            font-size: 10px;
        }
        .session-details {
            font-size: 8.5px;
            color: #475569;
        }
        .empty-slot {
            color: #94a3b8;
            font-style: italic;
            font-size: 8.5px;
            text-align: center;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            margin-top: 15px;
            width: 100%;
        }
        .qr-section {
            text-align: right;
            vertical-align: middle;
        }
        .qr-text {
            font-size: 8px;
            color: #64748b;
            margin-top: 3px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <div class="header">
        <h1>Université Sidi Mohamed Ben Abdellah · Fès</h1>
        <h2>ÉCOLE NATIONALE DE COMMERCE ET DE GESTION — ENCG FÈS</h2>
        <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
            Direction Académique & des Affaires Pédagogiques · Année Universitaire 2026/2027
        </div>
    </div>

    <!-- Room Hero Banner -->
    <div class="room-hero">
        <div class="room-title">{{ $room->name }}</div>
        <div class="room-meta">
            {{ strtoupper($room->type === 'amphitheatre' ? 'Amphithéâtre de Cours Magistraux' : ($room->type === 'lab' ? 'Laboratoire Informatique & TP' : 'Salle de Travaux Dirigés (TD)')) }}
            · Code : {{ $room->code }}
        </div>
    </div>

    <!-- Capacity & Equipment Metrics -->
    <table class="meta-boxes">
        <tr>
            <td style="width: 25%; padding-right: 5px;">
                <div class="meta-box">
                    <div class="meta-label">Capacité Enseignement</div>
                    <div class="meta-val">{{ $room->capacity }} places</div>
                </div>
            </td>
            <td style="width: 25%; padding: 0 2.5px;">
                <div class="meta-box">
                    <div class="meta-label">Capacité Examen (Anti-fraude)</div>
                    <div class="meta-val" style="color: #dc2626;">{{ $room->exam_capacity ?? (int)floor($room->capacity / 2) }} places</div>
                </div>
            </td>
            <td style="width: 25%; padding: 0 2.5px;">
                <div class="meta-box">
                    <div class="meta-label">Vidéoprojecteur</div>
                    <div class="meta-val">{{ $room->has_projector ? '✅ Installé' : '❌ Non' }}</div>
                </div>
            </td>
            <td style="width: 25%; padding-left: 5px;">
                <div class="meta-box">
                    <div class="meta-label">Climatisation</div>
                    <div class="meta-val">{{ $room->has_ac ? '✅ Équipée' : '❌ Non' }}</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Weekly Schedule Title -->
    <div class="section-title">Emploi du Temps Hebdomadaire Officiel</div>

    <!-- Timetable Matrix Table -->
    <table class="timetable-table">
        <thead>
            <tr>
                <th>Jour</th>
                <th style="width: 21.5%;">08:30 – 10:30</th>
                <th style="width: 21.5%;">10:45 – 12:45</th>
                <th style="width: 21.5%;">14:30 – 16:30</th>
                <th style="width: 21.5%;">16:45 – 18:45</th>
            </tr>
        </thead>
        <tbody>
            @php
                $days = [
                    1 => 'Lundi',
                    2 => 'Mardi',
                    3 => 'Mercredi',
                    4 => 'Jeudi',
                    5 => 'Vendredi',
                    6 => 'Samedi',
                ];
            @endphp

            @foreach($days as $dayIndex => $dayLabel)
                <tr>
                    <td class="day-cell">{{ $dayLabel }}</td>
                    @foreach(['08:30', '10:45', '14:30', '16:45'] as $timeSlot)
                        @php
                            $session = $schedules->first(function($s) use ($dayIndex, $timeSlot) {
                                return (int)$s->day_of_week === $dayIndex && str_starts_with($s->start_time, $timeSlot);
                            });
                        @endphp
                        <td>
                            @if($session)
                                <div class="session-block">
                                    <div class="session-module">{{ $session->module->name ?? 'Cours' }}</div>
                                    <div class="session-details">
                                        {{ $session->group->filiere->code ?? '' }} · {{ $session->group->name ?? 'Gr.' }}<br>
                                        Pr. {{ $session->professor->user->first_name ?? '' }} {{ $session->professor->user->last_name ?? '' }}
                                    </div>
                                </div>
                            @else
                                <div class="empty-slot">Libre</div>
                            @endif
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Footer with Verification QR Code -->
    <table class="footer">
        <tr>
            <td style="vertical-align: middle;">
                <div style="font-weight: bold; color: #001A4B; font-size: 9px;">ENCG FÈS — SYSTÈME DE GESTION DU CAMPUS (ERP)</div>
                <div style="font-size: 8px; color: #64748b; margin-top: 1px;">
                    Document officiel généré le {{ now()->format('d/m/Y à H:i') }}. Tout changement d'horaire ou rattrapage est synchronisé en temps réel via le QR Code.
                </div>
            </td>
            <td class="qr-section" style="width: 120px;">
                @if(!empty($qrCodeSvg))
                    <div style="text-align: right;">
                        <img src="data:image/svg+xml;base64,{{ base64_encode($qrCodeSvg) }}" width="65" height="65" />
                        <div class="qr-text">Scanner pour statut en direct</div>
                    </div>
                @endif
            </td>
        </tr>
    </table>

</body>
</html>
