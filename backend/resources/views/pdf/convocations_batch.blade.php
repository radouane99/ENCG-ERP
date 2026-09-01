<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Convocation aux Examens — ENCG Fès</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #1a1a2e;
            background: #fff;
        }

        .page-break { page-break-after: always; }

        /* ── PAGE CONTAINER ── */
        .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 18px 24px;
            position: relative;
            min-height: 1100px;
        }

        /* ── HEADER ── */
        .header {
            display: table;
            width: 100%;
            border-bottom: 3px solid #1a3a5c;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .header-left {
            display: table-cell;
            vertical-align: middle;
            width: 60%;
        }
        .header-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 40%;
        }
        .logo { max-height: 52px; max-width: 200px; }
        .logo-fallback {
            font-size: 10px;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            line-height: 1.3;
        }
        .logo-fallback .logo-main { font-size: 14px; }
        .logo-fallback .logo-sub { font-size: 8px; color: #4a6b8a; }

        .ministry-text {
            font-size: 7.5px;
            color: #4a6b8a;
            text-align: right;
            line-height: 1.5;
        }
        .ministry-text strong { color: #1a3a5c; font-size: 8px; }

        /* ── TITLE BANNER ── */
        .title-banner {
            background: linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%);
            color: #fff;
            text-align: center;
            padding: 10px 20px;
            margin-bottom: 14px;
            border-radius: 3px;
        }
        .title-banner .title-main {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
        .title-banner .title-sub {
            font-size: 11px;
            margin-top: 3px;
            opacity: 0.9;
            font-style: italic;
        }
        .title-banner .session-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.4);
            padding: 2px 12px;
            border-radius: 12px;
            font-size: 9px;
            margin-top: 5px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        /* ── STUDENT INFO CARD ── */
        .info-card {
            border: 1.5px solid #c8d8e8;
            border-radius: 4px;
            margin-bottom: 12px;
            overflow: hidden;
        }
        .info-card-header {
            background: #e8f0f8;
            padding: 5px 12px;
            font-size: 9px;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-bottom: 1px solid #c8d8e8;
        }
        .info-card-body {
            padding: 8px 12px;
            display: table;
            width: 100%;
        }
        .info-col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .info-col:first-child {
            border-right: 1px solid #e0eaf3;
            padding-right: 12px;
        }
        .info-col:last-child {
            padding-left: 12px;
        }
        .info-row-item {
            margin-bottom: 5px;
        }
        .info-row-label {
            font-size: 8.5px;
            color: #6b8aaa;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 1px;
        }
        .info-row-value {
            font-size: 11px;
            font-weight: bold;
            color: #1a1a2e;
        }
        .info-row-value.highlight {
            color: #1a3a5c;
            font-size: 12px;
        }

        /* ── INSTRUCTION ── */
        .instruction-box {
            background: #f0f7ff;
            border-left: 3px solid #2d6a9f;
            padding: 7px 12px;
            margin-bottom: 10px;
            font-size: 10px;
            color: #1a3a5c;
            font-style: italic;
        }

        /* ── EXAMS TABLE ── */
        .section-title {
            font-size: 9.5px;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 5px;
            padding-left: 8px;
            border-left: 3px solid #2d6a9f;
        }

        table.exams-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 9.5px;
        }
        .exams-table thead tr {
            background: #1a3a5c;
            color: #fff;
        }
        .exams-table th {
            padding: 6px 6px;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border: 1px solid #1a3a5c;
        }
        .exams-table td {
            padding: 5px 6px;
            border: 1px solid #c8d8e8;
            text-align: center;
            vertical-align: middle;
        }
        .exams-table td.col-matiere {
            text-align: left;
            font-weight: bold;
            color: #1a3a5c;
        }
        .exams-table tbody tr:nth-child(even) {
            background: #f5f9ff;
        }
        .exams-table tbody tr:nth-child(odd) {
            background: #fff;
        }
        .exams-table td.date-cell {
            font-weight: bold;
            color: #1a3a5c;
            white-space: nowrap;
        }
        .exams-table td.time-cell {
            background: #e8f0f8;
            font-weight: bold;
            color: #2d6a9f;
            white-space: nowrap;
        }
        .exams-table td.room-cell {
            font-weight: bold;
            color: #1a3a5c;
        }
        .seat-badge {
            display: inline-block;
            background: #1a3a5c;
            color: #fff;
            padding: 1px 7px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: bold;
        }

        /* ── RULES ── */
        .rules-section { margin-bottom: 12px; }
        .rules-title {
            font-size: 9.5px;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 5px;
            padding-left: 8px;
            border-left: 3px solid #c0392b;
        }
        .rules-text {
            font-size: 7.8px;
            line-height: 1.5;
            text-align: justify;
            color: #333;
            background: #fffbf0;
            border: 1px solid #f0e0c0;
            padding: 7px 10px;
            border-radius: 3px;
        }

        /* ── FOOTER AREA ── */
        .footer-area {
            display: table;
            width: 100%;
            margin-top: 10px;
            border-top: 2px solid #1a3a5c;
            padding-top: 10px;
        }
        .footer-left {
            display: table-cell;
            width: 50%;
            vertical-align: bottom;
        }
        .footer-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            text-align: right;
        }
        .ref-text {
            font-size: 7.5px;
            color: #8899aa;
            line-height: 1.6;
        }
        .ref-text .ref-code {
            font-weight: bold;
            color: #4a6b8a;
            letter-spacing: 0.5px;
        }
        .signature-block { text-align: right; }
        .signature-label {
            font-size: 9px;
            font-weight: bold;
            color: #1a3a5c;
            margin-bottom: 3px;
        }
        .signature-sublabel {
            font-size: 8px;
            color: #6b8aaa;
            font-style: italic;
            margin-bottom: 8px;
        }
        .signature-space {
            height: 35px;
            border-bottom: 1px dashed #aaa;
            margin-bottom: 4px;
            margin-left: 30px;
        }
        .qr-area {
            display: table;
            margin-top: 5px;
            margin-left: auto;
        }
        .qr-area img {
            border: 2px solid #1a3a5c;
            padding: 3px;
            background: #fff;
        }
        .qr-label {
            font-size: 7px;
            color: #6b8aaa;
            text-align: center;
            margin-top: 3px;
        }

        /* ── WATERMARK ── */
        .watermark-valid {
            display: inline-block;
            border: 1.5px solid #27ae60;
            color: #27ae60;
            font-size: 8px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* ── PAGE NUMBER ── */
        .page-num {
            font-size: 7.5px;
            color: #aab;
            text-align: center;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    @foreach($studentsData as $index => $data)
        <div class="container">

            {{-- ═══ HEADER ═══ --}}
            <div class="header">
                <div class="header-left">
                    @if(file_exists(public_path('logo-encg.png')))
                        <img src="{{ public_path('logo-encg.png') }}" alt="Logo ENCG" class="logo">
                    @elseif(file_exists(public_path('images/logo.png')))
                        <img src="{{ public_path('images/logo.png') }}" alt="Logo ENCG" class="logo">
                    @else
                        <div class="logo-fallback">
                            <div class="logo-main">ENCG Fès</div>
                            <div class="logo-sub">École Nationale de Commerce et de Gestion</div>
                        </div>
                    @endif
                </div>
                <div class="header-right">
                    <div class="ministry-text">
                        <strong>Royaume du Maroc</strong><br>
                        Ministère de l'Enseignement Supérieur<br>
                        Université Sidi Mohamed Ben Abdellah<br>
                        <strong>ENCG — Fès</strong>
                    </div>
                </div>
            </div>

            {{-- ═══ TITLE BANNER ═══ --}}
            <div class="title-banner">
                <div class="title-main">Convocation aux Examens</div>
                <div class="title-sub">{{ $data['session_name'] ?? 'Session d\'Examens' }}</div>
                <div class="session-badge">{{ strtoupper($data['session_type'] ?? 'Normale') }}</div>
            </div>

            {{-- ═══ STUDENT INFO CARD ═══ --}}
            <div class="info-card">
                <div class="info-card-header">&#128100; Informations de l'Étudiant</div>
                <div class="info-card-body">
                    <div class="info-col">
                        <div class="info-row-item">
                            <span class="info-row-label">Nom & Prénom</span>
                            <span class="info-row-value highlight">{{ strtoupper($data['person_name'] ?? '') }}</span>
                        </div>
                        <div class="info-row-item">
                            <span class="info-row-label">Matricule / CNE</span>
                            <span class="info-row-value">{{ strtoupper($data['person_id'] ?? '') }}</span>
                        </div>
                    </div>
                    <div class="info-col">
                        <div class="info-row-item">
                            <span class="info-row-label">Filière</span>
                            <span class="info-row-value">{{ $data['filiere_name'] ?? 'Tronc Commun ENCG' }}</span>
                        </div>
                        <div class="info-row-item">
                            <span class="info-row-label">Année Universitaire</span>
                            <span class="info-row-value">2025 — 2026</span>
                        </div>
                    </div>
                </div>
            </div>

            {{-- ═══ INSTRUCTION ═══ --}}
            <div class="instruction-box">
                Vous êtes prié(e) de vous présenter aux dates, heures et salles indiquées ci-dessous pour passer les épreuves de votre session d'examens.
            </div>

            {{-- ═══ EXAM TABLE ═══ --}}
            <div class="section-title">&#128203; Programme des Épreuves</div>
            <table class="exams-table">
                <thead>
                    <tr>
                        <th style="width:13%">Date</th>
                        <th style="width:14%">Horaire</th>
                        <th style="width:30%">Module / Épreuve</th>
                        <th style="width:20%">Enseignant</th>
                        <th style="width:13%">Salle / Amphi</th>
                        <th style="width:10%">Place N°</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data['exams'] as $exam)
                        <tr>
                            <td class="date-cell">{{ $exam['date'] }}</td>
                            <td class="time-cell">{{ $exam['time'] }}</td>
                            <td class="col-matiere">{{ $exam['module'] }}</td>
                            <td>{{ $exam['enseignant'] ?? '-' }}</td>
                            <td class="room-cell">{{ $exam['room'] }}</td>
                            <td><span class="seat-badge">{{ $exam['seat'] }}</span></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            {{-- ═══ RÈGLEMENT ═══ --}}
            <div class="rules-section">
                <div class="rules-title">&#9888; Règlement des Examens — À lire attentivement</div>
                <div class="rules-text">
                    L'usage des téléphones portables, tablettes ou autres appareils électroniques est <strong>strictement interdit</strong> en salle d'examen. Même lorsque l'usage des calculatrices est autorisé, les portables ne peuvent être utilisés à cet effet.<br>
                    — L'usage des PC portables est interdit sauf autorisation explicite de l'enseignant responsable de l'épreuve.<br>
                    — Chaque étudiant est tenu de se munir de tous les articles de bureau nécessaires (stylos, crayons, gomme, règle, etc.). L'échange de tels articles entre étudiants est interdit.<br>
                    — Tout étudiant en retard de plus de <strong>20 minutes</strong> après la distribution des sujets ne peut être admis dans la salle. Tout retard de plus de 30 minutes est définitivement prohibé.<br>
                    — Aucun étudiant ne pourra quitter la salle avant 30 minutes après la distribution des sujets. Il est strictement interdit de quitter temporairement la salle pendant l'épreuve.<br>
                    — Toute fraude constatée donne lieu à un zéro et à un rapport de discipline transmis à la Direction dans un délai de 48h. Toute copie non rendue à l'heure est affectée d'un zéro.
                </div>
            </div>

            {{-- ═══ FOOTER ═══ --}}
            <div class="footer-area">
                <div class="footer-left">
                    <div class="ref-text">
                        Généré électroniquement le {{ now()->format('d/m/Y à H:i') }}<br>
                        Réf. document : <span class="ref-code">{{ strtoupper(substr(md5(($data['id'] ?? 'ENCG').($data['created_at'] ?? '')), 0, 12)) }}</span><br>
                        <span class="watermark-valid">&#10003; Document Officiel</span>
                    </div>
                </div>
                <div class="footer-right">
                    <div class="signature-block">
                        <div class="signature-label">La Chargée de Scolarité</div>
                        <div class="signature-sublabel">et des Affaires Estudiantines</div>
                        <div class="signature-space"></div>
                        <div class="ref-text">Cachet &amp; Signature</div>
                        @if(!empty($data['qrCodeBase64']))
                            <div class="qr-area">
                                <img src="{{ $data['qrCodeBase64'] }}" alt="QR Code" width="72" height="72">
                                <div class="qr-label">Scan pour vérifier</div>
                            </div>
                        @elseif(!empty($data['qr_token']))
                            <div class="qr-area">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=72x72&data={{ urlencode($data['qr_token']) }}"
                                     alt="QR" width="72" height="72" onerror="this.style.display='none'">
                                <div class="qr-label">Scan pour vérifier</div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>

            <div class="page-num">
                ENCG Fès — Université Sidi Mohamed Ben Abdellah — {{ $data['session_name'] ?? 'Session d\'Examens' }} — {{ $data['session_type'] ?? '' }}
            </div>

        </div>

        @if(!$loop->last)
            <div class="page-break"></div>
        @endif
    @endforeach
</body>
</html>
