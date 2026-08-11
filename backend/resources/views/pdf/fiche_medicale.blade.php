@extends('pdf.layouts.pdf_master')

@section('title', 'FICHE MÉDICALE ÉTUDIANT — ENCG FÈS')

@section('content')
    <div style="position: relative; width: 100%; font-family: 'Helvetica', 'Arial', sans-serif;">

        <!-- Header Title Banner -->
        <div style="background-color: #0f2863; color: #ffffff; text-align: center; padding: 6px 12px; border-radius: 5px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(15,40,99,0.15);">
            <h2 style="font-size: 15px; font-weight: 900; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; margin: 0;">
                FICHE DE RENSEIGNEMENTS MÉDICAUX &amp; SANTÉ ÉTUDIANT
            </h2>
            <div style="font-size: 8pt; font-weight: bold; color: #93c5fd; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.8px;">
                Année Universitaire {{ $academicYear ?? '2026-2027' }} • Service de Santé &amp; Médecine Préventive ENCG Fès
            </div>
        </div>

        <!-- Section 1 : Student Personal Identity & Photo -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
            <tr>
                <td width="76%" style="vertical-align: top;">
                    <div style="border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden;">
                        <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 4px 10px; letter-spacing: 0.5px;">
                            1. COORDONNÉES PERSONNELLES DE L'ÉTUDIANT(E)
                        </div>
                        <div style="padding: 6px 10px;">
                            <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td width="38%" style="font-weight: bold; color: #475569;">Nom &amp; Prénom :</td>
                                    <td width="62%" style="font-weight: 900; color: #0f2863; font-size: 10.5pt; text-transform: uppercase;">
                                        {{ strtoupper($lastName ?? 'ENMILI') }} {{ strtoupper($firstName ?? 'FATIMA-ZAHRA') }}
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
                                        {{ $address ?? 'Non renseignée' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #475569;">Téléphone Personnel :</td>
                                    <td style="font-weight: 900; font-family: monospace; color: #0f2863;">
                                        {{ $phone ?? 'N/A' }}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>

                <!-- Photo Box (Ratio 35x45mm) -->
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

        <!-- Section 2 : Parent & Emergency Contacts -->
        <div style="border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden; margin-bottom: 10px;">
            <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 4px 10px; letter-spacing: 0.5px;">
                2. COORDONNÉES DES PARENTS ET PERSONNE À CONTACTER EN CAS D'URGENCE
            </div>
            <div style="padding: 6px 10px;">
                <table width="100%" cellpadding="3.5" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td width="38%" style="font-weight: bold; color: #475569;">Nom et Prénom du Père :</td>
                        <td width="62%" style="font-weight: bold; color: #1e293b;">{{ $fatherName ?? 'Non renseigné' }}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #475569;">Nom et Prénom de la Mère :</td>
                        <td style="font-weight: bold; color: #1e293b;">{{ $motherName ?? 'Non renseignée' }}</td>
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
                        <td style="font-weight: 900; font-family: monospace; color: #dc2626; font-size: 9.5pt;">{{ $emergencyPhone ?? '0606060606' }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Section 3 : Health Status & Medical Attestation -->
        <div style="border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden; margin-bottom: 12px;">
            <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 4px 10px; letter-spacing: 0.5px;">
                3. ÉTAT DE SANTÉ ET ATTESTATION DU MÉDECIN TRAITANT
            </div>
            <div style="padding: 6px 10px;">
                <table width="100%" cellpadding="3.5" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td width="38%" style="font-weight: bold; color: #475569;">Allergies Déclarées / Intolérances :</td>
                        <td width="62%" style="font-weight: bold; color: {{ !empty($allergyType) && $allergyType !== 'Aucune' ? '#dc2626' : '#1e293b' }};">
                            {{ $allergyType ?? 'Aucune' }}
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #475569;">Suivi Médical Particulier :</td>
                        <td style="font-weight: bold;">
                            @if(!empty($hasFollowUp))
                                <span style="background-color: #fee2e2; color: #dc2626; font-size: 7.5pt; font-weight: 900; padding: 1.5px 8px; border-radius: 3px; border: 1px solid #fca5a5;">OUI (Prise en charge spécifique)</span>
                            @else
                                <span style="background-color: #d1fae5; color: #065f46; font-size: 7.5pt; font-weight: 900; padding: 1.5px 8px; border-radius: 3px; border: 1px solid #a7f3d0;">NON (Aucun suivi particulier)</span>
                            @endif
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #475569;">Médicaments / Traitements en cours :</td>
                        <td style="font-weight: bold; color: #1e293b;">{{ $medication ?? 'Aucun' }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #475569;">Médecin Traitant / Établissement :</td>
                        <td style="font-weight: bold; color: #0f2863;">{{ $doctorInfo ?? 'Médecin Généraliste' }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Section 4 : Declaration & Signatures -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px; font-size: 8.5pt;">
            <tr>
                <td width="48%" style="vertical-align: top; text-align: center;">
                    <strong style="font-size: 8.5pt; color: #0f2863; display: block; margin-bottom: 4px;">
                        Signature de l'Étudiant(e)<br>
                        <span style="font-size: 7pt; font-weight: normal; color: #64748b;">(précédée de la mention manuscrite "Certifié exact et sincère")</span>
                    </strong>
                    <div style="border: 1px solid #cbd5e1; border-radius: 5px; height: 60px; background-color: #f8fafc; position: relative;">
                        <span style="position: absolute; bottom: 4px; left: 0; right: 0; text-align: center; font-size: 6.5pt; color: #94a3b8; font-style: italic;">
                            Certifié exact et sincère — Signature de l'étudiant(e)
                        </span>
                    </div>
                </td>
                <td width="4%"></td>
                <td width="48%" style="vertical-align: top; text-align: center;">
                    <strong style="font-size: 8.5pt; color: #0f2863; display: block; margin-bottom: 4px;">
                        Visa &amp; Cachet du Service Scolarité / Santé<br>
                        <span style="font-size: 7pt; font-weight: normal; color: #64748b;">(Réception et enregistrement du dossier médical)</span>
                    </strong>
                    <div style="border: 1px solid #cbd5e1; border-radius: 5px; height: 60px; background-color: #f8fafc; position: relative;">
                        <span style="position: absolute; bottom: 4px; left: 0; right: 0; text-align: center; font-size: 6.5pt; color: #94a3b8; font-style: italic;">
                            Cachet et signature Guichet Scolarité — ENCG Fès
                        </span>
                    </div>
                </td>
            </tr>
        </table>

    </div>
@endsection
