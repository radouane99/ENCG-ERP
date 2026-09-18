<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Convocation au Conseil de Discipline — {{ $fullNameFr ?? ($student->last_name ?? '') }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 8pt;
            line-height: 1.35;
            background: #ffffff;
        }
        .page-container {
            border: 2px solid #4a1010;
            padding: 10px 14px 8px 14px;
            background: #ffffff;
            position: relative;
            min-height: 275mm;
            max-height: 275mm;
        }

        /* En-tête officiel ENCG Fès & Royaume du Maroc */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
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
            margin: 4px 0 6px 0;
        }

        /* Titre Officiel */
        .title-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .title-cell {
            background-color: #4a1010;
            color: #ffffff;
            text-align: center;
            padding: 6px 8px;
            border-radius: 3px;
        }
        .title-cell h1 {
            font-size: 11pt;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.2;
        }
        .title-cell .sub {
            font-size: 7pt;
            font-weight: bold;
            color: #fde047;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Dossier Candidat (Bento Grid) */
        .dossier-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 8px;
        }
        .dossier-cell {
            border: 1px solid #cbd5e1;
            padding: 4px 8px;
            background: #f8fafc;
            vertical-align: top;
        }
        .tile-label {
            font-size: 5.8pt;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            display: block;
            margin-bottom: 1px;
        }
        .tile-value {
            font-size: 8.5pt;
            font-weight: 900;
            color: #0f172a;
        }

        /* Encadré Infraction & Faits */
        .incident-box {
            border: 1.5px solid #cbd5e1;
            background-color: #ffffff;
            border-radius: 4px;
            padding: 8px 10px;
            margin-bottom: 8px;
        }
        .incident-header {
            font-size: 7.5pt;
            font-weight: 900;
            color: #4a1010;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 5px;
        }
        .incident-table {
            width: 100%;
            border-collapse: collapse;
        }
        .incident-table td {
            padding: 2.5px 4px;
            font-size: 7.5pt;
            vertical-align: top;
        }
        .incident-lbl {
            width: 25%;
            font-weight: bold;
            color: #475569;
        }
        .incident-val {
            width: 75%;
            font-weight: 600;
            color: #0f172a;
        }

        /* Encadré Audience & Convocation */
        .hearing-box {
            border: 2px solid #991b1b;
            background-color: #fef2f2;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 8px;
            text-align: center;
        }
        .hearing-title {
            font-size: 8.5pt;
            font-weight: 900;
            color: #991b1b;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 3px;
        }
        .hearing-details {
            font-size: 9.5pt;
            font-weight: 900;
            color: #450a0a;
            line-height: 1.3;
        }

        /* Texte Légal et Dispositions */
        .legal-block {
            font-size: 6.8pt;
            color: #334155;
            line-height: 1.35;
            text-align: justify;
            margin-bottom: 8px;
            padding: 5px 8px;
            background-color: #f1f5f9;
            border-left: 3px solid #4a1010;
        }

        /* Signatures */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .signatures-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 10px;
        }
        .sign-role {
            font-size: 7.5pt;
            font-weight: 900;
            color: #4a1010;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .sign-sub {
            font-size: 6pt;
            color: #64748b;
            margin-bottom: 4px;
        }
        .signature-img {
            max-height: 44px;
            margin: 2px auto;
            display: block;
        }

        /* Pied de page & Sceau */
        .footer-seal-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1px dashed #cbd5e1;
            padding-top: 4px;
            margin-top: 6px;
        }
        .footer-seal-table td {
            vertical-align: middle;
        }
        .hash-code {
            font-family: monospace;
            font-size: 6pt;
            color: #64748b;
            line-height: 1.25;
        }
    </style>
</head>
<body>

<div class="page-container">

    <!-- En-tête Officiel -->
    <table class="header-table">
        <tr>
            <td style="width: 25%; text-align: left;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" style="max-height: 54px; max-width: 100%; width: auto;" alt="Logo ENCG Fès">
                @else
                    <strong style="color:#4a1010; font-size: 11pt;">ENCG FÈS</strong>
                @endif
            </td>
            <td style="width: 50%; text-align: center;">
                <div style="font-size: 8.5pt; font-weight: 900; color: #4a1010; text-transform: uppercase; letter-spacing: 0.8px;">
                    ROYAUME DU MAROC
                </div>
                <div style="font-size: 6.8pt; color: #475569; margin: 1px 0;">
                    Université Sidi Mohamed Ben Abdellah de Fès
                </div>
                <div style="font-size: 7.8pt; font-weight: 900; color: #002147; text-transform: uppercase;">
                    ÉCOLE NATIONALE DE COMMERCE ET DE GESTION
                </div>
                <div style="font-size: 6.2pt; font-weight: bold; color: #854d0e; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 1px;">
                    Instance Juridictionnelle du Conseil de Discipline
                </div>
            </td>
            <td style="width: 25%; text-align: right;">
                <div style="font-size: 6.5pt; color: #64748b; font-family: monospace;">
                    <strong>RÉFÉRENCE :</strong><br>
                    ENCG/CD-2026/{{ str_pad($incident->id ?? 1, 4, '0', STR_PAD_LEFT) }}<br>
                    Date : {{ date('d/m/Y') }}
                </div>
            </td>
        </tr>
    </table>

    <div class="gold-divider"></div>

    <!-- Titre Officiel -->
    <table class="title-table">
        <tr>
            <td class="title-cell">
                <h1>CONVOCATION DEVANT LE CONSEIL DE DISCIPLINE</h1>
                <div class="sub">Audition Contradictoire — Application de la Loi 01-00 (Article 24)</div>
            </td>
        </tr>
    </table>

    <!-- Informations du Candidat Convoqué -->
    <table class="dossier-table">
        <tr>
            <td class="dossier-cell" style="width: 50%;">
                <span class="tile-label">Nom et Prénom du Candidat</span>
                <span class="tile-value">{{ strtoupper($fullNameFr ?? ($student->last_name ?? '')) }}</span>
                @if(!empty($fullNameAr))
                    <span style="font-size: 8.5pt; color: #854d0e; font-weight: bold; margin-left: 6px;">({{ $fullNameAr }})</span>
                @endif
            </td>
            <td class="dossier-cell" style="width: 25%;">
                <span class="tile-label">Code National / Massar</span>
                <span class="tile-value" style="font-family: monospace;">{{ $cne ?? ($student->cne ?? 'N/A') }}</span>
            </td>
            <td class="dossier-cell" style="width: 25%;">
                <span class="tile-label">Année Académique</span>
                <span class="tile-value">2025 / 2026</span>
            </td>
        </tr>
        <tr>
            <td class="dossier-cell" colspan="2">
                <span class="tile-label">Filière / Cycle de Formation</span>
                <span class="tile-value" style="font-size: 8pt; color: #4a1010;">{{ $filiere ?? ($module->filiere->name ?? 'Tronc Commun ENCG') }}</span>
            </td>
            <td class="dossier-cell">
                <span class="tile-label">Statut Administratif</span>
                <span class="tile-value" style="color: #b91c1c; font-size: 7.5pt;">Inscrit / Convoqué</span>
            </td>
        </tr>
    </table>

    <!-- Motif et Circonstances de l'Infraction -->
    <div class="incident-box">
        <div class="incident-header">1. Constatations Préliminaires & Griefs Retenus</div>
        <table class="incident-table">
            <tr>
                <td class="incident-lbl">Épreuve / Module :</td>
                <td class="incident-val" style="font-size: 8.2pt; color: #4a1010;">
                    <strong>{{ $moduleName ?? ($module->name ?? 'Épreuve Semestrielle') }}</strong>
                    <span style="font-size: 7pt; color: #64748b;">(Date : {{ $examDate ?? ($incident->created_at?->format('d/m/Y') ?? date('d/m/Y')) }})</span>
                </td>
            </tr>
            <tr>
                <td class="incident-lbl">Nature de l'Infraction :</td>
                <td class="incident-val" style="color: #991b1b; font-weight: 900;">
                    {{ $typeLabel ?? ($incident->type_label ?? ($incident->type === 'fraude' ? 'Fraude flagrante à l\'examen' : ucfirst($incident->type))) }}
                </td>
            </tr>
            <tr>
                <td class="incident-lbl">Circonstances des Faits :</td>
                <td class="incident-val" style="text-align: justify;">
                    {{ $incident->description ?? 'Faits dûment constatés et consignés par les surveillants au Procès-Verbal officiel de surveillance de la salle d\'examen.' }}
                </td>
            </tr>
            @if(!empty($incident->confiscated_items))
            <tr>
                <td class="incident-lbl">Éléments Matériels Saisis :</td>
                <td class="incident-val" style="color: #854d0e; font-weight: bold;">
                    📦 {{ $incident->confiscated_items }} (Placés sous scellé au secrétariat de séance)
                </td>
            </tr>
            @endif
        </table>
    </div>

    <!-- Convocation Obligatoire -->
    <div class="hearing-box">
        <div class="hearing-title">2. Date, Heure et Lieu de Comparution Obligatoire</div>
        <div class="hearing-details">
            📅 Séance du : <u>{{ $hearingDate ?? ($incident->hearing_date ?? date('d/m/Y à 10h00')) }}</u><br>
            📍 Lieu de réunion : <u>{{ $hearingRoom ?? ($incident->hearing_room ?? 'Salle des Actes — ENCG Fès') }}</u>
        </div>
    </div>

    <!-- Dispositions Procédurales et Droits de la Défense -->
    <div class="legal-block">
        <strong>DROITS DU CANDIDAT & DISPOSITIONS PROCÉDURALES :</strong><br>
        En application de la <strong>Loi n° 01-00 portant organisation de l'enseignement supérieur</strong> et du règlement intérieur des études de l'ENCG Fès, vous êtes tenu(e) de vous présenter en personne aux date et heure indiquées. Il vous est loisible de consulter préalablement les pièces de votre dossier au Secrétariat de la Direction et de vous faire assister par un représentant étudiant de l'établissement.
        <br>
        <strong>Avertissement :</strong> En cas de non-comparution sans motif légitime dûment justifié au préalable, le Conseil de Discipline passera outre et délibérera valablement en votre absence.
    </div>

    <!-- Signatures Officielles -->
    <table class="signatures-table">
        <tr>
            <td>
                <div class="sign-role">Le Secrétaire Général</div>
                <div class="sign-sub">ENCG Fès</div>
                @if(!empty($secretaireSignature))
                    <img src="{{ $secretaireSignature }}" class="signature-img" alt="Signature SG">
                @else
                    <div style="height: 44px;"></div>
                @endif
                <div style="font-size: 6.5pt; font-weight: bold; color: #475569;">Signé & Enregistré au Registre</div>
            </td>
            <td>
                <div class="sign-role">Le Directeur de l'ENCG Fès</div>
                <div class="sign-sub">Président du Conseil de Discipline</div>
                @if(!empty($directorSignature))
                    <img src="{{ $directorSignature }}" class="signature-img" alt="Signature Directeur">
                @else
                    <div style="height: 44px;"></div>
                @endif
                <div style="font-size: 6.5pt; font-weight: bold; color: #475569;">(Cachet & Signature Institutionnels)</div>
            </td>
        </tr>
    </table>

    <!-- Sceau Cryptographique et Validation QR -->
    <table class="footer-seal-table">
        <tr>
            <td style="width: 14%; text-align: left;">
                @if(!empty($qrBase64))
                    <img src="{{ $qrBase64 }}" style="height: 48px; width: 48px;" alt="QR Authentification">
                @endif
            </td>
            <td style="width: 86%; text-align: left; padding-left: 6px;">
                <div class="hash-code">
                    <strong>EMPREINTE CRYPTOGRAPHIQUE DE SÉCURITÉ (SHA-256) :</strong><br>
                    {{ $sealHash ?? 'ENCG-FES-CD-'.strtoupper(hash('sha256', 'DISCIPLINE-'.$incident->id)) }}<br>
                    Document officiel certifié délivré par le Système Numérique Centralisé ENCG ERP. Toute altération est passible de sanctions pénales.
                </div>
            </td>
        </tr>
    </table>

</div>

</body>
</html>
