@extends('pdf.layouts.pdf_master')

@section('title', 'MAQUETTE PÉDAGOGIQUE OFFICIELLE — PROGRAMME')

@section('content')
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f2863;">
            MAQUETTE PÉDAGOGIQUE & PROGRAMME D'ENSEIGNEMENT
        </h2>
        <p style="font-size: 13px; font-weight: bold; margin-top: 5px; color: #059669;">
            FILIÈRE : {{ $filiereName ?? 'Gestion Financière et Comptable' }} ({{ $filiereCode ?? 'GFC' }})
        </p>
        <p style="font-size: 11px; color: #64748b; margin-top: 3px;">
            Diplôme des Écoles Nationales de Commerce et de Gestion — Bac + 5 (Grande École)
        </p>
    </div>

    <!-- RESPONSIBLE & SUMMARY BOX -->
    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; font-size: 11px; background-color: #f8fafc; border: 1px solid #cbd5e1;">
        <tr>
            <td width="50%">
                <strong>Coordinateur / Chef de Filière :</strong> {{ $coordinatorName ?? 'Prof. Abdelhak El Amrani' }}<br>
                <strong>Durée des études :</strong> {{ $durationYears ?? 5 }} ans (10 Semestres)
            </td>
            <td width="50%" style="text-align: right;">
                <strong>Volume Horaire Total :</strong> 2 400 Heures (CM + TD)<br>
                <strong>Régime Pédagogique :</strong> Présentiel & Évaluation Continue
            </td>
        </tr>
    </table>

    <!-- CURRICULUM SYLLABUS TABLE -->
    <h3 style="font-size: 12px; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-bottom: 8px;">
        STRUCTURE DES MODULES ET VOLUMES HORAIRES D'ENSEIGNEMENT
    </h3>

    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; font-size: 10px;">
        <thead>
            <tr style="background-color: #0f2863; color: #ffffff; text-align: left;">
                <th style="border: 1px solid #0f2863;">Semestre</th>
                <th style="border: 1px solid #0f2863;">Code & Intitulé du Module</th>
                <th style="border: 1px solid #0f2863; text-align: center;">Volume Horaire (CM/TD)</th>
                <th style="border: 1px solid #0f2863;">Département Responsable</th>
            </tr>
        </thead>
        <tbody>
            <tr style="background-color: #ffffff;">
                <td style="border: 1px solid #cbd5e1; font-weight: bold;">Semestre 1</td>
                <td style="border: 1px solid #cbd5e1;">TC-S1-M01 Mathématiques pour la Gestion</td>
                <td style="border: 1px solid #cbd5e1; text-align: center;">48 Heures</td>
                <td style="border: 1px solid #cbd5e1;">Sciences de Gestion</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="border: 1px solid #cbd5e1; font-weight: bold;">Semestre 1</td>
                <td style="border: 1px solid #cbd5e1;">TC-S1-M02 Comptabilité Générale I</td>
                <td style="border: 1px solid #cbd5e1; text-align: center;">48 Heures</td>
                <td style="border: 1px solid #cbd5e1;">Sciences de Gestion</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="border: 1px solid #cbd5e1; font-weight: bold;">Semestre 1</td>
                <td style="border: 1px solid #cbd5e1;">TC-S1-M05 Management de Base</td>
                <td style="border: 1px solid #cbd5e1; text-align: center;">48 Heures</td>
                <td style="border: 1px solid #cbd5e1;">Sciences de Gestion</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="border: 1px solid #cbd5e1; font-weight: bold;">Semestre 5 (Spécialité)</td>
                <td style="border: 1px solid #cbd5e1;">GFC-S5-M01 Finance d'Entreprise Approfondie</td>
                <td style="border: 1px solid #cbd5e1; text-align: center;">48 Heures</td>
                <td style="border: 1px solid #cbd5e1;">Sciences de Gestion</td>
            </tr>
            <tr style="background-color: #ffffff;">
                <td style="border: 1px solid #cbd5e1; font-weight: bold;">Semestre 5 (Spécialité)</td>
                <td style="border: 1px solid #cbd5e1;">GFC-S5-M02 Audit Financier & Comptable</td>
                <td style="border: 1px solid #cbd5e1; text-align: center;">48 Heures</td>
                <td style="border: 1px solid #cbd5e1;">Sciences de Gestion</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="border: 1px solid #cbd5e1; font-weight: bold;">Semestre 10</td>
                <td style="border: 1px solid #cbd5e1;">GFC-S10-M06 Projet de Fin d'Études (PFE) & Stage</td>
                <td style="border: 1px solid #cbd5e1; text-align: center;">300 Heures</td>
                <td style="border: 1px solid #cbd5e1;">Sciences de Gestion</td>
            </tr>
        </tbody>
    </table>


    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 10px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 10px; color: #065f46;">
            <strong>Validation Réglementaire :</strong> Maquette accréditée par le Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation du Royaume du Maroc.
        </p>
    </div>

    <!-- SIGNATURE FOOTER -->
    <table width="100%" style="margin-top: 20px;">
        <tr>
            <td width="60%" style="font-size: 9px; color: #64748b;">
                Document certifié conforme • ENCG Fès — USMBA<br>
                Empreinte Numérique : {{ md5($filiereCode ?? 'GFC') }}
            </td>
            <td width="40%" style="text-align: right; font-size: 10px; font-weight: bold; color: #0f2863;">
                Le Chef de Filière / Coordinateur<br><br><br>
                _______________________
            </td>
        </tr>
    </table>
@endsection
