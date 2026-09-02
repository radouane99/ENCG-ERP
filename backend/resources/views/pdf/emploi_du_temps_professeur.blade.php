<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Emploi du Temps — {{ $profName ?? 'Enseignant' }} — ENCG Fès</title>
    <style>
        @page { 
            size: A4 landscape; 
            margin: 5mm 7mm 5mm 7mm; 
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 7.5pt;
            line-height: 1.25;
            background: #ffffff;
        }
        .outer-frame {
            border: 2px solid #001A4B;
            padding: 7px 9px;
            background: #ffffff;
            position: relative;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        .header-table td {
            vertical-align: middle;
            border: none;
            padding: 0;
        }
        .gold-divider {
            height: 2px;
            background: #c9a227;
            margin: 3px 0 5px 0;
        }
        .title-banner {
            background-color: #001A4B;
            color: #ffffff;
            text-align: center;
            padding: 4px 6px;
            border-radius: 3px;
            margin-bottom: 4px;
        }
        .title-banner h1 {
            font-size: 11pt;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
        }
        .title-banner .sub {
            font-size: 6.8pt;
            font-weight: bold;
            color: #fef08a;
            margin-top: 1px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-card {
            width: 100%;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            margin-bottom: 5px;
            border-radius: 3px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            font-size: 7.2pt;
            border: none;
            padding: 1.5px 3px;
            color: #334155;
        }
        .info-table strong {
            color: #001A4B;
        }

        /* Grille Hebdomadaire */
        table.grid {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 5px;
        }
        table.grid th, table.grid td {
            border: 0.8px solid #001A4B;
            vertical-align: middle;
            text-align: center;
            padding: 3px 2px;
        }
        table.grid th {
            background: #001A4B;
            color: #ffffff;
            font-size: 7.2pt;
            font-weight: bold;
            text-transform: uppercase;
            padding: 3px 2px;
        }
        table.grid th.slot-col {
            width: 12.5%;
            background: #082663;
        }
        .slot-time {
            font-weight: bold;
            font-size: 7pt;
            color: #001A4B;
            line-height: 1.1;
        }
        .slot-period {
            font-size: 5.5pt;
            color: #64748b;
            text-transform: uppercase;
        }
        .cell-card {
            background: #f1f5f9;
            border: 0.5px solid #cbd5e1;
            border-radius: 3px;
            padding: 2.5px 2px;
            text-align: center;
        }
        .course-title {
            font-weight: bold;
            font-size: 7.2pt;
            color: #001A4B;
            line-height: 1.15;
            margin-bottom: 1.5px;
        }
        .badge-type {
            font-size: 6pt;
            font-weight: 900;
            display: inline-block;
            padding: 0.5px 3.5px;
            border-radius: 2px;
            background: #001A4B;
            color: #ffffff;
            margin-right: 2px;
        }
        .badge-group {
            font-size: 6.5pt;
            font-weight: bold;
            color: #047857;
        }
        .badge-room {
            font-size: 6.5pt;
            font-weight: bold;
            color: #b91c1c;
            margin-top: 1px;
        }
        .cell-free {
            color: #94a3b8;
            font-size: 6.5pt;
            font-style: italic;
        }

        /* Tableau Récap */
        table.recap {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
            font-size: 6.8pt;
        }
        table.recap th, table.recap td {
            border: 0.5px solid #cbd5e1;
            padding: 2.5px 3px;
        }
        table.recap th {
            background: #e2e8f0;
            color: #001A4B;
            font-weight: bold;
            text-transform: uppercase;
        }

        /* Footer */
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3px;
        }
        .footer-table td {
            border: none;
            vertical-align: middle;
            font-size: 6.2pt;
            color: #475569;
            padding: 0 3px;
        }
        .sig-box {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 3px;
            height: 42px;
            padding: 3px;
            text-align: center;
            font-weight: bold;
            color: #1e293b;
            font-size: 6.5pt;
        }
    </style>
</head>
<body>

<div class="outer-frame">
    
    <!-- Header Institutionnel Officiel avec Logo et Textes Bilingues -->
    <table class="header-table">
        <tr>
            <!-- Logo Officiel ENCG Fès -->
            <td style="width: 28%; text-align: left;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" style="max-height: 44px; max-width: 100%; height: auto;" alt="ENCG Fès">
                @else
                    <div style="font-size: 10pt; font-weight: 900; color: #001A4B;">ENCG FÈS</div>
                    <div style="font-size: 6pt; color: #475569;">École Nationale de Commerce et de Gestion</div>
                @endif
            </td>

            <!-- En-tête Central -->
            <td style="width: 46%; text-align: center;">
                <div style="font-size: 7pt; font-weight: bold; color: #001A4B; text-transform: uppercase; line-height: 1.3;">
                    ROYAUME DU MAROC<br>
                    UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS<br>
                    <span style="font-size: 7.8pt; color: #001A4B; font-weight: 900;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</span>
                </div>
            </td>

            <!-- QR Code & Badge Certifié -->
            <td style="width: 26%; text-align: right;">
                <table style="float: right; border-collapse: collapse;">
                    <tr>
                        <td style="text-align: right; padding-right: 5px; vertical-align: middle;">
                            <div style="font-size: 6.5pt; font-weight: 900; color: #001A4B; text-transform: uppercase;">
                                DOCUMENT CERTIFIÉ
                            </div>
                            <div style="font-size: 5.5pt; color: #059669; font-weight: bold;">
                                Horodatage SHA-256
                            </div>
                        </td>
                        <td style="vertical-align: middle;">
                            @if(!empty($qrBase64))
                                <img src="{{ $qrBase64 }}" style="width: 38px; height: 38px; border: 1px solid #cbd5e1; padding: 1px; border-radius: 2px;" alt="QR Code">
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="gold-divider"></div>

    <!-- Title Banner -->
    <div class="title-banner">
        <h1>EMPLOI DU TEMPS INDIVIDUEL DE L'ENSEIGNANT</h1>
        <div class="sub">Année Universitaire {{ $academicYear ?? '2026/2027' }} · Semestre Courant · Planning Officiel d'Enseignement</div>
    </div>

    <!-- Informations Enseignant -->
    <div class="info-card">
        <table class="info-table">
            <tr>
                <td style="width: 36%;">Enseignant(e) : <strong style="font-size: 8pt; text-transform: uppercase;">Prof. {{ $profName }}</strong></td>
                <td style="width: 34%;">Département : <strong>{{ $departmentName }}</strong></td>
                <td style="width: 30%;">Statut / Grade : <strong>{{ $rank }}</strong></td>
            </tr>
            <tr>
                <td>Volume Hebdomadaire : <strong>{{ count($schedules) * 2 }} Heures</strong></td>
                <td>Nombre de Séances : <strong>{{ count($schedules) }} Séances / Semaine</strong></td>
                <td>Réf. Certification : <strong style="font-family: monospace;">EDT-PROF-{{ $profId }}-2026</strong></td>
            </tr>
        </table>
    </div>

    <!-- Grille Hebdomadaire Officielle -->
    @php
        $days = [1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi', 4 => 'Jeudi', 5 => 'Vendredi', 6 => 'Samedi'];
        $slots = [
            0 => ['label' => '08h30 - 10h30', 'period' => 'Matinée 1', 'min' => 8.0, 'max' => 10.4],
            1 => ['label' => '10h45 - 12h45', 'period' => 'Matinée 2', 'min' => 10.4, 'max' => 13.5],
            2 => ['label' => '14h30 - 16h30', 'period' => 'Après-midi 1', 'min' => 13.8, 'max' => 16.5],
            3 => ['label' => '16h45 - 18h45', 'period' => 'Après-midi 2', 'min' => 16.5, 'max' => 19.5],
        ];
    @endphp

    <table class="grid">
        <thead>
            <tr>
                <th class="slot-col">Créneaux</th>
                @foreach($days as $dKey => $dName)
                    <th>{{ $dName }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($slots as $sIdx => $slot)
                <tr>
                    <td>
                        <div class="slot-time">{{ $slot['label'] }}</div>
                        <div class="slot-period">{{ $slot['period'] }}</div>
                    </td>
                    @foreach($days as $dKey => $dName)
                        @php
                            $matchedSessions = $schedules->filter(function($s) use ($dKey, $slot) {
                                if ((int)$s->day_of_week !== $dKey) return false;
                                $timeStr = $s->start_time ?? '';
                                $parts = explode(':', str_replace('h', ':', $timeStr));
                                $h = (int)($parts[0] ?? 0);
                                $m = (int)($parts[1] ?? 0);
                                $dec = $h + ($m / 60);
                                return $dec >= $slot['min'] && $dec < $slot['max'];
                            });
                        @endphp
                        <td>
                            @if($matchedSessions->isNotEmpty())
                                @foreach($matchedSessions as $sess)
                                    <div class="cell-card">
                                        <div class="course-title">{{ $sess->module->name ?? 'Module' }}</div>
                                        <div>
                                            <span class="badge-type">{{ strtoupper($sess->session_type ?? 'CM') }}</span>
                                            <span class="badge-group">{{ $sess->group->name ?? 'Groupe 1' }}</span>
                                        </div>
                                        <div class="badge-room">📍 {{ $sess->room->name ?? 'Salle ENCG' }}</div>
                                    </div>
                                @endforeach
                            @else
                                <span class="cell-free">—</span>
                            @endif
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Tableau Récapitulatif -->
    <table class="recap">
        <thead>
            <tr>
                <th style="width: 12%; text-align: left;">Jour</th>
                <th style="width: 14%; text-align: left;">Horaire</th>
                <th style="width: 32%; text-align: left;">Module & Élément Pédagogique</th>
                <th style="width: 8%; text-align: center;">Type</th>
                <th style="width: 20%; text-align: left;">Filière & Groupe</th>
                <th style="width: 14%; text-align: center;">Salle</th>
            </tr>
        </thead>
        <tbody>
            @forelse($schedules as $sess)
                <tr>
                    <td style="font-weight: bold; color: #001A4B;">{{ $days[$sess->day_of_week] ?? 'Jour' }}</td>
                    <td style="font-family: monospace; font-weight: bold;">{{ substr($sess->start_time, 0, 5) }} - {{ substr($sess->end_time, 0, 5) }}</td>
                    <td style="font-weight: bold; color: #001A4B;">{{ $sess->module->name ?? 'Module' }}</td>
                    <td style="text-align: center; font-weight: bold;">
                        <span style="background: #001A4B; color: #fff; padding: 0.5px 3px; border-radius: 2px;">{{ strtoupper($sess->session_type ?? 'CM') }}</span>
                    </td>
                    <td style="font-weight: bold; color: #047857;">{{ $sess->group->name ?? 'Section 1' }}</td>
                    <td style="text-align: center; font-weight: bold; color: #b91c1c;">📍 {{ $sess->room->name ?? 'Salle ENCG' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 5px; color: #94a3b8;">Aucune séance programmée.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Signatures & Sécurité -->
    <table class="footer-table">
        <tr>
            <td style="width: 40%;">
                <div>Document édité le : <strong>{{ now()->format('d/m/Y à H:i') }}</strong></div>
                <div>Système Intégré de Gestion Universitaire — ENCG Fès</div>
                <div style="font-family: monospace; font-size: 5.2pt; color: #64748b; margin-top: 1px;">
                    SHA-256 : {{ $verifyToken ?? hash('sha256', 'EDT-PROF-'.$profId.'-'.now()->toDateString()) }}
                </div>
            </td>
            <td style="width: 30%;">
                <div class="sig-box">
                    Émargement Enseignant(e)<br>
                    <span style="font-size: 5.5pt; color: #64748b;">(Signature Électronique Certifiée)</span>
                </div>
            </td>
            <td style="width: 30%;">
                <div class="sig-box">
                    Cachet et Signature de la Direction<br>
                    <span style="font-size: 5.5pt; color: #64748b;">Direction des Études & Scolarité</span>
                </div>
            </td>
        </tr>
    </table>

</div>

</body>
</html>
