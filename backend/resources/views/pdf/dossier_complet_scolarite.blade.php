<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>DOSSIER SCOLARITÉ COMPLET (3 PAGES) — ENCG FÈS</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm 10mm;
        }
        tr {
            page-break-inside: avoid;
            page-break-after: avoid;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #1e293b;
            background-color: #fff;
        }
        .page-container {
            width: 100%;
            height: 278mm;
            border: 4px double #002e5b;
            border-collapse: collapse;
        }
        .content-td {
            padding: 16px 22px 10px 22px;
            vertical-align: top;
        }
        .footer-td {
            padding: 10px 22px 16px 22px;
            vertical-align: bottom;
            height: 120px;
        }
        
        .official-logos-header {
            width: 100%;
            margin-bottom: 12px;
        }
        .logos-table {
            width: 100%;
            border-collapse: collapse;
        }
        .logos-table td {
            vertical-align: middle;
            text-align: center;
        }
        
        .footer-grid {
            width: 100%;
            border-collapse: collapse;
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
        }
        .footer-grid td { vertical-align: bottom; }
        .footer-left { width: 58%; font-size: 8px; color: #64748b; line-height: 1.3; }
        .footer-right { width: 42%; text-align: right; font-size: 10px; }

        .encg-contact-info {
            font-size: 7.5px;
            color: #1e293b;
            text-align: center;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            margin-top: 8px;
        }
        
        .qr-placeholder {
            width: 70px;
            height: 70px;
            float: left;
            margin-right: 10px;
        }
        .qr-placeholder img {
            width: 100%;
            height: 100%;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>

    <!-- ================================================================= -->
    <!-- 📜 PAGE 1 : ATTESTATION D'INSCRIPTION OFFICIELLE & RÉCÉPISSÉ      -->
    <!-- ================================================================= -->
    <table class="page-container">
        <tr>
            <td class="content-td">
                <!-- Standardized Top Header -->
                <div class="official-logos-header">
                    <table class="logos-table">
                        <tr>
                            <td style="text-align: left; width: 35%;">
                                <span style="font-size: 8.5px; font-weight: bold; color: #1e293b; line-height: 1.25;">
                                    ROYAUME DU MAROC<br>
                                    Ministère de l'Enseignement Supérieur,<br>
                                    de la Recherche Scientifique et de l'Innovation
                                </span>
                            </td>
                            <td style="text-align: center; width: 30%;">
                                @if(!empty($logoBase64))
                                    <img src="{{ $logoBase64 }}" alt="Logo ENCG" style="height: 42px;">
                                @else
                                    <strong style="color: #002e5b;">ENCG FÈS</strong>
                                @endif
                            </td>
                            <td style="text-align: right; width: 35%;">
                                <span style="font-size: 8.5px; font-weight: bold; color: #1e293b; line-height: 1.25;">
                                    UNIVERSITÉ SIDI MOHAMED<br>
                                    BEN ABDELLAH DE FÈS
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Header Title Banner -->
                <div style="background-color: #0f2863; color: #ffffff; text-align: center; padding: 5px 10px; border-radius: 4px; margin-bottom: 10px;">
                    <h2 style="font-size: 13.5px; font-weight: 900; letter-spacing: 0.8px; color: #ffffff; text-transform: uppercase; margin: 0;">
                        ATTESTATION D'INSCRIPTION &amp; RÉCÉPISSÉ DE DÉPÔT
                    </h2>
                    <div style="font-size: 7.5pt; font-weight: bold; color: #93c5fd; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.5px;">
                        DOCUMENT OFFICIEL CERTIFIÉ ET HORODATÉ ÉLECTRONIQUEMENT — ANNÉE UNIVERSITAIRE {{ $academicYear ?? '2026-2027' }}
                    </div>
                </div>

                <!-- Introductory Text & Student Identity Block -->
                <div style="margin-bottom: 8px;">
                    <p style="font-size: 9pt; font-weight: bold; color: #334155; margin: 0 0 5px 0;">
                        Le Directeur de l'École Nationale de Commerce et de Gestion de Fès atteste que l'étudiant(e) ci-dessous est régulièrement inscrit(e) :
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                            <td width="76%" style="vertical-align: top;">
                                <table width="100%" cellpadding="3.5" cellspacing="0" style="font-size: 9pt; border-collapse: collapse; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px;">
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td width="38%" style="font-weight: bold; color: #475569; background-color: #f8fafc;">Nom et Prénom :</td>
                                        <td width="62%" style="font-weight: 900; color: #0f2863; font-size: 10.5pt; text-transform: uppercase;">
                                            {{ $studentName ?? 'ENMILI FATIMA-ZAHRA' }}
                                        </td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="font-weight: bold; color: #475569; background-color: #f8fafc;">CODE MASSAR / CNE :</td>
                                        <td style="font-weight: 900; font-family: monospace; font-size: 10pt; color: #059669;">
                                            {{ $cne ?? 'H148073298' }}
                                        </td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="font-weight: bold; color: #475569; background-color: #f8fafc;">Carte d'Identité (CNIE) :</td>
                                        <td style="font-weight: bold; font-family: monospace; color: #1e293b;">
                                            {{ $cin ?? 'ZG195334' }}
                                        </td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="font-weight: bold; color: #475569; background-color: #f8fafc;">Né(e) le &amp; Lieu :</td>
                                        <td style="color: #1e293b;">
                                            <strong>{{ $birthDate ?? '25 / 07 / 2008' }}</strong> &nbsp;à&nbsp; <strong style="color: #0f2863;">{{ strtoupper($birthCity ?? 'OUJDA') }}</strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-weight: bold; color: #475569; background-color: #f8fafc;">Nationalité :</td>
                                        <td style="font-weight: bold; color: #059669;">
                                            {{ $nationality ?? 'Marocaine' }}
                                        </td>
                                    </tr>
                                </table>
                            </td>

                            <td width="24%" style="text-align: right; vertical-align: top; padding-left: 8px;">
                                <div style="width: 100px; height: 125px; border: 2px solid #0f2863; border-radius: 4px; padding: 2px; background-color: #ffffff; display: inline-block;">
                                    @if(!empty($photoBase64))
                                        <img src="{{ $photoBase64 }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 2px;" alt="Photo Étudiant" />
                                    @else
                                        <div style="width: 100%; height: 100%; background-color: #f1f5f9; text-align: center; line-height: 125px; font-size: 7.5pt; color: #94a3b8; font-weight: bold;">
                                            PHOTO 35×45
                                        </div>
                                    @endif
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Section I: Academic Origin & Baccalaureate Section -->
                <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                    <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8pt; text-transform: uppercase; padding: 3px 8px; letter-spacing: 0.5px;">
                        I. ORIGINE ACADÉMIQUE &amp; NOTES DU BACCALAURÉAT
                    </div>
                    <div style="padding: 5px 8px;">
                        <table width="100%" cellpadding="2.5" cellspacing="0" style="border-collapse: collapse; font-size: 8pt;">
                            <tr>
                                <td width="32%" style="font-weight: bold; color: #475569;">Série du Bac &amp; Mention :</td>
                                <td width="68%" style="font-weight: bold; color: #1e293b;">
                                    Série <strong style="color: #0f2863;">{{ $bacSerie ?? 'Sciences Économiques' }}</strong> &nbsp;·&nbsp; Mention <strong style="color: #059669;">{{ $bacMention ?? 'Bien' }}</strong>
                                </td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #475569;">Notes des Examens :</td>
                                <td style="color: #1e293b;">
                                    <span>National : <strong style="color: #059669;">{{ $bacNationalNote ?? '15.80 / 20' }}</strong></span> &nbsp;·&nbsp; 
                                    <span>Régional : <strong style="color: #0f2863;">{{ $bacRegionalNote ?? '14.90 / 20' }}</strong></span> &nbsp;·&nbsp; 
                                    <span>Moyenne Général : <strong style="color: #d97706;">{{ $bacGeneralNote ?? '15.41 / 20' }}</strong></span>
                                </td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #475569;">Établissement &amp; Région :</td>
                                <td style="color: #1e293b;">
                                    Lycee test &nbsp;·&nbsp; Académie <strong style="color: #0f2863;">ACADÉMIE L'Oriental</strong>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Section II: Registration & ENCG Pathway Section -->
                <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                    <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8pt; text-transform: uppercase; padding: 3px 8px; letter-spacing: 0.5px;">
                        II. INSCRIPTION &amp; AFFECTATION ENCG FÈS
                    </div>
                    <div style="padding: 5px 8px;">
                        <table width="100%" cellpadding="2.5" cellspacing="0" style="border-collapse: collapse; font-size: 8pt;">
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td width="32%" style="font-weight: bold; color: #475569;">Est officiellement inscrit(e) au :</td>
                                <td width="68%" style="font-weight: 900; color: #0f2863;">
                                    Semestre 1 du Cycle Diplôme ENCG (Bac+5) à l'E.N.C.G. FÈS
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="font-weight: bold; color: #475569;">Liste de Sélection / Admission :</td>
                                <td style="font-weight: 900; color: #059669;">
                                    LISTE PRINCIPALE (TAFEM)
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="font-weight: bold; color: #475569;">Filière d'Affectation :</td>
                                <td style="font-weight: 900; color: #0f2863;">
                                    {{ $filiereName ?? 'DEUX ANNÉES PRÉPARATOIRES (TRONC COMMUN)' }}
                                </td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #475569;">Année Universitaire :</td>
                                <td style="font-weight: bold; color: #059669;">
                                    {{ $academicYear ?? '2026-2027' }}
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Section III: Physical Documents Receipt Section -->
                <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                    <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8pt; text-transform: uppercase; padding: 3px 8px; letter-spacing: 0.5px;">
                        III. ÉMARGEMENT &amp; RÉCÉPISSÉ DE DÉPÔT DU DOSSIER PHYSIQUE (SCOLARITÉ)
                    </div>
                    <div style="padding: 5px 8px;">
                        <table width="100%" cellpadding="2.5" cellspacing="0" style="border-collapse: collapse; font-size: 7.5pt;">
                            <thead>
                                <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; text-align: left;">
                                    <th width="45%" style="padding: 3px; color: #475569;">Document Administratif Physiquement Requis</th>
                                    <th width="25%" style="padding: 3px; color: #475569;">Statut Dépôt Guichet</th>
                                    <th width="30%" style="padding: 3px; color: #475569;">Observations &amp; Conformité</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td>1. Original du Diplôme du Baccalauréat (Obligatoire)</td>
                                    <td><span style="color: #059669; font-weight: 900;">DÉPOSÉ</span></td>
                                    <td>Original conservé</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td>2. Relevé de Notes Officiel du Baccalauréat</td>
                                    <td><span style="color: #059669; font-weight: 900;">DÉPOSÉ</span></td>
                                    <td>Copie Conforme</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td>3. Copie Certifiée de la CNIE (Carte d'Identité)</td>
                                    <td><span style="color: #059669; font-weight: 900;">DÉPOSÉE</span></td>
                                    <td>Recto-Verso Valide</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td>4. Photos d'Identité Récentes (en Format CR80)</td>
                                    <td><span style="color: #059669; font-weight: 900;">DÉPOSÉES</span></td>
                                    <td>Conformes aux normes</td>
                                </tr>
                                <tr>
                                    <td>5. Extrait d'Acte de Naissance Récent</td>
                                    <td><span style="color: #059669; font-weight: 900;">DÉPOSÉ</span></td>
                                    <td>Original conforme</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Section IV: Security Note -->
                <div style="border: 1px dashed #f59e0b; background-color: #fffbeb; border-radius: 4px; padding: 5px 8px;">
                    <div style="font-size: 7.5pt; font-weight: bold; color: #b45309; text-transform: uppercase; margin-bottom: 2px;">
                        IV. NOTE IMPORTANTE &amp; VALIDITÉ OFFICIELLE :
                    </div>
                    <div style="font-size: 6.8pt; color: #78350f; line-height: 1.3;">
                        • La présente attestation fait office de récépissé officiel d'inscription et de décharge de dépôt du dossier physique.<br>
                        • L'inscription est réputée définitive dès validation des pièces originales déposées auprès du service de la scolarité.<br>
                        • Ce document électronique est signé et authentifié numériquement via l'empreinte QR ci-dessous.
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td class="footer-td">
                <table class="footer-grid">
                    <tr>
                        <td class="footer-left">
                            <div class="qr-placeholder">
                                @if(!empty($qrBase64))
                                    <img src="{{ $qrBase64 }}" alt="QR Code">
                                @endif
                            </div>
                            <div style="padding-top: 2px;">
                                <strong style="color:#002e5b; font-size: 9.5px;">Document numérique officiel sécurisé</strong><br>
                                Généré automatiquement par l'ERP ENCG.<br>
                                <strong>Anti-Fraude :</strong> Scannez le code QR ci-dessus pour valider l'authenticité de ce document.
                            </div>
                        </td>
                        <td class="footer-right">
                            Fait à Fès, le {{ date('d/m/Y') }}<br><br>
                            <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">POUR LE DIRECTEUR ET PAR DÉLÉGATION</div>
                            <strong style="color: #0f2863; font-size: 8.5pt;">LE CHEF DU SERVICE DE LA SCOLARITÉ</strong>
                        </td>
                    </tr>
                </table>
                <div class="encg-contact-info">
                    École Nationale de Commerce et de Gestion de Fès - Route d'Imouzzer, B.P. 1255, Fès - Maroc<br>
                    Tél: +212 5 35 64 49 20 | Email: contact@encg-fes.ac.ma | Web: www.encg-fes.ac.ma
                </div>
            </td>
        </tr>
    </table>

    <div class="page-break"></div>

    <!-- ================================================================= -->
    <!-- 📝 PAGE 2 : FORMULAIRE D'ENGAGEMENT DE L'ÉTUDIANT(E) (تعهد)        -->
    <!-- ================================================================= -->
    <table class="page-container">
        <tr>
            <td class="content-td">
                <!-- Standardized Top Header -->
                <div class="official-logos-header">
                    <table class="logos-table">
                        <tr>
                            <td style="text-align: left; width: 35%;">
                                <span style="font-size: 8.5px; font-weight: bold; color: #1e293b; line-height: 1.25;">
                                    ROYAUME DU MAROC<br>
                                    Ministère de l'Enseignement Supérieur,<br>
                                    de la Recherche Scientifique et de l'Innovation
                                </span>
                            </td>
                            <td style="text-align: center; width: 30%;">
                                @if(!empty($logoBase64))
                                    <img src="{{ $logoBase64 }}" alt="Logo ENCG" style="height: 42px;">
                                @else
                                    <strong style="color: #002e5b;">ENCG FÈS</strong>
                                @endif
                            </td>
                            <td style="text-align: right; width: 35%;">
                                <span style="font-size: 8.5px; font-weight: bold; color: #1e293b; line-height: 1.25;">
                                    UNIVERSITÉ SIDI MOHAMED<br>
                                    BEN ABDELLAH DE FÈS
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Header Title Banner -->
                <div style="background-color: #0f2863; color: #ffffff; text-align: center; padding: 5px 10px; border-radius: 4px; margin-bottom: 10px;">
                    <h2 style="font-size: 13.5px; font-weight: 900; letter-spacing: 0.8px; color: #ffffff; text-transform: uppercase; margin: 0;">
                        FORMULAIRE D'ENGAGEMENT DE L'ÉTUDIANT(E)
                    </h2>
                    <div style="font-size: 7.5pt; font-weight: bold; color: #93c5fd; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ANNÉE UNIVERSITAIRE {{ $academicYear ?? '2026-2027' }} • ENGAGEMENT DÉONTOLOGIQUE &amp; RÈGLEMENT INTERNE
                    </div>
                </div>

                <!-- Student Identity Summary & Photo -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                    <tr>
                        <td width="76%" style="vertical-align: top;">
                            <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
                                <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8pt; text-transform: uppercase; padding: 3px 8px; letter-spacing: 0.5px;">
                                    1. IDENTIFICATION DE L'ÉTUDIANT(E) INSCRIT(E)
                                </div>
                                <div style="padding: 5px 8px;">
                                    <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td width="40%" style="font-weight: bold; color: #475569;">Nom &amp; Prénom :</td>
                                            <td width="60%" style="font-weight: 900; color: #0f2863; font-size: 10pt; text-transform: uppercase;">
                                                {{ strtoupper($studentName ?? 'ENMILI FATIMA-ZAHRA') }}
                                            </td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="font-weight: bold; color: #475569;">Date &amp; Lieu de Naissance :</td>
                                            <td style="font-weight: bold; color: #1e293b;">
                                                {{ $birthDate ?? '25 / 07 / 2008' }} &nbsp;à&nbsp; <strong style="color: #0f2863;">{{ strtoupper($birthCity ?? 'OUJDA') }}</strong>
                                            </td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="font-weight: bold; color: #475569;">Carte d'Identité (CNIE) :</td>
                                            <td style="font-weight: bold; font-family: monospace; color: #1e293b;">
                                                {{ $cin ?? 'ZG195334' }}
                                            </td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="font-weight: bold; color: #475569;">Code CNE / MASSAR :</td>
                                            <td style="font-weight: 900; font-family: monospace; color: #059669;">
                                                {{ $cne ?? 'H148073298' }}
                                            </td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="font-weight: bold; color: #475569;">Inscrit(e) en Semestre &amp; Niveau :</td>
                                            <td style="font-weight: bold; color: #1e293b;">
                                                S1 (1ère année) — Cycle Diplôme ENCG (Bac+5)
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold; color: #475569;">Filière d'Affectation :</td>
                                            <td style="font-weight: 900; color: #0f2863; text-transform: uppercase;">
                                                {{ $filiereName ?? 'DEUX ANNÉES PRÉPARATOIRES (TC)' }}
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </td>

                        <td width="24%" style="text-align: right; vertical-align: top; padding-left: 8px;">
                            <div style="width: 100px; height: 125px; border: 2px solid #0f2863; border-radius: 4px; padding: 2px; background-color: #ffffff; display: inline-block;">
                                @if(!empty($photoBase64))
                                    <img src="{{ $photoBase64 }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 2px;" alt="Photo Étudiant" />
                                @else
                                    <div style="width: 100%; height: 100%; background-color: #f1f5f9; text-align: center; line-height: 125px; font-size: 7.5pt; color: #94a3b8; font-weight: bold;">
                                        PHOTO 35×45
                                    </div>
                                @endif
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Rules & Ethical Obligations Checklist -->
                <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
                    <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8pt; text-transform: uppercase; padding: 3px 8px; letter-spacing: 0.5px;">
                        2. ENGAGEMENTS DÉONTOLOGIQUES &amp; OBLIGATIONS ACADÉMIQUES
                    </div>
                    <div style="padding: 5px 8px;">
                        <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse; font-size: 8pt;">
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td width="6%" style="text-align: center; vertical-align: top; padding-top: 4px;">
                                    <span style="background-color: #0f2863; color: #ffffff; font-size: 7pt; font-weight: 900; padding: 1px 5px; border-radius: 2px;">01</span>
                                </td>
                                <td width="94%" style="line-height: 1.35; color: #1e293b;">
                                    <strong style="color: #0f2863;">Assiduité &amp; Présence Obligatoire :</strong> Je m'engage à assister avec régularité et ponctualité à l'ensemble des cours magistraux, travaux dirigés (TD), travaux pratiques (TP) et conférences programmés par l'établissement.
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="text-align: center; vertical-align: top; padding-top: 4px;">
                                    <span style="background-color: #0f2863; color: #ffffff; font-size: 7pt; font-weight: 900; padding: 1px 5px; border-radius: 2px;">02</span>
                                </td>
                                <td style="line-height: 1.35; color: #1e293b;">
                                    <strong style="color: #0f2863;">Respect du Règlement Intérieur :</strong> Déclare avoir pris connaissance du règlement intérieur de l'ENCG Fès et m'engage à respecter les règles de bienséance, le matériel, le campus et le corps enseignant et administratif.
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="text-align: center; vertical-align: top; padding-top: 4px;">
                                    <span style="background-color: #0f2863; color: #ffffff; font-size: 7pt; font-weight: 900; padding: 1px 5px; border-radius: 2px;">03</span>
                                </td>
                                <td style="line-height: 1.35; color: #1e293b;">
                                    <strong style="color: #0f2863;">Intégrité Académique :</strong> Je m'engage à respecter la charte de probité intellectuelle, m'interdisant toute forme de fraude, plagiat ou tricherie lors des contrôles continus et examens finaux.
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align: center; vertical-align: top; padding-top: 4px;">
                                    <span style="background-color: #0f2863; color: #ffffff; font-size: 7pt; font-weight: 900; padding: 1px 5px; border-radius: 2px;">04</span>
                                </td>
                                <td style="line-height: 1.35; color: #1e293b;">
                                    <strong style="color: #0f2863;">Authenticité des Pièces :</strong> Certifie sur l'honneur l'exactitude absolue de l'ensemble des pièces scannées et documents physiques déposés auprès de la Scolarité ENCG Fès.
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Declaration & Signatures -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 6px; font-size: 8pt;">
                    <tr>
                        <td width="48%" style="vertical-align: top;">
                            <div style="font-size: 7.5pt; color: #475569; font-weight: bold; margin-bottom: 4px;">
                                Fait à Fès, le : <strong style="color: #0f2863;">{{ date('d/m/Y') }}</strong>
                            </div>
                            <div style="padding: 6px 8px; border: 1px dashed #f59e0b; background-color: #fffbeb; border-radius: 4px; font-size: 7pt; color: #78350f; line-height: 1.35;">
                                <strong style="color: #0f2863; font-size: 7.5pt;">Notice de la Scolarité :</strong><br>
                                Ce document d'engagement est généré automatiquement lors de l'inscription et doit être signé et joint au dossier physique de l'étudiant.
                            </div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" style="vertical-align: top; text-align: center;">
                            <strong style="font-size: 8pt; color: #0f2863; display: block; margin-bottom: 3px;">
                                Signature de l'Étudiant(e)<br>
                                <span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">(précédée de la mention manuscrite "Lu et approuvé")</span>
                            </strong>
                            <div style="border: 1px solid #cbd5e1; border-radius: 4px; height: 50px; background-color: #f8fafc; position: relative;">
                                <span style="position: absolute; bottom: 3px; left: 0; right: 0; text-align: center; font-size: 6pt; color: #94a3b8; font-style: italic;">
                                    Lu et approuvé — Signature manuscrite obligatoire
                                </span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td class="footer-td">
                <table class="footer-grid">
                    <tr>
                        <td class="footer-left">
                            <div class="qr-placeholder">
                                @if(!empty($qrBase64))
                                    <img src="{{ $qrBase64 }}" alt="QR Code">
                                @endif
                            </div>
                            <div style="padding-top: 2px;">
                                <strong style="color:#002e5b; font-size: 9.5px;">Document numérique officiel sécurisé</strong><br>
                                Généré automatiquement par l'ERP ENCG.<br>
                                <strong>Anti-Fraude :</strong> Scannez le code QR ci-dessus pour valider l'authenticité de ce document.
                            </div>
                        </td>
                        <td class="footer-right">
                            Fait à Fès, le {{ date('d/m/Y') }}<br><br>
                            <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">POUR LE DIRECTEUR ET PAR DÉLÉGATION</div>
                            <strong style="color: #0f2863; font-size: 8.5pt;">LE CHEF DU SERVICE DE LA SCOLARITÉ</strong>
                        </td>
                    </tr>
                </table>
                <div class="encg-contact-info">
                    École Nationale de Commerce et de Gestion de Fès - Route d'Imouzzer, B.P. 1255, Fès - Maroc<br>
                    Tél: +212 5 35 64 49 20 | Email: contact@encg-fes.ac.ma | Web: www.encg-fes.ac.ma
                </div>
            </td>
        </tr>
    </table>

    <div class="page-break"></div>

    <!-- ================================================================= -->
    <!-- 🩺 PAGE 3 : FICHE DE RENSEIGNEMENTS MÉDICAUX & SANTÉ ÉTUDIANT       -->
    <!-- ================================================================= -->
    <table class="page-container">
        <tr>
            <td class="content-td">
                <!-- Standardized Top Header -->
                <div class="official-logos-header">
                    <table class="logos-table">
                        <tr>
                            <td style="text-align: left; width: 35%;">
                                <span style="font-size: 8.5px; font-weight: bold; color: #1e293b; line-height: 1.25;">
                                    ROYAUME DU MAROC<br>
                                    Ministère de l'Enseignement Supérieur,<br>
                                    de la Recherche Scientifique et de l'Innovation
                                </span>
                            </td>
                            <td style="text-align: center; width: 30%;">
                                @if(!empty($logoBase64))
                                    <img src="{{ $logoBase64 }}" alt="Logo ENCG" style="height: 42px;">
                                @else
                                    <strong style="color: #002e5b;">ENCG FÈS</strong>
                                @endif
                            </td>
                            <td style="text-align: right; width: 35%;">
                                <span style="font-size: 8.5px; font-weight: bold; color: #1e293b; line-height: 1.25;">
                                    UNIVERSITÉ SIDI MOHAMED<br>
                                    BEN ABDELLAH DE FÈS
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Header Title Banner -->
                <div style="background-color: #0f2863; color: #ffffff; text-align: center; padding: 5px 10px; border-radius: 4px; margin-bottom: 10px;">
                    <h2 style="font-size: 13.5px; font-weight: 900; letter-spacing: 0.8px; color: #ffffff; text-transform: uppercase; margin: 0;">
                        FICHE DE RENSEIGNEMENTS MÉDICAUX &amp; SANTÉ ÉTUDIANT
                    </h2>
                    <div style="font-size: 7.5pt; font-weight: bold; color: #93c5fd; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ANNÉE UNIVERSITAIRE {{ $academicYear ?? '2026-2027' }} • SERVICE DE SANTÉ &amp; MÉDECINE PRÉVENTIVE ENCG FÈS
                    </div>
                </div>

                <!-- Section 1 : Student Personal Identity & Photo -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                        <td width="76%" style="vertical-align: top;">
                            <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
                                <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8pt; text-transform: uppercase; padding: 3px 8px; letter-spacing: 0.5px;">
                                    1. COORDONNÉES PERSONNELLES DE L'ÉTUDIANT(E)
                                </div>
                                <div style="padding: 5px 8px;">
                                    <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td width="38%" style="font-weight: bold; color: #475569;">Nom &amp; Prénom :</td>
                                            <td width="62%" style="font-weight: 900; color: #0f2863; font-size: 10pt; text-transform: uppercase;">
                                                {{ strtoupper($studentName ?? 'ENMILI FATIMA-ZAHRA') }}
                                            </td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="font-weight: bold; color: #475569;">CODE CNE / CNIE :</td>
                                            <td style="font-weight: 900; font-family: monospace; color: #059669;">
                                                {{ $cne ?? 'H148073298' }} &nbsp;|&nbsp; <span style="color: #1e293b;">{{ $cin ?? 'ZG195334' }}</span>
                                            </td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="font-weight: bold; color: #475569;">Adresse de Résidence :</td>
                                            <td style="font-weight: bold; color: #1e293b;">
                                                {{ $address ?? 'DOUAR OULED SALAH HOUARA GUERCIF' }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold; color: #475569;">Téléphone Personnel :</td>
                                            <td style="font-weight: 900; font-family: monospace; color: #0f2863;">
                                                {{ $phone ?? '0660606060' }}
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </td>

                        <td width="24%" style="text-align: right; vertical-align: top; padding-left: 8px;">
                            <div style="width: 100px; height: 125px; border: 2px solid #0f2863; border-radius: 4px; padding: 2px; background-color: #ffffff; display: inline-block;">
                                @if(!empty($photoBase64))
                                    <img src="{{ $photoBase64 }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 2px;" alt="Photo Étudiant" />
                                @else
                                    <div style="width: 100%; height: 100%; background-color: #f1f5f9; border-radius: 2px; text-align: center; line-height: 125px; font-size: 7.5pt; color: #94a3b8; font-weight: bold;">
                                        PHOTO 35×45
                                    </div>
                                @endif
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Section 2 : Parent & Emergency Contacts -->
                <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                    <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8pt; text-transform: uppercase; padding: 3px 8px; letter-spacing: 0.5px;">
                        2. COORDONNÉES DES PARENTS ET PERSONNE À CONTACTER EN CAS D'URGENCE
                    </div>
                    <div style="padding: 5px 8px;">
                        <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td width="38%" style="font-weight: bold; color: #475569;">Nom et Prénom du Père :</td>
                                <td width="62%" style="font-weight: bold; color: #1e293b;">{{ $fatherName ?? 'ENMILI JAWAD' }}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="font-weight: bold; color: #475569;">Nom et Prénom de la Mère :</td>
                                <td style="font-weight: bold; color: #1e293b;">{{ $motherName ?? 'taib AMINA' }}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="font-weight: bold; color: #475569;">Téléphone des Parents :</td>
                                <td style="font-weight: bold; font-family: monospace; color: #0f2863;">{{ $parentPhone ?? '0606060606' }}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="font-weight: bold; color: #475569;">Personne à contacter en cas d'urgence :</td>
                                <td style="font-weight: bold; color: #d97706;">{{ $emergencyName ?? 'Père / Tuteur' }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #dc2626;">Téléphone Urgence 24h/24 :</td>
                                <td style="font-weight: 900; font-family: monospace; color: #dc2626; font-size: 9pt;">{{ $emergencyPhone ?? '0606060606' }}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Section 3 : Health Status & Medical Attestation -->
                <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                    <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8pt; text-transform: uppercase; padding: 3px 8px; letter-spacing: 0.5px;">
                        3. ÉTAT DE SANTÉ ET ATTESTATION DU MÉDECIN TRAITANT
                    </div>
                    <div style="padding: 5px 8px;">
                        <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td width="38%" style="font-weight: bold; color: #475569;">Allergies Déclarées / Intolérances :</td>
                                <td width="62%" style="font-weight: bold; color: #dc2626;">{{ $allergyType ?? 'Aucune' }}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="font-weight: bold; color: #475569;">Suivi Médical Particulier :</td>
                                <td style="font-weight: bold; color: #059669;">NON (Aucun suivi particulier)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="font-weight: bold; color: #475569;">Médicaments / Traitements en cours :</td>
                                <td style="font-weight: bold; color: #1e293b;">{{ $medication ?? 'Aucun' }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #475569;">Médecin Traitant / Établissement :</td>
                                <td style="font-weight: bold; color: #1e293b;">{{ $doctorInfo ?? 'Médecin Généraliste' }}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Section 4 : Signatures -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 6px; font-size: 8pt;">
                    <tr>
                        <td width="48%" style="vertical-align: top; text-align: center;">
                            <strong style="font-size: 8pt; color: #0f2863; display: block; margin-bottom: 3px;">
                                Signature de l'Étudiant(e)<br>
                                <span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">(précédée de la mention manuscrite "Certifié exact et sincère")</span>
                            </strong>
                            <div style="border: 1px solid #cbd5e1; border-radius: 4px; height: 45px; background-color: #f8fafc; position: relative;">
                                <span style="position: absolute; bottom: 3px; left: 0; right: 0; text-align: center; font-size: 6pt; color: #94a3b8; font-style: italic;">
                                    Certifié exact et sincère — Signature de l'étudiant(e)
                                </span>
                            </div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" style="vertical-align: top; text-align: center;">
                            <strong style="font-size: 8pt; color: #0f2863; display: block; margin-bottom: 3px;">
                                Visa &amp; Cachet du Service Scolarité / Santé<br>
                                <span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">(Réception et enregistrement du dossier médical)</span>
                            </strong>
                            <div style="border: 1px solid #cbd5e1; border-radius: 4px; height: 45px; background-color: #f8fafc; position: relative;">
                                <span style="position: absolute; bottom: 3px; left: 0; right: 0; text-align: center; font-size: 6pt; color: #94a3b8; font-style: italic;">
                                    Cachet et signature Guichet Scolarité — ENCG Fès
                                </span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td class="footer-td">
                <table class="footer-grid">
                    <tr>
                        <td class="footer-left">
                            <div class="qr-placeholder">
                                @if(!empty($qrBase64))
                                    <img src="{{ $qrBase64 }}" alt="QR Code">
                                @endif
                            </div>
                            <div style="padding-top: 2px;">
                                <strong style="color:#002e5b; font-size: 9.5px;">Document numérique officiel sécurisé</strong><br>
                                Généré automatiquement par l'ERP ENCG.<br>
                                <strong>Anti-Fraude :</strong> Scannez le code QR ci-dessus pour valider l'authenticité de ce document.
                            </div>
                        </td>
                        <td class="footer-right">
                            Fait à Fès, le {{ date('d/m/Y') }}<br><br>
                            <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">POUR LE DIRECTEUR ET PAR DÉLÉGATION</div>
                            <strong style="color: #0f2863; font-size: 8.5pt;">LE CHEF DU SERVICE DE LA SCOLARITÉ</strong>
                        </td>
                    </tr>
                </table>
                <div class="encg-contact-info">
                    École Nationale de Commerce et de Gestion de Fès - Route d'Imouzzer, B.P. 1255, Fès - Maroc<br>
                    Tél: +212 5 35 64 49 20 | Email: contact@encg-fes.ac.ma | Web: www.encg-fes.ac.ma
                </div>
            </td>
        </tr>
    </table>

</body>
</html>
