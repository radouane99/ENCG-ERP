<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Affiche de Porte — {{ $room->name ?? 'Salle d\'Examen' }}</title>
    <style>
        @page {
            margin: 7mm 10mm 7mm 10mm;
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
            font-size: 9pt;
            line-height: 1.2;
            background-color: #ffffff;
        }

        /* En-tête Institutionnel Officiel */
        .institution-header {
            width: 100%;
            border-bottom: 2px solid #002e5b;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .header-logo {
            width: 22%;
            vertical-align: middle;
        }
        .header-logo img {
            max-height: 44px;
            width: auto;
            display: block;
        }
        .header-center {
            width: 56%;
            text-align: center;
            vertical-align: middle;
        }
        .header-center .sub-title {
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #475569;
            font-weight: bold;
            margin: 0 0 1px 0;
        }
        .header-center .main-title {
            font-size: 11pt;
            font-weight: 900;
            color: #002e5b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 0 0 2px 0;
        }
        .header-center .document-badge {
            display: inline-block;
            background-color: #002e5b;
            color: #ffffff;
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            padding: 2px 12px;
            border-radius: 12px;
        }
        .header-right {
            width: 22%;
            text-align: right;
            vertical-align: middle;
            font-size: 7pt;
            color: #64748b;
            line-height: 1.2;
        }

        /* Bannière Visuelle de Salle & Épreuve */
        .hero-banner {
            width: 100%;
            background-color: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 6px;
            margin-bottom: 7px;
            border-collapse: collapse;
        }
        .hero-banner td {
            padding: 5px 8px;
            vertical-align: top;
        }
        .banner-cell-room {
            width: 28%;
            background-color: #002e5b;
            color: #ffffff;
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
            padding: 8px 10px !important;
            text-align: center;
        }
        .room-tag {
            font-size: 6.5pt;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #93c5fd;
            font-weight: 800;
            margin-bottom: 1px;
        }
        .room-name {
            font-size: 13pt;
            font-weight: 900;
            color: #ffffff;
            text-transform: uppercase;
            line-height: 1.1;
        }
        .room-capacity {
            font-size: 7.5pt;
            color: #fde047;
            font-weight: bold;
            margin-top: 2px;
        }

        .meta-label {
            font-size: 6.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            font-weight: bold;
            margin-bottom: 1px;
        }
        .meta-value {
            font-size: 9.5pt;
            font-weight: bold;
            color: #0f172a;
            line-height: 1.15;
        }
        .meta-sub {
            font-size: 7.5pt;
            color: #475569;
            font-weight: normal;
        }

        /* Barre de Consignes & Surveillants */
        .notice-bar {
            width: 100%;
            background-color: #f1f5f9;
            border-left: 3.5px solid #002e5b;
            padding: 3.5px 8px;
            margin-bottom: 7px;
            font-size: 7pt;
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
            padding: 4.5px 8px;
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-right: 1px solid #1e3a8a;
            text-align: left;
        }
        .seats-table th:last-child {
            border-right: none;
        }
        .seats-table td {
            padding: 3.8px 8px;
            border-bottom: 1px solid #e2e8f0;
            border-right: 1px solid #f1f5f9;
            font-size: 8.5pt;
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
            font-size: 8.5pt;
            padding: 2px 8px;
            border-radius: 10px;
            text-align: center;
            min-width: 48px;
        }
        .cne-code {
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            font-size: 8.5pt;
            color: #334155;
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
            text-transform: capitalize;
        }

        /* Footer & Signature de Vérification */
        .door-footer {
            margin-top: 7px;
            border-top: 1px solid #cbd5e1;
            padding-top: 4px;
            width: 100%;
        }
        .footer-table {
            width: 100%;
        }
        .footer-qr {
            width: 42px;
            vertical-align: middle;
        }
        .footer-qr img {
            width: 38px;
            height: 38px;
            display: block;
            border: 1px solid #cbd5e1;
            padding: 1px;
            background: #fff;
        }
        .footer-text {
            font-size: 6.5pt;
            color: #64748b;
            line-height: 1.25;
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
                @endif
            </td>
            <td class="header-center">
                <div class="sub-title">Royaume du Maroc - Universite Sidi Mohamed Ben Abdellah</div>
                <div class="main-title">Ecole Nationale de Commerce et de Gestion de Fes</div>
                <div class="document-badge">AFFICHE DE PORTE - REPARTITION DES PLACES</div>
            </td>
            <td class="header-right">
                <strong>Session :</strong> {{ $exam->examSession->name ?? 'Session d\'Examens' }}<br>
                <strong>Annee :</strong> {{ date('Y') }}/{{ date('Y') + 1 }}<br>
                <strong>Epreuve ID :</strong> EXAM-{{ str_pad($exam->id, 4, '0', STR_PAD_LEFT) }}
            </td>
        </tr>
    </table>

    {{-- Bannière Visuelle de Salle & Épreuve --}}
    <table class="hero-banner">
        <tr>
            <td class="banner-cell-room">
                <div class="room-tag">Local d'Examen</div>
                <div class="room-name">{{ $room->name ?? ($exam->room->name ?? 'Amphitheatre B') }}</div>
                <div class="room-capacity">Effectif : {{ count($seatings) }} Convoque(s)</div>
            </td>
            <td style="width: 42%; padding-left: 10px;">
                <div class="meta-label">Module / Epreuve Academique</div>
                <div class="meta-value" style="color: #002e5b; font-size: 10pt;">
                    {{ $exam->module->name ?? 'Examen' }}
                </div>
                <div class="meta-sub">
                    <strong>Filiere :</strong> {{ $exam->module?->filiere?->name ?? 'Tronc Commun ENCG' }}
                    @if($exam->group)
                        - <strong>Groupe :</strong> {{ $exam->group->name }}
                    @endif
                </div>
            </td>
            <td style="width: 30%; border-left: 1px dashed #cbd5e1; padding-left: 10px;">
                <div class="meta-label">Date & Horaires Officiels</div>
                <div class="meta-value">
                    {{ $dateFormatted ?? ($exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->translatedFormat('l d F Y') : 'Date a definir') }}
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
                        {{ $presidentName }} (President)
                    @endif
                    @if(!empty($surveillantNames) && count($surveillantNames) > 0)
                        - {{ implode(', ', $surveillantNames) }}
                    @elseif(empty($presidentName))
                        Comite de surveillance assigne par le Decanat
                    @endif
                </td>
                <td style="width: 42%; text-align: right; vertical-align: middle;">
                    <strong>Consigne :</strong> CNIE / Carte d'Etudiant obligatoire - Acces selon place assignee
                </td>
            </tr>
        </table>
    </div>

    {{-- Grille des Étudiants et Numéros de Sièges (3 COLONNES SANS ÉMARGEMENT) --}}
    <table class="seats-table">
        <thead>
            <tr>
                <th style="width: 16%; text-align: center;">N° Siege</th>
                <th style="width: 54%; text-align: center;">Nom & Prenom de l'Etudiant</th>
                <th style="width: 30%; text-align: center;">Code CNE / Massar</th>
            </tr>
        </thead>
        <tbody>
            @forelse($seatings as $seating)
                @php
                    $sStudent = is_array($seating) ? null : ($seating->student ?? null);
                    $sUser = $sStudent?->user ?? null;
                    
                    $lastName = is_array($seating)
                        ? ($seating['last_name'] ?? '')
                        : ($sUser?->last_name ?? $sStudent?->last_name ?? '');
                    
                    $firstName = is_array($seating)
                        ? ($seating['first_name'] ?? '')
                        : ($sUser?->first_name ?? $sStudent?->first_name ?? '');
                    
                    $cne = is_array($seating)
                        ? ($seating['cne'] ?? $seating['massar'] ?? '—')
                        : ($sStudent?->cne ?? $sStudent?->massar_code ?? $sStudent?->student_number ?? '—');
                    
                    $seatNum = is_array($seating)
                        ? ($seating['seat_number'] ?? $loop->iteration)
                        : ($seating->seat_number ?: $loop->iteration);

                    $hasName = !empty($lastName) || !empty($firstName);
                    $fullDisplayName = is_array($seating) 
                        ? ($seating['full_name'] ?? $seating['name'] ?? null)
                        : ($sUser?->name ?? null);
                @endphp
                <tr>
                    <td style="text-align: center;">
                        <span class="seat-pill">N° {{ sprintf('%02d', $seatNum) }}</span>
                    </td>
                    <td style="text-align: center;">
                        @if($hasName)
                            <span class="student-name-bold">{{ strtoupper($lastName) }}</span>
                            <span class="student-name-first">{{ ucfirst(strtolower($firstName)) }}</span>
                        @elseif(!empty($fullDisplayName))
                            <span class="student-name-bold">{{ strtoupper($fullDisplayName) }}</span>
                        @else
                            <span style="color: #94a3b8;">- Non renseigne -</span>
                        @endif
                    </td>
                    <td style="text-align: center;">
                        <span class="cne-code">{{ $cne }}</span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" style="text-align: center; color: #64748b; padding: 18px;">
                        Aucun etudiant place dans cette salle pour cette epreuve.
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
                    <span class="footer-legal">Document d'Affichage Officiel - Anti-Fraude Numerique (Loi 53-05)</span><br>
                    Authenticite certifiee par le Systeme d'Information ENCG Fes - Genere le {{ date('d/m/Y a H:i') }}<br>
                    Scannez le QR code de porte pour verifier la conformite du plan de placement et de la session en direct.
                </td>
                <td style="text-align: right; vertical-align: middle; font-size: 7.5pt; font-weight: bold; color: #002e5b;">
                    PAGE 1 / 1
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
