<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Convocation aux Examens — {{ $studentName }} — ENCG Fès</title>
    <style>
        @page { 
            size: A4 portrait; 
            margin: 6mm 8mm 6mm 8mm; 
        }
        * { 
            box-sizing: border-box; 
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 7.2pt;
            line-height: 1.2;
            background: #ffffff;
        }
        .page-container {
            border: 1.8px solid #002147;
            padding: 6px 8px;
            background: #ffffff;
            position: relative;
            page-break-inside: avoid;
        }

        /* En-tête officiel ENCG Fès */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 3px;
        }
        .header-table td {
            vertical-align: middle;
            border: none;
            padding: 0;
        }
        .gold-divider {
            height: 2.2px;
            background: #c9a227;
            margin: 3px 0 4px 0;
        }

        /* Bannière Titre */
        .title-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 4px;
        }
        .title-cell {
            background-color: #002147;
            color: #ffffff;
            text-align: center;
            padding: 4px 6px;
            border-radius: 2px;
            border: none;
        }
        .title-cell h1 {
            font-size: 11pt;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.15;
        }
        .title-cell .sub {
            font-size: 6.8pt;
            font-weight: bold;
            color: #fde047;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Dossier Étudiant (Bento Tiles 100% pleine largeur) */
        .dossier-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 5px;
        }
        .dossier-cell {
            border: 1px solid #cbd5e1;
            padding: 3px 6px;
            background: #f8fafc;
            vertical-align: top;
        }
        .tile-label {
            font-size: 5.0pt;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 1.5px;
            line-height: 1;
        }
        .tile-value {
            font-size: 7.0pt;
            font-weight: 800;
            color: #002147;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        }
        .tile-mono {
            font-family: monospace;
            font-size: 7.2pt;
            color: #002147;
            font-weight: 900;
        }
        .badge-pill {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 2px;
            font-size: 6.2pt;
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
        .badge-valid {
            background: #ecfdf5;
            color: #047857;
            border: 0.8px solid #a7f3d0;
        }

        /* Pastille verte en pur CSS */
        .dot-green {
            display: inline-block;
            width: 4.5px;
            height: 4.5px;
            background-color: #059669;
            border-radius: 50%;
            vertical-align: middle;
            margin-right: 2px;
        }

        /* Notification officielle d'examen */
        .notice-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-left: 4px solid #1d4ed8;
            padding: 4px 8px;
            border-radius: 2px;
            margin-bottom: 5px;
            font-size: 6.4pt;
            color: #1e3a8a;
            line-height: 1.2;
        }

        /* Tableau des épreuves d'examen */
        table.exams-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 6px;
        }
        table.exams-table th, table.exams-table td {
            border: 1px solid #94a3b8;
            padding: 4px 5px;
            text-align: center;
            vertical-align: middle;
        }
        table.exams-table th {
            background-color: #002147;
            color: #ffffff;
            font-size: 7.2pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 5px 3px;
            border: 1px solid #00152e;
            border-bottom: 2.2px solid #c9a227;
        }
        .exam-date-badge {
            font-weight: 900;
            color: #002147;
            font-size: 7.2pt;
        }
        .exam-time-badge {
            font-size: 6.4pt;
            color: #475569;
            font-weight: bold;
        }
        .exam-module-code {
            display: inline-block;
            background: #f1f5f9;
            border: 0.6px solid #cbd5e1;
            border-radius: 2px;
            padding: 0.5px 3px;
            font-size: 5.6pt;
            font-weight: 800;
            color: #002147;
            margin-bottom: 1.5px;
        }
        .exam-module-name {
            font-size: 7.2pt;
            font-weight: 900;
            color: #002147;
            line-height: 1.15;
            text-align: left;
        }
        .exam-room-pill {
            display: inline-block;
            background: #eff6ff;
            border: 0.8px solid #bfdbfe;
            border-radius: 2px;
            padding: 1.5px 4px;
            font-size: 6.8pt;
            font-weight: 900;
            color: #1d4ed8;
        }
        .exam-seat-ticket {
            display: inline-block;
            background: #ecfdf5;
            border: 1px solid #059669;
            border-radius: 3px;
            padding: 2px 6px;
            font-size: 7.5pt;
            font-weight: 900;
            color: #065f46;
            letter-spacing: 0.3px;
        }

        /* Charte des examens */
        .rules-card {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-left: 3.5px solid #d97706;
            border-radius: 2px;
            padding: 4px 8px;
            margin-bottom: 5px;
        }
        .rules-title {
            font-size: 6.4pt;
            font-weight: 900;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 2px;
        }
        .rules-list {
            margin: 0;
            padding-left: 12px;
            font-size: 5.6pt;
            color: #78350f;
            line-height: 1.25;
        }
        .rules-list li {
            margin-bottom: 1px;
        }

        /* Cartouche officiel de vérification (Pied de page) */
        .verification-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #94a3b8;
            background: #ffffff;
            margin-top: 3px;
        }
        .verification-cell {
            border: none;
            vertical-align: middle;
            padding: 4px 6px;
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
            font-size: 5.4pt;
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
            font-size: 5.4pt;
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
                <span style="font-family: monospace; font-size: 5.2pt; color: #94a3b8;">REF : ENCG-CONV-{{ strtoupper(substr(md5(($cne ?? 'ENCG').'2026'), 0, 8)) }}</span>
            </td>
        </tr>
    </table>

    <div class="gold-divider"></div>

    <!-- Titre (Table 100% pleine largeur) -->
    <table class="title-table">
        <tr>
            <td class="title-cell">
                <h1>CONVOCATION OFFICIELLE AUX ÉPREUVES D'EXAMENS</h1>
                <div class="sub">
                    {{ $sessionType ?? 'SESSION ORDINAIRE' }} — ARCHITECTURE PÉDAGOGIQUE ENCG FÈS
                </div>
            </td>
        </tr>
    </table>

    <!-- Dossier Académique Étudiant (Bento Tiles 4x2 symétriques) -->
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
                <div class="tile-label">GROUPE DE RATTACHEMENT</div>
                <div class="tile-value">
                    <span class="badge-pill badge-section">{{ $groupName ?? 'TC-S2-G1' }}</span>
                </div>
            </td>
            <td class="dossier-cell">
                <div class="tile-label">SOUS-GROUPE (TD/TP)</div>
                <div class="tile-value">
                    <span class="badge-pill badge-subgroup">{{ $subGroup ?? 'G1.2' }}</span>
                </div>
            </td>
            <td class="dossier-cell">
                <div class="tile-label">NATURE DE LA SESSION</div>
                <div class="tile-value">
                    <strong style="color: #002147;">{{ $sessionType }}</strong>
                </div>
            </td>
            <td class="dossier-cell">
                <div class="tile-label">STATUT DU DOSSIER</div>
                <div class="tile-value">
                    <span class="badge-pill badge-valid"><span class="dot-green"></span> CONVOCATION VALIDÉE</span>
                </div>
            </td>
        </tr>
    </table>

    <!-- Notice officielle d'émargement -->
    <div class="notice-box">
        <strong>AVIS IMPORTANT AUX CANDIDATS :</strong> Vous êtes convoqué(e) à vous présenter obligatoirement aux dates, horaires et salles indiqués ci-dessous muni(e) de la présente convocation et de votre carte d'étudiant ou CIN.
    </div>

    <!-- Tableau officiel des examens et affectation des places -->
    <table class="exams-table">
        <thead>
            <tr>
                <th style="width: 14%;">DATE</th>
                <th style="width: 15%;">HORAIRES</th>
                <th style="width: 41%; text-align: left; padding-left: 8px;">MODULE & MATIÈRE</th>
                <th style="width: 15%;">SALLE / AMPHI</th>
                <th style="width: 15%;">PLACE ATTRIBUÉE</th>
            </tr>
        </thead>
        <tbody>
            @forelse($exams as $exam)
                <tr>
                    <td>
                        <div class="exam-date-badge">{{ $exam['date'] }}</div>
                    </td>
                    <td>
                        <div class="exam-time-badge">{{ $exam['time'] }}</div>
                    </td>
                    <td style="text-align: left; padding-left: 8px;">
                        <span class="exam-module-code">{{ $exam['module_code'] }}</span><br/>
                        <span class="exam-module-name">{{ $exam['module_name'] }}</span>
                    </td>
                    <td>
                        <span class="exam-room-pill">{{ $exam['room'] }}</span>
                    </td>
                    <td>
                        <span class="exam-seat-ticket">{{ $exam['seat'] }}</span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="padding: 12px; color: #64748b; font-size: 7pt;">
                        Aucune épreuve programmée pour cette session.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Charte et Consignes Générales de Discipline -->
    <div class="rules-card">
        <div class="rules-title">Consignes Officielles & Discipline des Examens :</div>
        <ul class="rules-list">
            <li><strong>Ponctualité stricte :</strong> Présence obligatoire devant la salle d'examen 15 minutes avant le début de l'épreuve. Aucun retard supérieur à 15 minutes ne sera toléré.</li>
            <li><strong>Contrôle d'identité :</strong> Présentation obligatoire de la carte d'étudiant ou de la CIN avec cette convocation aux surveillants.</li>
            <li><strong>Appareils électroniques :</strong> Les téléphones portables, montres connectées et objets connectés sont strictement interdits et doivent être éteints dans les cartables.</li>
            <li><strong>Discipline & Fraude :</strong> Toute communication ou tentative de fraude entraîne l'exclusion immédiate et la comparution automatique devant le Conseil de Discipline.</li>
            <li><strong>Emargement :</strong> Tout candidat est tenu de signer la liste d'émargement officielle avant de quitter la salle d'examen.</li>
        </ul>
    </div>

    <!-- Cartouche Officiel de Vérification Électronique & Signature (Pied de page) -->
    <table class="verification-table">
        <tr>
            <!-- 1. QR Code & Instructions de Scan -->
            <td class="verification-cell" style="width: 33%;">
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                    <tr>
                        <td style="width: 58px; vertical-align: middle; padding-right: 4px;">
                            @if(!empty($qrBase64))
                                <div class="qr-card">
                                    <img src="{{ $qrBase64 }}" alt="QR Code Pass Entrée" style="width: 52px; height: 52px; display: block;"/>
                                </div>
                            @else
                                <div style="width: 52px; height: 52px; border: 1px dashed #cbd5e1; text-align: center; line-height: 52px; font-size: 6pt; color: #94a3b8;">
                                    PASS QR
                                </div>
                            @endif
                        </td>
                        <td style="vertical-align: middle; line-height: 1.15;">
                            <div style="font-size: 6.2pt; font-weight: 900; color: #002147; text-transform: uppercase;">
                                PASS ENTRÉE SALLE
                            </div>
                            <div style="font-size: 5.2pt; font-weight: 900; color: #059669; margin: 1px 0;">
                                <span class="dot-green"></span> CONVOCATION CERTIFIÉE
                            </div>
                            <div style="font-size: 4.8pt; color: #475569; line-height: 1.15;">
                                Scannez ce Pass QR à l'entrée de la salle d'examen pour authentification biométrique et émargement.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>

            <!-- 2. Sécurité, Empreinte SHA-256 & Horodatage -->
            <td class="verification-cell" style="width: 37%; padding: 0 4px;">
                <div style="background: #f8fafc; border: 0.8px solid #cbd5e1; border-radius: 2px; padding: 2.5px 5px;">
                    <div style="font-size: 5.8pt; font-weight: 900; color: #002147; text-transform: uppercase;">
                        AUTHENTICITÉ NUMÉRIQUE & CONTRÔLE
                    </div>
                    <div style="font-family: monospace; font-size: 4.8pt; color: #0f172a; background: #f1f5f9; border: 0.5px solid #e2e8f0; padding: 1.5px 3px; border-radius: 2px; margin: 1px 0; word-break: break-all;">
                        SHA-256 : {{ $verifyToken ?? 'CONV-CERTIFIED-SECURE' }}
                    </div>
                    <div style="font-size: 4.8pt; color: #0284c7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        Vérification : {{ $verifyUrl ?? url('/') }}
                    </div>
                    <div style="font-size: 4.5pt; color: #64748b; margin-top: 1px;">
                        Système d'Information ERP ENCG Fès • Conforme à la loi 53-05.
                    </div>
                </div>
            </td>

            <!-- 3. Visa & Sceau Officiel de l'Administration -->
            <td class="verification-cell" style="width: 30%;">
                <div class="stamp-box">
                    <div class="stamp-title">POUR LE DIRECTEUR DE L'ÉCOLE</div>
                    <div class="stamp-sub">Le Directeur Adjoint aux Affaires Pédagogiques</div>
                    <div class="stamp-badge">
                        <span class="dot-green"></span> VISA & CACHET ÉLECTRONIQUE
                    </div>
                    <div style="font-size: 4.5pt; color: #94a3b8; margin-top: 1.5px;">
                        RÉF-SIG : DAP-{{ date('Ymd') }}-CONV-ENCG
                    </div>
                </div>
            </td>
        </tr>
    </table>
</div>

</body>
</html>
