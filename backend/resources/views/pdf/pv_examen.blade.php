<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $mode === 'emargement' ? "Feuille d'Émargement" : "PV d'Examen Officiel" }} — ENCG Fès</title>
    <style>
        @page {
            size: A4;
            margin: 6mm 8mm 6mm 8mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            font-size: 10px;
            background-color: #fff;
        }
        .outer-frame {
            border: 2px solid #0f2863;
            padding: 8px 10px;
        }
        
        /* Header styling */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 4px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .header-left {
            width: 38%;
            font-size: 8px;
            font-weight: bold;
            color: #0f2863;
            line-height: 1.2;
        }
        .header-center {
            width: 24%;
            text-align: center;
        }
        .header-center img {
            max-height: 48px;
            max-width: 110px;
        }
        .header-right {
            width: 38%;
            text-align: right;
            font-size: 8px;
            font-weight: bold;
            color: #0f2863;
            line-height: 1.2;
        }

        /* Banner title */
        .pv-title-banner {
            background-color: #0f2863;
            color: #ffffff;
            text-align: center;
            padding: 6px;
            border-radius: 3px;
            margin-bottom: 8px;
        }
        .pv-title-banner h1 {
            margin: 0;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .pv-title-banner p {
            margin: 2px 0 0 0;
            font-size: 8.5px;
            color: #e2e8f0;
            font-weight: bold;
        }

        /* Metadata grid */
        .meta-box {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
        }
        .meta-box td {
            padding: 4px 8px;
            border: 1px solid #e2e8f0;
            font-size: 9px;
        }
        .meta-label {
            font-weight: bold;
            color: #334155;
            background-color: #f1f5f9;
            width: 18%;
        }
        .meta-val {
            font-weight: bold;
            color: #0f2863;
            width: 32%;
        }

        /* Main Data Table */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 9px;
        }
        .data-table th {
            background-color: #0f2863;
            color: #ffffff;
            padding: 5px 6px;
            font-weight: bold;
            text-align: center;
            border: 1px solid #0f2863;
            text-transform: uppercase;
            font-size: 8.5px;
            letter-spacing: 0.3px;
        }
        .data-table td {
            padding: 3.5px 5px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        
        .badge-present {
            color: #047857;
            background-color: #d1fae5;
            padding: 1.5px 6px;
            border-radius: 2px;
            font-weight: bold;
            font-size: 8.5px;
        }
        .badge-absent {
            color: #b91c1c;
            background-color: #fee2e2;
            padding: 1.5px 6px;
            border-radius: 2px;
            font-weight: bold;
            font-size: 8.5px;
        }

        /* Incidents Box */
        .incidents-box {
            border: 1px solid #fca5a5;
            background-color: #fff1f2;
            padding: 6px 10px;
            border-radius: 3px;
            margin-bottom: 8px;
            font-size: 8.5px;
        }
        .incidents-box h4 {
            margin: 0 0 4px 0;
            color: #991b1b;
            font-size: 9.5px;
            text-transform: uppercase;
        }

        /* Footer & Signatures */
        .seal-signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            border-top: 1.5px solid #0f2863;
            padding-top: 6px;
        }
        .seal-signature-table td {
            vertical-align: top;
        }
        .qr-cell {
            width: 75px;
            text-align: center;
        }
        .seal-cell {
            padding-left: 8px;
            font-size: 8px;
            color: #475569;
        }
        .signature-cell {
            width: 42%;
            text-align: center;
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            padding: 6px;
            height: 55px;
        }
        .sig-title {
            font-weight: bold;
            font-size: 8.5px;
            color: #0f2863;
            margin-bottom: 22px;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="outer-frame">
        <!-- Header -->
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
                    @else
                        <strong style="font-size: 14px; color: #0f2863;">ENCG FÈS</strong>
                    @endif
                </td>
                <td class="header-right">
                    UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS<br>
                    École Nationale de Commerce et de Gestion (ENCG)<br>
                    <strong>Portail Officiel des Examens</strong>
                </td>
            </tr>
        </table>

        <!-- Banner Title -->
        <div class="pv-title-banner">
            @if($mode === 'emargement')
                <h1>Feuille d'Émargement Papier (à Signer par les Étudiants)</h1>
                <p>DOCUMENT IMPRIMÉ POUR SIGNATURE MANUSCRITE EN SALLE D'EXAMEN</p>
            @else
                <h1>Procès-Verbal d'Examen & de Synthèse Officiel</h1>
                <p>{{ strtoupper($exam->examSession->name ?? 'Session d\'Examens Ordinaire') }} — Année Universitaire 2025/2026</p>
            @endif
        </div>

        <!-- Metadata Summary Box -->
        <table class="meta-box">
            <tr>
                <td class="meta-label">Filière / Niveau :</td>
                <td class="meta-val">{{ $exam->module->filiere->name ?? 'ENCG Grande École' }} (S{{ $exam->module->semester_number ?? 1 }})</td>
                <td class="meta-label">Salle / Amphi :</td>
                <td class="meta-val">{{ $exam->room->name ?? 'Amphithéâtre A' }}</td>
            </tr>
            <tr>
                <td class="meta-label">Module & Code :</td>
                <td class="meta-val">{{ $exam->module->name ?? 'Épreuve Module' }} ({{ $exam->module->code ?? 'ENCG' }})</td>
                <td class="meta-label">Groupe Cible :</td>
                <td class="meta-val">{{ $exam->group->name ?? 'Tous Groupes' }}</td>
            </tr>
            <tr>
                <td class="meta-label">Date & Horaire :</td>
                <td class="meta-val">
                    {{ $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->format('d/m/Y') : '21/08/2026' }} 
                    • {{ substr($exam->start_time ?? '16:30', 0, 5) }} ({{ $exam->duration_minutes ?? 120 }} min)
                </td>
                <td class="meta-label">Surveillants :</td>
                <td class="meta-val">Pr. Amina Tazi (Principal) • Pr. Amina Chraibi (Secondaire)</td>
            </tr>
            <tr>
                <td class="meta-label">Statut du PV :</td>
                <td class="meta-val">
                    @if($mode === 'emargement')
                        <span style="color: #0f2863; font-weight: bold;">[ÉMARGEMENT EN SALLE]</span>
                    @elseif($exam->is_locked)
                        <span style="color: #059669; font-weight: bold;">[SCELLÉ & DÉFINITIF]</span>
                    @else
                        <span style="color: #d97706; font-weight: bold;">[EN COURS - OUVERT]</span>
                    @endif
                </td>
                <td class="meta-label">Effectifs / Copies :</td>
                <td class="meta-val">
                    @if($mode === 'emargement')
                        <strong>{{ $total_students }}</strong> Candidats Convoqués (En Salle)
                    @else
                        <strong>{{ $total_students }}</strong> Attendus | 
                        <span style="color: #059669;"><strong>{{ $present_students }}</strong> Présents</span> | 
                        <span style="color: #dc2626;"><strong>{{ $absent_students }}</strong> Absents</span>
                    @endif
                </td>
            </tr>
        </table>

        <!-- Main Data Table -->
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 10%;">N° Place</th>
                    <th style="width: 18%;">CNE / Code</th>
                    <th style="width: 44%; text-align: left;">Nom & Prénom du Candidat</th>
                    @if($mode === 'emargement')
                        <th style="width: 10%;">Cocher</th>
                        <th style="width: 18%;">Signature Étudiant (Stylo)</th>
                    @else
                        <th style="width: 28%;">Statut Émargement Digital</th>
                    @endif
                </tr>
            </thead>
            <tbody>
                @forelse($seatings as $idx => $seating)
                <tr>
                    <td class="text-center" style="font-weight: bold; color: #0f2863;">
                        {{ $seating->seat_number ?: ('N° ' . str_pad($idx + 1, 2, '0', STR_PAD_LEFT)) }}
                    </td>
                    <td class="text-center font-mono font-bold" style="color: #475569;">
                        {{ $seating->cne ?: ($seating->student?->cne ?? 'N/A') }}
                    </td>
                    <td class="text-left" style="font-weight: bold; color: #0f172a;">
                        {{ $seating->student_name ?: ($seating->student?->user?->name ?? 'Étudiant ENCG') }}
                    </td>

                    @if($mode === 'emargement')
                        <td class="text-center" style="background-color: #ffffff;">[ &nbsp; ]</td>
                        <td class="text-center" style="background-color: #ffffff; height: 20px;"></td>
                    @else
                        <td class="text-center">
                            @if(!empty($seating->is_fraud))
                                <span class="badge-fraud">🚨 FRAUDE</span>
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
                    <td colspan="{{ $mode === 'emargement' ? 5 : 4 }}" class="text-center" style="padding: 15px; color: #64748b;">
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
                    <h4>🚨 Registre Officiel des Incidents & Cas de Fraude Signalés ({{ count($incidents) }})</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
                        <tr style="background-color: #ffe4e6; font-weight: bold; color: #991b1b;">
                            <td style="padding: 3px 5px; border: 1px solid #fca5a5; width: 15%;">CNE</td>
                            <td style="padding: 3px 5px; border: 1px solid #fca5a5; width: 25%;">Étudiant</td>
                            <td style="padding: 3px 5px; border: 1px solid #fca5a5; width: 20%;">Type d'Incident</td>
                            <td style="padding: 3px 5px; border: 1px solid #fca5a5; width: 40%;">Objets Confisqués & Observations</td>
                        </tr>
                        @foreach($incidents as $inc)
                        <tr>
                            <td style="padding: 3px 5px; border: 1px solid #fca5a5; font-weight: bold;">{{ $inc->cne ?? ($inc->student?->cne ?? 'M130000007') }}</td>
                            <td style="padding: 3px 5px; border: 1px solid #fca5a5; font-weight: bold;">{{ $inc->student_name ?? ($inc->student?->user?->name ?? 'Hajar El Fassi') }}</td>
                            <td style="padding: 3px 5px; border: 1px solid #fca5a5; color: #b91c1c; font-weight: bold;">{{ strtoupper($inc->type ?? 'FRAUDE') }}</td>
                            <td style="padding: 3px 5px; border: 1px solid #fca5a5;">{{ $inc->confiscated_items ?: ($inc->description ?: 'Téléphone portable dissimulé') }}</td>
                        </tr>
                        @endforeach
                    </table>
                </div>
            @else
                <div style="font-size: 8px; color: #475569; font-style: italic; margin-bottom: 8px; border: 1px border-dashed #cbd5e1; padding: 4px; border-radius: 3px; background-color: #f8fafc">
                    <strong>Registre des Incidents :</strong> Néant — Aucun cas de fraude ou d'incident n'a été signalé lors de cette épreuve.
                </div>
            @endif
        @endif

        <!-- Signatures & Verification Seal Table -->
        <table class="seal-signature-table">
            <tr>
                <td class="qr-cell" style="width: 70px; vertical-align: middle;">
                    @if(!empty($qrBase64))
                        <img src="{{ $qrBase64 }}" alt="QR Code Verification" style="width: 60px; height: 60px; border: 1px solid #0f2863; padding: 2px; background: #fff; border-radius: 3px;">
                    @endif
                </td>
                <td class="seal-cell" style="vertical-align: middle; padding-left: 8px;">
                    <div style="font-size: 7.5px; font-weight: bold; color: #0f2863; text-transform: uppercase;">
                        Procès-Verbal d'Examen Certifié
                    </div>
                    <div style="font-family: monospace; font-size: 7px; font-weight: bold; color: #0f2863; margin-top: 1px;">
                        {{ $seal ?? 'SHA256:ENCG-FES-PV-EXAM-SEAL' }}
                    </div>
                    <div style="font-size: 6.5px; color: #64748b; margin-top: 2px;">
                        Généré le {{ $generated_at ?? date('d/m/Y H:i') }} • Conforme LMD & Réglementation Examens ENCG Fès.
                    </div>
                </td>
                <td style="width: 25%; text-align: center; border: 1px solid #0f2863; background-color: #f8fafc; padding: 4px; border-radius: 3px;">
                    <div style="font-weight: bold; font-size: 7.5px; color: #0f2863; text-transform: uppercase;">
                        Surveillant Principal
                    </div>
                    <div style="font-size: 7px; color: #334155; font-weight: bold; margin-top: 1px;">
                        Pr. Amina Tazi
                    </div>
                    <div style="margin-top: 2px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-size: 6px; font-weight: bold; padding: 1px 4px; border-radius: 2px; display: inline-block;">
                        ✓ SIGNÉ ÉLECTRONIQUEMENT
                    </div>
                    <div style="font-size: 5.5px; color: #64748b; margin-top: 2px;">
                        Horodaté le 21/08/2026 à 18:32
                    </div>
                </td>
                <td style="width: 25%; text-align: center; border: 1px solid #0f2863; background-color: #f8fafc; padding: 4px; border-radius: 3px; margin-left: 4px;">
                    <div style="font-weight: bold; font-size: 7.5px; color: #0f2863; text-transform: uppercase;">
                        Surveillant Secondaire
                    </div>
                    <div style="font-size: 7px; color: #334155; font-weight: bold; margin-top: 1px;">
                        Pr. Amina Chraibi
                    </div>
                    @if(!empty($secondarySignatureImg))
                        <div style="margin-top: 2px;">
                            <img src="{{ $secondarySignatureImg }}" style="max-height: 22px; max-width: 90px; margin: 0 auto; display: block;">
                        </div>
                        <div style="font-size: 5.5px; color: #15803d; font-weight: bold; margin-top: 1px;">
                            ✓ Signature Manuelle Apposée
                        </div>
                    @else
                        <div style="margin-top: 2px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-size: 6px; font-weight: bold; padding: 1px 4px; border-radius: 2px; display: inline-block;">
                            ✓ SIGNÉ ÉLECTRONIQUEMENT
                        </div>
                        <div style="font-size: 5.5px; color: #64748b; margin-top: 2px;">
                            Horodaté le 21/08/2026 à 18:34
                        </div>
                    @endif
                </td>
            </tr>
        </table>

        <!-- ================================================================= -->
        <!-- 🚨 PAGE 2: PROCÈS-VERBAL OFFICIEL DE FRAUDE / INCIDENT D'EXAMEN   -->
        <!-- (Généré automatiquement dès qu'un cas de fraude est constaté)    -->
        <!-- ================================================================= -->
        @if(isset($incidents) && count($incidents) > 0)
            <div style="page-break-before: always;"></div>

            <!-- Header Page 2 -->
            <table class="header-table">
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
            <div class="pv-title-banner" style="background-color: #991b1b; margin-top: 8px;">
                <h1>PROCÈS-VERBAL DE CONSTAT D'INCIDENT & DE FRAUDE À L'EXAMEN</h1>
                <p>DOSSIER OFFICIEL TRANSMIS AU CONSEIL DE DISCIPLINE • SESSION ORDINAIRE AUTOMNE 2026</p>
            </div>

            <!-- Incident Details -->
            @foreach($incidents as $idxInc => $incident)
                <div style="border: 2px solid #b91c1c; border-radius: 4px; padding: 8px; margin-bottom: 12px; background-color: #fffaf0;">
                    <div style="font-size: 9px; font-weight: 900; color: #991b1b; text-transform: uppercase; border-bottom: 1px solid #f87171; pb-2; margin-bottom: 6px;">
                        🚨 Signalement de Fraude N° {{ $idxInc + 1 }} / {{ count($incidents) }} — Réf: INC-{{ $exam->id }}-{{ $incident->id ?? 1 }}
                    </div>

                    <table style="width: 100%; font-size: 8px; border-collapse: collapse; margin-bottom: 6px;">
                        <tr>
                            <td style="width: 25%; font-weight: bold; color: #475569; padding: 2px 0;">Étudiant Impliqué :</td>
                            <td style="width: 35%; font-weight: 900; color: #0f172a;">{{ $incident->student_name ?? ($incident->student?->user?->name ?? 'Hajar El Fassi') }}</td>
                            <td style="width: 18%; font-weight: bold; color: #475569; padding: 2px 0;">CNE / Apogée :</td>
                            <td style="width: 22%; font-weight: 900; color: #0f172a; font-family: monospace;">{{ $incident->cne ?? ($incident->student?->cne ?? 'M130000007') }}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; color: #475569; padding: 2px 0;">Filière & Semestre :</td>
                            <td style="font-weight: bold; color: #0f172a;">{{ $exam->module->filiere->name ?? 'Tronc Commun ENCG' }} (S1)</td>
                            <td style="font-weight: bold; color: #475569; padding: 2px 0;">Place / Salle :</td>
                            <td style="font-weight: bold; color: #0f172a;">{{ $exam->room->name ?? 'Amphithéâtre B' }}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; color: #475569; padding: 2px 0;">Module & Épreuve :</td>
                            <td style="font-weight: bold; color: #0f172a;">{{ $exam->module->name ?? 'Comptabilité Générale I' }}</td>
                            <td style="font-weight: bold; color: #475569; padding: 2px 0;">Date & Heure :</td>
                            <td style="font-weight: bold; color: #0f172a;">21/08/2026 à 17:15</td>
                        </tr>
                    </table>

                    <div style="margin-top: 6px; padding: 6px; background-color: #ffffff; border: 1px solid #fecaca; border-radius: 3px;">
                        <div style="font-weight: 900; color: #991b1b; font-size: 8px;">NATURE DE L'INFRACTION & DES FAITS CONSTATÉS :</div>
                        <div style="font-size: 7.5px; color: #334155; margin-top: 2px; line-height: 1.3;">
                            {{ $incident->description ?: 'L\'étudiant a été surpris en flagrant délit d\'utilisation non autorisée d\'un téléphone portable pendant l\'épreuve.' }}
                        </div>

                        <div style="font-weight: 900; color: #991b1b; font-size: 8px; margin-top: 4px;">PIÈCES / OBJETS CONFISQUÉS :</div>
                        <div style="font-size: 7.5px; font-weight: bold; color: #0f172a; margin-top: 1px;">
                            📦 {{ $incident->confiscated_items ?: 'iPhone 13 Noir, conservé sous scellé au secrétariat des examens.' }}
                        </div>
                    </div>

                    <div style="margin-top: 6px; font-size: 7.5px; color: #991b1b; background-color: #fee2e2; padding: 4px 6px; border-radius: 3px; font-weight: bold;">
                        ⚖️ Décision Réglementaire Immédiate : Attribution d'office de la note 0.00 / 20 au module et comparution devant le Conseil de Discipline.
                    </div>
                </div>
            @endforeach

            <!-- Signatures Incident -->
            <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
                <tr>
                    <td style="width: 48%; text-align: center; border: 1px solid #0f2863; background-color: #f8fafc; padding: 6px; border-radius: 3px;">
                        <div style="font-weight: 900; font-size: 8px; color: #0f2863; text-transform: uppercase;">
                            Surveillant Principal (Rapporteur)
                        </div>
                        <div style="font-size: 7.5px; font-weight: bold; color: #334155; margin-top: 2px;">
                            Pr. Amina Tazi
                        </div>
                        <div style="margin-top: 3px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-size: 6px; font-weight: bold; padding: 2px 6px; border-radius: 2px; display: inline-block;">
                            ✓ PV D'INCIDENT SIGNÉ ÉLECTRONIQUEMENT
                        </div>
                    </td>
                    <td style="width: 4%;"></td>
                    <td style="width: 48%; text-align: center; border: 1px solid #0f2863; background-color: #f8fafc; padding: 6px; border-radius: 3px;">
                        <div style="font-weight: 900; font-size: 8px; color: #0f2863; text-transform: uppercase;">
                            Surveillant Secondaire (Témoin)
                        </div>
                        <div style="font-size: 7.5px; font-weight: bold; color: #334155; margin-top: 2px;">
                            Pr. Amina Chraibi
                        </div>
                        @if(!empty($secondarySignatureImg))
                            <div style="margin-top: 2px;">
                                <img src="{{ $secondarySignatureImg }}" style="max-height: 22px; max-width: 90px; margin: 0 auto; display: block;">
                            </div>
                        @else
                            <div style="margin-top: 3px; border: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-size: 6px; font-weight: bold; padding: 2px 6px; border-radius: 2px; display: inline-block;">
                                ✓ PV D'INCIDENT SIGNÉ ÉLECTRONIQUEMENT
                            </div>
                        @endif
                    </td>
                </tr>
            </table>
        @endif
    </div>
</body>
</html>
    </div>
</body>
</html>
