<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Emploi du Temps Officiel — {{ $studentName ?? 'Étudiant' }} — ENCG Fès</title>
    <style>
        @page { 
            size: A4 landscape; 
            margin: 3.5mm 5mm 3.5mm 5mm; 
        }
        * { 
            box-sizing: border-box; 
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 6.8pt;
            line-height: 1.15;
            background: #ffffff;
        }
        .page-container {
            border: 1.8px solid #002147;
            padding: 4px;
            background: #ffffff;
            position: relative;
            page-break-inside: avoid;
        }

        /* En-tête officiel ENCG Fès */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 2px;
        }
        .header-table td {
            vertical-align: middle;
            border: none;
            padding: 0;
        }
        .gold-divider {
            height: 2.2px;
            background: #c9a227;
            margin: 2px 0 3px 0;
        }

        /* Bannière Titre (Table 100% pleine largeur) */
        .title-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 3px;
        }
        .title-cell {
            background-color: #002147;
            color: #ffffff;
            text-align: center;
            padding: 3.5px 6px;
            border-radius: 2px;
            border: none;
        }
        .title-cell h1 {
            font-size: 10.5pt;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.1;
        }
        .title-cell .sub {
            font-size: 6.5pt;
            font-weight: bold;
            color: #fde047;
            margin-top: 1.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Dossier Académique Étudiant (Table 100% pleine largeur) */
        .dossier-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 3px;
        }
        .dossier-cell {
            border: 1px solid #cbd5e1;
            padding: 2.5px 5px;
            background: #f8fafc;
            vertical-align: top;
        }
        .tile-label {
            font-size: 4.8pt;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 1.5px;
            line-height: 1;
        }
        .tile-value {
            font-size: 6.6pt;
            font-weight: 800;
            color: #002147;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        }
        .tile-mono {
            font-family: monospace;
            font-size: 6.8pt;
            color: #002147;
            font-weight: 900;
        }
        .badge-pill {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 6.0pt;
            font-weight: 800;
            line-height: 1.1;
        }
        .badge-section {
            background: #eff6ff;
            color: #1d4ed8;
            border: 0.8px solid #bfdbfe;
        }
        .badge-subgroup {
            background: #f5f3ff;
            color: #6d28d9;
            border: 0.8px solid #ddd6fe;
        }
        .badge-group {
            background: #f1f5f9;
            color: #0f172a;
            border: 0.8px solid #cbd5e1;
        }
        .badge-valid {
            background: #ecfdf5;
            color: #047857;
            border: 0.8px solid #a7f3d0;
        }

        /* Pastille verte en pur CSS (aucun caractère spécial) */
        .dot-green {
            display: inline-block;
            width: 4.5px;
            height: 4.5px;
            background-color: #059669;
            border-radius: 50%;
            vertical-align: middle;
            margin-right: 2px;
        }

        /* Calendrier officiel (Table 100% pleine largeur) */
        .dates-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 3px;
        }
        .dates-cell {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-left: 3.5px solid #c9a227;
            padding: 2.5px 6px;
            font-size: 6.0pt;
            color: #1e293b;
            line-height: 1.15;
            border-radius: 2px;
        }

        /* Grille Hebdomadaire (Plein écran A4 paysage) */
        table.grid {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 3px;
            page-break-inside: avoid;
        }
        table.grid th, table.grid td {
            border: 1px solid #94a3b8;
            padding: 2px;
            text-align: center;
            vertical-align: top;
        }
        table.grid th.header-col {
            background-color: #002147;
            color: #ffffff;
            font-size: 7.2pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 4px 1px;
            border: 1px solid #00152e;
            border-bottom: 2.2px solid #c9a227;
        }
        table.grid th.slot-head {
            background-color: #f8fafc;
            color: #002147;
            font-size: 6.6pt;
            font-weight: 900;
            width: 62px;
            vertical-align: middle;
            padding: 2px 1px;
            border: 1px solid #94a3b8;
        }
        .period-tag {
            font-size: 4.8pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            padding: 0.5px 3px;
            border-radius: 1.5px;
            margin-bottom: 1.5px;
            display: inline-block;
            text-transform: uppercase;
        }
        .period-tag.matin {
            background: #e0f2fe;
            color: #0369a1;
            border: 0.5px solid #bae6fd;
        }
        .period-tag.apres-midi {
            background: #fef3c7;
            color: #b45309;
            border: 0.5px solid #fde68a;
        }
        .slot-time-box {
            line-height: 1.2;
        }

        /* Cell content height */
        .cell-content {
            height: 70px;
            min-height: 70px;
            max-height: 70px;
            display: block;
            overflow: hidden;
        }

        /* Session cards */
        .session-card {
            border-radius: 2px;
            padding: 2.5px 4px;
            text-align: left;
            margin: 0;
            height: 66px;
            overflow: hidden;
            box-sizing: border-box;
        }
        .session-card.cm {
            background: #f0f7ff;
            border: 0.8px solid #93c5fd;
            border-left: 4px solid #1d4ed8;
        }
        .session-card.td {
            background: #faf5ff;
            border: 0.8px solid #d8b4fe;
            border-left: 4px solid #7c3aed;
        }
        .session-card.tp {
            background: #f0fdf4;
            border: 0.8px solid #86efac;
            border-left: 4px solid #059669;
        }
        .badge-type {
            display: inline-block;
            font-size: 5.5pt;
            font-weight: 900;
            padding: 1px 4px;
            border-radius: 1.5px;
            text-transform: uppercase;
            color: #ffffff;
            background: #002147;
        }
        .badge-type.cm { background: #1d4ed8; }
        .badge-type.td { background: #7c3aed; }
        .badge-type.tp { background: #059669; }

        .session-time-text {
            font-size: 5.4pt;
            color: #475569;
            font-weight: bold;
            float: right;
            margin-top: 1px;
        }
        .session-title {
            font-size: 6.6pt;
            font-weight: 900;
            color: #002147;
            line-height: 1.15;
            margin: 2px 0 1.5px 0;
            max-height: 22px;
            overflow: hidden;
        }
        .session-prof {
            font-size: 5.6pt;
            color: #334155;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 1.5px;
        }
        .session-room-badge {
            display: inline-block;
            background: #fef2f2;
            border: 0.6px solid #fecaca;
            border-radius: 2px;
            padding: 1px 3px;
            font-size: 5.4pt;
            color: #b91c1c;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 95%;
        }

        .empty-slot {
            height: 66px;
            display: table;
            width: 100%;
            background-color: #fafbfc;
            border: 0.6px dashed #e2e8f0;
            border-radius: 2px;
            box-sizing: border-box;
        }
        .empty-slot-content {
            display: table-cell;
            vertical-align: middle;
            text-align: center;
            color: #cbd5e1;
            font-size: 10pt;
        }

        /* LIGNE DE PAUSE DÉJEUNER OFFICIELLE (Séparation Matin / Après-Midi) */
        tr.pause-row td.pause-cell {
            background: #fffbeb;
            border: 1.2px solid #f59e0b;
            padding: 2.5px 6px;
            vertical-align: middle;
            text-align: center;
        }
        .pause-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .pause-table td {
            border: none;
            padding: 0;
            vertical-align: middle;
        }
        .pause-badge {
            display: inline-block;
            background: #d97706;
            color: #ffffff;
            font-size: 5.5pt;
            font-weight: 900;
            padding: 1px 5px;
            border-radius: 2px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .pause-title {
            color: #92400e;
            font-size: 6.4pt;
            font-weight: 900;
            letter-spacing: 0.4px;
        }
        .pause-sub {
            color: #b45309;
            font-size: 5.6pt;
            font-weight: 800;
        }

        /* Cartouche Officiel de Vérification Électronique (Table 100% pleine largeur) */
        .verification-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #94a3b8;
            background: #ffffff;
            margin-top: 2px;
        }
        .verification-cell {
            border: none;
            vertical-align: middle;
            padding: 3px 5px;
        }
        .qr-card {
            border: 0.8px solid #cbd5e1;
            background: #ffffff;
            border-radius: 2px;
            padding: 2px;
            display: inline-block;
        }
        .stamp-box {
            border: 1.5px dashed #002147;
            border-radius: 2px;
            padding: 3px 6px;
            text-align: center;
            background: #fdfdfd;
        }
        .stamp-title {
            font-size: 6.4pt;
            font-weight: 900;
            color: #002147;
            text-transform: uppercase;
        }
        .stamp-sub {
            font-size: 5.2pt;
            color: #475569;
            font-weight: bold;
            margin-top: 0.5px;
        }
        .stamp-badge {
            display: inline-block;
            margin-top: 2px;
            padding: 1.5px 5px;
            background: #ecfdf5;
            border: 0.8px solid #a7f3d0;
            border-radius: 2px;
            color: #047857;
            font-size: 5.2pt;
            font-weight: 900;
        }
    </style>
</head>
<body>

<div class="page-container">
    <!-- En-tête officiel ENCG Fès -->
    <table class="header-table">
        <tr>
            <td style="width: 25%; text-align: left;">
                <strong style="color:#002147; font-size: 7.2pt;">ROYAUME DU MAROC</strong><br/>
                <span style="font-size: 5.8pt; color: #475569;">Université Sidi Mohamed Ben Abdellah</span><br/>
                <strong style="color:#002147; font-size: 6.5pt;">ENCG FÈS</strong>
            </td>
            <td style="width: 50%; text-align: center;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG" style="height: 32px; max-width: 150px;"/>
                @else
                    <div style="font-size: 9.5pt; font-weight: 900; color: #002147; letter-spacing: 0.5px;">
                        ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS
                    </div>
                @endif
                <div style="font-size: 6.0pt; color: #c9a227; font-weight: bold; margin-top: 1px; letter-spacing: 0.4px;">
                    DIRECTION DES AFFAIRES PÉDAGOGIQUES & DE LA SCOLARITÉ
                </div>
            </td>
            <td style="width: 25%; text-align: right;">
                <span style="font-size: 6.0pt; color: #64748b;">Année Universitaire : <strong style="color: #002147;">{{ $academicYear ?? '2026/2027' }}</strong></span><br/>
                <span style="font-size: 5.5pt; color: #64748b;">Édition officielle : <strong>{{ now()->format('d/m/Y à H:i') }}</strong></span><br/>
                <span style="font-family: monospace; font-size: 5.2pt; color: #94a3b8;">REF : ENCG-EDT-{{ strtoupper(substr(md5(($cne ?? 'ENCG').'2026'), 0, 8)) }}</span>
            </td>
        </tr>
    </table>

    <div class="gold-divider"></div>

    <!-- Titre (Table pleine largeur) -->
    <table class="title-table">
        <tr>
            <td class="title-cell">
                <h1>EMPLOI DU TEMPS OFFICIEL DE L'ÉTUDIANT</h1>
                <div class="sub">
                    ARCHITECTURE PÉDAGOGIQUE ENCG FÈS — {{ $filiereName ?? 'Tronc Commun ENCG' }} • SEMESTRE {{ $semesterNumber ?? 2 }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Dossier Académique Étudiant (Table 100% pleine largeur, zéro caractère spécial) -->
    <table class="dossier-table">
        <tr>
            <td class="dossier-cell" style="width: 25%;">
                <div class="tile-label">ÉTUDIANT (NOM & PRÉNOM)</div>
                <div class="tile-value">{{ $studentName }}</div>
            </td>
            <td class="dossier-cell" style="width: 25%;">
                <div class="tile-label">CODE CNE / MASSAR</div>
                <div class="tile-value tile-mono">{{ $cne }}</div>
            </td>
            <td class="dossier-cell" style="width: 25%;">
                <div class="tile-label">CARTE D'IDENTITÉ (CIN)</div>
                <div class="tile-value">{{ $cin }}</div>
            </td>
            <td class="dossier-cell" style="width: 25%;">
                <div class="tile-label">FILIÈRE & SEMESTRE</div>
                <div class="tile-value">{{ $filiereName }} (S{{ $semesterNumber ?? 2 }})</div>
            </td>
        </tr>
        <tr>
            <td class="dossier-cell">
                <div class="tile-label">SECTION AMPHI (COURS MAGISTRAUX)</div>
                <div class="tile-value">
                    <span class="badge-pill badge-section">Section {{ $sectionNumber ?? (preg_match('/(\d+)/', $section ?? '', $m) ? $m[1] : '1') }} (~100 étud.)</span>
                </div>
            </td>
            <td class="dossier-cell">
                <div class="tile-label">SOUS-GROUPE (TD / TP - ORDRE ALPHA)</div>
                <div class="tile-value">
                    <span class="badge-pill badge-subgroup">Sous-Groupe {{ $subGroup ?? 'G1.2' }} (Alpha)</span>
                </div>
            </td>
            <td class="dossier-cell">
                <div class="tile-label">GROUPE DE RATTACHEMENT</div>
                <div class="tile-value">
                    <span class="badge-pill badge-group">{{ $groupName ?? 'TC-S2-G1' }}</span>
                </div>
            </td>
            <td class="dossier-cell">
                <div class="tile-label">STATUT DU DOSSIER</div>
                <div class="tile-value">
                    <span class="badge-pill badge-valid"><span class="dot-green"></span> INSCRIPTION VALIDÉE (ACTIF)</span>
                </div>
            </td>
        </tr>
    </table>

    <!-- Calendrier Officiel de Démarrage (Table pleine largeur) -->
    <table class="dates-table">
        <tr>
            <td class="dates-cell">
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                    <tr>
                        <td style="width: 26%; text-align: left;">
                            <strong style="color: #002147; font-size: 6.2pt; text-transform: uppercase;">CALENDRIER PÉDAGOGIQUE :</strong>
                        </td>
                        <td style="width: 37%; text-align: left;">
                            Cours Magistraux (CM en Amphi) : <strong style="color: #1d4ed8;">{{ $coursStart ?? '15 Septembre 2026' }}</strong>
                        </td>
                        <td style="width: 37%; text-align: left;">
                            Travaux Dirigés & Pratiques (TD/TP) : <strong style="color: #7c3aed;">{{ $tdTpStart ?? '22 Septembre 2026' }}</strong>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @php
        $days = [
            1 => 'LUNDI',
            2 => 'MARDI',
            3 => 'MERCREDI',
            4 => 'JEUDI',
            5 => 'VENDREDI',
            6 => 'SAMEDI'
        ];

        // Séances du matin
        $matinSlots = [
            ['label' => '08h30 - 10h30', 'start' => '08:30', 'end' => '10:30', 'period' => 'matin', 'period_label' => 'MATIN'],
            ['label' => '10h45 - 12h45', 'start' => '10:45', 'end' => '12:45', 'period' => 'matin', 'period_label' => 'MATIN'],
        ];

        // Séances de l'après-midi
        $apresMidiSlots = [
            ['label' => '14h30 - 16h30', 'start' => '14:30', 'end' => '16:30', 'period' => 'apres-midi', 'period_label' => 'APRÈS-MIDI'],
            ['label' => '16h45 - 18h45', 'start' => '16:45', 'end' => '18:45', 'period' => 'apres-midi', 'period_label' => 'APRÈS-MIDI'],
        ];
    @endphp

    <!-- Grille Matrice Officielle (A4 Landscape Single-Page Fit) -->
    <table class="grid">
        <thead>
            <tr>
                <th class="header-col" style="width: 62px;">HORAIRES</th>
                @foreach($days as $dayKey => $dayName)
                    <th class="header-col">{{ $dayName }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            <!-- SÉANCES DE LA MATINÉE -->
            @foreach($matinSlots as $slot)
                <tr>
                    <th class="slot-head">
                        <span class="period-tag matin">MATIN</span>
                        <div class="slot-time-box">
                            <div>{{ explode(' - ', $slot['label'])[0] }}</div>
                            <div style="font-size: 5.0pt; color: #64748b;">à</div>
                            <div>{{ explode(' - ', $slot['label'])[1] }}</div>
                        </div>
                    </th>
                    @foreach($days as $dayKey => $dayName)
                        @php
                            $matchingSessions = $schedules->filter(function($s) use ($dayKey, $slot) {
                                $sameDay = (int)$s->day_of_week === (int)$dayKey;
                                $sessionStart = substr((string)$s->start_time, 0, 5);
                                return $sameDay && $sessionStart === $slot['start'];
                            });
                        @endphp
                        <td>
                            <div class="cell-content">
                                @if($matchingSessions->isNotEmpty())
                                    @foreach($matchingSessions as $session)
                                        @php
                                            $rawType = strtolower($session->session_type ?? $session->type ?? 'cm');
                                            $isCm = str_contains($rawType, 'cm') || str_contains($rawType, 'magistral');
                                            $isTd = str_contains($rawType, 'td') || str_contains($rawType, 'dirig');
                                            $isTp = str_contains($rawType, 'tp') || str_contains($rawType, 'prat');
                                            $typeClass = $isCm ? 'cm' : ($isTd ? 'td' : ($isTp ? 'tp' : 'cm'));
                                            $typeLabel = $isCm ? 'CM' : ($isTd ? 'TD' : ($isTp ? 'TP' : strtoupper($rawType)));

                                            $moduleName = $session->module->name ?? $session->module_name ?? $session->title ?? 'Module';
                                            $roomName = $session->room->name ?? $session->room_name ?? $session->location ?? 'Salle non assignée';
                                            $profName = $session->professor->user->name ?? $session->professor ?? 'Enseignant';
                                            if (!str_starts_with($profName, 'Pr.') && !str_starts_with($profName, 'Dr.')) {
                                                $profName = 'Pr. ' . $profName;
                                            }
                                        @endphp
                                        <div class="session-card {{ $typeClass }}">
                                            <div>
                                                <span class="badge-type {{ $typeClass }}">{{ $typeLabel }}</span>
                                                <span class="session-time-text">
                                                    {{ substr((string)$session->start_time, 0, 5) }} - {{ substr((string)$session->end_time, 0, 5) }}
                                                </span>
                                            </div>
                                            <div class="session-title">{{ $moduleName }}</div>
                                            <div class="session-prof">{{ $profName }}</div>
                                            <div>
                                                <span class="session-room-badge">Lieu : {{ $roomName }}</span>
                                            </div>
                                        </div>
                                    @endforeach
                                @else
                                    <div class="empty-slot">
                                        <div class="empty-slot-content">—</div>
                                    </div>
                                @endif
                            </div>
                        </td>
                    @endforeach
                </tr>
            @endforeach

            <!-- PAUSE DÉJEUNER & REPAS (SÉPARATION OFFICIELLE MATIN / APRÈS-MIDI) -->
            <tr class="pause-row">
                <td colspan="7" class="pause-cell">
                    <table class="pause-table">
                        <tr>
                            <td style="width: 25%; text-align: left;">
                                <span class="pause-badge">PAUSE MÉRIDIENNE</span>
                                <span style="font-size: 5.6pt; color: #78350f; font-weight: bold; margin-left: 3px;">Interruption</span>
                            </td>
                            <td style="width: 50%; text-align: center;">
                                <span class="pause-title">
                                    PAUSE DÉJEUNER & REPAS : 12H45 À 14H30 • DURÉE OFFICIELLE : 1H45
                                </span>
                            </td>
                            <td style="width: 25%; text-align: right;">
                                <span class="pause-sub">REPRISE DES COURS À 14H30</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- SÉANCES DE L'APRÈS-MIDI -->
            @foreach($apresMidiSlots as $slot)
                <tr>
                    <th class="slot-head">
                        <span class="period-tag apres-midi">APRÈS-MIDI</span>
                        <div class="slot-time-box">
                            <div>{{ explode(' - ', $slot['label'])[0] }}</div>
                            <div style="font-size: 5.0pt; color: #64748b;">à</div>
                            <div>{{ explode(' - ', $slot['label'])[1] }}</div>
                        </div>
                    </th>
                    @foreach($days as $dayKey => $dayName)
                        @php
                            $matchingSessions = $schedules->filter(function($s) use ($dayKey, $slot) {
                                $sameDay = (int)$s->day_of_week === (int)$dayKey;
                                $sessionStart = substr((string)$s->start_time, 0, 5);
                                return $sameDay && $sessionStart === $slot['start'];
                            });
                        @endphp
                        <td>
                            <div class="cell-content">
                                @if($matchingSessions->isNotEmpty())
                                    @foreach($matchingSessions as $session)
                                        @php
                                            $rawType = strtolower($session->session_type ?? $session->type ?? 'cm');
                                            $isCm = str_contains($rawType, 'cm') || str_contains($rawType, 'magistral');
                                            $isTd = str_contains($rawType, 'td') || str_contains($rawType, 'dirig');
                                            $isTp = str_contains($rawType, 'tp') || str_contains($rawType, 'prat');
                                            $typeClass = $isCm ? 'cm' : ($isTd ? 'td' : ($isTp ? 'tp' : 'cm'));
                                            $typeLabel = $isCm ? 'CM' : ($isTd ? 'TD' : ($isTp ? 'TP' : strtoupper($rawType)));

                                            $moduleName = $session->module->name ?? $session->module_name ?? $session->title ?? 'Module';
                                            $roomName = $session->room->name ?? $session->room_name ?? $session->location ?? 'Salle non assignée';
                                            $profName = $session->professor->user->name ?? $session->professor ?? 'Enseignant';
                                            if (!str_starts_with($profName, 'Pr.') && !str_starts_with($profName, 'Dr.')) {
                                                $profName = 'Pr. ' . $profName;
                                            }
                                        @endphp
                                        <div class="session-card {{ $typeClass }}">
                                            <div>
                                                <span class="badge-type {{ $typeClass }}">{{ $typeLabel }}</span>
                                                <span class="session-time-text">
                                                    {{ substr((string)$session->start_time, 0, 5) }} - {{ substr((string)$session->end_time, 0, 5) }}
                                                </span>
                                            </div>
                                            <div class="session-title">{{ $moduleName }}</div>
                                            <div class="session-prof">{{ $profName }}</div>
                                            <div>
                                                <span class="session-room-badge">Lieu : {{ $roomName }}</span>
                                            </div>
                                        </div>
                                    @endforeach
                                @else
                                    <div class="empty-slot">
                                        <div class="empty-slot-content">—</div>
                                    </div>
                                @endif
                            </div>
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Cartouche Officiel de Vérification Électronique & Signature (Table 100% pleine largeur) -->
    <table class="verification-table">
        <tr>
            <!-- 1. QR Code & Instructions de Scan -->
            <td class="verification-cell" style="width: 32%;">
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                    <tr>
                        <td style="width: 58px; vertical-align: middle; padding-right: 4px;">
                            @if(!empty($qrBase64))
                                <div class="qr-card">
                                    <img src="{{ $qrBase64 }}" alt="QR Code Vérification" style="width: 54px; height: 54px; display: block;"/>
                                </div>
                            @else
                                <div style="width: 54px; height: 54px; border: 1px dashed #cbd5e1; text-align: center; line-height: 54px; font-size: 6pt; color: #94a3b8;">
                                    QR VERIFY
                                </div>
                            @endif
                        </td>
                        <td style="vertical-align: middle; line-height: 1.2;">
                            <div style="font-size: 6.2pt; font-weight: 900; color: #002147; text-transform: uppercase;">
                                SCAN POUR VÉRIFICATION
                            </div>
                            <div style="font-size: 5.4pt; font-weight: 900; color: #059669; margin: 1px 0;">
                                <span class="dot-green"></span> DOCUMENT CERTIFIÉ CONFORME
                            </div>
                            <div style="font-size: 4.8pt; color: #475569; line-height: 1.15;">
                                Scannez ce QR Code avec un smartphone pour authentifier l'emploi du temps et les affectations en temps réel sur le portail officiel de l'école.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>

            <!-- 2. Sécurité, Empreinte SHA-256 & Horodatage -->
            <td class="verification-cell" style="width: 38%; padding: 0 4px;">
                <div style="background: #f8fafc; border: 0.8px solid #cbd5e1; border-radius: 2px; padding: 2.5px 5px;">
                    <div style="font-size: 5.8pt; font-weight: 900; color: #002147; text-transform: uppercase;">
                        SIGNATURE NUMÉRIQUE & INTÉGRITÉ
                    </div>
                    <div style="font-family: monospace; font-size: 4.9pt; color: #0f172a; background: #f1f5f9; border: 0.5px solid #e2e8f0; padding: 1.5px 3px; border-radius: 2px; margin: 1px 0; word-break: break-all;">
                        SHA-256 : {{ $verifyToken ?? 'EDT-CERTIFIED-SECURE' }}
                    </div>
                    <div style="font-size: 4.8pt; color: #0284c7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        Vérification : {{ $verifyUrl ?? url('/') }}
                    </div>
                    <div style="font-size: 4.5pt; color: #64748b; margin-top: 1px;">
                        Système d'Information ERP ENCG Fès • Conforme à la loi 53-05 sur les documents électroniques.
                    </div>
                </div>
            </td>

            <!-- 3. Visa & Sceau Officiel de l'Administration -->
            <td class="verification-cell" style="width: 30%;">
                <div class="stamp-box">
                    <div class="stamp-title">POUR LE DIRECTEUR DE L'ÉCOLE</div>
                    <div class="stamp-sub">Le Directeur Adjoint aux Affaires Pédagogiques</div>
                    <div class="stamp-badge">
                        <span class="dot-green"></span> CACHET ÉLECTRONIQUE & VISA VALIDÉS
                    </div>
                    <div style="font-size: 4.5pt; color: #94a3b8; margin-top: 1.5px;">
                        RÉF-SIG : DAP-{{ date('Ymd') }}-AUTH-ENCG
                    </div>
                </div>
            </td>
        </tr>
    </table>
</div>

</body>
</html>
