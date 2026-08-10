@extends('pdf.layouts.pdf_master')

@section('title', 'ATTESTATION D\'INSCRIPTION OFFICIELLE — ENCG FÈS')

@section('content')
    <div style="position: relative; width: 100%; font-family: 'Helvetica', 'Arial', sans-serif;">

        <!-- Header Title Banner -->
        <div style="background-color: #0f2863; color: #ffffff; text-align: center; padding: 6px 12px; border-radius: 5px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(15,40,99,0.15);">
            <h2 style="font-size: 15px; font-weight: 900; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; margin: 0;">
                ATTESTATION D'INSCRIPTION &amp; RÉCÉPISSÉ DE DÉPÔT
            </h2>
            <div style="font-size: 8pt; font-weight: bold; color: #93c5fd; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.8px;">
                DOCUMENT OFFICIEL CERTIFIÉ ET HORODATÉ ÉLECTRONIQUEMENT — ANNÉE UNIVERSITAIRE 2026-2027
            </div>
        </div>

        <!-- Introductory Text & Student Identity Block -->
        <div style="margin-bottom: 10px;">
            <p style="font-size: 9.5pt; font-weight: bold; color: #334155; margin: 0 0 6px 0;">
                Le Directeur de l'École Nationale de Commerce et de Gestion de Fès atteste que l'étudiant(e) ci-dessous est régulièrement inscrit(e) :
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                    <!-- Left: Identity Details Table -->
                    <td width="76%" style="vertical-align: top;">
                        <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 9.5pt; border-collapse: collapse; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 5px;">
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td width="38%" style="font-weight: bold; color: #475569; background-color: #f8fafc;">Nom et Prénom :</td>
                                <td width="62%" style="font-weight: 900; color: #0f2863; font-size: 11pt; text-transform: uppercase;">
                                    {{ $studentName ?? 'ENMILI FATIMA-ZAHRA' }}
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="font-weight: bold; color: #475569; background-color: #f8fafc;">CODE MASSAR / CNE :</td>
                                <td style="font-weight: 900; font-family: monospace; font-size: 10.5pt; color: #059669;">
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
                                    <strong>{{ $birthDate ?? '25/07/2008' }}</strong> &nbsp;à&nbsp; <strong style="color: #0f2863;">{{ strtoupper($birthCity ?? 'OUJDA') }}</strong>
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

                    <!-- Right: Photo Box (Ratio 35x45mm) -->
                    <td width="24%" style="text-align: right; vertical-align: top; padding-left: 10px;">
                        <div style="width: 105px; height: 130px; border: 2px solid #0f2863; border-radius: 5px; padding: 2px; background-color: #ffffff; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            @if(!empty($photoBase64))
                                <img src="{{ $photoBase64 }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 3px;" alt="Photo Étudiant" />
                            @elseif(!empty($photoPath) && file_exists($photoPath))
                                <img src="{{ $photoPath }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 3px;" alt="Photo Étudiant" />
                            @else
                                <div style="width: 100%; height: 100%; background-color: #f1f5f9; border-radius: 3px; text-align: center; line-height: 130px; font-size: 8pt; color: #94a3b8; font-weight: bold;">
                                    PHOTO 35×45
                                </div>
                            @endif
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Section I: Academic Origin & Baccalaureate Section -->
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden; margin-bottom: 10px;">
            <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 4px 10px; letter-spacing: 0.5px;">
                I. ORIGINE ACADÉMIQUE &amp; NOTES DU BACCALAURÉAT
            </div>
            <div style="padding: 6px 10px;">
                <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                    <tr>
                        <td width="32%" style="font-weight: bold; color: #475569;">Série du Bac &amp; Mention :</td>
                        <td width="68%" style="font-weight: bold; color: #1e293b;">
                            Série <strong style="color: #0f2863;">{{ $bacSerie ?? 'Sciences Économiques' }}</strong> &nbsp;·&nbsp; Mention <strong style="color: #059669;">{{ $bacMention ?? 'Bien' }}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #475569;">Notes des Examens :</td>
                        <td style="color: #1e293b; font-size: 8.5pt;">
                            <span style="white-space: nowrap;">National : <strong style="color: #059669;">{{ $bacNationalNote ?? '15.80 / 20' }}</strong></span> &nbsp;·&nbsp; 
                            <span style="white-space: nowrap;">Régional : <strong style="color: #0f2863;">{{ $bacRegionalNote ?? '14.90 / 20' }}</strong></span> &nbsp;·&nbsp; 
                            <span style="white-space: nowrap;">Moyenne Général : <strong style="color: #d97706;">{{ $bacGeneralNote ?? '15.41 / 20' }}</strong></span>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #475569;">Établissement &amp; Région :</td>
                        <td style="color: #1e293b;">
                            {{ $highSchool ?? 'Lycée Qualifiant Hassan II' }} &nbsp;·&nbsp; Académie <strong>{{ $academy ?? 'Fès-Meknès' }}</strong>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Section II: Enrollment Details Section ENCG -->
        <div style="background-color: #f8fafc; border: 1.5px solid #0f2863; border-radius: 5px; overflow: hidden; margin-bottom: 10px;">
            <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 4px 10px; letter-spacing: 0.5px;">
                II. INSCRIPTION &amp; AFFECTATION ENCG FÈS
            </div>
            <div style="padding: 8px 10px; font-size: 8.5pt; line-height: 1.45;">
                <p style="margin: 0 0 6px 0; color: #1e293b;">
                    Est officiellement inscrit(e) au <strong>{{ $semester ?? 'Semestre 1' }}</strong> du <strong>{{ $cycle ?? 'Cycle Diplôme ENCG (Bac+5)' }}</strong> à l'É.N.C.G. FÈS.
                </p>
                
                <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                        <td width="32%" style="font-weight: bold; color: #475569;">Liste de Sélection / Admission :</td>
                        <td width="68%" style="font-weight: 900; color: #059669; text-transform: uppercase;">
                            {{ $selectionList ?? 'Liste Principale (TAFEM)' }}
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #475569;">Filière d'Affectation :</td>
                        <td style="font-weight: 900; color: #0f2863; text-transform: uppercase;">
                            {{ $filiereName ?? $filiere ?? 'DEUX ANNÉES PRÉPARATOIRES (TRONC COMMUN)' }}
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #475569;">Année Universitaire :</td>
                        <td style="font-weight: 900; color: #059669;">
                            2026 - 2027
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Section III: Physical Documents Deposit Receipt Table -->
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden; margin-bottom: 10px;">
            <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 4px 10px; letter-spacing: 0.5px;">
                III. ÉMARGEMENT &amp; RÉCÉPISSÉ DE DÉPÔT DU DOSSIER PHYSIQUE (SCOLARITÉ)
            </div>
            <div style="padding: 6px 10px;">
                <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                    <tr style="background-color: #f1f5f9; font-weight: bold; color: #334155; border-bottom: 1px solid #cbd5e1;">
                        <td width="50%" style="padding: 4px 6px;">Document Administratif Physiquement Requis</td>
                        <td width="25%" style="text-align: center; padding: 4px 6px;">Statut Dépôt Guichet</td>
                        <td width="25%" style="text-align: center; padding: 4px 6px;">Observations &amp; Conformité</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 4px 6px;">1. Original du Diplôme du Baccalauréat (Obligatoire)</td>
                        <td style="text-align: center; padding: 4px 6px;">
                            @if(!empty($physBac))
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #d1fae5; color: #065f46; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #a7f3d0; display: inline-block;">DÉPOSÉ</span>
                            @else
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #fef3c7; color: #92400e; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #fde68a; display: inline-block;">EN ATTENTE</span>
                            @endif
                        </td>
                        <td style="text-align: center; color: #64748b; font-size: 8pt; padding: 4px 6px;">
                            {{ !empty($physBac) ? 'Original conservé' : 'À fournir' }}
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 4px 6px;">2. Relevé de Notes Officiel du Baccalauréat</td>
                        <td style="text-align: center; padding: 4px 6px;">
                            @if(!empty($physReleve))
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #d1fae5; color: #065f46; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #a7f3d0; display: inline-block;">DÉPOSÉ</span>
                            @else
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #fef3c7; color: #92400e; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #fde68a; display: inline-block;">EN ATTENTE</span>
                            @endif
                        </td>
                        <td style="text-align: center; color: #64748b; font-size: 8pt; padding: 4px 6px;">
                            {{ !empty($physReleve) ? 'Copie Conforme' : 'À fournir' }}
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 4px 6px;">3. Copie Certifiée de la CNIE (Carte d'Identité)</td>
                        <td style="text-align: center; padding: 4px 6px;">
                            @if(!empty($physCnie))
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #d1fae5; color: #065f46; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #a7f3d0; display: inline-block;">DÉPOSÉE</span>
                            @else
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #fef3c7; color: #92400e; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #fde68a; display: inline-block;">EN ATTENTE</span>
                            @endif
                        </td>
                        <td style="text-align: center; color: #64748b; font-size: 8pt; padding: 4px 6px;">
                            {{ !empty($physCnie) ? 'Recto-Verso Valide' : 'À fournir' }}
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 4px 6px;">4. Photos d'Identité Récentes (x4 Format CR80)</td>
                        <td style="text-align: center; padding: 4px 6px;">
                            @if(!empty($physPhoto))
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #d1fae5; color: #065f46; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #a7f3d0; display: inline-block;">DÉPOSÉES</span>
                            @else
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #fef3c7; color: #92400e; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #fde68a; display: inline-block;">EN ATTENTE</span>
                            @endif
                        </td>
                        <td style="text-align: center; color: #64748b; font-size: 8pt; padding: 4px 6px;">
                            {{ !empty($physPhoto) ? 'Conformes aux normes' : 'À fournir' }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 6px;">5. Extrait d'Acte de Naissance Récent</td>
                        <td style="text-align: center; padding: 4px 6px;">
                            @if(!empty($physNaissance))
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #d1fae5; color: #065f46; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #a7f3d0; display: inline-block;">DÉPOSÉ</span>
                            @else
                                <span style="font-family: 'Helvetica', 'Arial', sans-serif; background-color: #fef3c7; color: #92400e; font-size: 7.5pt; font-weight: 900; padding: 2px 10px; border-radius: 3px; border: 1px solid #fde68a; display: inline-block;">EN ATTENTE</span>
                            @endif
                        </td>
                        <td style="text-align: center; color: #64748b; font-size: 8pt; padding: 4px 6px;">
                            {{ !empty($physNaissance) ? 'Original conforme' : 'À fournir' }}
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Section IV: Legal Notice Section -->
        <div style="background-color: #fffbeb; border: 1px dashed #f59e0b; border-radius: 5px; padding: 6px 10px; margin-bottom: 6px; font-size: 8pt; line-height: 1.4; color: #78350f;">
            <strong style="color: #0f2863; font-size: 8.5pt;">IV. NOTE IMPORTANTE &amp; VALIDITÉ OFFICIELLE :</strong><br>
            • La présente attestation fait office de récépissé officiel d'inscription et de décharge de dépôt du dossier physique.<br>
            • L'inscription est réputée définitive dès validation des pièces originales déposées auprès du service de la scolarité.<br>
            • Ce document électronique est signé et authentifié numériquement via l'empreinte QR ci-dessous.
        </div>

    </div>
@endsection
