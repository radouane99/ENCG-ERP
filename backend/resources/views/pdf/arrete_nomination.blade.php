@extends('pdf.layouts.pdf_master')

@section('title', 'ARRÊTÉ DE NOMINATION — CHEF DE DÉPARTEMENT')

@section('content')
    <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f2863; text-decoration: underline;">
            DÉCISION N° {{ rand(100, 999) }}/{{ date('Y') }} PORTANT NOMINATION D'UN CHEF DE DÉPARTEMENT
        </h2>
        <p style="font-size: 12px; font-weight: bold; margin-top: 5px; color: #475569;">
            ANNÉE ACADÉMIQUE {{ $academicYear ?? '2026/2027' }}
        </p>
    </div>

    <div style="font-size: 12px; line-height: 1.8; margin-bottom: 25px; text-align: justify;">
        <p style="margin-bottom: 12px;">
            <strong>LE DIRECTEUR DE L'ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS,</strong>
        </p>
        <ul style="list-style-type: square; padding-left: 20px; margin-bottom: 15px;">
            <li>Vu le Dahir n° 1-00-199 du 15 Safar 1421 (19 mai 2000) portant promulgation de la loi n° 01-00 portant réorganisation de l'enseignement supérieur ;</li>
            <li>Vu le décret n° 2-90-554 du 2 Rajab 1411 (18 janvier 1991) relatif aux établissements universitaires ;</li>
            <li>Vu les délibérations du Conseil d'Établissement de l'ENCG Fès ;</li>
            <li>Considérant les compétences académiques et scientifiques de l'intéressé(e).</li>
        </ul>
    </div>

    <!-- DECISION ARTICLES -->
    <div style="border: 2px solid #0f2863; border-radius: 6px; padding: 20px; background-color: #f8fafc; margin-bottom: 30px;">
        <h3 style="font-size: 13px; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-top: 0; margin-bottom: 10px; border-b: 1px solid #cbd5e1; padding-bottom: 5px;">
            DÉCIDE CE QUI SUIT :
        </h3>

        <p style="font-size: 12px; line-height: 1.6; margin-bottom: 10px;">
            <strong><u>ARTICLE PREMIER :</u></strong><br>
            Monsieur / Madame le Professeur <strong>{{ $headName ?? 'Abdelhak El Amrani' }}</strong>, Enseignant-Chercheur titulaire à l'ENCG Fès, est nommé(e) <strong>Chef du Département {{ $departmentName ?? 'Sciences de Gestion' }} ({{ $departmentCode ?? 'SG' }})</strong>.
        </p>

        <p style="font-size: 12px; line-height: 1.6; margin-bottom: 10px;">
            <strong><u>ARTICLE 2 :</u></strong><br>
            L'intéressé(e) exerce ses fonctions conformément aux dispositions réglementaires en vigueur régissant l'organisation pédagogique et administrative des départements universitaires.
        </p>

        <p style="font-size: 12px; line-height: 1.6; margin-bottom: 0;">
            <strong><u>ARTICLE 3 :</u></strong><br>
            Le Secrétaire Général de l'Établissement est chargé de l'exécution de la présente décision qui prend effet à compter du <strong>01 Septembre {{ date('Y') }}</strong>.
        </p>
    </div>

    <!-- SIGNATURE & SEAL SECTION -->
    <table width="100%" style="margin-top: 30px;">
        <tr>
            <td width="50%" style="vertical-align: top; font-size: 10px; color: #64748b;">
                <p style="margin: 0; font-weight: bold;">Document Officiel Certifié</p>
                <p style="margin: 3px 0;">Fait à Fès, le {{ date('d/m/Y') }}</p>
                <p style="margin: 3px 0; font-family: monospace;">UUID : {{ md5($departmentCode ?? 'SG') }}</p>
            </td>
            <td width="50%" style="text-align: right; vertical-align: top;">
                <p style="font-size: 12px; font-weight: bold; margin: 0; color: #0f2863;">
                    Le Directeur de l'ENCG Fès
                </p>
                <p style="font-size: 11px; margin: 3px 0 15px 0; color: #475569;">
                    Pr. Directeur de l'Établissement
                </p>
                <div style="border: 2px dashed #0f2863; padding: 10px; display: inline-block; background-color: #f1f5f9; border-radius: 6px; text-align: center;">
                    <span style="font-size: 10px; font-weight: bold; color: #0f2863;">[ TAMPON ET SIGNATURE OFFICIELLE ]</span><br>
                    <span style="font-size: 8px; color: #64748b;">Signé Électroniquement via ENCG ERP</span>
                </div>
            </td>
        </tr>
    </table>
@endsection
