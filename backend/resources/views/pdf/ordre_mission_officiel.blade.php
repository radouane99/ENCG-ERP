<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>ORDRE DE MISSION OFFICIEL — ENCG FÈS</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm 10mm;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 8px 12px;
            color: #1e293b;
            background-color: #ffffff;
            font-size: 9.5pt;
            line-height: 1.45;
        }
        
        .page-border-frame {
            position: fixed;
            top: -2mm;
            left: -2mm;
            right: -2mm;
            bottom: -2mm;
            border: 3px double #002e5b;
            pointer-events: none;
            z-index: -100;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #002e5b;
            padding-bottom: 6px;
            margin-bottom: 10px;
        }
        .header-table td {
            vertical-align: middle;
            text-align: center;
        }

        .watermark-bg {
            position: fixed;
            top: 36%;
            left: 2%;
            width: 96%;
            text-align: center;
            opacity: 0.04;
            font-size: 32pt;
            font-weight: 900;
            color: #002e5b;
            transform: rotate(-25deg);
            z-index: -50;
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        .mission-header-banner {
            background: #002e5b;
            color: #ffffff;
            text-align: center;
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 12px;
        }
        .mission-title {
            font-size: 16pt;
            font-weight: 900;
            letter-spacing: 2px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
        }
        .mission-subtitle {
            font-size: 8.5pt;
            font-weight: bold;
            color: #bfdbfe;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .meta-ref-bar {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 6px 12px;
            margin-bottom: 12px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }

        .intro-paragraph {
            margin: 8px 0 12px 0;
            text-align: justify;
            line-height: 1.5;
            font-size: 9.5pt;
            color: #1e293b;
        }

        .details-table-card {
            border: 1.5px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }
        .details-table td {
            padding: 7px 10px;
            vertical-align: middle;
        }
        .details-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .label-col {
            width: 32%;
            font-weight: bold;
            color: #334155;
            border-bottom: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
        }
        .val-col {
            width: 68%;
            font-weight: 600;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
        }

        .legal-clause-box {
            border-left: 3.5px solid #002e5b;
            background-color: #f1f5f9;
            border-radius: 0 6px 6px 0;
            padding: 8px 12px;
            margin-bottom: 12px;
        }
        .legal-clause-title {
            font-size: 8pt;
            font-weight: 900;
            color: #002e5b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .legal-clause-text {
            font-size: 7.5pt;
            color: #475569;
            line-height: 1.35;
        }

        /* Dual Approval Workflow Box */
        .approval-workflow-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .approval-workflow-table td {
            vertical-align: top;
            padding: 6px;
        }
        .approval-card {
            border: 1.5px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 10px;
            background-color: #ffffff;
            height: 140px;
            position: relative;
        }
        .approval-card-title {
            font-size: 8.5pt;
            font-weight: 900;
            color: #002e5b;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }
        .visa-badge-favorable {
            display: inline-block;
            background-color: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
            font-weight: 900;
            font-size: 8pt;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .visa-badge-pending {
            display: inline-block;
            background-color: #fef3c7;
            color: #b45309;
            border: 1px solid #fde68a;
            font-weight: 900;
            font-size: 8pt;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 6px;
        }
    </style>
</head>
<body>
    <div class="page-border-frame"></div>
    <div class="watermark-bg">
        {{ $isDraft ? 'PROJET NON SCELLÉ' : 'ENCG FÈS • ORDRE DE MISSION' }}
    </div>

    <!-- Official Ministry / USMBA Header -->
    <table class="header-table">
        <tr>
            <td style="width: 25%; text-align: left;">
                <div style="font-size: 8pt; font-weight: bold; color: #002e5b; text-transform: uppercase;">
                    Royaume du Maroc<br>
                    Ministère de l'Enseignement<br>Supérieur &amp; de la Recherche
                </div>
            </td>
            <td style="width: 50%; text-align: center;">
                <div style="font-size: 11pt; font-weight: 900; color: #002e5b; text-transform: uppercase; letter-spacing: 0.5px;">
                    Université Sidi Mohamed Ben Abdellah
                </div>
                <div style="font-size: 10pt; font-weight: 800; color: #b45309; margin-top: 2px; text-transform: uppercase;">
                    École Nationale de Commerce et de Gestion de Fès
                </div>
                <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">
                    المدرسة الوطنية للتجارة والتسيير بفاس — جامعة سيدي محمد بن عبد الله
                </div>
            </td>
            <td style="width: 25%; text-align: right;">
                <div style="font-size: 8pt; font-weight: bold; color: #002e5b; text-align: right;">
                    ENCG FÈS<br>
                    Direction / Secrétariat Général<br>
                    Ressources Humaines
                </div>
            </td>
        </tr>
    </table>

    <!-- Banner -->
    <div class="mission-header-banner">
        <div class="mission-title">ORDRE DE MISSION OFFICIEL</div>
        <div class="mission-subtitle">
            Cadre Déplacement Académique, Enseignement &amp; Recherche Scientifique
        </div>
    </div>

    <!-- Reference Meta Bar -->
    <div class="meta-ref-bar">
        <table class="meta-table">
            <tr>
                <td style="width: 60%;">
                    <strong style="color: #475569;">RÉFÉRENCE PARAPHEUR :</strong> 
                    <span style="font-family: monospace; font-weight: 900; color: #002e5b; font-size: 10pt;">{{ $trackingCode }}</span>
                    @if($isDraft)
                        <span style="background-color: #fee2e2; color: #b91c1c; font-size: 7.5pt; font-weight: bold; padding: 1px 4px; border-radius: 3px; margin-left: 6px;">[EN COURS DE VALIDATION]</span>
                    @else
                        <span style="background-color: #dcfce7; color: #15803d; font-size: 7.5pt; font-weight: bold; padding: 1px 4px; border-radius: 3px; margin-left: 6px;">[OFFICIELLEMENT SCELLÉ]</span>
                    @endif
                </td>
                <td style="width: 40%; text-align: right; color: #475569;">
                    Fès, le <strong style="color: #002e5b; font-size: 9.5pt;">{{ $date }}</strong>
                </td>
            </tr>
        </table>
    </div>

    <!-- Intro Statement -->
    <p class="intro-paragraph">
        Le Directeur de l'<strong>École Nationale de Commerce et de Gestion (ENCG) de Fès</strong> ordonne et autorise par la présente l'enseignant(e)-chercheur(se) désigné(e) ci-après à accomplir le déplacement officiel d'intérêt pédagogique et scientifique :
    </p>

    <!-- Details Card -->
    <div class="details-table-card">
        <table class="details-table">
            <tr>
                <td class="label-col" style="background-color: #f1f5f9; color: #002e5b;">Enseignant(e)-Chercheur(se) :</td>
                <td class="val-col" style="background-color: #f1f5f9; font-weight: 900; color: #002e5b; font-size: 10pt; text-transform: uppercase;">
                    Pr. {{ $user->name ?? ($professor ? ($professor->first_name . ' ' . $professor->last_name) : 'ENSEIGNANT PERMANENT') }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Département de Rattachement :</td>
                <td class="val-col" style="color: #047857; font-weight: bold;">
                    {{ $department->name ?? ($professor->specialty ?? 'Département des Sciences de Gestion & Commerce') }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Nature / Catégorie de Mission :</td>
                <td class="val-col" style="font-weight: 700; color: #0f172a;">
                    {{ $mission['category'] }}
                </td>
            </tr>
            <tr>
                <td class="label-col" style="color: #002e5b;">Objet / Motif de la Mission :</td>
                <td class="val-col" style="font-weight: 700; color: #0f172a;">
                    {{ $mission['motif'] }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Ville &amp; Destination :</td>
                <td class="val-col" style="font-weight: 900; color: #002e5b; font-size: 9.5pt;">
                    📍 {{ $mission['destination'] }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Période du Déplacement :</td>
                <td class="val-col" style="font-weight: 900; color: #b45309; font-size: 9.5pt;">
                    🗓️ Du <strong>{{ $mission['start_date'] }}</strong> au <strong>{{ $mission['end_date'] }}</strong>
                </td>
            </tr>
            <tr>
                <td class="label-col">Moyen de Transport Autorisé :</td>
                <td class="val-col" style="font-weight: 600; color: #0f172a;">
                    🚗 {{ $mission['transport_mode'] }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Prise en Charge des Frais :</td>
                <td class="val-col" style="font-size: 8.5pt; color: #334155;">
                    💼 {{ $mission['expense_coverage'] }}
                </td>
            </tr>
        </table>
    </div>

    <!-- Legal Notice -->
    <div class="legal-clause-box">
        <div class="legal-clause-title">DISPOSITIONS RÉGLEMENTAIRES &amp; RÉQUISITION :</div>
        <div class="legal-clause-text">
            • Mission accomplie en exécution du service public universitaire conformément au décret n° 2-97-511.<br>
            • Les autorités civiles, militaires et de sécurité sont priées de prêter assistance au porteur du présent ordre pour faciliter sa mission officielle.
        </div>
    </div>

    <!-- Dual Approval Workflow Table -->
    <table class="approval-workflow-table">
        <tr>
            <!-- Dept Visa Block -->
            <td style="width: 48%;">
                <div class="approval-card">
                    <div class="approval-card-title">1. VISA DU CHEF DE DÉPARTEMENT</div>
                    <div style="margin-top: 4px; font-size: 8.5pt;">
                        <strong>Statut Visa :</strong> 
                        @if($request->department_visa === 'favorable')
                            <span class="visa-badge-favorable">✓ AVIS FAVORABLE</span>
                        @elseif($request->department_visa === 'unfavorable')
                            <span style="color: #b91c1c; font-weight: bold;">✕ DÉFAVORABLE</span>
                        @else
                            <span class="visa-badge-pending">⏳ EN ATTENTE DE VISA</span>
                        @endif
                    </div>
                    @if($request->department_visa_at)
                        <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">
                            Apposé le : {{ \Carbon\Carbon::parse($request->department_visa_at)->format('d/m/Y à H:i') }}
                        </div>
                    @endif
                    @if($request->department_notes)
                        <div style="font-size: 7.5pt; color: #334155; margin-top: 4px; font-style: italic;">
                            « {{ $request->department_notes }} »
                        </div>
                    @endif
                    <div style="position: absolute; bottom: 8px; left: 10px; font-size: 7pt; color: #047857; font-weight: bold;">
                        [Visa Électronique Certifié]
                    </div>
                </div>
            </td>

            <!-- Direction Decision & Signature Block -->
            <td style="width: 52%;">
                <div class="approval-card" style="border-color: #002e5b;">
                    <div class="approval-card-title" style="color: #002e5b;">2. DÉCISION &amp; SIGNATURE DIRECTION</div>
                    <div style="font-size: 8.5pt; font-weight: bold; color: #002e5b;">
                        {{ $signatoryTitle }}
                    </div>
                    <div style="margin-top: 2px; font-size: 8pt; color: #475569;">
                        Fait à Fès, le {{ $date }}
                    </div>

                    @if(!$isDraft && $digitalSeal)
                        <div style="margin-top: 8px; font-size: 7pt; color: #047857; font-weight: bold; font-family: monospace;">
                            SHA-256: {{ substr($digitalSeal, 0, 32) }}...
                        </div>
                        <div style="margin-top: 4px; font-size: 7.5pt; color: #002e5b; font-weight: 900;">
                            ✓ VU, APPROUVÉ ET SCELLÉ NUMÉRIQUEMENT
                        </div>
                    @else
                        <div style="margin-top: 14px; font-size: 8pt; color: #b45309; font-weight: bold;">
                            [Signature en cours de traitement]
                        </div>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <!-- Footer with QR Verification -->
    <table class="footer-table">
        <tr>
            <td style="width: 15%; text-align: left; vertical-align: middle;">
                <img src="{{ $qrCodeUrl }}" alt="QR Code" style="width: 60px; height: 60px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px;">
            </td>
            <td style="width: 85%; vertical-align: middle; font-size: 7.5pt; color: #64748b; line-height: 1.3;">
                <strong>Vérification d'authenticité :</strong> Flashez ce QR Code ou accédez à <code>{{ $verifyUrl }}</code> pour authentifier cet ordre de mission officiel.<br>
                École Nationale de Commerce et de Gestion de Fès &bull; BP 81 A, Avenue Allal El Fassi, Fès &bull; Tél: +212 5 35 60 05 84 &bull; Web: encg-fes.ac.ma
            </td>
        </tr>
    </table>
</body>
</html>
