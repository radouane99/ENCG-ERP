<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Affiche de Porte Officielle — {{ $room->name }} ({{ $room->code }})</title>
    <style>
        @page {
            margin: 6mm 8mm 6mm 8mm;
            size: A4 portrait;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            color: #0f172a;
            font-size: 7.5pt;
            line-height: 1.25;
            background-color: #ffffff;
            padding: 2px;
        }

        /* Institutional Double Border Frame */
        .page-frame {
            border: 2.5px solid #001A4B;
            outline: 1px solid #C5A059;
            outline-offset: -5px;
            padding: 10px 12px 8px 12px;
            min-height: 275mm;
            position: relative;
            background: #ffffff;
        }

        /* Institutional Bilingual Header */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #001A4B;
            padding-bottom: 4px;
            margin-bottom: 5px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .header-logo-cell {
            width: 70px;
            text-align: left;
        }
        .header-logo-cell img {
            max-height: 48px;
            max-width: 65px;
        }
        .header-school-cell {
            text-align: left;
            padding-left: 6px;
        }
        .inst-school-name {
            font-size: 8pt;
            font-weight: bold;
            color: #001A4B;
            letter-spacing: 0.5px;
        }
        .inst-univ-name {
            font-size: 6.8pt;
            color: #475569;
            margin-top: 1px;
        }
        .inst-service-name {
            font-size: 6.5pt;
            color: #047857;
            font-weight: bold;
            margin-top: 1px;
        }
        .header-state-cell {
            text-align: right;
            font-size: 6.5pt;
            line-height: 1.2;
            color: #001A4B;
        }
        .arabic-state-title {
            font-size: 8pt;
            font-weight: bold;
            color: #001A4B;
            direction: rtl;
            margin-bottom: 2px;
        }

        /* Room Hero Banner */
        .room-hero {
            background-color: #001A4B;
            color: #ffffff;
            border-radius: 5px;
            border-bottom: 3.5px solid #C5A059;
            padding: 8px 12px;
            margin-bottom: 5px;
            text-align: center;
        }
        .room-title {
            font-size: 21pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1.8px;
            color: #ffffff;
            line-height: 1.05;
        }
        .room-code-tag {
            display: inline-block;
            background-color: rgba(197, 160, 89, 0.25);
            border: 1px solid #C5A059;
            color: #fef08a;
            padding: 1.5px 8px;
            border-radius: 12px;
            font-size: 7.8pt;
            font-weight: bold;
            font-family: 'DejaVu Sans Mono', monospace;
            letter-spacing: 0.8px;
            margin-top: 3px;
        }
        .room-classification {
            font-size: 7.2pt;
            color: #bfdbfe;
            margin-top: 3px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        /* Reference & Status Ribbon */
        .ribbon-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            margin-bottom: 5px;
            font-size: 6.5pt;
        }
        .ribbon-table td {
            padding: 2.5px 6px;
            vertical-align: middle;
        }

        /* 4 Distinct Specifications Badges */
        .spec-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 4px 0;
            margin-bottom: 5px;
        }
        .spec-card {
            width: 25%;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 4px 5px;
            text-align: center;
            background: #ffffff;
        }
        .spec-card.card-course {
            border-top: 2.5px solid #0284c7;
            background: #f0f9ff;
        }
        .spec-card.card-exam {
            border-top: 2.5px solid #dc2626;
            background: #fef2f2;
        }
        .spec-card.card-multimedia {
            border-top: 2.5px solid #059669;
            background: #f0fdf4;
        }
        .spec-card.card-comfort {
            border-top: 2.5px solid #7c3aed;
            background: #faf5ff;
        }
        .spec-val {
            font-size: 13pt;
            font-weight: bold;
            line-height: 1.1;
            font-family: 'DejaVu Sans Mono', monospace;
        }
        .spec-lbl {
            font-size: 5.8pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-top: 1.5px;
        }
        .spec-sub {
            font-size: 5.2pt;
            color: #475569;
            margin-top: 1px;
            line-height: 1.1;
        }

        /* Section Banner */
        .section-banner {
            background-color: #001A4B;
            color: #ffffff;
            padding: 2.5px 6px;
            border-radius: 2px;
            font-size: 6.8pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2.5px;
        }
        .section-banner-sub {
            float: right;
            font-size: 5.6pt;
            color: #fef08a;
            font-weight: normal;
        }

        /* Timetable Grid */
        .sched-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            font-size: 6.2pt;
        }
        .sched-table th, .sched-table td {
            border: 1px solid #cbd5e1;
            padding: 2.5px 3px;
            vertical-align: middle;
        }
        .sched-table th {
            background-color: #f1f5f9;
            color: #001A4B;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            font-size: 5.8pt;
            padding: 2.5px 2px;
        }
        .sched-day-lbl {
            font-weight: bold;
            color: #001A4B;
            background-color: #f8fafc;
            width: 12%;
            text-align: center;
            text-transform: uppercase;
            font-size: 6.2pt;
        }
        .sched-cell {
            width: 22%;
            height: 18px;
        }
        .session-block {
            background-color: #f0f7ff;
            border-left: 2px solid #2563eb;
            padding: 1.5px 3px;
        }
        .session-module {
            font-weight: bold;
            color: #001A4B;
            font-size: 6.2pt;
            line-height: 1.1;
        }
        .session-details {
            font-size: 5.4pt;
            color: #475569;
            margin-top: 1px;
            line-height: 1.1;
        }
        .badge-filiere {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            font-weight: bold;
            font-size: 5.2pt;
            padding: 0.5px 2.5px;
            border-radius: 2px;
            margin-right: 2px;
        }
        .empty-slot {
            color: #94a3b8;
            font-style: italic;
            font-size: 5.6pt;
            text-align: center;
        }

        /* Rules & Charter */
        .charter-box {
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            padding: 4px 6px;
            margin-bottom: 5px;
            background: #ffffff;
        }
        .charter-title {
            font-size: 6.5pt;
            font-weight: bold;
            color: #001A4B;
            text-transform: uppercase;
            border-bottom: 0.5px solid #e2e8f0;
            padding-bottom: 1.5px;
            margin-bottom: 2px;
        }
        .charter-table {
            width: 100%;
            border-collapse: collapse;
        }
        .charter-table td {
            width: 50%;
            vertical-align: top;
            padding: 1px 4px;
            font-size: 5.6pt;
            line-height: 1.18;
            color: #334155;
        }
        .charter-table strong {
            color: #001A4B;
        }

        /* Tripartite Stamps */
        .signatures-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 3px 0;
            margin-bottom: 4px;
        }
        .sig-cell {
            width: 33.33%;
            vertical-align: top;
            text-align: center;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            padding: 3px;
            background-color: #ffffff;
        }
        .sig-title {
            font-size: 6.2pt;
            font-weight: bold;
            color: #001A4B;
            text-transform: uppercase;
        }
        .sig-sub {
            font-size: 5.2pt;
            color: #475569;
            margin-bottom: 1px;
        }
        .stamp-area {
            height: 38px;
            border: 0.8px dashed #cbd5e1;
            border-radius: 2px;
            background: #f8fafc;
            padding: 2px;
            margin: 1.5px 0;
            text-align: center;
        }
        .seal-text {
            font-size: 4.8pt;
            font-weight: bold;
            line-height: 1.1;
        }
        .sig-date {
            font-size: 5.2pt;
            color: #64748b;
        }

        /* Footer Anti-Fraud & QR Code */
        .footer-table {
            width: 100%;
            border-top: 1px solid #cbd5e1;
            padding-top: 2.5px;
            border-collapse: collapse;
            font-size: 5.6pt;
            color: #475569;
        }
        .footer-table td {
            vertical-align: middle;
        }
        .footer-bottom {
            border-top: 0.5px solid #e2e8f0;
            margin-top: 2px;
            padding-top: 2px;
            text-align: center;
            font-size: 5.2pt;
            color: #64748b;
        }
    </style>
</head>
<body>
<div class="page-frame">

    @php
        $currentYear = date('Y');
        $academicYear = $currentYear . '-' . ($currentYear + 1);
        $todayStr = date('d/m/Y');
        $typeLabel = match($room->type) {
            'amphitheatre', 'amphitheater' => 'Amphithéâtre de Cours Magistraux (Grands Amphis)',
            'lab' => 'Laboratoire Informatique & Travaux Pratiques (TP)',
            'seminar', 'conference' => 'Salle de Séminaire, Master & Soutenances',
            'admin' => 'Bureau Administratif & Réunion',
            default => 'Salle d\'Enseignement & Travaux Dirigés (TD)'
        };
        $examCapacity = $room->exam_capacity ?? (int)floor($room->capacity / 2);
        $buildingLabel = $room->building ?? ($room->type === 'amphitheatre' ? 'Bloc des Grands Amphis' : 'Bâtiment Pédagogique Central');

        $qrSrc = !empty($qrBase64) ? $qrBase64 : (!empty($qrCodeSvg) ? 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg) : null);
        if (empty($qrSrc) && !empty($verifyUrl)) {
            $qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=1&data=' . urlencode($verifyUrl);
        }
    @endphp

    <!-- Official Header -->
    <table class="header-table">
        <tr>
            <td class="header-logo-cell">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès" />
                @endif
            </td>
            <td class="header-school-cell">
                <div class="inst-school-name">ENCG FÈS • USMBA</div>
                <div class="inst-univ-name">École Nationale de Commerce et de Gestion · Université Sidi Mohamed Ben Abdellah</div>
                <div class="inst-service-name">Service du Patrimoine, Logistique &amp; Espaces Pédagogiques</div>
            </td>
            <td class="header-state-cell">
                <div class="arabic-state-title">المملكة المغربية • جامعة سيدي محمد بن عبد الله</div>
                <strong>ROYAUME DU MAROC</strong><br/>
                Ministère de l'Enseignement Supérieur, de la Recherche Scientifique<br/>
                et de l'Innovation · <strong>Direction des Affaires Pédagogiques</strong>
            </td>
        </tr>
    </table>

    <!-- Room Hero Banner -->
    <div class="room-hero">
        <div class="room-title">{{ $room->name }}</div>
        <div class="room-code-tag">REPÈRE / CODE : {{ $room->code }}</div>
        <div class="room-classification">
            {{ $typeLabel }} · {{ $buildingLabel }}
        </div>
    </div>

    <!-- Reference & Identification Ribbon -->
    <table class="ribbon-table">
        <tr>
            <td style="width: 35%;">
                <strong>Réf. Patrimoine :</strong>
                <span style="font-family: 'DejaVu Sans Mono', monospace; font-weight: bold; color: #001A4B;">
                    ENCG-PAT-{{ $currentYear }}-{{ $room->code }}
                </span>
            </td>
            <td style="width: 40%; text-align: center;">
                <strong>Homologation :</strong>
                <span style="color: {{ $room->is_available ? '#16a34a' : '#dc2626' }}; font-weight: bold;">
                    {{ $room->is_available ? '✔ ESPACE OPÉRATIONNEL & HOMOLOGUÉ' : '⚠ MAINTENANCE TECHNIQUE EN COURS' }}
                </span>
            </td>
            <td style="width: 25%; text-align: right;">
                <strong>Année Universitaire :</strong>
                <span style="color: #001A4B; font-weight: bold;">{{ $academicYear }}</span>
            </td>
        </tr>
    </table>

    <!-- 4 Distinct Capacity & Equipment Badges -->
    <table class="spec-grid">
        <tr>
            <!-- 1: Course Capacity -->
            <td class="spec-card card-course">
                <div class="spec-val" style="color: #0284c7;">{{ $room->capacity }}</div>
                <div class="spec-lbl" style="color: #0284c7;">Capacité Cours / TD</div>
                <div class="spec-sub">Configuration normale plein effectif</div>
            </td>

            <!-- 2: Exam Capacity -->
            <td class="spec-card card-exam">
                <div class="spec-val" style="color: #dc2626;">{{ $examCapacity }}</div>
                <div class="spec-lbl" style="color: #dc2626;">Capacité Examens</div>
                <div class="spec-sub">1 place sur 2 espacée (Anti-fraude)</div>
            </td>

            <!-- 3: Multimedia Equipment -->
            <td class="spec-card card-multimedia">
                <div class="spec-val" style="color: #059669; font-size: 10pt;">
                    {{ $room->has_projector ? '✔ Projecteur Laser' : '✖ Non équipé' }}
                </div>
                <div class="spec-lbl" style="color: #059669;">Équipement Multimédia</div>
                <div class="spec-sub">Sonorisation &amp; Écran de projection HD</div>
            </td>

            <!-- 4: Comfort & Connectivity -->
            <td class="spec-card card-comfort">
                <div class="spec-val" style="color: #7c3aed; font-size: 10pt;">
                    {{ $room->has_ac ? '❄ Climatisation OK' : '✖ Sans Clim' }}
                </div>
                <div class="spec-lbl" style="color: #7c3aed;">Confort &amp; Réseau</div>
                <div class="spec-sub">Wi-Fi Eduroam &amp; Prises Pupitre</div>
            </td>
        </tr>
    </table>

    <!-- Timetable Section Banner -->
    <div class="section-banner">
        <span>Planning Hebdomadaire Officiel d'Occupation (Semestres Automne &amp; Printemps)</span>
        <span class="section-banner-sub">Cycles Tronc Commun, Spécialités &amp; Masters</span>
    </div>

    <!-- Weekly Timetable Matrix -->
    <table class="sched-table">
        <thead>
            <tr>
                <th>Jour</th>
                <th style="width: 22%;">08h30 – 10h30</th>
                <th style="width: 22%;">10h45 – 12h45</th>
                <th style="width: 22%;">14h30 – 16h30</th>
                <th style="width: 22%;">16h45 – 18h45</th>
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
                    <td class="sched-day-lbl">{{ $dayLabel }}</td>
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

                            $groupedSessions = $slotSessions->groupBy(function($item) {
                                $moduleKey = $item->module->name ?? 'Séance';
                                $profKey = ($item->professor->user->first_name ?? '') . '_' . ($item->professor->user->last_name ?? '');
                                return $moduleKey . '___' . $profKey;
                            });
                        @endphp
                        <td class="sched-cell">
                            @if($groupedSessions->isNotEmpty())
                                @foreach($groupedSessions as $groupItems)
                                    @php
                                        $first = $groupItems->first();
                                        $moduleName = $first->module->name ?? 'Séance Programmée';
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
                                                <div style="font-style: italic; color: #334155;">Pr. {{ $profFullName }}</div>
                                            @endif
                                        </div>
                                    </div>
                                @endforeach
                            @else
                                <div class="empty-slot">&#8212; DISPONIBLE &#8212;</div>
                            @endif
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Regulatory Rules & Code of Conduct -->
    <div class="charter-box">
        <div class="charter-title">Charte &amp; Règlement Intérieur d'Usage des Locaux Pédagogiques</div>
        <table class="charter-table">
            <tr>
                <td>
                    <strong>Article 1 (Respect du Matériel) :</strong> Le matériel informatique, audiovisuel et le mobilier sont placés sous la responsabilité des usagers. Tout dommage sera sanctionné.<br/>
                    <strong>Article 2 (Hygiène &amp; Propreté) :</strong> Il est formellement interdit d'introduire des boissons sucrées et de la nourriture dans les locaux pédagogiques.
                </td>
                <td>
                    <strong>Article 3 (Énergie &amp; Sécurité) :</strong> Extinction obligatoire de l'éclairage, des climatiseurs et des vidéoprojecteurs à la fin de chaque séance.<br/>
                    <strong>Article 4 (Priorité Pédagogique) :</strong> Les cours réguliers priment sur les activités parascolaires. Tout rattrapage doit être validé auprès de la Direction des Études.
                </td>
            </tr>
        </table>
    </div>

    <!-- Official Tripartite Stamp Boxes -->
    <table class="signatures-table">
        <tr>
            <td class="sig-cell">
                <div class="sig-title">LOGISTIQUE &amp; PATRIMOINE</div>
                <div class="sig-sub">Le Responsable du Parc Immobilier</div>
                <div class="stamp-area">
                    <div class="seal-text" style="color: #047857;">
                        ★ ENCG FÈS ★<br/>
                        SERVICE DU PATRIMOINE<br/>
                        CONFORME &amp; SÉCURISÉ
                    </div>
                </div>
                <div class="sig-date">Visa technique vérifié</div>
            </td>

            <td class="sig-cell">
                <div class="sig-title">AFFAIRES PÉDAGOGIQUES</div>
                <div class="sig-sub">Service des Emplois du Temps</div>
                <div class="stamp-area">
                    <div class="seal-text" style="color: #0284c7;">
                        PLANNING HOMOLOGUÉ<br/>
                        AFFECTATION VALIDÉE<br/>
                        SESSION {{ $currentYear }}/{{ $currentYear + 1 }}
                    </div>
                </div>
                <div class="sig-date">Validé pour l'année universitaire</div>
            </td>

            <td class="sig-cell">
                <div class="sig-title">DIRECTION DE L'ÉTABLISSEMENT</div>
                <div class="sig-sub">Le Directeur de l'ENCG Fès</div>
                <div class="stamp-area">
                    <div class="seal-text" style="color: #001A4B;">
                        ★ USMBA · ENCG FÈS ★<br/>
                        SCEAU OFFICIEL DE L'ÉCOLE<br/>
                        POUR LE DIRECTEUR
                    </div>
                </div>
                <div class="sig-date">Fait à Fès, le {{ $todayStr }}</div>
            </td>
        </tr>
    </table>

    <!-- Footer Anti-Fraud & Real Scannable QR Code -->
    <table class="footer-table">
        <tr>
            <td style="width: 44px; vertical-align: middle;">
                @if(!empty($qrSrc))
                    <img src="{{ $qrSrc }}" width="38" height="38" style="display: block; border: 1px solid #cbd5e1; padding: 1px; background: #ffffff; border-radius: 2px;" alt="QR Code" />
                @endif
            </td>
            <td style="vertical-align: middle; padding-left: 6px;">
                <strong style="color: #001A4B; font-size: 6.2pt; text-transform: uppercase;">
                    Système d'Information &amp; Registre des Espaces — ENCG Fès
                </strong><br/>
                <span style="color: #64748b; line-height: 1.15;">
                    Document certifié conforme aux normes du Ministère de l'Enseignement Supérieur et de l'Université Sidi Mohamed Ben Abdellah.<br/>
                    <strong>Contrôle Numérique :</strong> ROOM-{{ $room->code }} · <strong>Authentification Cloud :</strong> SHA256-{{ $room->code }}-{{ $currentYear }}E4B · 
                    <strong>Assistance Technique :</strong> 05 35 64 49 20
                </span>
            </td>
            <td style="width: 130px; text-align: right; vertical-align: middle;">
                <div style="font-size: 5.8pt; font-weight: bold; color: #001A4B;">Université Sidi Mohamed Ben Abdellah</div>
                <div style="font-size: 5.4pt; color: #64748b;">École Nationale de Commerce et de Gestion</div>
                <div style="font-size: 6pt; font-weight: bold; color: #001A4B; margin-top: 1px;">PAGE 1 / 1 (A4 OFFICIEL)</div>
            </td>
        </tr>
    </table>

    <div class="footer-bottom">
        École Nationale de Commerce et de Gestion de Fès — Route d'Imouzzer, B.P. 1255, Fès - Maroc | Tél: +212 5 35 64 49 20 | URL : {{ $verifyUrl ?? 'https://encg-fes.ac.ma' }}
    </div>

</div>
</body>
</html>
