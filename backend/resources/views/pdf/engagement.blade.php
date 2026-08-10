@extends('pdf.layouts.pdf_master')

@section('title', 'ENGAGEMENT DE L\'ÉTUDIANT — ENCG FÈS')

@section('content')
    <div style="position: relative; width: 100%;">
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px; border-bottom: 2px dashed #0f2863; padding-bottom: 10px;">
            <tr>
                <td width="70%">
                    <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ROYAUME DU MAROC</div>
                    <div style="font-size: 12px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 2px;">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS</div>
                    <div style="font-size: 12px; font-weight: 900; color: #990000; text-transform: uppercase; margin-top: 3px;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                </td>
                <td width="30%" style="text-align: right;">
                    <div style="font-size: 9px; font-family: monospace; font-weight: bold; color: #0f2863;">RÉFÉRENCE DOSSIER :</div>
                    <div style="font-size: 12px; font-family: monospace; font-weight: 900; color: #059669;">
                        ENG-2026-{{ $cne ?? 'N142088916' }}
                    </div>
                </td>
            </tr>
        </table>

        <!-- Document Title -->
        <div style="text-align: center; margin: 15px 0 20px 0; padding: 10px; background-color: #f8fafc; border: 1.5px solid #0f2863; border-radius: 6px;">
            <h2 style="font-size: 16px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin: 0;">
                FORMULAIRE D'ENGAGEMENT DE L'ÉTUDIANT(E)
            </h2>
            <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-top: 4px;">
                Année Universitaire {{ $academicYear ?? '2026/2027' }} • Engagement Déontologique & Règlement Interne
            </div>
        </div>

        <!-- Candidate Identity Summary -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            <tr>
                <td width="78%" style="vertical-align: top;">
                    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 11px;">
                        <tr style="background-color: #0f2863; color: #ffffff;">
                            <td colspan="2" style="font-weight: 900; font-size: 12px; text-transform: uppercase;">
                                1. IDENTIFICATION DE L'ÉTUDIANT(E) INSCRIT(E)
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td width="38%" style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Nom & Prénom de l'Étudiant(e) :</td>
                            <td width="62%" style="font-weight: 900; color: #0f2863; font-size: 12px;">{{ strtoupper($studentName ?? '') }}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Date & Lieu de Naissance :</td>
                            <td style="font-weight: bold;">{{ $birthDate ?? '' }} &nbsp; à &nbsp; {{ $birthCity ?? '' }}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Carte d'Identité Nationale (CNIE) :</td>
                            <td style="font-family: monospace; font-weight: bold;">{{ $cin ?? '' }}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Code CNE / MASSAR :</td>
                            <td style="font-family: monospace; font-weight: bold; color: #059669;">{{ $cne ?? '' }}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Inscrit(e) en Semestre & Niveau :</td>
                            <td style="font-weight: bold;">{{ $semester ?? 'S1' }} ({{ $semesterLabel ?? '1ère année' }}) — Cycle Diplôme ENCG (Bac+5)</td>
                        </tr>
                        <tr>
                            <td style="background-color: #f8fafc; font-weight: bold; color: #1e293b;">Filière d'Affectation Officielle :</td>
                            <td style="font-weight: bold; color: #d97706;">{{ $filiere ?? 'Deux années préparatoires (Tronc Commun ENCG)' }}</td>
                        </tr>
                    </table>
                </td>
                <td width="22%" style="text-align: right; vertical-align: top; padding-left: 10px;">
                    <div style="width: 100px; height: 130px; border: 2px solid #0f2863; border-radius: 6px; padding: 2px; background-color: #ffffff; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        @if(!empty($photoBase64))
                            <img src="{{ $photoBase64 }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" alt="Photo" />
                        @elseif(!empty($photoPath) && file_exists($photoPath))
                            <img src="{{ $photoPath }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" alt="Photo" />
                        @else
                            <div style="width: 100%; height: 100%; background-color: #f1f5f9; border-radius: 4px; text-align: center; line-height: 130px; font-size: 9px; color: #94a3b8; font-weight: bold;">
                                PHOTO 35×45
                            </div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <!-- Rules & Ethical Obligations Checklist -->
        <table width="100%" cellpadding="7" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; font-size: 11px; border: 1px solid #cbd5e1;">
            <tr style="background-color: #0f2863; color: #ffffff;">
                <td colspan="2" style="font-weight: 900; font-size: 12px; text-transform: uppercase;">
                    2. ENGAGEMENTS DÉONTOLOGIQUES & OBLIGATIONS ACADÉMIQUES
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td width="6%" style="text-align: center; font-weight: 900; color: #0f2863; background-color: #f1f5f9;">01</td>
                <td width="94%" style="line-height: 1.4;">
                    <strong>Assiduité & Présence Obligatoire :</strong> Je m'engage à assister avec régularité et ponctualité à l'ensemble des cours magistraux, travaux dirigés (TD), travaux pratiques (TP) et conférences programmés par l'établissement.
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="text-align: center; font-weight: 900; color: #0f2863; background-color: #f1f5f9;">02</td>
                <td style="line-height: 1.4;">
                    <strong>Respect du Règlement Interne :</strong> Déclare avoir pris connaissance du règlement intérieur de l'ENCG Fès et m'engage à respecter les règles de bienséance, le matériel, le campus et le corps enseignant et administratif.
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="text-align: center; font-weight: 900; color: #0f2863; background-color: #f1f5f9;">03</td>
                <td style="line-height: 1.4;">
                    <strong>Intégrité Académique :</strong> Je m'engage à respecter la charte de probité intellectuelle, m'interdisant toute forme de fraude, plagiat ou tricherie lors des contrôles continus et examens finaux.
                </td>
            </tr>
            <tr>
                <td style="text-align: center; font-weight: 900; color: #0f2863; background-color: #f1f5f9;">04</td>
                <td style="line-height: 1.4;">
                    <strong>Authenticité des Pièces :</strong> Certifie sur l'honneur l'exactitude absolue de l'ensemble des pièces scannées et documents physiques déposés auprès de la Scolarité ENCG Fès.
                </td>
            </tr>
        </table>

        <!-- Declaration & Signatures -->
        <table width="100%" cellpadding="6" cellspacing="0" style="margin-top: 20px; font-size: 11px;">
            <tr>
                <td width="50%" style="vertical-align: top;">
                    <div style="font-size: 10px; color: #64748b;">
                        Fait à Fès, le : <strong>{{ $currentDate ?? now()->format('d/m/Y') }}</strong>
                    </div>
                    <div style="margin-top: 8px; padding: 8px; border: 1px dashed #cbd5e1; background-color: #f8fafc; border-radius: 4px; font-size: 9px; color: #475569;">
                        <strong>Note de la Scolarité :</strong><br>
                        Ce document d'engagement est généré automatiquement lors de la pré-inscription et doit être joint au dossier physique.
                    </div>
                </td>
                <td width="50%" style="text-align: center; vertical-align: top;">
                    <div style="font-weight: 900; color: #0f2863; font-size: 12px; margin-bottom: 40px;">
                        Signature de l'Étudiant(e)<br>
                        <span style="font-size: 9px; font-weight: normal; color: #64748b;">(précédée de la mention "Lu et approuvé")</span>
                    </div>
                    <div style="border-bottom: 1px dashed #94a3b8; width: 80%; margin: 0 auto;"></div>
                </td>
            </tr>
        </table>
    </div>
@endsection
