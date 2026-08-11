@extends('pdf.layouts.pdf_master')

@section('title', 'ENGAGEMENT DE L\'ÉTUDIANT — ENCG FÈS')

@section('content')
    <div style="position: relative; width: 100%; font-family: 'Helvetica', 'Arial', sans-serif;">

        <!-- Header Title Banner -->
        <div style="background-color: #0f2863; color: #ffffff; text-align: center; padding: 6px 12px; border-radius: 5px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(15,40,99,0.15);">
            <h2 style="font-size: 15px; font-weight: 900; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; margin: 0;">
                FORMULAIRE D'ENGAGEMENT DE L'ÉTUDIANT(E)
            </h2>
            <div style="font-size: 8pt; font-weight: bold; color: #93c5fd; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.8px;">
                Année Universitaire {{ $academicYear ?? '2026-2027' }} • Engagement Déontologique &amp; Règlement Interne
            </div>
        </div>

        <!-- Student Identity Summary & Photo -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
            <tr>
                <td width="76%" style="vertical-align: top;">
                    <div style="border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden;">
                        <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 4px 10px; letter-spacing: 0.5px;">
                            1. IDENTIFICATION DE L'ÉTUDIANT(E) INSCRIT(E)
                        </div>
                        <div style="padding: 6px 10px;">
                            <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse; font-size: 9pt;">
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td width="40%" style="font-weight: bold; color: #475569;">Nom &amp; Prénom :</td>
                                    <td width="60%" style="font-weight: 900; color: #0f2863; font-size: 10.5pt; text-transform: uppercase;">
                                        {{ strtoupper($studentName ?? 'ENMILI FATIMA-ZAHRA') }}
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="font-weight: bold; color: #475569;">Date &amp; Lieu de Naissance :</td>
                                    <td style="font-weight: bold; color: #1e293b;">
                                        {{ $birthDate ?? '25/07/2008' }} &nbsp;à&nbsp; <strong style="color: #0f2863;">{{ strtoupper($birthCity ?? 'OUJDA') }}</strong>
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
                                        {{ $semester ?? 'S1' }} ({{ $semesterLabel ?? '1ère année' }}) — Cycle Diplôme ENCG (Bac+5)
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #475569;">Filière d'Affectation :</td>
                                    <td style="font-weight: 900; color: #0f2863; text-transform: uppercase;">
                                        {{ $filiere ?? 'DEUX ANNÉES PRÉPARATOIRES (TRONC COMMUN)' }}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>

                <!-- Photo Box (35x45mm Ratio) -->
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

        <!-- Rules & Ethical Obligations Checklist -->
        <div style="border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden; margin-bottom: 14px;">
            <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 4px 10px; letter-spacing: 0.5px;">
                2. ENGAGEMENTS DÉONTOLOGIQUES &amp; OBLIGATIONS ACADÉMIQUES
            </div>
            <div style="padding: 6px 10px;">
                <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td width="6%" style="text-align: center; vertical-align: top; padding-top: 5px;">
                            <span style="background-color: #0f2863; color: #ffffff; font-size: 7.5pt; font-weight: 900; padding: 2px 6px; border-radius: 3px;">01</span>
                        </td>
                        <td width="94%" style="line-height: 1.4; color: #1e293b;">
                            <strong style="color: #0f2863;">Assiduité &amp; Présence Obligatoire :</strong> Je m'engage à assister avec régularité et ponctualité à l'ensemble des cours magistraux, travaux dirigés (TD), travaux pratiques (TP) et conférences programmés par l'établissement.
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="text-align: center; vertical-align: top; padding-top: 5px;">
                            <span style="background-color: #0f2863; color: #ffffff; font-size: 7.5pt; font-weight: 900; padding: 2px 6px; border-radius: 3px;">02</span>
                        </td>
                        <td style="line-height: 1.4; color: #1e293b;">
                            <strong style="color: #0f2863;">Respect du Règlement Intérieur :</strong> Déclare avoir pris connaissance du règlement intérieur de l'ENCG Fès et m'engage à respecter les règles de bienséance, le matériel, le campus et le corps enseignant et administratif.
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="text-align: center; vertical-align: top; padding-top: 5px;">
                            <span style="background-color: #0f2863; color: #ffffff; font-size: 7.5pt; font-weight: 900; padding: 2px 6px; border-radius: 3px;">03</span>
                        </td>
                        <td style="line-height: 1.4; color: #1e293b;">
                            <strong style="color: #0f2863;">Intégrité Académique :</strong> Je m'engage à respecter la charte de probité intellectuelle, m'interdisant toute forme de fraude, plagiat ou tricherie lors des contrôles continus et examens finaux.
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; vertical-align: top; padding-top: 5px;">
                            <span style="background-color: #0f2863; color: #ffffff; font-size: 7.5pt; font-weight: 900; padding: 2px 6px; border-radius: 3px;">04</span>
                        </td>
                        <td style="line-height: 1.4; color: #1e293b;">
                            <strong style="color: #0f2863;">Authenticité des Pièces :</strong> Certifie sur l'honneur l'exactitude absolue de l'ensemble des pièces scannées et documents physiques déposés auprès de la Scolarité ENCG Fès.
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Declaration & Signatures -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px; font-size: 8.5pt;">
            <tr>
                <td width="48%" style="vertical-align: top;">
                    <div style="font-size: 8pt; color: #475569; font-weight: bold; margin-bottom: 6px;">
                        Fait à Fès, le : <strong style="color: #0f2863;">{{ $currentDate ?? now()->format('d/m/Y') }}</strong>
                    </div>
                    <div style="padding: 8px 10px; border: 1px dashed #f59e0b; background-color: #fffbeb; border-radius: 5px; font-size: 7.5pt; color: #78350f; line-height: 1.45;">
                        <strong style="color: #0f2863; font-size: 8pt;">Notice de la Scolarité :</strong><br>
                        Ce document d'engagement est généré automatiquement lors de l'inscription et doit être signé et joint au dossier physique de l'étudiant.
                    </div>
                </td>
                <td width="4%"></td>
                <td width="48%" style="vertical-align: top; text-align: center;">
                    <strong style="font-size: 8.5pt; color: #0f2863; display: block; margin-bottom: 4px;">
                        Signature de l'Étudiant(e)<br>
                        <span style="font-size: 7pt; font-weight: normal; color: #64748b;">(précédée de la mention manuscrite "Lu et approuvé")</span>
                    </strong>
                    <div style="border: 1px solid #cbd5e1; border-radius: 5px; height: 65px; background-color: #f8fafc; position: relative;">
                        <span style="position: absolute; bottom: 4px; left: 0; right: 0; text-align: center; font-size: 6.5pt; color: #94a3b8; font-style: italic;">
                            Lu et approuvé — Signature manuscrite obligatoire
                        </span>
                    </div>
                </td>
            </tr>
        </table>
    </div>
@endsection
