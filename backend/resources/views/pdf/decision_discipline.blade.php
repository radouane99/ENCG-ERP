<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Procès-Verbal de Décision — {{ $fullNameFr ?? ($student->last_name ?? '') }} — ENCG Fès</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 5mm 7mm 5mm 7mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 7.6pt;
            line-height: 1.3;
            background: #ffffff;
        }
        .page-container {
            border: 2px solid #581c1c;
            outline: 1px solid #c9a227;
            outline-offset: -4px;
            padding: 7px 10px 5px 10px;
            background: #ffffff;
            position: relative;
        }

        /* En-tête officiel bilingue ENCG Fès & Royaume du Maroc */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 1px;
        }
        .header-table td {
            vertical-align: middle;
            border: none;
            padding: 0;
        }
        .hdr-kingdom {
            font-size: 7.5pt;
            font-weight: bold;
            color: #581c1c;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 1px;
        }
        .hdr-ar-kingdom {
            font-size: 8.5pt;
            font-weight: bold;
            color: #581c1c;
            margin-bottom: 1px;
        }
        .hdr-univ {
            font-size: 6.5pt;
            color: #334155;
        }
        .hdr-ar-univ {
            font-size: 7pt;
            font-weight: bold;
            color: #1e293b;
        }
        .hdr-school {
            font-size: 7.2pt;
            font-weight: bold;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .hdr-ar-school {
            font-size: 7.2pt;
            font-weight: bold;
            color: #002147;
            margin-bottom: 1px;
        }
        .hdr-council {
            font-size: 6.2pt;
            font-weight: bold;
            color: #854d0e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Cartouche de Référence */
        .ref-badge-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #c9a227;
            background-color: #fffdf7;
            border-radius: 3px;
            text-align: left;
        }
        .ref-badge-table td {
            padding: 2px 5px;
            font-size: 6pt;
            line-height: 1.2;
            color: #334155;
        }
        .ref-title {
            background-color: #581c1c;
            color: #ffffff !important;
            font-weight: bold;
            font-size: 5.8pt;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: center;
        }
        .ref-code {
            font-family: 'DejaVu Sans Mono', monospace, sans-serif;
            font-size: 6.5pt;
            font-weight: bold;
            color: #581c1c;
            border-bottom: 1px solid #f1e5c3;
        }
        .ref-meta {
            border-bottom: 1px solid #f8f1de;
        }
        .badge-decision {
            display: inline-block;
            background-color: #991b1b;
            color: #ffffff;
            font-size: 5.8pt;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 2px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        /* Séparateur Royal Double Ligne */
        .royal-divider {
            margin: 2px 0 4px 0;
            border-top: 1.5px solid #581c1c;
            border-bottom: 1px solid #c9a227;
            height: 2px;
        }

        /* Titre Officiel PV */
        .title-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        .title-cell {
            background-color: #581c1c;
            border-top: 1.2px solid #c9a227;
            border-bottom: 1.2px solid #c9a227;
            color: #ffffff;
            text-align: center;
            padding: 4px 8px;
            border-radius: 3px;
        }
        .title-cell h1 {
            font-size: 10pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.15;
        }
        .title-cell .ar-title {
            font-size: 11.5pt;
            font-weight: bold;
            color: #fde68a;
            margin: 1.5px 0 1px 0;
            letter-spacing: 0.2px;
        }
        .title-cell .sub-title {
            font-size: 6.2pt;
            font-weight: bold;
            color: #f1f5f9;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        /* Préambule de l'Instance */
        .instance-preamble {
            font-size: 6.6pt;
            color: #334155;
            line-height: 1.25;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 3px;
            padding: 3px 6px;
            margin-bottom: 5px;
        }

        /* Bento Grid Candidat */
        .dossier-box {
            border: 1.2px solid #cbd5e1;
            border-radius: 3px;
            background: #ffffff;
            margin-bottom: 5px;
        }
        .dossier-header-strip {
            background-color: #f1f5f9;
            border-bottom: 1px solid #cbd5e1;
            padding: 2px 7px;
            font-size: 6.2pt;
            font-weight: bold;
            color: #581c1c;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .dossier-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .dossier-cell {
            border-right: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            padding: 3px 7px;
            vertical-align: middle;
            background: #ffffff;
        }
        .dossier-cell:last-child {
            border-right: none;
        }
        .tile-label {
            font-size: 5.2pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            display: block;
            margin-bottom: 1px;
        }
        .tile-value-fr {
            font-size: 8.8pt;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: 0.2px;
        }
        .tile-value-ar {
            font-size: 10pt;
            font-weight: bold;
            color: #581c1c;
            text-align: right;
            display: block;
        }
        .tile-val {
            font-size: 7.6pt;
            font-weight: bold;
            color: #1e293b;
        }
        .tile-val-mono {
            font-family: 'DejaVu Sans Mono', monospace, sans-serif;
            font-size: 8pt;
            font-weight: bold;
            color: #0f172a;
        }

        /* Section Faits & Audition */
        .section-box {
            border: 1.2px solid #cbd5e1;
            border-radius: 3px;
            background-color: #ffffff;
            margin-bottom: 5px;
        }
        .section-header-strip {
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 2.5px 7px;
            font-size: 7pt;
            font-weight: bold;
            color: #581c1c;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .section-table {
            width: 100%;
            border-collapse: collapse;
        }
        .section-table td {
            padding: 2.5px 7px;
            font-size: 7.2pt;
            vertical-align: top;
            border-bottom: 1px solid #f1f5f9;
        }
        .section-table tr:last-child td {
            border-bottom: none;
        }
        .lbl-col {
            width: 27%;
            font-weight: bold;
            color: #475569;
        }
        .val-col {
            width: 73%;
            color: #0f172a;
        }

        /* Badges */
        .pill-infraction {
            background-color: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecdd3;
            border-radius: 2px;
            padding: 1px 5px;
            font-weight: bold;
            font-size: 7.2pt;
            display: inline-block;
        }

        /* Encadré Sanction Prononcée (Focus Central) */
        .sanction-box {
            border: 1.5px solid #991b1b;
            background-color: #fff8f8;
            border-left: 4px solid #991b1b;
            border-radius: 3px;
            padding: 5px 8px;
            margin-bottom: 5px;
            text-align: center;
        }
        .sanction-header {
            font-size: 7.4pt;
            font-weight: bold;
            color: #991b1b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .sanction-text {
            font-size: 8.8pt;
            font-weight: bold;
            color: #450a0a;
            line-height: 1.25;
            margin: 2px 0;
        }
        .sanction-deliberation {
            font-size: 6.2pt;
            font-weight: bold;
            color: #881337;
            margin-top: 2px;
        }

        /* Effet Juridique & Notifications */
        .legal-notice {
            font-size: 6.2pt;
            color: #334155;
            line-height: 1.25;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-left: 3.5px solid #581c1c;
            padding: 3.5px 7px;
            border-radius: 2px;
            margin-bottom: 4px;
            text-align: justify;
        }

        /* Signatures */
        .signatures-section {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1px;
            margin-bottom: 3px;
        }
        .signatures-section td {
            width: 50%;
            vertical-align: top;
            padding: 0 8px;
            text-align: center;
        }
        .date-city-line {
            text-align: right;
            font-size: 6.6pt;
            font-weight: bold;
            color: #475569;
            margin-bottom: 2px;
            padding-right: 6px;
        }
        .sign-role-title {
            font-size: 7.2pt;
            font-weight: bold;
            color: #581c1c;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 0.5px;
        }
        .sign-role-sub {
            font-size: 5.8pt;
            color: #64748b;
            margin-bottom: 1px;
        }
        .sign-image-wrapper {
            height: 38px;
            margin: 1px auto;
        }
        .sign-image-wrapper img {
            max-height: 36px;
            max-width: 100%;
            display: block;
            margin: 0 auto;
        }
        .sign-status-badge {
            font-size: 5.8pt;
            font-weight: bold;
            color: #475569;
            border-top: 1px dashed #cbd5e1;
            padding-top: 1.5px;
            display: inline-block;
            min-width: 130px;
        }

        /* Pied de Page Sécurisé & Sceau */
        .footer-seal-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1px solid #cbd5e1;
            padding-top: 3px;
            margin-top: 2px;
        }
        .footer-seal-table td {
            vertical-align: middle;
        }
        .hash-code {
            font-family: 'DejaVu Sans Mono', monospace, sans-serif;
            font-size: 5.2pt;
            color: #475569;
            line-height: 1.2;
        }
    </style>
</head>
<body>

<div class="page-container">

    <!-- En-tête Officiel Bilingue -->
    <table class="header-table">
        <tr>
            <td style="width: 22%; text-align: left;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" style="max-height: 50px; max-width: 100%; width: auto;" alt="Logo ENCG Fès">
                @else
                    <strong style="color:#581c1c; font-size: 11pt;">ENCG FÈS</strong>
                @endif
            </td>
            <td style="width: 53%; text-align: center;">
                <div class="hdr-kingdom">ROYAUME DU MAROC</div>
                <div class="hdr-ar-kingdom">{{ $arKingdom ?? 'المملكة المغربية' }}</div>
                <div class="hdr-univ">Université Sidi Mohamed Ben Abdellah de Fès</div>
                <div class="hdr-ar-univ">{{ $arUniv ?? 'جامعة سيدي محمد بن عبد الله - فاس' }}</div>
                <div class="hdr-school">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                <div class="hdr-ar-school">{{ $arSchool ?? 'المدرسة الوطنية للتجارة والتسيير بفاس' }}</div>
                <div class="hdr-council">INSTANCE DISCIPLINAIRE DU CONSEIL DE DISCIPLINE</div>
            </td>
            <td style="width: 25%; text-align: right;">
                <table class="ref-badge-table">
                    <tr>
                        <td class="ref-title" colspan="2">RÉFÉRENCE DU PROCÈS-VERBAL</td>
                    </tr>
                    <tr>
                        <td class="ref-code" colspan="2">ENCG/PV-CD-2026/{{ str_pad($incident->id ?? 1, 4, '0', STR_PAD_LEFT) }}</td>
                    </tr>
                    <tr>
                        <td class="ref-meta"><strong>Date :</strong> {{ date('d/m/Y') }}</td>
                        <td class="ref-meta" style="text-align: right;"><strong>Dossier :</strong> #{{ $incident->id ?? 1 }}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="text-align: center; padding: 1.5px 3px;">
                            <span class="badge-decision">DÉCISION DÉFINITIVE</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="royal-divider"></div>

    <!-- Titre Officiel Bilingue -->
    <table class="title-table">
        <tr>
            <td class="title-cell">
                <h1>PROCÈS-VERBAL DE DÉLIBÉRATION &amp; DÉCISION</h1>
                @if(!empty($arDocTitle))
                    <div class="ar-title">{{ $arDocTitle }}</div>
                @endif
                <div class="sub-title">SÉANCE PLÉNIÈRE DU CONSEIL DE DISCIPLINE — LOI N° 01-00 (ARTICLE 24)</div>
            </td>
        </tr>
    </table>

    <!-- Préambule Juridique de l'Instance -->
    <div class="instance-preamble">
        Le <strong>Conseil de Discipline</strong> de l'École Nationale de Commerce et de Gestion de Fès, régulièrement convoqué et réuni en séance plénière sous la présidence de la Direction de l'Établissement, en présence des membres statutaires du corps enseignant et des délégués des étudiants, a statué contradictoirement sur les griefs disciplinaires reprochés au candidat ci-après identifié :
    </div>

    <!-- Fiche d'Identification du Candidat -->
    <div class="dossier-box">
        <div class="dossier-header-strip">
            DOSSIER DU CANDIDAT DÉFÉRÉ DEVANT LE CONSEIL
        </div>
        <table class="dossier-table">
            <tr>
                <td class="dossier-cell" style="width: 50%;">
                    <span class="tile-label">Nom &amp; Prénom du Candidat (Français)</span>
                    <span class="tile-value-fr">{{ strtoupper($fullNameFr ?? ($student->last_name ?? '')) }}</span>
                </td>
                <td class="dossier-cell" style="width: 50%; text-align: right;">
                    <span class="tile-label" style="text-align: right;">Nom &amp; Prénom (Arabe)</span>
                    <span class="tile-value-ar">{{ !empty($fullNameAr) ? $fullNameAr : 'غير مسجل' }}</span>
                </td>
            </tr>
        </table>
        <table class="dossier-table">
            <tr>
                <td class="dossier-cell" style="width: 32%;">
                    <span class="tile-label">Code Massar / CNE</span>
                    <span class="tile-val-mono">{{ $cne ?? ($student->cne ?? 'N/A') }}</span>
                </td>
                <td class="dossier-cell" style="width: 38%;">
                    <span class="tile-label">Filière &amp; Niveau Académique</span>
                    <span class="tile-val" style="color: #854d0e;">{{ $filiere ?? 'Tronc Commun ENCG' }}</span>
                </td>
                <td class="dossier-cell" style="width: 30%;">
                    <span class="tile-label">Année Universitaire</span>
                    <span class="tile-val">2025 / 2026</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- Section 1 : Rappel des Faits & Audition -->
    <div class="section-box">
        <div class="section-header-strip">
            ■ 1. RAPPEL DES FAITS &amp; DÉROULEMENT DE L'AUDITION CONTRADICTOIRE
        </div>
        <table class="section-table">
            <tr>
                <td class="lbl-col">Grief Constaté :</td>
                <td class="val-col">
                    <span class="pill-infraction">{{ $typeLabel ?? ($incident->type_label ?? ucfirst($incident->type)) }}</span>
                </td>
            </tr>
            <tr>
                <td class="lbl-col">Circonstances des Faits :</td>
                <td class="val-col" style="text-align: justify; line-height: 1.26;">
                    {{ $incident->description ?? 'Faits dûment constatés et consignés par les surveillants au Procès-Verbal officiel de surveillance de la salle d\'examen.' }}
                </td>
            </tr>
            @if(!empty($incident->confiscated_items))
            <tr>
                <td class="lbl-col">Pièces &amp; Objets Saisis :</td>
                <td class="val-col">
                    <strong>{{ $incident->confiscated_items }}</strong> &nbsp;
                    <span style="font-size: 6.5pt; color: #64748b;">(Examinés contradictoirement en séance)</span>
                </td>
            </tr>
            @endif
            <tr>
                <td class="lbl-col">Débats &amp; Observations :</td>
                <td class="val-col" style="color: #334155;">
                    Audition contradictoire tenue en présence des membres de la commission. L'étudiant a été régulièrement entendu en ses explications et moyens de défense.
                </td>
            </tr>
        </table>
    </div>

    <!-- Section 2 : Décision & Sanction Officiellement Scellée -->
    <div class="sanction-box">
        <div class="sanction-header">
            ■ 2. DÉCISION &amp; SANCTION OFFICIELLEMENT PRONONCÉE PAR LE CONSEIL
        </div>
        <div class="sanction-text">
            @if($incident->sanction)
                {{ $incident->sanction }}
            @elseif($incident->decision_note)
                {{ $incident->decision_note }}
            @else
                Note 0.00 / 20 attribuée d'office au module avec mention "FRAUDE" inscrite au PV officiel d'examen.
            @endif
        </div>
        <div class="sanction-deliberation">
            Délibération adoptée à l'unanimité des membres présents du Conseil de Discipline réuni le {{ date('d/m/Y') }}.
        </div>
    </div>

    <!-- Section 3 : Effet Juridique & Notifications Administratives -->
    <div class="legal-notice">
        <strong>EFFET JURIDIQUE &amp; TRANSMISSION ADMINISTRATIVE :</strong><br>
        La présente décision prend effet immédiatement et est inscrite au dossier académique et disciplinaire de l'intéressé(e). Copie conforme est transmise sans délai au Service des Examens pour application sur la note du module, au Secrétariat Général et à la Scolarité Centrale de l'ENCG de Fès. Toute voie de recours contentieux s'exerce conformément aux dispositions de la Loi n° 03-00 et au statut de l'Université Sidi Mohamed Ben Abdellah.
    </div>

    <div class="date-city-line">
        Fait à Fès, le {{ date('d/m/Y') }}
    </div>

    <!-- Signatures Officielles avec Sceaux -->
    <table class="signatures-section">
        <tr>
            <td>
                <div class="sign-role-title">Le Secrétaire de Séance</div>
                <div class="sign-role-sub">Secrétaire Général de l'ENCG Fès</div>
                <div class="sign-image-wrapper">
                    @if(!empty($secretaireSignature))
                        <img src="{{ $secretaireSignature }}" alt="Visa Secrétaire de Séance">
                    @endif
                </div>
                <div class="sign-status-badge">Procès-Verbal Scellé &amp; Enregistré</div>
            </td>
            <td>
                <div class="sign-role-title">Le Directeur de l'ENCG de Fès</div>
                <div class="sign-role-sub">Président du Conseil de Discipline</div>
                <div class="sign-image-wrapper">
                    @if(!empty($directorSignature))
                        <img src="{{ $directorSignature }}" alt="Cachet et Signature Direction">
                    @endif
                </div>
                <div class="sign-status-badge">(Cachet Officiel &amp; Signature Valides)</div>
            </td>
        </tr>
    </table>

    <!-- Pied de Page Sécurisé & Sceau Cryptographique -->
    <table class="footer-seal-table">
        <tr>
            <td style="width: 10%; text-align: left;">
                @if(!empty($qrBase64))
                    <img src="{{ $qrBase64 }}" style="width: 38px; height: 38px; display: block; border: 1px solid #cbd5e1; padding: 1px;" alt="QR Code">
                @endif
            </td>
            <td style="width: 90%; padding-left: 6px;">
                <div class="hash-code">
                    <strong style="color: #581c1c;">AUTHENTIFICATION NUMÉRIQUE DU PROCÈS-VERBAL (SHA-256) :</strong><br>
                    {{ $sealHash ?? hash('sha256', 'DECISION-DISCIPLINE-'.($incident->id ?? 1)) }}<br>
                    <span style="color: #64748b;">
                        Document disciplinaire officiel sous scellé numérique délivré par le Système Centralisé ENCG ERP. Toute falsification ou altération expose son auteur aux sanctions disciplinaires et pénales prévues par la législation en vigueur.
                    </span>
                </div>
            </td>
        </tr>
    </table>

</div>

</body>
</html>
