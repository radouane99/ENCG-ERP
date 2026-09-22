<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Rapport Statistique Annuel Officiel MESRSFC — ENCG Fès</title>
    <style>
        @page { 
            size: A4 portrait; 
            margin: 4mm 6mm 4mm 6mm; 
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
            line-height: 1.18;
            background: #ffffff;
        }
        .page-container {
            border: 1.8px solid #002147;
            padding: 5px 8px 4px 8px;
            background: #ffffff;
            position: relative;
            page-break-inside: avoid;
        }

        /* Filigrane officiel */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-28deg);
            opacity: 0.03;
            font-size: 32pt;
            font-weight: 900;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-align: center;
            width: 100%;
            pointer-events: none;
            z-index: 0;
        }

        .content-layer {
            position: relative;
            z-index: 1;
        }

        /* En-tête officiel ENCG Fès / MESRSFC */
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
        .hdr-kingdom {
            font-size: 6.6pt;
            font-weight: bold;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.1;
        }
        .hdr-ar-kingdom {
            font-size: 7.6pt;
            font-weight: bold;
            color: #002147;
            line-height: 1.15;
        }
        .hdr-ministry {
            font-size: 6.0pt;
            font-weight: bold;
            color: #1e3a8a;
            line-height: 1.1;
        }
        .hdr-ar-ministry {
            font-size: 6.6pt;
            font-weight: bold;
            color: #1e3a8a;
            line-height: 1.1;
        }
        .hdr-univ {
            font-size: 5.6pt;
            color: #334155;
            line-height: 1.1;
        }
        .hdr-ar-univ {
            font-size: 6.2pt;
            font-weight: bold;
            color: #1e293b;
            line-height: 1.1;
        }
        .hdr-school {
            font-size: 6.6pt;
            font-weight: bold;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            line-height: 1.1;
        }
        .hdr-ar-school {
            font-size: 6.6pt;
            font-weight: bold;
            color: #002147;
            line-height: 1.15;
        }

        /* Cartouche de Référence */
        .ref-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #c9a227;
            background-color: #fffdf7;
            border-radius: 2px;
            text-align: left;
        }
        .ref-table td {
            padding: 1.5px 3px;
            font-size: 5.2pt;
            line-height: 1.1;
            color: #334155;
        }
        .ref-hdr {
            background-color: #002147;
            color: #ffffff !important;
            font-weight: bold;
            font-size: 5.0pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            text-align: center;
        }
        .ref-val {
            font-family: 'DejaVu Sans Mono', monospace, sans-serif;
            font-size: 5.6pt;
            font-weight: bold;
            color: #002147;
            border-bottom: 1px solid #f1e5c3;
        }
        .ref-badge {
            display: inline-block;
            background-color: #002147;
            color: #ffffff;
            font-size: 4.8pt;
            font-weight: bold;
            padding: 1px 3px;
            border-radius: 2px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        /* Séparateur Royal Double Ligne */
        .royal-divider {
            margin: 1.5px 0 2.5px 0;
            border-top: 1.2px solid #002147;
            border-bottom: 0.8px solid #c9a227;
            height: 1.5px;
        }

        /* Titre Officiel Bilingue */
        .title-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2.5px;
        }
        .title-cell {
            background-color: #002147;
            border-top: 1px solid #c9a227;
            color: #ffffff;
            text-align: center;
            padding: 2.5px 4px;
            border-radius: 2px;
        }
        .title-cell h1 {
            font-size: 8.6pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.05;
        }
        .title-cell .ar-sub {
            font-size: 6.8pt;
            font-weight: bold;
            color: #fde047;
            margin-top: 1px;
            line-height: 1.15;
        }
        .title-cell .degree-sub {
            font-size: 4.8pt;
            font-weight: bold;
            color: #e2e8f0;
            margin-top: 0.5px;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }

        /* Section Header Bar */
        .sec-header {
            background-color: #002147;
            color: #ffffff;
            font-size: 5.4pt;
            font-weight: 900;
            padding: 2px 5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-radius: 2px 2px 0 0;
            border-bottom: 0.8px solid #c9a227;
            margin-top: 2px;
        }

        /* KPI Bento Grid */
        .kpi-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 2px;
        }
        .kpi-cell {
            border: 0.8px solid #cbd5e1;
            padding: 2px 4px;
            background: #f8fafc;
            text-align: center;
            vertical-align: middle;
        }
        .kpi-label {
            font-size: 4.4pt;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-bottom: 0.5px;
        }
        .kpi-val {
            font-size: 7.2pt;
            font-weight: 900;
            color: #002147;
            line-height: 1.1;
        }
        .kpi-sub {
            font-size: 4.3pt;
            color: #64748b;
            margin-top: 0.5px;
        }

        /* Data Tables */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 0.8px solid #002147;
            margin-bottom: 2px;
        }
        .data-table th {
            background-color: #f1f5f9;
            color: #002147;
            font-size: 4.8pt;
            font-weight: 800;
            padding: 2px 3px;
            border: 0.8px solid #cbd5e1;
            text-align: left;
            text-transform: uppercase;
        }
        .data-table td {
            font-size: 5.6pt;
            padding: 2px 3px;
            border: 0.8px solid #cbd5e1;
            vertical-align: middle;
        }

        /* Authentification & Sceau */
        .auth-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 0.8px solid #cbd5e1;
            background: #ffffff;
            margin-top: 2px;
            margin-bottom: 1.5px;
        }
        .auth-table td {
            vertical-align: middle;
            padding: 2px 4px;
            border: none;
        }
        .auth-left {
            width: 52%;
            border-right: 0.8px solid #e2e8f0;
        }
        .auth-right {
            width: 48%;
            text-align: center;
            padding-left: 6px;
        }
        .seal-circle {
            display: inline-block;
            width: 36px;
            height: 36px;
            border: 1.2px dashed #1d4ed8;
            border-radius: 50%;
            text-align: center;
            padding: 1.5px;
            margin-top: 1px;
            color: #1d4ed8;
        }

        /* Pied de Page */
        .footer-bar {
            border-top: 0.8px solid #cbd5e1;
            padding-top: 1.5px;
            font-size: 4.4pt;
            color: #64748b;
            text-align: center;
            line-height: 1.1;
        }
    </style>
</head>
<body>

<div class="page-container">
    <div class="watermark">ROYAUME DU MAROC • MESRSFC • ENCG FÈS</div>

    <div class="content-layer">
        
        <!-- En-tête Officiel Bilingue -->
        <table class="header-table">
            <tr>
                <td style="width: 22%; text-align: left;">
                    @if(!empty($logoBase64))
                        <img src="{{ $logoBase64 }}" style="max-height: 46px; max-width: 130px; width: auto; display: block;" alt="Logo ENCG Fès">
                    @else
                        <strong style="color: #002147; font-size: 10pt; letter-spacing: 0.5px;">ENCG FÈS</strong><br>
                        <span style="font-size: 5.5pt; color: #64748b;">Université USMBA</span>
                    @endif
                </td>
                <td style="width: 54%; text-align: center;">
                    <div class="hdr-kingdom">ROYAUME DU MAROC</div>
                    <div class="hdr-ar-kingdom">{!! $arKingdom ?? 'المملكة المغربية' !!}</div>
                    <div class="hdr-ministry">Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation</div>
                    <div class="hdr-ar-ministry">{!! $arMinistry ?? 'وزارة التعليم العالي والبحث العلمي والابتكار' !!}</div>
                    <div class="hdr-univ">Université Sidi Mohamed Ben Abdellah de Fès</div>
                    <div class="hdr-ar-univ">{!! $arUniv ?? 'جامعة سيدي محمد بن عبد الله - فاس' !!}</div>
                    <div class="hdr-school">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                    <div class="hdr-ar-school">{!! $arSchool ?? 'المدرسة الوطنية للتجارة والتسيير بفاس' !!}</div>
                </td>
                <td style="width: 24%; text-align: right;">
                    <table class="ref-table">
                        <tr>
                            <td class="ref-hdr" colspan="2">DOCUMENT OFFICIEL MESRSFC</td>
                        </tr>
                        <tr>
                            <td class="ref-val" colspan="2">{{ $refNumber ?? 'MESRSFC/ENCG-FÈS/STAT-2026/N° 01' }}</td>
                        </tr>
                        <tr>
                            <td><strong>DATE :</strong> {{ date('d/m/Y') }}</td>
                            <td style="text-align: right;"><strong>ANNÉE :</strong> {{ $academicYear ?? '2025/2026' }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="text-align: center; padding: 0.5px;">
                                <span class="ref-badge">RAPPORT MINISTÈRE</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="royal-divider"></div>

        <!-- Titre Solennel Bilingue -->
        <table class="title-table">
            <tr>
                <td class="title-cell">
                    <h1>RAPPORT STATISTIQUE ANNUEL OFFICIEL — MESRSFC</h1>
                    <div class="ar-sub">{!! $arDocTitle ?? 'التقرير الإحصائي السنوي الرسمي للوزارة الوصية' !!}</div>
                    <div class="degree-sub">INDICATEURS CLÉS D'ACTIVITÉ, DE SCOLARITÉ &amp; DE GOUVERNANCE PÉDAGOGIQUE — ENCG FÈS</div>
                </td>
            </tr>
        </table>

        <!-- ── Section 1 : Démographie & Effectifs Étudiants ────────────── -->
        <div class="sec-header">1. Démographie &amp; Effectifs Étudiants Inscrits (Année {{ $academicYear }})</div>
        <table class="kpi-table">
            <tr>
                <td class="kpi-cell" style="border-radius: 2px 0 0 2px;">
                    <div class="kpi-label">Total Étudiants Inscrits</div>
                    <div class="kpi-val">{{ $totalStudents }}</div>
                    <div class="kpi-sub">Effectif Global Actif</div>
                </td>
                <td class="kpi-cell">
                    <div class="kpi-label">Effectif Féminin (Femmes)</div>
                    <div class="kpi-val" style="color: #9333ea;">{{ $femaleCount }}</div>
                    <div class="kpi-sub">{{ $tauxFeminisation }}% du total</div>
                </td>
                <td class="kpi-cell">
                    <div class="kpi-label">Effectif Masculin (Hommes)</div>
                    <div class="kpi-val" style="color: #2563eb;">{{ $maleCount }}</div>
                    <div class="kpi-sub">{{ $totalStudents > 0 ? round(($maleCount / $totalStudents) * 100, 1) : 0 }}% du total</div>
                </td>
                <td class="kpi-cell" style="border-radius: 0 2px 2px 0;">
                    <div class="kpi-label">Taux de Féminisation</div>
                    <div class="kpi-val" style="color: #16a34a;">{{ $tauxFeminisation }}%</div>
                    <div class="kpi-sub">Parité &amp; Inclusion</div>
                </td>
            </tr>
        </table>

        <!-- ── Section 2 : Répartition par Filière & Cycle ─────────────── -->
        <div class="sec-header">2. Répartition Officielle par Filière d'Études &amp; Spécialité</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 15%;">Code Filière</th>
                    <th style="width: 48%;">Intitulé Officiel de la Filière / Spécialité</th>
                    <th style="width: 17%; text-align: center;">Étudiants Inscrits</th>
                    <th style="width: 20%; text-align: center;">Part Relative (%)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($byFiliere as $f)
                <tr>
                    <td style="font-weight: bold; font-family: monospace;">{{ $f['code'] ?: 'FIL-'.str_pad($loop->iteration, 2, '0', STR_PAD_LEFT) }}</td>
                    <td><strong>{{ $f['filiere'] }}</strong></td>
                    <td style="text-align: center; font-weight: bold; color: #002147;">{{ $f['count'] }}</td>
                    <td style="text-align: center;">
                        <strong>{{ $f['percentage'] }}%</strong>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- ── Section 3 : Performance Pédagogique & Corps Professoral ──── -->
        <div class="sec-header">3. Encadrement Pédagogique &amp; Corps Professoral</div>
        <table class="kpi-table">
            <tr>
                <td class="kpi-cell" style="border-radius: 2px 0 0 2px;">
                    <div class="kpi-label">Taux de Réussite Académique</div>
                    <div class="kpi-val" style="color: #16a34a;">{{ $successRate }}%</div>
                    <div class="kpi-sub">{{ $successCount }} / {{ $totalWithGrades }} étudiants évalués</div>
                </td>
                <td class="kpi-cell">
                    <div class="kpi-label">Modules Accrédités</div>
                    <div class="kpi-val">{{ $totalModules }}</div>
                    <div class="kpi-sub">Architecture CNPN LMD</div>
                </td>
                <td class="kpi-cell">
                    <div class="kpi-label">Professeurs Permanents</div>
                    <div class="kpi-val" style="color: #002147;">{{ $totalProfs }}</div>
                    <div class="kpi-sub">Enseignants-Chercheurs Titulaires</div>
                </td>
                <td class="kpi-cell">
                    <div class="kpi-label">Enseignants Vacataires</div>
                    <div class="kpi-val" style="color: #ca8a04;">{{ $vacataires }}</div>
                    <div class="kpi-sub">Intervenants Professionnels</div>
                </td>
                <td class="kpi-cell" style="border-radius: 0 2px 2px 0;">
                    <div class="kpi-label">Ratio Étudiants / Prof</div>
                    <div class="kpi-val" style="color: #0891b2;">{{ $ratioEtudiantProf }}</div>
                    <div class="kpi-sub">Étudiants par enseignant permanent</div>
                </td>
            </tr>
        </table>

        <!-- ── Section 4 : Stages PFE & Dématérialisation Administrative ── -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 2px;">
            <tr>
                <td style="width: 49%; vertical-align: top; padding-right: 3px;">
                    <div class="sec-header">4. Projets de Fin d'Études (PFE)</div>
                    <table class="kpi-table" style="margin-bottom: 0;">
                        <tr>
                            <td class="kpi-cell">
                                <div class="kpi-label">PFE Soumis</div>
                                <div class="kpi-val">{{ $totalPfe }}</div>
                            </td>
                            <td class="kpi-cell">
                                <div class="kpi-label">Validés en Jury</div>
                                <div class="kpi-val" style="color: #16a34a;">{{ $validatedPfe }}</div>
                            </td>
                            <td class="kpi-cell">
                                <div class="kpi-label">Taux Validation</div>
                                <div class="kpi-val" style="color: #2563eb;">{{ $tauxValidation }}%</div>
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="width: 51%; vertical-align: top; padding-left: 3px;">
                    <div class="sec-header">5. Vie Administrative &amp; Dématérialisation</div>
                    <table class="kpi-table" style="margin-bottom: 0;">
                        <tr>
                            <td class="kpi-cell">
                                <div class="kpi-label">Demandes Docs</div>
                                <div class="kpi-val">{{ $totalDocRequests }}</div>
                            </td>
                            <td class="kpi-cell">
                                <div class="kpi-label">Délivrées (Taux)</div>
                                <div class="kpi-val" style="color: #16a34a;">{{ $tauxDelivrance }}%</div>
                            </td>
                            <td class="kpi-cell">
                                <div class="kpi-label">Absences (Justif.)</div>
                                <div class="kpi-val" style="color: #ea580c;">{{ $tauxJustification }}%</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- ── Section 6 : Authentification Numérique & Sceau Officiel ─── -->
        <table class="auth-table">
            <tr>
                <td class="auth-left">
                    <table style="width: 100%; border-collapse: collapse; border: none;">
                        <tr>
                            @if(!empty($qrCodeBase64))
                            <td style="width: 44px; vertical-align: middle; border: none; padding-right: 4px;">
                                <img src="{{ $qrCodeBase64 }}" style="width: 40px; height: 40px; border: 0.8px solid #cbd5e1; padding: 1.5px; display: block;" alt="QR Code">
                            </td>
                            @endif
                            <td style="vertical-align: middle; border: none;">
                                <strong style="color: #002147; font-size: 5.2pt;">CERTIFICATION DE CONFORMITÉ MESRSFC</strong><br>
                                <span style="font-size: 4.5pt; color: #475569;">Système d'Information Scolarité &bull; ENCG Fès</span><br>
                                <span style="font-size: 4.3pt; color: #64748b;">Empreinte SHA-256 : <span style="font-family: monospace;">{{ $sealHash }}</span></span><br>
                                <span style="font-size: 4.3pt; color: #047857; font-weight: bold;">Document statistique officiel certifié conforme extrait de la base centrale.</span>
                            </td>
                        </tr>
                    </table>
                </td>
                <td class="auth-right">
                    <div style="font-style: italic; color: #334155; font-size: 5.2pt; margin-bottom: 0.5px;">Fait à Fès, le {{ $generatedDate }}</div>
                    <div style="font-weight: 900; color: #002147; font-size: 5.6pt; text-transform: uppercase;">Pour le Directeur de l'ENCG de Fès et par délégation,</div>
                    <div style="font-size: 4.8pt; color: #64748b; margin-bottom: 1px;">Le Directeur Adjoint chargé des Affaires Pédagogiques</div>
                    
                    <div class="seal-circle">
                        <div style="font-size: 2.5pt; font-weight: 900;">USMBA</div>
                        <div style="font-size: 5pt; color: #c9a227; line-height: 1;">★</div>
                        <div style="font-size: 2.3pt; font-weight: 800;">ENCG FÈS</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer-bar">
            <strong>École Nationale de Commerce et de Gestion de Fès</strong> &bull; Université Sidi Mohamed Ben Abdellah &bull; Quartier Industriel Ain Chkef, Route d'Imouzzer, BP 81 A Fès — Maroc &bull; Tél: +212 5 35 61 14 00 &bull; www.encg-fes.ac.ma &bull; Direction des Études &amp; de la Planification
        </div>

    </div>
</div>

</body>
</html>
