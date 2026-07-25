@extends('pdf.layouts.pdf_master')

@section('title', 'FICHE SYLLABIQUE OFFICIELLE — MODULE')

@section('content')
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f2863;">
            FICHE DESCRIPTIVE & SYLLABIQUE DU MODULE
        </h2>
        <p style="font-size: 14px; font-weight: bold; margin-top: 5px; color: #059669;">
            MODULE : {{ $moduleCode ?? 'GFC-S5-M02' }} — {{ $moduleName ?? 'Analyse Financière' }}
        </p>
        <p style="font-size: 11px; color: #64748b; margin-top: 3px;">
            ENCG Fès — Semestre {{ $semester ?? 'S5' }} (Coefficient : {{ $coefficient ?? '3.00' }})
        </p>
    </div>

    <!-- MODULE METRICS TABLE -->
    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; font-size: 11px; background-color: #f8fafc; border: 1px solid #cbd5e1;">
        <tr>
            <td width="50%">
                <strong>Enseignant Responsable :</strong> {{ $professorName ?? 'Prof. Abdelhak El Amrani' }}<br>
                <strong>Filière Rattachée :</strong> {{ $filiereName ?? 'Gestion Financière et Comptable (GFC)' }}
            </td>
            <td width="50%" style="text-align: right;">
                <strong>Volume Horaire Total :</strong> {{ $creditHours ?? 45 }} Heures (CM/TD)<br>
                <strong>Modalité Principale :</strong> CC1 25% | CC2 25% | Exam 50%
            </td>
        </tr>
    </table>

    <!-- SYLLABUS CONTENT BOX -->
    <div style="border: 1px solid #0f2863; border-radius: 6px; padding: 15px; background-color: #ffffff; margin-bottom: 20px; font-size: 11px; line-height: 1.6;">
        <h3 style="font-size: 12px; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            1. OBJECTIFS PÉDAGOGIQUES ET COMPÉTENCES VISÉES
        </h3>
        <p style="margin-top: 0; margin-bottom: 12px; text-align: justify;">
            {{ $objectifs ?? "Ce module vise à maîtriser les compétences fondamentales de la discipline et d'émettre des recommandations stratégiques." }}
        </p>

        <h3 style="font-size: 12px; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            2. PROGRAMME STRUCTURÉ DU COURS
        </h3>
        <ul style="margin-top: 0; margin-bottom: 12px; padding-left: 20px;">
            @if(isset($chapitres) && is_array($chapitres))
                @foreach($chapitres as $chap)
                    <li>{{ $chap }}</li>
                @endforeach
            @else
                <li>Chapitre I : Introduction générale et fondements théoriques.</li>
                <li>Chapitre II : Analyse des concepts avancés et méthodologie.</li>
                <li>Chapitre III : Études de cas pratiques et applications sectorielles.</li>
                <li>Chapitre IV : Synthèse stratégique et évaluation finale.</li>
            @endif
        </ul>


        <h3 style="font-size: 12px; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            3. MODALITÉS D'ÉVALUATION ET DE CONTRÔLE DES CONNAISSANCES
        </h3>
        <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; margin-top: 5px;">
            <thead>
                <tr style="background-color: #0f2863; color: #ffffff;">
                    <th style="border: 1px solid #0f2863;">Épreuve / Contrôle</th>
                    <th style="border: 1px solid #0f2863; text-align: center;">Pondération (%)</th>
                    <th style="border: 1px solid #0f2863;">Durée & Nature</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #cbd5e1;">Contrôle Continu I (CC1)</td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">25%</td>
                    <td style="border: 1px solid #cbd5e1;">1h30 — Épreuve Écrite / Test Individuel</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #cbd5e1;">Contrôle Continu II (CC2) / TP</td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">25%</td>
                    <td style="border: 1px solid #cbd5e1;">1h30 — Étude de Cas Pratique</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #cbd5e1;">Examen Final (Session Ordinaire)</td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #059669;">50%</td>
                    <td style="border: 1px solid #cbd5e1;">2h00 — Épreuve Écrite Récapitulative</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- SIGNATURE FOOTER -->
    <table width="100%" style="margin-top: 15px;">
        <tr>
            <td width="60%" style="font-size: 9px; color: #64748b;">
                Fiche Syllabique Officielle ENCG Fès • Valable pour l'Année Académique 2026/2027<br>
                Empreinte Numérique : {{ md5($moduleCode ?? 'GFC-S5-M02') }}
            </td>
            <td width="40%" style="text-align: right; font-size: 10px; font-weight: bold; color: #0f2863;">
                L'Enseignant Responsable du Module<br><br><br>
                _______________________
            </td>
        </tr>
    </table>
@endsection
