@extends('pdf.layouts.pdf_master')

@section('title', 'FICHE MÉDICALE ÉTUDIANT — ENCG FÈS')

@section('content')
    <div style="position: relative; width: 100%;">
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px; border-bottom: 2px dashed #0f2863; padding-bottom: 8px;">
            <tr>
                <td width="70%">
                    <div style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ROYAUME DU MAROC</div>
                    <div style="font-size: 11px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 2px;">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS</div>
                    <div style="font-size: 11px; font-weight: 900; color: #990000; text-transform: uppercase; margin-top: 2px;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                </td>
                <td width="30%" style="text-align: right;">
                    <div style="font-size: 9px; font-family: monospace; font-weight: bold; color: #0f2863;">N° FICHE SANTÉ :</div>
                    <div style="font-size: 11px; font-family: monospace; font-weight: 900; color: #059669;">
                        MED-2026-{{ $cin ?? 'ZG195334' }}
                    </div>
                </td>
            </tr>
        </table>

        <!-- Document Title -->
        <div style="text-align: center; margin: 10px 0 15px 0; padding: 8px; background-color: #f8fafc; border: 1.5px solid #0f2863; border-radius: 6px;">
            <h2 style="font-size: 15px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin: 0;">
                FICHE DE RENSEIGNEMENTS MÉDICAUX & SANTE ÉTUDIANT
            </h2>
            <div style="font-size: 9.5px; font-weight: bold; color: #64748b; margin-top: 3px;">
                Année Universitaire {{ $academicYear ?? '2026/2027' }} • Service de Santé & Médecine Préventive ENCG Fès
            </div>
        </div>

        <!-- Section 1 : Student Identification -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
            <tr>
                <td width="78%" style="vertical-align: top;">
                    <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 10.5px;">
                        <tr style="background-color: #0f2863; color: #ffffff;">
                            <td colspan="2" style="font-weight: 900; font-size: 11px; text-transform: uppercase;">
                                1. COORDONNÉES PERSONNELLES DE L'ÉTUDIANT(E)
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td width="35%" style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Nom & Prénom :</td>
                            <td width="65%" style="font-weight: 900; color: #0f2863; font-size: 11.5px;">{{ strtoupper($lastName ?? '') }} {{ strtoupper($firstName ?? '') }}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">CODE CNE / CNIE :</td>
                            <td style="font-family: monospace; font-weight: bold; color: #059669;">{{ $cne ?? '' }} &nbsp;|&nbsp; {{ $cin ?? '' }}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Adresse de Résidence :</td>
                            <td style="font-weight: bold;">{{ $address ?? 'Non renseignée' }}</td>
                        </tr>
                        <tr>
                            <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Téléphone Personnel :</td>
                            <td style="font-family: monospace; font-weight: bold; color: #059669;">{{ $phone ?? 'N/A' }}</td>
                        </tr>
                    </table>
                </td>
                <td width="22%" style="text-align: right; vertical-align: top; padding-left: 10px;">
                    <div style="width: 95px; height: 120px; border: 2px solid #0f2863; border-radius: 6px; padding: 2px; background-color: #ffffff; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        @if(!empty($photoBase64))
                            <img src="{{ $photoBase64 }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" alt="Photo" />
                        @elseif(!empty($photoPath) && file_exists($photoPath))
                            <img src="{{ $photoPath }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" alt="Photo" />
                        @else
                            <div style="width: 100%; height: 100%; background-color: #f1f5f9; border-radius: 4px; text-align: center; line-height: 120px; font-size: 8.5px; color: #94a3b8; font-weight: bold;">
                                PHOTO 35×45
                            </div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <!-- Section 2 : Parent & Contact Details -->
        <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin-bottom: 12px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 10.5px;">
            <tr style="background-color: #0f2863; color: #ffffff;">
                <td colspan="2" style="font-weight: 900; font-size: 11px; text-transform: uppercase;">
                    2. COORDONNÉES DES PARENTS ET PERSONNE À CONTACTER EN CAS D'URGENCE
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td width="35%" style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Nom et Prénom du Père :</td>
                <td width="65%" style="font-weight: bold;">{{ $fatherName ?? 'Non renseigné' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Nom et Prénom de la Mère :</td>
                <td style="font-weight: bold;">{{ $motherName ?? 'Non renseignée' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Téléphone des Parents :</td>
                <td style="font-family: monospace; font-weight: bold;">{{ $parentPhone ?? '0606060606' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Personne à contacter en cas d'urgence :</td>
                <td style="font-weight: bold; color: #d97706;">{{ $emergencyName ?? 'Père / Tuteur' }}</td>
            </tr>
            <tr>
                <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Téléphone Urgence 24h/24 :</td>
                <td style="font-family: monospace; font-weight: 900; color: #dc2626;">{{ $emergencyPhone ?? '0606060606' }}</td>
            </tr>
        </table>

        <!-- Section 3 : Health Status & Medical Records -->
        <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin-bottom: 15px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 10.5px;">
            <tr style="background-color: #0f2863; color: #ffffff;">
                <td colspan="2" style="font-weight: 900; font-size: 11px; text-transform: uppercase;">
                    3. ÉTAT DE SANTÉ ET ATTESTATION DU MÉDECIN TRAITANT
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td width="35%" style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Allergies Déclarées / Intolérances :</td>
                <td width="65%" style="font-weight: bold;">{{ $allergyType ?? 'Aucune' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Suivi Médical Particulier :</td>
                <td style="font-weight: bold; color: {{ $hasFollowUp ? '#dc2626' : '#059669' }};">
                    {{ $hasFollowUp ? 'Oui (Nécessite une prise en charge spécifique)' : 'Non (Aucun suivi particulier)' }}
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Médicaments / Traitements en cours :</td>
                <td style="font-weight: bold;">{{ $medication ?? 'Aucun' }}</td>
            </tr>
            <tr>
                <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Médecin Traitant / Établissement :</td>
                <td style="font-weight: bold;">{{ $doctorInfo ?? 'Médecin Généraliste' }}</td>
            </tr>
        </table>

        <!-- Section 4 : Signatures & Doctor Stamp -->
        <table width="100%" cellpadding="6" cellspacing="0" style="margin-top: 15px; font-size: 10.5px;">
            <tr>
                <td width="50%" style="vertical-align: top; text-align: center;">
                    <div style="font-weight: 900; color: #0f2863; font-size: 11px; margin-bottom: 35px;">
                        Signature de l'Étudiant(e)<br>
                        <span style="font-size: 8.5px; font-weight: normal; color: #64748b;">(précédée de la mention "Certifié exact")</span>
                    </div>
                    <div style="border-bottom: 1px dashed #94a3b8; width: 75%; margin: 0 auto;"></div>
                </td>
                <td width="50%" style="text-align: center; vertical-align: top;">
                    <div style="font-weight: 900; color: #0f2863; font-size: 11px; margin-bottom: 35px;">
                        Cachet & Signature du Médecin Traitant<br>
                        <span style="font-size: 8.5px; font-weight: normal; color: #64748b;">(avec indication du numéro de matricule)</span>
                    </div>
                    <div style="border-bottom: 1px dashed #94a3b8; width: 75%; margin: 0 auto;"></div>
                </td>
            </tr>
        </table>
    </div>
@endsection
