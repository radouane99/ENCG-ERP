<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <title>Récépissé de Préinscription — ENCG Fès — {{ $app->reference_number }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 6mm 9mm 6mm 9mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background-color: #ffffff;
            font-size: 7.8pt;
            line-height: 1.3;
        }
        
        /* Cadre institutionnel double bordure A4 */
        .page-border-frame {
            position: fixed;
            top: -3mm;
            left: -5mm;
            right: -5mm;
            bottom: -3mm;
            border: 2px double #1a3673;
            pointer-events: none;
            z-index: -100;
        }

        /* En-tête officiel */
        .official-header {
            width: 100%;
            border-bottom: 2px solid #1a3673;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }

        /* Filigrane discret */
        .watermark-bg {
            position: fixed;
            top: 40%;
            left: 5%;
            width: 90%;
            text-align: center;
            opacity: 0.035;
            font-size: 30pt;
            font-weight: 900;
            color: #1a3673;
            transform: rotate(-30deg);
            z-index: -50;
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        /* Titre principal */
        .banner-title {
            background-color: #1a3673;
            color: #ffffff;
            text-align: center;
            padding: 5px 10px;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        .banner-title h1 {
            font-size: 13.5pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #ffffff;
            margin: 0;
            text-transform: uppercase;
        }
        .banner-title .ar-title {
            font-size: 9.5pt;
            font-weight: bold;
            color: #f8fafc;
            margin-top: 1px;
            direction: rtl;
        }
        .banner-title .sub-tag {
            font-size: 7pt;
            color: #93c5fd;
            text-transform: uppercase;
            margin-top: 2px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        /* Cartouche candidat */
        .candidate-card {
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            margin-bottom: 8px;
            border-collapse: collapse;
        }
        .section-header {
            background-color: #1a3673;
            color: #ffffff;
            font-weight: 900;
            font-size: 7.2pt;
            text-transform: uppercase;
            padding: 3px 8px;
            letter-spacing: 0.4px;
        }

        /* Tableaux de données */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5pt;
        }
        .data-table td {
            padding: 3.5px 6px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }
        .data-label {
            width: 32%;
            font-weight: bold;
            color: #475569;
        }
        .data-val {
            width: 68%;
            color: #0f172a;
        }

        /* Photo cadre */
        .photo-box {
            width: 88px;
            height: 110px;
            border: 2px solid #1a3673;
            border-radius: 4px;
            padding: 2px;
            background-color: #ffffff;
            text-align: center;
        }
        .photo-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 2px;
        }

        /* Blocs signatures & guichet */
        .bottom-blocks {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .sign-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 5px;
            height: 80px;
            background-color: #f8fafc;
            vertical-align: top;
        }

        /* Pied de page et avis légal */
        .legal-notice {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 6.5pt;
            color: #1e3a8a;
            line-height: 1.35;
            margin-top: 6px;
        }
        .page-footer {
            margin-top: 5px;
            border-top: 1px solid #cbd5e1;
            padding-top: 3px;
            font-size: 6.2pt;
            color: #64748b;
            width: 100%;
        }
    </style>
</head>
<body>
    <div class="page-border-frame"></div>
    <div class="watermark-bg">ENCG FÈS · ADMISSION OFFICIELLE</div>

    <!-- En-tête Institutionnel Officiel -->
    <table class="official-header" cellpadding="0" cellspacing="0">
        <tr>
            <td style="width: 55%; vertical-align: middle;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="ENCG Fès" style="max-height: 52px; width: auto;">
                @else
                    <div style="font-size: 8.5pt; font-weight: 900; color: #1a3673; text-transform: uppercase;">
                        ÉCOLE NATIONALE DE COMMERCE ET DE GESTION — FÈS<br>
                        <span style="font-size: 6.5pt; color: #64748b; font-weight: normal; text-transform: none;">
                            Université Sidi Mohamed Ben Abdellah
                        </span>
                    </div>
                @endif
            </td>
            <td style="width: 45%; vertical-align: middle; text-align: right; font-size: 6.8pt; color: #475569; line-height: 1.35;">
                <strong style="color: #1a3673; font-size: 7.2pt;">ROYAUME DU MAROC</strong><br>
                Ministère de l'Enseignement Supérieur, de la Recherche<br>
                Scientifique et de l'Innovation<br>
                <strong style="color: #1a3673;">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH</strong>
            </td>
        </tr>
    </table>

    <!-- Titre et Campagne -->
    <div class="banner-title">
        <h1>FICHE OFFICIELLE DE PRÉINSCRIPTION EN LIGNE</h1>
        <div class="ar-title">وصل التسجيل القبلي الإلكتروني الرسمي — برسم الموسم الجامعي {{ date('Y') }}/{{ date('Y')+1 }}</div>
        <div class="sub-tag">
            {{ $app->campaign->name }} · VOIE D'ACCÈS : {{ strtoupper($app->campaign->entry_route) }} · ENTRÉE S{{ $app->campaign->entry_semester ?? 1 }}
        </div>
    </div>

    <!-- Bloc d'Identification Étudiant & Photo -->
    <table class="candidate-card" cellpadding="0" cellspacing="0">
        <tr>
            <td style="vertical-align: top; width: 78%; padding: 6px 10px;">
                <div style="border-bottom: 1.5px solid #1a3673; padding-bottom: 3px; margin-bottom: 5px;">
                    <span style="font-size: 11pt; font-weight: 900; color: #1a3673; text-transform: uppercase;">
                        {{ strtoupper($app->profile['last_name'] ?? $app->last_name) }} {{ strtoupper($app->profile['first_name'] ?? $app->first_name) }}
                    </span>
                    @if(!empty($app->profile['last_name_ar']) || !empty($app->profile['first_name_ar']))
                        <span style="font-size: 10pt; font-weight: bold; color: #1e293b; margin-left: 10px; direction: rtl;">
                            ({{ $app->profile['last_name_ar'] ?? '' }} {{ $app->profile['first_name_ar'] ?? '' }})
                        </span>
                    @endif
                </div>

                <table width="100%" cellpadding="1" cellspacing="0" style="font-size: 7.8pt;">
                    <tr>
                        <td width="48%">
                            <span style="color: #64748b;">Code Massar / CNE :</span>
                            <strong style="color: #059669; font-family: monospace; font-size: 9pt;">{{ $app->cne }}</strong>
                        </td>
                        <td width="52%">
                            <span style="color: #64748b;">Carte Nationale (CNIE) :</span>
                            <strong style="font-family: monospace; color: #1e293b; font-size: 8.5pt;">{{ $app->cin }}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span style="color: #64748b;">Réf. Dossier :</span>
                            <strong style="font-family: monospace; color: #1a3673;">{{ $app->reference_number }}</strong>
                        </td>
                        <td>
                            <span style="color: #64748b;">Dépôt numérique :</span>
                            <strong>{{ $app->submitted_at?->timezone('Africa/Casablanca')->format('d/m/Y à H:i') ?? now()->format('d/m/Y') }}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span style="color: #64748b;">Téléphone :</span>
                            <strong>{{ $app->profile['phone'] ?? $app->phone ?? '—' }}</strong>
                        </td>
                        <td>
                            <span style="color: #64748b;">E-mail :</span>
                            <strong style="font-family: monospace;">{{ $app->profile['email'] ?? $app->email ?? '—' }}</strong>
                        </td>
                    </tr>
                </table>
            </td>

            <td style="vertical-align: top; width: 22%; text-align: right; padding: 6px;">
                <div class="photo-box">
                    @if(!empty($photoData))
                        <img class="photo-img" src="{{ $photoData }}" alt="Photo Candidat">
                    @else
                        <div style="line-height: 105px; font-size: 7pt; color: #94a3b8; font-weight: bold;">
                            PHOTO 35×45
                        </div>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <!-- Grille à 2 colonnes : Informations Détaillées -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 6px;">
        <tr>
            <!-- Colonne Gauche : Formation & Baccalauréat -->
            <td width="49%" style="vertical-align: top;">
                <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 6px;">
                    <div class="section-header">1. FORMATION &amp; AFFECTATION</div>
                    <table class="data-table">
                        <tr>
                            <td class="data-label">Établissement</td>
                            <td class="data-val"><strong>ENCG — Fès</strong></td>
                        </tr>
                        <tr>
                            <td class="data-label">Filière / Cycle</td>
                            <td class="data-val"><strong>{{ $app->campaign->filiere?->name ?? 'Deux années préparatoires (Tronc Commun)' }}</strong></td>
                        </tr>
                        <tr>
                            <td class="data-label">Niveau d'admission</td>
                            <td class="data-val">Semestre <strong>S{{ $app->campaign->entry_semester ?? 1 }}</strong> ({{ ($app->campaign->entry_semester ?? 1) == 1 ? '1ère Année' : 'Passerelle 3e/4e Année' }})</td>
                        </tr>
                        <tr>
                            <td class="data-label">Régime d'études</td>
                            <td class="data-val">Formation Initiale — Cycle Normal (Gratuite)</td>
                        </tr>
                    </table>
                </div>

                <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
                    <div class="section-header">2. BACCALAURÉAT &amp; SCOLARITÉ</div>
                    <table class="data-table">
                        <tr>
                            <td class="data-label">Série du Bac</td>
                            <td class="data-val"><strong>{{ $app->profile['bac_series'] ?? '—' }}</strong></td>
                        </tr>
                        <tr>
                            <td class="data-label">Année d'obtention</td>
                            <td class="data-val">{{ $app->profile['bac_year'] ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Mention du Bac</td>
                            <td class="data-val"><strong>{{ strtoupper($app->profile['mention'] ?? $app->profile['bac_mention'] ?? 'PASSABLE') }}</strong></td>
                        </tr>
                        <tr>
                            <td class="data-label">Moyenne générale</td>
                            <td class="data-val"><strong style="color: #059669; font-size: 8.5pt;">{{ $app->profile['bac_average'] ?? '—' }} / 20</strong></td>
                        </tr>
                        <tr>
                            <td class="data-label">Lycée d'origine</td>
                            <td class="data-val">{{ $app->profile['high_school'] ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Académie (AREF)</td>
                            <td class="data-val">{{ $app->profile['academy'] ?? '—' }}</td>
                        </tr>
                    </table>
                </div>
            </td>

            <td width="2%"></td>

            <!-- Colonne Droite : État Civil, Résidence & Famille -->
            <td width="49%" style="vertical-align: top;">
                <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 6px;">
                    <div class="section-header">3. ÉTAT CIVIL &amp; RÉSIDENCE</div>
                    <table class="data-table">
                        <tr>
                            <td class="data-label">Date &amp; Lieu Naiss.</td>
                            <td class="data-val">{{ $app->profile['birth_date'] ?? '—' }} à {{ strtoupper($app->profile['birth_city'] ?? '—') }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Nationalité / Sexe</td>
                            <td class="data-val">{{ $app->profile['nationality'] ?? 'Marocaine' }} · {{ ($app->profile['gender'] ?? '') === 'female' ? 'Féminin' : 'Masculin' }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Adresse de résidence</td>
                            <td class="data-val">{{ $app->profile['address'] ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Ville &amp; Province</td>
                            <td class="data-val">{{ $app->profile['city'] ?? '—' }} · {{ $app->profile['province'] ?? $app->profile['region'] ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Région administrative</td>
                            <td class="data-val">{{ $app->profile['region'] ?? '—' }}</td>
                        </tr>
                    </table>
                </div>

                <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
                    <div class="section-header">4. FAMILLE &amp; CONTACT D'URGENCE</div>
                    <table class="data-table">
                        <tr>
                            <td class="data-label">Père / Tuteur</td>
                            <td class="data-val">{{ $app->profile['father_first_name'] ?? '' }} {{ $app->profile['father_last_name'] ?? '' }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Profession du Père</td>
                            <td class="data-val">{{ $app->profile['father_profession'] ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Mère</td>
                            <td class="data-val">{{ $app->profile['mother_first_name'] ?? '' }} {{ $app->profile['mother_last_name'] ?? '' }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Profession de la Mère</td>
                            <td class="data-val">{{ $app->profile['mother_profession'] ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Contact d'urgence</td>
                            <td class="data-val"><strong>{{ $app->profile['emergency_contact_name'] ?? 'Père / Tuteur' }}</strong> (Tél : {{ $app->profile['emergency_contact_phone'] ?? '—' }})</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <!-- Section 5 : Contrôle au Guichet & Emargement Administratif -->
    <table class="bottom-blocks" cellpadding="0" cellspacing="0">
        <tr>
            <!-- QR Code de vérification -->
            <td width="26%" style="vertical-align: top; padding-right: 6px;">
                <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 5px; text-align: center; background-color: #f8fafc; height: 92px;">
                    <img src="{{ $qrData }}" width="68" height="68" alt="QR Dossier" style="display: inline-block;">
                    <div style="font-size: 5.5pt; color: #475569; margin-top: 2px; font-weight: bold;">
                        SCAN VÉRIFICATION GUICHET<br>
                        <span style="color: #1a3673; font-family: monospace;">{{ $app->cne }}</span>
                    </div>
                </div>
            </td>

            <!-- Signature du candidat -->
            <td width="36%" style="vertical-align: top; padding-right: 6px;">
                <div class="sign-box" style="height: 92px;">
                    <div style="font-size: 6.8pt; font-weight: 900; color: #1a3673; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 3px;">
                        Signature &amp; Date du Candidat
                    </div>
                    <div style="font-size: 5.8pt; color: #64748b; font-style: italic; margin-bottom: 2px;">
                        (Précédée de la mention manuscrite "Certifié sincère et exact")
                    </div>
                    <div style="height: 48px;"></div>
                    <div style="font-size: 5.5pt; color: #94a3b8; text-align: center;">
                        Fait à ....................................., le ......./......./2026
                    </div>
                </div>
            </td>

            <!-- Cadre réservé à la Scolarité ENCG Fès -->
            <td width="38%" style="vertical-align: top;">
                <div class="sign-box" style="height: 92px; border: 1.5px dashed #1a3673; background-color: #f0f7ff;">
                    <div style="font-size: 6.8pt; font-weight: 900; color: #1a3673; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 2px;">
                        Cadre Réservé à la Scolarité (ENCG Fès)
                    </div>
                    <div style="font-size: 5.8pt; color: #1e293b; line-height: 1.3;">
                        Originaux physiquement contrôlés au guichet :<br>
                        [ &nbsp; ] Baccalauréat original &nbsp;&nbsp;&nbsp; [ &nbsp; ] Relevé officiel<br>
                        [ &nbsp; ] Copie légalisée CNIE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] 4 Photos d'identité<br>
                        [ &nbsp; ] Engagement légalisé &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Fiche médicale visée
                    </div>
                    <div style="font-size: 5.8pt; font-weight: bold; color: #1a3673; margin-top: 4px;">
                        Visa &amp; Cachet de la Scolarité :
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Cadre Légal CNDP et Notice -->
    <div class="legal-notice">
        <strong>Notice administrative &amp; CNDP (Loi n° 09-08) :</strong> Ce récépissé confirme l'enregistrement numérique de votre préinscription. Il doit obligatoirement être imprimé et présenté au guichet avec les pièces originales demandées. Conformément à la loi n° 09-08 (Dahir n° 1-09-15), les informations recueillies font l'objet d'un traitement destiné exclusivement à la scolarité et aux inscriptions à l'ENCG Fès (Déclaration CNDP N° A-I-ENCG-0908). Vous bénéficiez d'un droit d'accès et de rectification auprès du service admissions (cndp-privacy@encg-fes.ma).
    </div>

    <!-- Empreinte numérique & Bas de page -->
    <table class="page-footer" cellpadding="0" cellspacing="0">
        <tr>
            <td width="70%" style="vertical-align: middle;">
                Empreinte d'authenticité numérique : <strong style="font-family: monospace; color: #1a3673;">ENCG-DOC-{{ strtoupper(substr(hash('sha256', $app->reference_number.'|'.$app->cne.'|2026'), 0, 18)) }}</strong>
                · Horodaté le {{ now()->timezone('Africa/Casablanca')->format('d/m/Y H:i:s') }}
            </td>
            <td width="30%" style="vertical-align: middle; text-align: right;">
                Page 1 / 1 · Registre Officiel des Admissions
            </td>
        </tr>
    </table>
</body>
</html>
