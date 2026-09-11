@extends('pdf.layouts.pdf_master')

@section('title', 'FICHE D\'ENJAMBEMENT & DETTE DE MODULE — ENCG FÈS')

@section('content')
    <div style="position: relative; width: 100%; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9pt; color: #1e293b;">

        <!-- Header Title Banner -->
        <div style="background-color: #0f2863; color: #ffffff; text-align: center; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(15,40,99,0.15);">
            <h2 style="font-size: 14px; font-weight: 900; letter-spacing: 0.8px; color: #ffffff; text-transform: uppercase; margin: 0;">
                FICHE OFFICIELLE D'ENJAMBEMENT &amp; ENGAGEMENT DE RATTRAPAGE
            </h2>
            <div style="font-size: 8pt; font-weight: bold; color: #93c5fd; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.6px;">
                Règlement des Études LMD • ENCG Fès • Année Universitaire {{ $academicYear ?? '2026-2027' }}
            </div>
        </div>

        <!-- Reference & Status Strip -->
        <table width="100%" cellpadding="4" cellspacing="0" style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 5px; background-color: #f8fafc; font-size: 8.5pt;">
            <tr>
                <td width="33%">
                    <strong style="color: #475569;">Réf. Dossier :</strong>
                    <span style="font-family: monospace; font-weight: bold; color: #0f2863;">ENCG-ENJ-{{ str_pad($student->id ?? 1, 5, '0', STR_PAD_LEFT) }}/{{ date('Y') }}</span>
                </td>
                <td width="34%" style="text-align: center;">
                    <strong style="color: #475569;">Décision Jury :</strong>
                    <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-weight: 900; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde68a;">
                        PASSAGE AVEC DETTE (ENJAMBEMENT)
                    </span>
                </td>
                <td width="33%" style="text-align: right;">
                    <strong style="color: #475569;">Date d'Édition :</strong>
                    <span style="font-weight: bold;">{{ date('d/m/Y') }}</span>
                </td>
            </tr>
        </table>

        <!-- Student Identity Box -->
        <div style="border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden; margin-bottom: 12px;">
            <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 5px 10px; letter-spacing: 0.5px;">
                1. IDENTIFICATION DE L'ÉTUDIANT(E) BÉNÉFICIAIRE
            </div>
            <div style="padding: 8px 10px;">
                <table width="100%" cellpadding="3" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td width="25%" style="font-weight: bold; color: #64748b;">Nom &amp; Prénom :</td>
                        <td width="35%" style="font-weight: 900; color: #0f2863; font-size: 10pt; text-transform: uppercase;">
                            {{ $student->full_name ?? ($student->user?->name ?? 'Tazi Salma') }}
                        </td>
                        <td width="20%" style="font-weight: bold; color: #64748b;">Code CNE / MASSAR :</td>
                        <td width="20%" style="font-weight: 900; font-family: monospace; color: #059669;">
                            {{ $student->cne ?? 'N134056789' }}
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #64748b;">N° Apogée / Étudiant :</td>
                        <td style="font-weight: bold; font-family: monospace; color: #1e293b;">
                            {{ $student->student_number ?? $student->cne ?? '26001248' }}
                        </td>
                        <td style="font-weight: bold; color: #64748b;">CNIE :</td>
                        <td style="font-weight: bold; font-family: monospace; color: #1e293b;">
                            {{ $student->user?->cin ?? 'CD748291' }}
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #64748b;">Filière d'Origine :</td>
                        <td style="font-weight: bold; color: #0f2863;">
                            {{ $filiereName ?? 'Tronc Commun (TC)' }}
                        </td>
                        <td style="font-weight: bold; color: #64748b;">Moyenne Annuelle :</td>
                        <td style="font-weight: 900; color: #2563eb;">
                            {{ number_format($annualAverage ?? 13.45, 2, ',', ' ') }} / 20
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #64748b;">Transition Accordée :</td>
                        <td colspan="3" style="font-weight: 900; color: #059669;">
                            {{ $currentLevel ?? '1ère Année (S1/S2)' }} &nbsp;➔&nbsp; {{ $targetLevel ?? '2ème Année (S3/S4)' }}
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Debt Modules Breakdown -->
        <div style="border: 1px solid #f59e0b; border-radius: 5px; overflow: hidden; margin-bottom: 12px;">
            <div style="background-color: #d97706; color: #ffffff; font-weight: 900; font-size: 8.5pt; text-transform: uppercase; padding: 5px 10px; letter-spacing: 0.5px;">
                2. SITUATION DES DETTES DE MODULES À RATTRAPER (CRÉDITS NON CAPITALISÉS)
            </div>
            <div style="padding: 8px 10px;">
                <p style="font-size: 8pt; color: #78350f; margin-top: 0; margin-bottom: 8px; line-height: 1.3;">
                    En application des délibérations annuelles du Jury d'Établissement, le passage au niveau supérieur est subordonné au rattrapage obligatoire du (ou des) module(s) suivant(s) :
                </p>

                <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-size: 8pt; border: 1px solid #e2e8f0;">
                    <thead>
                        <tr style="background-color: #fef3c7; color: #78350f; font-weight: 900; text-transform: uppercase;">
                            <th width="15%" style="border: 1px solid #cbd5e1; text-align: center;">Code Module</th>
                            <th width="45%" style="border: 1px solid #cbd5e1; text-align: left;">Intitulé du Module</th>
                            <th width="12%" style="border: 1px solid #cbd5e1; text-align: center;">Semestre</th>
                            <th width="13%" style="border: 1px solid #cbd5e1; text-align: center;">Note Obtenue</th>
                            <th width="15%" style="border: 1px solid #cbd5e1; text-align: center;">Statut LMD</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($debtModules ?? [] as $debt)
                            <tr style="background-color: #ffffff;">
                                <td style="border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: 900; color: #b45309;">
                                    {{ $debt['code'] ?? 'TC-S2-M07' }}
                                </td>
                                <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
                                    {{ $debt['name'] ?? 'Soft Skills II' }}
                                </td>
                                <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">
                                    {{ $debt['semester'] ?? 'S2' }}
                                </td>
                                <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: 900; color: #dc2626;">
                                    {{ isset($debt['grade']) ? number_format((float)$debt['grade'], 2, ',', ' ') : 'ABS' }} / 20
                                </td>
                                <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: 900; color: #b45309; background-color: #fffbeb;">
                                    En Dette
                                </td>
                            </tr>
                        @empty
                            <tr style="background-color: #ffffff;">
                                <td style="border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: 900; color: #b45309;">TC-S2-M07</td>
                                <td style="border: 1px solid #cbd5e1; font-weight: bold;">Soft Skills II</td>
                                <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">S2</td>
                                <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: 900; color: #dc2626;">08,34 / 20</td>
                                <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: 900; color: #b45309; background-color: #fffbeb;">En Dette</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Regulatory & Obligations Articles -->
        <div style="border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden; margin-bottom: 12px; background-color: #f8fafc;">
            <div style="background-color: #334155; color: #ffffff; font-weight: 900; font-size: 8pt; text-transform: uppercase; padding: 4px 10px; letter-spacing: 0.5px;">
                3. CADRE RÉGLEMENTAIRE &amp; CONDITIONS STRICTES DE DIPLOMATION
            </div>
            <div style="padding: 6px 10px; font-size: 7.5pt; color: #334155; line-height: 1.35;">
                <p style="margin: 0 0 4px 0;">
                    • <strong>Article 12 du Règlement Pédagogique ENCG Fès :</strong> Le passage par dérogation (enjambement) n'est autorisé que si le nombre de modules non validés est inférieur ou égal à 2 et que la moyenne annuelle compensée est supérieure ou égale à 10,00/20.
                </p>
                <p style="margin: 0 0 4px 0;">
                    • <strong>Article 14 (Obligation de Rattrapage) :</strong> L'étudiant bénéficiaire de l'enjambement est inscrit d'office aux sessions d'examens des modules en dette lors de l'année supérieure. L'assiduité aux séances de renforcement ou TP/TD dudit module est obligatoire.
                </p>
                <p style="margin: 0;">
                    • <strong>Blocage du Diplôme :</strong> Aucun diplôme de l'ENCG ne peut être délivré si un module en dette demeure non validé (&lt; 10,00/20) au terme de la 5ème année.
                </p>
            </div>
        </div>

        <!-- Signatures & Official Stamping -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px;">
            <tr>
                <td width="48%" style="vertical-align: top; border: 1px solid #cbd5e1; border-radius: 5px; padding: 8px;">
                    <div style="font-weight: 900; font-size: 8pt; color: #0f2863; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 6px;">
                        Engagement &amp; Signature de l'Étudiant(e)
                    </div>
                    <p style="font-size: 7.5pt; color: #64748b; margin: 0 0 35px 0;">
                        « Je soussigné(e), déclare avoir pris connaissance de mes modules en dette et m'engage formellement à me présenter aux sessions de rattrapage programmées. »
                    </p>
                    <div style="font-size: 7.5pt; font-style: italic; color: #94a3b8; text-align: right;">
                        Mention manuscrite "Lu et approuvé" + Signature
                    </div>
                </td>
                <td width="4%"></td>
                <td width="48%" style="vertical-align: top; border: 1px solid #cbd5e1; border-radius: 5px; padding: 8px; background-color: #f8fafc;">
                    <div style="font-weight: 900; font-size: 8pt; color: #0f2863; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 6px;">
                        Direction des Affaires Pédagogiques &amp; Scolarité
                    </div>
                    <p style="font-size: 7.5pt; color: #475569; margin: 0 0 30px 0;">
                        Fait à Fès, le {{ date('d/m/Y') }}<br>
                        Pour le Doyen de l'ENCG et par délégation,<br>
                        <strong>Le Chef du Service de la Scolarité</strong>
                    </p>
                    <div style="text-align: center; color: #0f2863; font-size: 7pt; font-weight: bold; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
                        Cachet officiel &amp; Signature numérique certifiée CNDP
                    </div>
                </td>
            </tr>
        </table>

    </div>
@endsection
