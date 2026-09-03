<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $mode === 'emargement' ? "Feuille d'Émargement" : "Procès-Verbal d'Examen Officiel" }} — ENCG Fès</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm 9mm 8mm 9mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            font-size: 8.5px;
            background-color: #ffffff;
            line-height: 1.15;
        }
        .outer-frame {
            border: 1.5px solid #001A4B;
            padding: 8px 10px;
            background-color: #ffffff;
        }
        
        /* Header styling */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            border-bottom: 1.5px solid #001A4B;
            padding-bottom: 4px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .header-left {
            width: 38%;
            font-size: 7.5px;
            font-weight: bold;
            color: #001A4B;
            line-height: 1.25;
        }
        .header-center {
            width: 24%;
            text-align: center;
        }
        .header-center img {
            max-height: 42px;
            max-width: 100px;
        }
        .header-right {
            width: 38%;
            text-align: right;
            font-size: 7.5px;
            font-weight: bold;
            color: #001A4B;
            line-height: 1.25;
        }

        /* Banner title */
        .pv-title-banner {
            background-color: #001A4B;
            color: #ffffff;
            text-align: center;
            padding: 5px 8px;
            border-radius: 2px;
            margin-bottom: 6px;
        }
        .pv-title-banner h1 {
            margin: 0;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .pv-title-banner p {
            margin: 2px 0 0 0;
            font-size: 7.5px;
            color: #fbbf24;
            font-weight: bold;
            letter-spacing: 0.2px;
        }

        /* Metadata grid */
        .meta-box {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
        }
        .meta-box td {
            padding: 3px 6px;
            border: 1px solid #cbd5e1;
            font-size: 8px;
        }
        .meta-label {
            font-weight: bold;
            color: #475569;
            background-color: #f1f5f9;
            width: 17%;
        }
        .meta-val {
            font-weight: bold;
            color: #001A4B;
            width: 33%;
        }

        /* Main Data Table */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 8px;
        }
        .data-table th {
            background-color: #001A4B;
            color: #ffffff;
            padding: 3.5px 5px;
            font-weight: bold;
            text-align: center;
            border: 1px solid #001A4B;
            text-transform: uppercase;
            font-size: 7.5px;
            letter-spacing: 0.3px;
        }
        .data-table td {
            padding: 2.2px 4px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        
        .badge-present {
            color: #065f46;
            background-color: #d1fae5;
            padding: 1px 5px;
            border-radius: 2px;
            font-weight: bold;
            font-size: 7.5px;
            display: inline-block;
            border: 0.5px solid #a7f3d0;
        }
        .badge-absent {
            color: #991b1b;
            background-color: #fee2e2;
            padding: 1px 5px;
            border-radius: 2px;
            font-weight: bold;
            font-size: 7.5px;
            display: inline-block;
            border: 0.5px solid #fecaca;
        }
        .badge-fraud {
            color: #ffffff;
            background-color: #dc2626;
            padding: 1px 5px;
            border-radius: 2px;
            font-weight: 900;
            font-size: 7.5px;
            letter-spacing: 0.4px;
            display: inline-block;
        }

        /* Incidents Box */
        .incidents-box {
            border: 1px solid #fca5a5;
            background-color: #fff1f2;
            padding: 4px 6px;
            border-radius: 2px;
            margin-bottom: 6px;
            font-size: 7.5px;
        }
        .incidents-box h4 {
            margin: 0 0 3px 0;
            color: #991b1b;
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
        }

        /* Footer & Signatures */
        .seal-signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }
        .seal-signature-table td {
            vertical-align: top;
        }
    </style>
</head>
<body>
    <div class="outer-frame">
        <!-- Official Academic Header -->
        <table class="header-table">
            <tr>
                <td class="header-left">
                    ROYAUME DU MAROC<br>
                    Ministère de l'Enseignement Supérieur,<br>
                    de la Recherche Scientifique et de l'Innovation
                </td>
                <td class="header-center">
                    @if(!empty($logoBase64))
                        <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès">
                    @endif
                </td>
                <td class="header-right">
                    UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS<br>
                    École Nationale de Commerce et de Gestion (ENCG)<br>
                    Portail Officiel des Examens
                </td>
            </tr>
        </table>

        <!-- Banner Title -->
        <div class="pv-title-banner">
            @if($mode === 'emargement')
                <h1>Feuille d'Émargement Officielle des Candidats</h1>
                <p>{{ strtoupper($exam->examSession->name ?? 'Session d\'Examens Ordinaire') }} — Année Universitaire 2026/2027</p>
            @else
                <h1>Procès-Verbal d'Examen & de Synthèse Officiel</h1>
                <p>{{ strtoupper($exam->examSession->name ?? 'Session d\'Examens Ordinaire') }} — Année Universitaire 2026/2027</p>
            @endif
        </div>

        <!-- Metadata Summary Box -->
        <table class="meta-box">
            <tr>
                <td class="meta-label">Filière / Niveau :</td>
                <td class="meta-val">{{ $exam->module->filiere->name ?? '—' }} (S{{ $exam->module->semester_number ?? $exam->module->semester ?? 1 }})</td>
                <td class="meta-label">Salle / Amphi :</td>
                <td class="meta-val">{{ $exam->room->name ?? '—' }}</td>
            </tr>
            <tr>
                <td class="meta-label">Module & Code :</td>
                <td class="meta-val">{{ $exam->module->name ?? '—' }} ({{ $exam->module->code ?? '—' }})</td>
                <td class="meta-label">Groupe Cible :</td>
                <td class="meta-val">{{ $exam->group->name ?? '—' }}</td>
            </tr>
            <tr>
                <td class="meta-label">Date & Horaire :</td>
                <td class="meta-val">
                    {{ $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->format('d/m/Y') : '—' }} 
                    @if($exam->start_time)
                        • {{ substr($exam->start_time, 0, 5) }} ({{ $exam->duration_minutes ?? 120 }} min)
                    @endif
                </td>
                <td class="meta-label">Surveillants :</td>
                <td class="meta-val">
                    {{ $principalName ?? 'Surveillant Principal' }} (Principal)
                    @if(!empty($secondaryName) && $secondaryName !== ($principalName ?? ''))
                        • {{ $secondaryName }} (Secondaire)
                    @endif
                </td>
            </tr>
            <tr>
                <td class="meta-label">Statut du PV :</td>
                <td class="meta-val">
                    @if($mode === 'emargement')
                        <span style="color: #001A4B; font-weight: bold;">[ÉMARGEMENT EN SALLE]</span>
                    @elseif($exam->is_locked)
                        <span style="color: #059669; font-weight: bold;">[SCELLÉ & DÉFINITIF]</span>
                    @else
                        <span style="color: #d97706; font-weight: bold;">[EN COURS - OUVERT]</span>
                    @endif
                </td>
                <td class="meta-label">Effectifs / Copies :</td>
                <td class="meta-val">
                    <strong>{{ $total_students }}</strong> Inscrits | 
                    <span style="color: #059669;"><strong>{{ $present_students }}</strong> Présents</span> | 
                    <span style="color: #dc2626;"><strong>{{ $absent_students }}</strong> Absents</span>
                </td>
            </tr>
        </table>

        <!-- Main Data Table -->
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 10%;">N° Place</th>
                    <th style="width: 18%;">CNE / Apogée</th>
                    <th style="width: 44%; text-align: left; padding-left: 6px;">Nom & Prénom du Candidat</th>
                    @if($mode === 'emargement')
                        <th style="width: 10%;">Cocher</th>
                        <th style="width: 18%;">Signature Étudiant</th>
                    @else
                        <th style="width: 28%;">Statut Émargement Digital</th>
                    @endif
                </tr>
            </thead>
            <tbody>
                @forelse($seatings as $idx => $seating)
                <tr>
                    <td class="text-center" style="font-weight: bold; color: #001A4B;">
                        {{ ($seating->seat_number && !str_contains($seating->seat_number, '125')) ? $seating->seat_number : ('N° ' . str_pad($idx + 1, 2, '0', STR_PAD_LEFT)) }}
                    </td>
                    <td class="text-center font-mono font-bold" style="color: #475569;">
                        {{ $seating->cne ?: ($seating->student?->cne ?? '—') }}
                    </td>
                    <td class="text-left" style="font-weight: bold; color: #0f172a; padding-left: 6px;">
                        {{ $seating->student_name ?: ($seating->student?->user?->name ?? '—') }}
                    </td>

                    @if($mode === 'emargement')
                        <td class="text-center" style="background-color: #ffffff;">[ &nbsp; ]</td>
                        <td class="text-center" style="background-color: #ffffff; height: 16px;"></td>
                    @else
                        <td class="text-center">
                            @if(!empty($seating->is_fraud))
                                <span class="badge-fraud">FRAUDE</span>
                            @elseif($seating->is_present)
                                <span class="badge-present">PRÉSENT</span>
                            @else
                                <span class="badge-absent">ABSENT</span>
                            @endif
                        </td>
                    @endif
                </tr>
                @empty
                <tr>
                    <td colspan="{{ $mode === 'emargement' ? 5 : 4 }}" class="text-center" style="padding: 10px; color: #64748b;">
                        <em>Aucun candidat n'a été affecté à cet examen.</em>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Incidents & Frauds Section (Only on final PV) -->
        @if($mode !== 'emargement')
            @if(isset($incidents) && count($incidents) > 0)
                <div class="incidents-box">
                    <h4>REGISTRE OFFICIEL DES INCIDENTS & CAS DE FRAUDE SIGNALÉS ({{ count($incidents) }})</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 7.5px;">
                        <tr style="background-color: #ffe4e6; font-weight: bold; color: #991b1b;">
                            <td style="padding: 2.5px 4px; border: 1px solid #fca5a5; width: 15%;">CNE</td>
                            <td style="padding: 2.5px 4px; border: 1px solid #fca5a5; width: 25%;">Étudiant</td>
                            <td style="padding: 2.5px 4px; border: 1px solid #fca5a5; width: 20%;">Type d'Incident</td>
                            <td style="padding: 2.5px 4px; border: 1px solid #fca5a5; width: 40%;">Objets Confisqués & Observations</td>
                        </tr>
                        @foreach($incidents as $inc)
                        <tr>
                            <td style="padding: 2px 4px; border: 1px solid #fca5a5; font-weight: bold;">{{ $inc->cne ?? ($inc->student?->cne ?? '—') }}</td>
                            <td style="padding: 2px 4px; border: 1px solid #fca5a5; font-weight: bold;">{{ $inc->student_name ?? ($inc->student?->user?->name ?? '—') }}</td>
                            <td style="padding: 2px 4px; border: 1px solid #fca5a5; color: #b91c1c; font-weight: bold;">{{ strtoupper($inc->type ?? 'FRAUDE') }}</td>
                            <td style="padding: 2px 4px; border: 1px solid #fca5a5;">{{ $inc->confiscated_items ?: ($inc->description ?: '—') }}</td>
                        </tr>
                        @endforeach
                    </table>
                </div>
            @endif
        @endif

        <!-- Signatures & Verification Seal Table -->
        <table class="seal-signature-table">
            <tr>
                <td style="width: 32%; border: 1px solid #001A4B; background-color: #f8fafc; padding: 4px; border-radius: 2px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 48px; vertical-align: middle;">
                                @if(!empty($qrBase64))
                                    <img src="{{ $qrBase64 }}" alt="QR Code Verification" style="width: 44px; height: 44px; border: 1px solid #001A4B; padding: 1px; background: #fff; border-radius: 2px;">
                                @endif
                            </td>
                            <td style="vertical-align: middle; padding-left: 5px;">
                                <div style="font-size: 7px; font-weight: 900; color: #001A4B; text-transform: uppercase;">
                                    PV CERTIFIÉ ENCG
                                </div>
                                <div style="font-family: monospace; font-size: 6px; font-weight: bold; color: #001A4B; margin-top: 1px;">
                                    {{ substr($seal ?? 'SHA256:ENCG-FES-PV-EXAM-SEAL', 0, 24) }}
                                </div>
                                <div style="font-size: 5.5px; color: #64748b; margin-top: 1px;">
                                    Généré le {{ $generated_at ?? date('d/m/Y H:i') }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="width: 2%;"></td>
                <td style="width: 32%; text-align: center; border: 1px solid #001A4B; background-color: #f8fafc; padding: 4px; border-radius: 2px;">
                    <div style="font-weight: 900; font-size: 7px; color: #001A4B; text-transform: uppercase;">
                        Surveillant Principal
                    </div>
                    <div style="font-size: 7px; color: #1e293b; font-weight: bold; margin-top: 1px;">
                        {{ $principalName ?? 'Surveillant Principal' }}
                    </div>
                    @if(!empty($principalSignatureImg))
                        <div style="margin-top: 1px;">
                            <img src="{{ $principalSignatureImg }}" style="max-height: 18px; max-width: 85px; margin: 0 auto; display: block;">
                        </div>
                    @elseif(!empty($hasPrincipalSignature))
                        <div style="margin-top: 2px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-size: 5.5px; font-weight: bold; padding: 1px 4px; border-radius: 2px; display: inline-block;">
                            SIGNÉ ÉLECTRONIQUEMENT
                        </div>
                    @else
                        <div style="margin-top: 2px; border: 1px dashed #94a3b8; color: #64748b; font-size: 5.5px; font-weight: bold; padding: 1px 4px; border-radius: 2px; display: inline-block;">
                            EN ATTENTE DE SIGNATURE
                        </div>
                    @endif
                </td>
                <td style="width: 2%;"></td>
                <td style="width: 32%; text-align: center; border: 1px solid #001A4B; background-color: #f8fafc; padding: 4px; border-radius: 2px;">
                    <div style="font-weight: 900; font-size: 7px; color: #001A4B; text-transform: uppercase;">
                        Surveillant Secondaire
                    </div>
                    <div style="font-size: 7px; color: #1e293b; font-weight: bold; margin-top: 1px;">
                        {{ $secondaryName ?? 'Surveillant Secondaire' }}
                    </div>
                    @if(!empty($secondarySignatureImg))
                        <div style="margin-top: 1px;">
                            <img src="{{ $secondarySignatureImg }}" style="max-height: 18px; max-width: 85px; margin: 0 auto; display: block;">
                        </div>
                    @elseif(!empty($hasSecondarySignature))
                        <div style="margin-top: 2px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-size: 5.5px; font-weight: bold; padding: 1px 4px; border-radius: 2px; display: inline-block;">
                            SIGNÉ ÉLECTRONIQUEMENT
                        </div>
                    @else
                        <div style="margin-top: 2px; border: 1px dashed #94a3b8; color: #64748b; font-size: 5.5px; font-weight: bold; padding: 1px 4px; border-radius: 2px; display: inline-block;">
                            EN ATTENTE DE SIGNATURE
                        </div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <!-- ================================================================= -->
    <!-- 🚨 PAGE 2: PROCÈS-VERBAL OFFICIEL DE FRAUDE / INCIDENT D'EXAMEN   -->
    <!-- ================================================================= -->
    @if(isset($incidents) && count($incidents) > 0)
        <div style="page-break-before: always;"></div>

        <div class="outer-frame" style="border-color: #991b1b;">
            <!-- Header Page 2 -->
            <table class="header-table" style="border-bottom-color: #991b1b;">
                <tr>
                    <td class="header-left">
                        ROYAUME DU MAROC<br>
                        Ministère de l'Enseignement Supérieur,<br>
                        de la Recherche Scientifique et de l'Innovation
                    </td>
                    <td class="header-center">
                        <img src="{{ public_path('logo-encg.png') }}" alt="Logo ENCG Fès">
                    </td>
                    <td class="header-right">
                        UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS<br>
                        École Nationale de Commerce et de Gestion (ENCG)<br>
                        Commission de Discipline & des Examens
                    </td>
                </tr>
            </table>

            <!-- Banner Incident -->
            <div class="pv-title-banner" style="background-color: #991b1b;">
                <h1>PROCÈS-VERBAL DE CONSTAT D'INCIDENT & DE FRAUDE À L'EXAMEN</h1>
                <p style="color: #fecaca;">DOSSIER OFFICIEL TRANSMIS AU CONSEIL DE DISCIPLINE • SESSION ORDINAIRE 2026/2027</p>
            </div>

            <!-- Incident Details -->
            @foreach($incidents as $idxInc => $incident)
                <div style="border: 1.5px solid #b91c1c; border-radius: 3px; padding: 8px; margin-bottom: 8px; background-color: #fffaf0;">
                    <div style="font-size: 8.5px; font-weight: 900; color: #991b1b; text-transform: uppercase; border-bottom: 1px solid #f87171; padding-bottom: 3px; margin-bottom: 6px;">
                        SIGNALEMENT DE FRAUDE N° {{ $idxInc + 1 }} / {{ count($incidents) }} — RÉFÉRENCE : INC-{{ $exam->id }}-{{ $incident->id ?? 1 }}
                    </div>

                    <table style="width: 100%; font-size: 8px; border-collapse: collapse; margin-bottom: 6px;">
                        <tr>
                            <td style="width: 25%; font-weight: bold; color: #475569; padding: 2px 0;">Étudiant Impliqué :</td>
                            <td style="width: 35%; font-weight: 900; color: #0f172a;">{{ $incident->student_name ?? '—' }}</td>
                            <td style="width: 18%; font-weight: bold; color: #475569; padding: 2px 0;">CNE / Apogée :</td>
                            <td style="width: 22%; font-weight: 900; color: #0f172a; font-family: monospace;">{{ $incident->cne ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; color: #475569; padding: 2px 0;">Filière & Niveau :</td>
                            <td style="font-weight: bold; color: #0f172a;">{{ $exam->module->filiere->name ?? '—' }} (S{{ $exam->module->semester_number ?? $exam->module->semester ?? 1 }})</td>
                            <td style="font-weight: bold; color: #475569; padding: 2px 0;">Lieu / Salle :</td>
                            <td style="font-weight: bold; color: #0f172a;">{{ $exam->room->name ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; color: #475569; padding: 2px 0;">Module & Épreuve :</td>
                            <td style="font-weight: bold; color: #0f172a;">{{ $exam->module->name ?? '—' }}</td>
                            <td style="font-weight: bold; color: #475569; padding: 2px 0;">Date & Heure :</td>
                            <td style="font-weight: bold; color: #0f172a;">
                                {{ $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->format('d/m/Y') : '—' }} 
                                @if($exam->start_time)
                                    à {{ substr($exam->start_time, 0, 5) }}
                                @endif
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 4px; padding: 6px; background-color: #ffffff; border: 1px solid #fecaca; border-radius: 2px;">
                        <div style="font-weight: 900; color: #991b1b; font-size: 7.5px; text-transform: uppercase;">NATURE DE L'INFRACTION & DES FAITS CONSTATÉS :</div>
                        <div style="font-size: 7.5px; color: #334155; margin-top: 2px; line-height: 1.3;">
                            {{ $incident->description ?: 'Non spécifié' }}
                        </div>

                        <div style="font-weight: 900; color: #991b1b; font-size: 7.5px; margin-top: 4px; text-transform: uppercase;">PIÈCES / OBJETS CONFISQUÉS :</div>
                        <div style="font-size: 7.5px; font-weight: bold; color: #0f172a; margin-top: 1px;">
                            Objet(s) saisi(s) : {{ $incident->confiscated_items ?: 'Aucun' }}
                        </div>
                    </div>

                    <div style="margin-top: 6px; font-size: 7.5px; color: #991b1b; background-color: #fee2e2; padding: 4px 6px; border-radius: 2px; font-weight: bold; border: 1px solid #fca5a5;">
                        Décision Réglementaire Immédiate : Attribution d'office de la note 0.00 / 20 au module et comparution devant le Conseil de Discipline de l'établissement.
                    </div>
                </div>
            @endforeach

            <!-- Signatures Incident -->
            <table style="width: 100%; margin-top: 8px; border-collapse: collapse;">
                <tr>
                    <td style="width: 48%; text-align: center; border: 1px solid #991b1b; background-color: #fffaf0; padding: 6px; border-radius: 2px;">
                        <div style="font-weight: 900; font-size: 7.5px; color: #991b1b; text-transform: uppercase;">
                            Surveillant Principal (Rapporteur)
                        </div>
                        <div style="font-size: 7.5px; font-weight: bold; color: #1e293b; margin-top: 2px;">
                            {{ $principalName ?? 'Surveillant Principal' }}
                        </div>
                        @if(!empty($principalSignatureImg))
                            <div style="margin-top: 2px;">
                                <img src="{{ $principalSignatureImg }}" style="max-height: 20px; max-width: 85px; margin: 0 auto; display: block;">
                            </div>
                        @elseif(!empty($hasPrincipalSignature))
                            <div style="margin-top: 3px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-size: 5.5px; font-weight: bold; padding: 2px 6px; border-radius: 2px; display: inline-block;">
                                PV D'INCIDENT SIGNÉ ÉLECTRONIQUEMENT
                            </div>
                        @else
                            <div style="margin-top: 3px; border: 1px dashed #94a3b8; color: #64748b; font-size: 5.5px; font-weight: bold; padding: 2px 6px; border-radius: 2px; display: inline-block;">
                                EN ATTENTE DE SIGNATURE
                            </div>
                        @endif
                    </td>
                    <td style="width: 4%;"></td>
                    <td style="width: 48%; text-align: center; border: 1px solid #991b1b; background-color: #fffaf0; padding: 6px; border-radius: 2px;">
                        <div style="font-weight: 900; font-size: 7.5px; color: #991b1b; text-transform: uppercase;">
                            Surveillant Secondaire (Témoin)
                        </div>
                        <div style="font-size: 7.5px; font-weight: bold; color: #1e293b; margin-top: 2px;">
                            {{ $secondaryName ?? 'Surveillant Secondaire' }}
                        </div>
                        @if(!empty($secondarySignatureImg))
                            <div style="margin-top: 2px;">
                                <img src="{{ $secondarySignatureImg }}" style="max-height: 20px; max-width: 85px; margin: 0 auto; display: block;">
                            </div>
                        @elseif(!empty($hasSecondarySignature))
                            <div style="margin-top: 3px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-size: 5.5px; font-weight: bold; padding: 2px 6px; border-radius: 2px; display: inline-block;">
                                PV D'INCIDENT SIGNÉ ÉLECTRONIQUEMENT
                            </div>
                        @else
                            <div style="margin-top: 3px; border: 1px dashed #94a3b8; color: #64748b; font-size: 5.5px; font-weight: bold; padding: 2px 6px; border-radius: 2px; display: inline-block;">
                                EN ATTENTE DE SIGNATURE
                            </div>
                        @endif
                    </td>
                </tr>
            </table>
        </div>
    @endif
</body>
</html>
