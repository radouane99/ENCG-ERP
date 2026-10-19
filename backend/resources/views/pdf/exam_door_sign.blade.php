<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Affiche de Porte — {{ $room->name ?? 'Salle d\'Examen' }}</title>
    @php
        $totalSeatings = count($seatings ?? []);
        
        // Calibrage intelligent de l'espacement pour tenir sur 1 seule page (jusqu'à 26 étudiants)
        if ($totalSeatings <= 22) {
            $rowPad = '3.5px 8px';
            $fontSize = '8.5pt';
            $cneFont = '8.5pt';
            $pillPad = '2px 8px';
        } elseif ($totalSeatings <= 28) {
            $rowPad = '2.4px 7px';
            $fontSize = '8.0pt';
            $cneFont = '8.0pt';
            $pillPad = '1.5px 6px';
        } elseif ($totalSeatings <= 35) {
            $rowPad = '1.8px 6px';
            $fontSize = '7.5pt';
            $cneFont = '7.5pt';
            $pillPad = '1px 5px';
        } else {
            $rowPad = '1.4px 5px';
            $fontSize = '7.0pt';
            $cneFont = '7.0pt';
            $pillPad = '0.5px 4px';
        }

        $logoBase64 = $logoBase64 ?? '';
        if (empty($logoBase64) && file_exists(public_path('logo-encg.png'))) {
            $logoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('logo-encg.png')));
        }

        $filiereObj = $exam->module?->filiere ?? $exam->filiere ?? null;
        $filiereName = is_object($filiereObj) ? ($filiereObj->name ?? $filiereObj->code ?? 'Tronc Commun') : (is_string($filiereObj) ? $filiereObj : 'Tronc Commun ENCG');

        $groupObj = $exam->group ?? null;
        $groupName = is_object($groupObj) ? ($groupObj->name ?? $groupObj->code ?? '') : (is_string($groupObj) ? $groupObj : '');

        $moduleName = is_object($exam->module) ? ($exam->module->name ?? 'Examen') : (is_string($exam->module) ? $exam->module : 'Examen');
        $moduleCode = is_object($exam->module) ? ($exam->module->code ?? '') : '';
    @endphp
    <style>
        @page {
            margin: 6mm 9mm 5mm 9mm;
            size: A4 portrait;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: {{ $fontSize }};
            line-height: 1.15;
            background-color: #ffffff;
        }

        /* En-tête Institutionnel Officiel */
        .institution-header {
            width: 100%;
            border-bottom: 2px solid #002e5b;
            padding-bottom: 4px;
            margin-bottom: 5px;
        }
        .header-logo {
            width: 22%;
            vertical-align: middle;
        }
        .header-logo img {
            max-height: 40px;
            width: auto;
            display: block;
        }
        .header-center {
            width: 56%;
            text-align: center;
            vertical-align: middle;
        }
        .header-center .sub-title {
            font-size: 6.8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
            font-weight: bold;
            margin: 0 0 1px 0;
        }
        .header-center .main-title {
            font-size: 10.5pt;
            font-weight: 900;
            color: #002e5b;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin: 0 0 2px 0;
        }
        .header-center .document-badge {
            display: inline-block;
            background-color: #002e5b;
            color: #ffffff;
            font-size: 7.2pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 2px 10px;
            border-radius: 10px;
        }
        .header-right {
            width: 22%;
            text-align: right;
            vertical-align: middle;
            font-size: 6.8pt;
            color: #64748b;
            line-height: 1.2;
        }

        /* Bannière Visuelle de Salle & Épreuve */
        .hero-banner {
            width: 100%;
            background-color: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 5px;
            margin-bottom: 5px;
            border-collapse: collapse;
        }
        .hero-banner td {
            padding: 5px 8px;
            vertical-align: top;
        }
        .banner-cell-room {
            width: 27%;
            background-color: #002e5b;
            color: #ffffff;
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
            padding: 6px 8px !important;
            text-align: center;
        }
        .room-tag {
            font-size: 6.2pt;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #93c5fd;
            font-weight: 800;
            margin-bottom: 1px;
        }
        .room-name {
            font-size: 12pt;
            font-weight: 900;
            color: #ffffff;
            text-transform: uppercase;
            line-height: 1.1;
        }
        .room-capacity {
            font-size: 7.2pt;
            color: #fde047;
            font-weight: bold;
            margin-top: 2px;
        }

        .meta-label {
            font-size: 6.2pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            font-weight: bold;
            margin-bottom: 1px;
        }
        .meta-value {
            font-size: 9.0pt;
            font-weight: bold;
            color: #0f172a;
            line-height: 1.15;
        }
        .meta-sub {
            font-size: 7.2pt;
            color: #475569;
            font-weight: normal;
            margin-top: 2px;
        }

        /* Barre de Consignes & Surveillants */
        .notice-bar {
            width: 100%;
            background-color: #f1f5f9;
            border-left: 3.5px solid #002e5b;
            padding: 3px 8px;
            margin-bottom: 5px;
            font-size: 6.8pt;
            color: #334155;
        }
        .notice-bar strong {
            color: #002e5b;
        }

        /* Grille des Sièges & Candidats (3 colonnes, sans émargement) */
        .seats-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1px;
        }
        .seats-table thead tr {
            background-color: #002e5b;
            color: #ffffff;
        }
        .seats-table th {
            padding: 3.5px 8px;
            font-size: 7.2pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-right: 1px solid #1e3a8a;
            text-align: center;
        }
        .seats-table th:last-child {
            border-right: none;
        }
        .seats-table td {
            padding: {{ $rowPad }};
            border-bottom: 1px solid #e2e8f0;
            border-right: 1px solid #f1f5f9;
            font-size: {{ $fontSize }};
            vertical-align: middle;
        }
        .seats-table td:last-child {
            border-right: none;
        }
        .seats-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .seats-table tbody tr {
            page-break-inside: avoid;
        }

        /* Badges Siège & CNE */
        .seat-pill {
            display: inline-block;
            background-color: #002e5b;
            color: #ffffff;
            font-weight: 900;
            font-size: {{ $fontSize }};
            padding: {{ $pillPad }};
            border-radius: 8px;
            text-align: center;
            min-width: 44px;
        }
        .cne-code {
            font-family: 'DejaVu Sans Mono', 'Courier New', Courier, monospace;
            font-weight: bold;
            font-size: {{ $cneFont }};
            color: #1e293b;
            letter-spacing: 0.5px;
        }
        .student-name-bold {
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
        }
        .student-name-first {
            font-weight: normal;
            color: #334155;
        }

        /* Footer & Signature de Vérification */
        .door-footer {
            margin-top: 5px;
            border-top: 1px solid #cbd5e1;
            padding-top: 3px;
            width: 100%;
        }
        .footer-table {
            width: 100%;
        }
        .footer-qr {
            width: 36px;
            vertical-align: middle;
        }
        .footer-qr img {
            width: 32px;
            height: 32px;
            display: block;
            border: 1px solid #cbd5e1;
            padding: 1px;
            background: #fff;
        }
        .footer-text {
            font-size: 6.2pt;
            color: #64748b;
            line-height: 1.2;
            vertical-align: middle;
            padding-left: 6px;
        }
        .footer-legal {
            font-weight: bold;
            color: #002e5b;
        }
    </style>
</head>
<body>

    {{-- En-tête Institutionnel --}}
    <table class="institution-header">
        <tr>
            <td class="header-logo">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG Fes">
                @else
                    <div style="font-size: 11pt; font-weight: 900; color: #002e5b;">ENCG FÈS</div>
                @endif
            </td>
            <td class="header-center">
                <div class="sub-title">Royaume du Maroc - Université Sidi Mohamed Ben Abdellah</div>
                <div class="main-title">École Nationale de Commerce et de Gestion de Fès</div>
                <div class="document-badge">AFFICHE DE PORTE - RÉPARTITION DES PLACES</div>
            </td>
            <td class="header-right">
                <strong>Session :</strong> {{ $exam->examSession->name ?? 'Session Normale' }}<br>
                <strong>Année :</strong> {{ date('Y') }}/{{ date('Y') + 1 }}<br>
                <strong>Épreuve ID :</strong> EXAM-{{ str_pad($exam->id, 4, '0', STR_PAD_LEFT) }}
            </td>
        </tr>
    </table>

    {{-- Bannière Visuelle de Salle & Épreuve --}}
    <table class="hero-banner">
        <tr>
            <td class="banner-cell-room">
                <div class="room-tag">Local d'Examen</div>
                <div class="room-name">{{ $room->name ?? ($exam->room->name ?? 'Amphithéâtre B') }}</div>
                <div class="room-capacity">Effectif : {{ $totalSeatings }} Convoqué(s)</div>
            </td>
            <td style="width: 43%; padding-left: 10px;">
                <div class="meta-label">Module / Épreuve Académique</div>
                <div class="meta-value" style="color: #002e5b; font-size: 9.5pt;">
                    {{ $moduleName }} @if($moduleCode)<small style="font-size: 7.5pt; color: #64748b;">({{ $moduleCode }})</small>@endif
                </div>
                <div class="meta-sub">
                    <strong>Filière :</strong> {{ $filiereName }}
                    @if(!empty($groupName))
                        - <strong>Groupe :</strong> {{ $groupName }}
                    @endif
                </div>
            </td>
            <td style="width: 30%; border-left: 1px dashed #cbd5e1; padding-left: 10px;">
                <div class="meta-label">Date &amp; Horaires Officiels</div>
                <div class="meta-value">
                    {{ $dateFormatted ?? ($exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->translatedFormat('l d F Y') : 'Date à définir') }}
                </div>
                <div class="meta-sub" style="font-weight: bold; color: #b45309; margin-top: 2px;">
                    Horaire : {{ $startTime ?? substr($exam->start_time ?? '08:30', 0, 5) }} - {{ $endTime ?? '10:30' }} ({{ $durationMins ?? ($exam->duration_minutes ?? 120) }} min)
                </div>
            </td>
        </tr>
    </table>

    {{-- Barre de Consignes & Surveillants --}}
    <div class="notice-bar">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 58%; vertical-align: middle;">
                    <strong>Surveillance :</strong>
                    @if(!empty($presidentName))
                        {{ $presidentName }} (Président)
                    @endif
                    @if(!empty($surveillantNames) && count($surveillantNames) > 0)
                        - {{ implode(', ', $surveillantNames) }}
                    @elseif(empty($presidentName))
                        Comité de surveillance assigné par le Décanat
                    @endif
                </td>
                <td style="width: 42%; text-align: right; vertical-align: middle;">
                    <strong>Consigne :</strong> CNIE / Carte d'Étudiant obligatoire &bull; Accès selon place assignée
                </td>
            </tr>
        </table>
    </div>

    {{-- Grille des Étudiants et Numéros de Sièges (3 COLONNES SANS ÉMARGEMENT) --}}
    <table class="seats-table">
        <thead>
            <tr>
                <th style="width: 14%; text-align: center;">N° Siège</th>
                <th style="width: 56%; text-align: left; padding-left: 14px;">Nom &amp; Prénom de l'Étudiant</th>
                <th style="width: 30%; text-align: center;">Code CNE / Massar</th>
            </tr>
        </thead>
        <tbody>
            @forelse($seatings as $seating)
                @php
                    $isArr = is_array($seating);
                    $student = $isArr ? ($seating['student'] ?? null) : ($seating->student ?? null);
                    $user = is_object($student) ? ($student->user ?? null) : (is_array($student) ? ($student['user'] ?? null) : null);

                    // Extract Nom
                    $lastName = $isArr
                        ? ($seating['last_name'] ?? ($student['last_name'] ?? ($user['last_name'] ?? '')))
                        : ($student?->last_name ?? $user?->last_name ?? '');

                    // Extract Prénom
                    $firstName = $isArr
                        ? ($seating['first_name'] ?? ($student['first_name'] ?? ($user['first_name'] ?? '')))
                        : ($student?->first_name ?? $user?->first_name ?? '');

                    // Fallback to full name if needed
                    if (empty($lastName) && empty($firstName)) {
                        $full = $isArr
                            ? ($seating['full_name'] ?? ($seating['name'] ?? ($user['name'] ?? '')))
                            : ($user?->name ?? '');
                        if (is_string($full) && !empty($full)) {
                            $parts = explode(' ', trim($full), 2);
                            $lastName = $parts[0] ?? '';
                            $firstName = $parts[1] ?? '';
                        }
                    }

                    // Extract CNE / Massar / Code Étudiant
                    $cne = $isArr
                        ? ($seating['cne'] ?? ($seating['massar'] ?? ($student['cne'] ?? ($student['student_number'] ?? '—'))))
                        : ($student?->cne ?? $student?->student_number ?? '—');

                    // Extract CIN
                    $cin = $isArr
                        ? ($seating['cin'] ?? ($student['cin'] ?? ($user['cin'] ?? '')))
                        : ($student?->cin ?? $user?->cin ?? '');

                    // Seat Number
                    $seatNum = $isArr
                        ? ($seating['seat_number'] ?? $loop->iteration)
                        : ($seating->seat_number ?: $loop->iteration);

                    $lastNameClean = is_string($lastName) ? trim($lastName) : '';
                    $firstNameClean = is_string($firstName) ? trim($firstName) : '';
                    $cneClean = is_string($cne) ? trim($cne) : '—';
                    $cinClean = is_string($cin) ? trim($cin) : '';
                @endphp
                <tr>
                    <td style="text-align: center;">
                        <span class="seat-pill">N° {{ sprintf('%02d', (int)$seatNum) }}</span>
                    </td>
                    <td style="text-align: left; padding-left: 14px;">
                        @if(!empty($lastNameClean) || !empty($firstNameClean))
                            <span class="student-name-bold">{{ mb_strtoupper($lastNameClean) }}</span>
                            <span class="student-name-first">{{ mb_convert_case($firstNameClean, MB_CASE_TITLE, "UTF-8") }}</span>
                        @else
                            <span style="color: #94a3b8; font-style: italic;">— Étudiant non renseigné —</span>
                        @endif
                        @if(!empty($cinClean))
                            <span style="font-size: 7.2pt; color: #64748b; margin-left: 6px; font-weight: 600;">(CIN: {{ $cinClean }})</span>
                        @endif
                    </td>
                    <td style="text-align: center;">
                        <span class="cne-code">{{ $cneClean }}</span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" style="text-align: center; color: #64748b; padding: 18px;">
                        Aucun étudiant placé dans cette salle pour cette épreuve.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Pied de Page Officiel avec QR Anti-Fraude --}}
    <div class="door-footer">
        <table class="footer-table">
            <tr>
                @if(!empty($qrBase64))
                    <td class="footer-qr">
                        <img src="{{ $qrBase64 }}" alt="QR Code">
                    </td>
                @endif
                <td class="footer-text">
                    <span class="footer-legal">Document d'Affichage Officiel &bull; Anti-Fraude Numérique (Loi 53-05)</span><br>
                    Authenticité certifiée par le Système d'Information ENCG Fès &bull; Édité le {{ date('d/m/Y à H:i') }}<br>
                    Plan officiel d'affectation et de placement des étudiants en salle d'examen.
                </td>
                <td style="text-align: right; vertical-align: middle; font-size: 7.2pt; font-weight: bold; color: #002e5b; white-space: nowrap;">
                    ENCG FÈS &bull; EXAM-{{ str_pad($exam->id, 4, '0', STR_PAD_LEFT) }}
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
