<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Affiche de Porte Officielle — {{ $room->name }}</title>
    <style>
        @page {
            margin: 7mm 9mm 7mm 9mm;
            size: A4 portrait;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 9px;
            line-height: 1.25;
            background-color: #ffffff;
        }

        /* Institutional Header */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #001A4B;
            padding-bottom: 5px;
            margin-bottom: 7px;
        }
        .header-logo-cell {
            width: 75px;
            vertical-align: middle;
            text-align: left;
        }
        .header-logo-cell img {
            max-height: 52px;
            max-width: 70px;
        }
        .header-text-cell {
            vertical-align: middle;
            text-align: center;
        }
        .inst-title-country {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
            font-weight: bold;
            margin: 0;
        }
        .inst-title-univ {
            font-size: 11px;
            font-weight: bold;
            color: #001A4B;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 1px 0;
        }
        .inst-title-school {
            font-size: 10px;
            font-weight: bold;
            color: #C5A059;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }
        .inst-subtitle {
            font-size: 7.5px;
            color: #475569;
            margin-top: 2px;
        }
        .header-meta-cell {
            width: 90px;
            vertical-align: middle;
            text-align: right;
            font-size: 7.5px;
            color: #475569;
            line-height: 1.3;
        }
        .meta-year-badge {
            display: inline-block;
            background-color: #001A4B;
            color: #ffffff;
            font-size: 7px;
            font-weight: bold;
            padding: 2px 5px;
            border-radius: 3px;
            margin-top: 2px;
            text-transform: uppercase;
        }

        /* Room Hero Banner */
        .room-hero {
            background-color: #001A4B;
            color: #ffffff;
            border-radius: 6px;
            border-bottom: 3px solid #C5A059;
            padding: 9px 12px;
            margin-bottom: 7px;
            text-align: center;
        }
        .room-title {
            font-size: 22px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
            color: #ffffff;
        }
        .room-subtitle {
            font-size: 9.5px;
            color: #93c5fd;
            margin-top: 3px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        /* Capacity & Equipment Strip */
        .meta-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 5px 0;
            margin-bottom: 7px;
        }
        .meta-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 4px 6px;
            text-align: center;
        }
        .meta-card-label {
            font-size: 7px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.4px;
        }
        .meta-card-value {
            font-size: 11px;
            font-weight: bold;
            color: #001A4B;
            margin-top: 1px;
        }
        .status-ok {
            color: #15803d;
            font-weight: bold;
        }
        .status-no {
            color: #64748b;
        }

        /* Section Title Strip */
        .section-bar {
            background-color: #f1f5f9;
            border-left: 4px solid #001A4B;
            padding: 3px 8px;
            margin-bottom: 6px;
        }
        .section-title {
            font-size: 9.5px;
            font-weight: bold;
            text-transform: uppercase;
            color: #001A4B;
            letter-spacing: 0.5px;
            display: inline-block;
        }
        .section-tag {
            float: right;
            font-size: 7.5px;
            color: #64748b;
            font-style: italic;
        }

        /* Timetable Grid */
        .timetable-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 7px;
        }
        .timetable-table th, .timetable-table td {
            border: 1px solid #cbd5e1;
            padding: 3px 4px;
            vertical-align: top;
        }
        .timetable-table th {
            background-color: #001A4B;
            color: #ffffff;
            text-transform: uppercase;
            font-size: 8px;
            font-weight: bold;
            text-align: center;
            padding: 4px 2px;
        }
        .day-cell {
            background-color: #f8fafc;
            font-weight: bold;
            color: #001A4B;
            width: 13%;
            text-align: center;
            vertical-align: middle;
            font-size: 8.5px;
            text-transform: uppercase;
        }
        .slot-col {
            width: 21.75%;
        }

        /* Compact Course Session Blocks */
        .session-block {
            background-color: #f0f7ff;
            border: 1px solid #bfdbfe;
            border-left: 3px solid #003087;
            border-radius: 3px;
            padding: 2.5px 4px;
            margin-bottom: 2.5px;
        }
        .session-block:last-child {
            margin-bottom: 0;
        }
        .session-module {
            font-weight: bold;
            color: #001A4B;
            font-size: 7.8px;
            line-height: 1.15;
        }
        .session-details {
            font-size: 7px;
            color: #475569;
            margin-top: 1px;
            line-height: 1.15;
        }
        .badge-filiere {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            font-weight: bold;
            font-size: 6.5px;
            padding: 0.5px 3px;
            border-radius: 2px;
            margin-right: 2px;
        }
        .session-prof {
            font-size: 6.8px;
            color: #334155;
            font-style: italic;
            margin-top: 1px;
        }
        .empty-slot {
            color: #94a3b8;
            font-style: italic;
            font-size: 7.5px;
            text-align: center;
            padding: 8px 0;
        }

        /* Footer & Electronic Verification */
        .footer-panel {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            padding: 5px 8px;
        }
        .footer-left {
            vertical-align: middle;
            padding-right: 8px;
        }
        .footer-badge {
            display: inline-block;
            background-color: #047857;
            color: #ffffff;
            font-size: 6.5px;
            font-weight: bold;
            padding: 1.5px 5px;
            border-radius: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .footer-title {
            font-size: 8px;
            font-weight: bold;
            color: #001A4B;
            text-transform: uppercase;
        }
        .footer-desc {
            font-size: 6.8px;
            color: #475569;
            margin-top: 2px;
            line-height: 1.25;
        }
        .footer-security-code {
            font-size: 6.2px;
            font-family: 'DejaVu Sans Mono', monospace;
            color: #64748b;
            margin-top: 3px;
        }
        .footer-qr-cell {
            width: 85px;
            text-align: center;
            vertical-align: middle;
            border-left: 1px dashed #cbd5e1;
            padding-left: 8px;
        }
        .qr-frame {
            display: inline-block;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 2px;
            border-radius: 3px;
        }
        .qr-tagline {
            font-size: 6.2px;
            font-weight: bold;
            color: #001A4B;
            margin-top: 2px;
            text-transform: uppercase;
        }
        .qr-subtagline {
            font-size: 5.5px;
            color: #64748b;
        }
    </style>
</head>
<body>

    <!-- Official University & School Header -->
    <table class="header-table">
        <tr>
            <td class="header-logo-cell">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès" />
                @endif
            </td>
            <td class="header-text-cell">
                <div class="inst-title-country">Royaume du Maroc</div>
                <div class="inst-title-univ">Université Sidi Mohamed Ben Abdellah · Fès</div>
                <div class="inst-title-school">École Nationale de Commerce et de Gestion</div>
                <div class="inst-subtitle">
                    Direction des Affaires Pédagogiques · Service des Emplois du Temps & des Salles
                </div>
            </td>
            <td class="header-meta-cell">
                <div>Document Officiel</div>
                <div class="meta-year-badge">2026 / 2027</div>
                <div style="margin-top: 2px; font-size: 6.5px; color: #64748b;">Édition Campus</div>
            </td>
        </tr>
    </table>

    <!-- Room Hero Banner -->
    <div class="room-hero">
        <div class="room-title">{{ $room->name }}</div>
        <div class="room-subtitle">
            @php
                $typeLabel = match($room->type) {
                    'amphitheatre', 'amphitheater' => 'Amphithéâtre de Cours Magistraux',
                    'lab' => 'Laboratoire Informatique & Travaux Pratiques',
                    'conference' => 'Salle de Conférence & Séminaires',
                    default => 'Salle d\'Enseignement & Travaux Dirigés (TD)'
                };
            @endphp
            {{ strtoupper($typeLabel) }} &nbsp;·&nbsp; REPÈRE / CODE : {{ $room->code }}
        </div>
    </div>

    <!-- Capacity & Equipment Metrics Strip -->
    <table class="meta-table">
        <tr>
            <td style="width: 25%;">
                <div class="meta-card">
                    <div class="meta-card-label">Capacité Cours</div>
                    <div class="meta-card-value">{{ $room->capacity }} places</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="meta-card">
                    <div class="meta-card-label">Capacité Examen (Anti-fraude)</div>
                    <div class="meta-card-value" style="color: #b91c1c;">
                        {{ $room->exam_capacity ?? (int)floor($room->capacity / 2) }} places
                    </div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="meta-card">
                    <div class="meta-card-label">Vidéoprojecteur</div>
                    <div class="meta-card-value">
                        @if($room->has_projector)
                            <span class="status-ok">&#10003; Installé</span>
                        @else
                            <span class="status-no">&#10007; Non équipé</span>
                        @endif
                    </div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="meta-card">
                    <div class="meta-card-label">Climatisation</div>
                    <div class="meta-card-value">
                        @if($room->has_ac)
                            <span class="status-ok">&#10003; Équipée</span>
                        @else
                            <span class="status-no">&#10007; Non équipée</span>
                        @endif
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Weekly Schedule Title Bar -->
    <div class="section-bar">
        <span class="section-title">Planning Hebdomadaire Officiel d'Occupation</span>
        <span class="section-tag">Cycle Normal & Masters · Semestres d'Automne / Printemps</span>
    </div>

    <!-- Timetable Matrix Grid (All 6 Days) -->
    <table class="timetable-table">
        <thead>
            <tr>
                <th>Jour</th>
                <th class="slot-col">08:30 – 10:30</th>
                <th class="slot-col">10:45 – 12:45</th>
                <th class="slot-col">14:30 – 16:30</th>
                <th class="slot-col">16:45 – 18:45</th>
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
                $timeSlots = ['08:30', '10:45', '14:30', '16:45'];
            @endphp

            @foreach($days as $dayIndex => $dayLabel)
                <tr>
                    <td class="day-cell">{{ $dayLabel }}</td>
                    @foreach($timeSlots as $timeSlot)
                        @php
                            $slotSessions = $schedules->filter(function($s) use ($dayIndex, $timeSlot) {
                                if ((int)$s->day_of_week !== $dayIndex) return false;
                                $start = (string)$s->start_time;
                                if ($timeSlot === '08:30') return str_starts_with($start, '08:') || str_starts_with($start, '09:');
                                if ($timeSlot === '10:45') return str_starts_with($start, '10:') || str_starts_with($start, '11:') || str_starts_with($start, '12:');
                                if ($timeSlot === '14:30') return str_starts_with($start, '14:') || str_starts_with($start, '15:');
                                if ($timeSlot === '16:45') return str_starts_with($start, '16:') || str_starts_with($start, '17:') || str_starts_with($start, '18:');
                                return false;
                            });

                            // Smart grouping by module name + professor so identical sessions for G1, G2 etc. don't bloat the cell
                            $groupedSessions = $slotSessions->groupBy(function($item) {
                                $moduleKey = $item->module->name ?? 'Sans_Module';
                                $profKey = ($item->professor->user->first_name ?? '') . '_' . ($item->professor->user->last_name ?? '');
                                return $moduleKey . '___' . $profKey;
                            });
                        @endphp
                        <td>
                            @if($groupedSessions->isNotEmpty())
                                @foreach($groupedSessions as $groupItems)
                                    @php
                                        $first = $groupItems->first();
                                        $moduleName = $first->module->name ?? 'Cours';
                                        $filiereCode = $first->group->filiere->code ?? '';
                                        $groupNames = $groupItems->map(fn($item) => $item->group->name ?? null)->filter()->unique()->implode(', ');
                                        $profFirst = $first->professor->user->first_name ?? '';
                                        $profLast = $first->professor->user->last_name ?? '';
                                        $profFullName = trim($profFirst . ' ' . $profLast);
                                    @endphp
                                    <div class="session-block">
                                        <div class="session-module">{{ $moduleName }}</div>
                                        <div class="session-details">
                                            @if(!empty($filiereCode))
                                                <span class="badge-filiere">{{ $filiereCode }}</span>
                                            @endif
                                            <span>{{ $groupNames ?: 'Tous groupes' }}</span>
                                            @if(!empty($profFullName))
                                                <div class="session-prof">Pr. {{ $profFullName }}</div>
                                            @endif
                                        </div>
                                    </div>
                                @endforeach
                            @else
                                <div class="empty-slot">&#8212; Libre &#8212;</div>
                            @endif
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Electronic Verification & Stamp Footer Panel -->
    <table class="footer-panel">
        <tr>
            <td class="footer-left">
                <span class="footer-badge">&#10003; Document Officiel Vérifié</span>
                <div class="footer-title">Vérification Électronique & Synchronisation Cloud en Temps Réel</div>
                <div class="footer-desc">
                    Affichage certifié conforme émis par la Direction des Affaires Pédagogiques. 
                    Toute modification de planning, rattrapage, soutenance ou réservation ponctuelle est répercutée instantanément sur la passerelle numérique.
                </div>
                <div class="footer-security-code">
                    Édité le {{ now()->format('d/m/Y à H:i:s') }} · HASH : ENCGFES-SALLE-{{ $room->id }}-{{ strtoupper(substr(md5($room->code . ($room->id * 42)), 0, 10)) }} · APOGEE v26.4
                </div>
            </td>
            <td class="footer-qr-cell">
                @php
                    $qrSrc = !empty($qrBase64) ? $qrBase64 : (!empty($qrCodeSvg) ? 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg) : null);
                @endphp
                @if(!empty($qrSrc))
                    <div class="qr-frame">
                        <img src="{{ $qrSrc }}" width="58" height="58" alt="QR Code Vérification" />
                    </div>
                    <div class="qr-tagline">Scanner pour vérifier</div>
                    <div class="qr-subtagline">Statut d'occupation en direct</div>
                @else
                    <div style="font-size: 6.5px; color: #64748b; padding: 10px 0;">
                        {{ $verifyUrl }}
                    </div>
                @endif
            </td>
        </tr>
    </table>

</body>
</html>
