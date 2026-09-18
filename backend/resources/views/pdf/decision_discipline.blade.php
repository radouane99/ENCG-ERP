<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Procès-Verbal de Décision — {{ $fullNameFr ?? ($student->last_name ?? '') }} — ENCG Fès</title>
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
            border: 2px solid #881337;
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

        /* Titre Officiel PV */
        .title-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .title-cell {
            background-color: #881337;
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

        /* Cadre Délibération & Instance */
        .instance-box {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            border-radius: 4px;
            padding: 6px 10px;
            margin-bottom: 7px;
            font-size: 7.2pt;
            color: #334155;
            line-height: 1.35;
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
            background: #ffffff;
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

        /* Rapport des Faits & Audition */
        .hearing-summary-box {
            border: 1.5px solid #cbd5e1;
            background-color: #ffffff;
            border-radius: 4px;
            padding: 7px 10px;
            margin-bottom: 8px;
        }
        .summary-header {
            font-size: 7.5pt;
            font-weight: 900;
            color: #881337;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 4px;
        }

        /* Encadré Sanction Prononcée (Focus Central) */
        .sanction-box {
            border: 2px solid #b91c1c;
            background-color: #fef2f2;
            border-radius: 6px;
            padding: 9px 12px;
            margin-bottom: 8px;
            text-align: center;
        }
        .sanction-title {
            font-size: 8.5pt;
            font-weight: 900;
            color: #991b1b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
        }
        .sanction-text {
            font-size: 10.5pt;
            font-weight: 900;
            color: #450a0a;
            line-height: 1.35;
        }
        .sanction-meta {
            font-size: 6.8pt;
            color: #7f1d1d;
            font-weight: bold;
            margin-top: 3px;
        }

        /* Notification & Effets Juridiques */
        .legal-block {
            font-size: 6.8pt;
            color: #334155;
            line-height: 1.35;
            text-align: justify;
            margin-bottom: 8px;
            padding: 5px 8px;
            background-color: #f1f5f9;
            border-left: 3px solid #881337;
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
            color: #881337;
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
                    <strong style="color:#881337; font-size: 11pt;">ENCG FÈS</strong>
                @endif
            </td>
            <td style="width: 50%; text-align: center;">
                <div style="font-size: 8.5pt; font-weight: 900; color: #881337; text-transform: uppercase; letter-spacing: 0.8px;">
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
                    <strong>PROCÈS-VERBAL N° :</strong><br>
                    ENCG/PV-CD-2026/{{ str_pad($incident->id ?? 1, 4, '0', STR_PAD_LEFT) }}<br>
                    Séance du : {{ $incident->hearing_date ?? date('d/m/Y') }}
                </div>
            </td>
        </tr>
    </table>

    <div class="gold-divider"></div>

    <!-- Titre Officiel PV -->
    <table class="title-table">
        <tr>
            <td class="title-cell">
                <h1>PROCÈS-VERBAL DE DÉLIBÉRATION & DÉCISION</h1>
                <div class="sub">Conseil de Discipline de l'Établissement — Décret n° 2-90-554 & Loi 01-00</div>
            </td>
        </tr>
    </table>

    <!-- Cadre de Réunion de l'Instance -->
    <div class="instance-box">
        <strong>COMPOSITION DE L'INSTANCE :</strong> Réuni en séance plénière officielle le <u>{{ $incident->hearing_date ?? date('d/m/Y') }}</u> à la <u>{{ $incident->hearing_room ?? 'Salle des Actes de l\'ENCG Fès' }}</u>, sous la présidence de Monsieur le Directeur de l'ENCG Fès, en présence de Monsieur le Secrétaire Général, des Directeurs Adjoints, des Chefs de Départements, des représentants du corps enseignant et du représentant des étudiants, pour statuer sur le dossier disciplinaire ci-après.
    </div>

    <!-- Informations du Candidat Poursuivi -->
    <table class="dossier-table">
        <tr>
            <td class="dossier-cell" style="width: 50%;">
                <span class="tile-label">Identité de l'Étudiant</span>
                <span class="tile-value">{{ strtoupper($fullNameFr ?? ($student->last_name ?? '')) }}</span>
                @if(!empty($fullNameAr))
                    <span style="font-size: 8.5pt; color: #854d0e; font-weight: bold; margin-left: 6px;">({{ $fullNameAr }})</span>
                @endif
            </td>
            <td class="dossier-cell" style="width: 25%;">
                <span class="tile-label">CNE / Code Massar</span>
                <span class="tile-value" style="font-family: monospace;">{{ $cne ?? ($student->cne ?? 'N/A') }}</span>
            </td>
            <td class="dossier-cell" style="width: 25%;">
                <span class="tile-label">Année Universitaire</span>
                <span class="tile-value">2025 / 2026</span>
            </td>
        </tr>
        <tr>
            <td class="dossier-cell" colspan="2">
                <span class="tile-label">Filière / Module d'Épreuve</span>
                <span class="tile-value" style="font-size: 8pt; color: #881337;">
                    {{ $filiere ?? ($module->filiere->name ?? 'Tronc Commun ENCG') }} — {{ $moduleName ?? ($module->name ?? 'Épreuve Semestrielle') }}
                </span>
            </td>
            <td class="dossier-cell">
                <span class="tile-label">Date de l'Incident</span>
                <span class="tile-value" style="font-size: 7.5pt;">{{ $examDate ?? ($incident->created_at?->format('d/m/Y') ?? date('d/m/Y')) }}</span>
            </td>
        </tr>
    </table>

    <!-- Synthèse de l'Audition Contradictoire & Débats -->
    <div class="hearing-summary-box">
        <div class="summary-header">1. Constatations des Faits & Audition Contradictoire</div>
        <div style="font-size: 7.5pt; line-height: 1.35; text-align: justify; margin-bottom: 4px;">
            <strong>Griefs Retenus :</strong> <span style="color: #991b1b; font-weight: bold;">{{ $typeLabel ?? ($incident->type_label ?? ucfirst($incident->type)) }}</span> — {{ $incident->description ?? 'Infraction constatée en salle d\'examen.' }}
            @if(!empty($incident->confiscated_items))
                <br><strong>Pièces Saisies :</strong> <span style="color: #854d0e;">{{ $incident->confiscated_items }}</span>
            @endif
        </div>
        <div style="font-size: 7.2pt; line-height: 1.3; color: #475569; background-color: #f8fafc; padding: 4px 6px; border-radius: 3px; border: 1px dashed #cbd5e1;">
            <strong>Synthèse de l'Instruction :</strong> {{ $incident->hearing_notes ?? 'Le candidat a été entendu en ses explications et moyens de défense contradictoires. Le Conseil a délibéré à huis clos après examen circonstancié des pièces matérielles et confrontation des rapports de surveillance.' }}
        </div>
    </div>

    <!-- Décision et Sanction Prononcée (Focus Box) -->
    <div class="sanction-box">
        <div class="sanction-title">2. DÉCISION DU CONSEIL DE DISCIPLINE & SANCTION STATUTAIRE</div>
        <div class="sanction-text">
            {{ $incident->decision ?? 'Note 0.00 / 20 attribuée d\'office au module de l\'épreuve avec mention FRAUDE inscrite au PV d\'examen.' }}
        </div>
        <div class="sanction-meta">
            Décision adoptée à la majorité qualifiée des membres présents de l'instance juridictionnelle.
        </div>
    </div>

    <!-- Effets Juridiques et Exécution -->
    <div class="legal-block">
        <strong>EFFETS JURIDIQUES & NOTIFICATION :</strong><br>
        La présente décision est exécutoire immédiatement à compter de sa date de signature. Elle est notifiée à l'intéressé(e), transcrite sur le Procès-Verbal officiel des examens et versée à son dossier académique permanent. Copies officielles sont adressées à la Scolarité Centrale, au Service des Examens et à la Présidence de l'Université Sidi Mohamed Ben Abdellah.
    </div>

    <!-- Signatures Officielles -->
    <table class="signatures-table">
        <tr>
            <td>
                <div class="sign-role">Le Rapporteur de Séance</div>
                <div class="sign-sub">Secrétaire Général de l'ENCG Fès</div>
                @if(!empty($secretaireSignature))
                    <img src="{{ $secretaireSignature }}" class="signature-img" alt="Signature SG">
                @else
                    <div style="height: 44px;"></div>
                @endif
                <div style="font-size: 6.5pt; font-weight: bold; color: #475569;">Procès-Verbal Scellé & Archivé</div>
            </td>
            <td>
                <div class="sign-role">Le Président du Conseil de Discipline</div>
                <div class="sign-sub">Directeur de l'ENCG Fès</div>
                @if(!empty($directorSignature))
                    <img src="{{ $directorSignature }}" class="signature-img" alt="Signature Directeur">
                @else
                    <div style="height: 44px;"></div>
                @endif
                <div style="font-size: 6.5pt; font-weight: bold; color: #475569;">(Cachet Officiel et Signature d'Autorité)</div>
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
                    <strong>CERTIFICATION OFFICIELLE & SCELLÉ ÉLECTRONIQUE (SHA-256) :</strong><br>
                    {{ $sealHash ?? 'ENCG-FES-PV-'.strtoupper(hash('sha256', 'DECISION-'.$incident->id)) }}<br>
                    Acte authentique du Conseil de Discipline de l'ENCG Fès. Tout recours contentieux s'exerce conformément aux délais légaux en vigueur.
                </div>
            </td>
        </tr>
    </table>

</div>

</body>
</html>
