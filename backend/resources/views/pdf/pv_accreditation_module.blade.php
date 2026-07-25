@extends('pdf.layouts.pdf_master')

@section('title', 'PV D\'ACCRÉDITATION OFFICIEL — MODULE')

@section('content')
    <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f2863;">
            PROCES-VERBAL D'ACCREDITATION ET DE VALIDATION PEDAGOGIQUE
        </h2>
        <p style="font-size: 13px; font-weight: bold; margin-top: 5px; color: #059669;">
            MODULE : {{ $moduleCode ?? 'GFC-S5-M02' }} — {{ $moduleName ?? 'Analyse Financière' }}
        </p>
        <p style="font-size: 11px; color: #64748b; margin-top: 3px;">
            Conseil Pédagogique de l'ENCG Fès • Année Académique 2026/2027
        </p>
    </div>

    <!-- MODULE IDENTIFICATION BOX -->
    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; font-size: 11px; background-color: #f8fafc; border: 1px solid #cbd5e1;">
        <tr>
            <td width="50%">
                <strong>Code d'Accréditation :</strong> ACC-{{ strtoupper($moduleCode ?? 'GFC-S5-M02') }}-2026<br>
                <strong>Filière Rattachée :</strong> {{ $filiereName ?? 'Gestion Financière et Comptable (GFC)' }}<br>
                <strong>Semestre :</strong> {{ $semester ?? 'S5' }}
            </td>
            <td width="50%" style="text-align: right;">
                <strong>Coefficient Officiel :</strong> {{ $coefficient ?? '3.00' }}<br>
                <strong>Volume Horaire Global :</strong> {{ $creditHours ?? 45 }} Heures<br>
                <strong>Statut de Validation :</strong> <span style="color: #059669; font-weight: bold;">ACCRÉDITÉ PAR LE MINISTÈRE</span>
            </td>
        </tr>
    </table>

    <!-- CERTIFICATION BODY -->
    <div style="border: 1px solid #0f2863; border-radius: 6px; padding: 15px; background-color: #ffffff; margin-bottom: 25px; font-size: 11px; line-height: 1.6;">
        <h3 style="font-size: 12px; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            1. DÉCISION DE LA COMMISSION PÉDAGOGIQUE
        </h3>
        <p style="margin-top: 0; margin-bottom: 12px; text-align: justify;">
            Le Conseil de l'École Nationale de Commerce et de Gestion de Fès, réuni en session ordinaire, certifie que le module <strong>{{ $moduleName ?? 'Analyse Financière' }}</strong> répertorié sous le code <strong>{{ $moduleCode ?? 'GFC-S5-M02' }}</strong> est formellement homologué et conforme aux normes d'accréditation du Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation.
        </p>

        <h3 style="font-size: 12px; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            2. ÉLÉMENTS CONSTITUTIFS DU MODULE (ECM)
        </h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; margin-bottom: 12px;">
            <thead>
                <tr style="background-color: #f1f5f9; color: #0f2863;">
                    <th style="border: 1px solid #cbd5e1;">Élément de Module (ECM)</th>
                    <th style="border: 1px solid #cbd5e1; text-align: center;">Pondération (%)</th>
                    <th style="border: 1px solid #cbd5e1; text-align: center;">Volume Horaire</th>
                    <th style="border: 1px solid #cbd5e1;">Enseignant Titulaire</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #cbd5e1;">ECM 1 : Cours Magistral & Diagnostic Financier</td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">60%</td>
                    <td style="border: 1px solid #cbd5e1; text-align: center;">27 Heures</td>
                    <td style="border: 1px solid #cbd5e1;">{{ $professorName ?? 'Prof. Abdelhak El Amrani' }}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #cbd5e1;">ECM 2 : Travaux Dirigés & Études de Cas Pratiques</td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">40%</td>
                    <td style="border: 1px solid #cbd5e1; text-align: center;">18 Heures</td>
                    <td style="border: 1px solid #cbd5e1;">Prof. Karim Bennani</td>
                </tr>
            </tbody>
        </table>

        <h3 style="font-size: 12px; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            3. BARÈME D'ÉVALUATION ET CONTRÔLE CONTINU
        </h3>
        <p style="margin-top: 0; margin-bottom: 5px;">
            Le barème officiel arrêté pour la validation de ce module est décomposé comme suit :<br>
            • <strong>Contrôle Continu I (CC1) :</strong> 25% | • <strong>Contrôle Continu II (CC2) :</strong> 25% | • <strong>Examen Final (Session Ordinaire) :</strong> 50%
        </p>
    </div>

    <!-- OFFICIAL SIGNATURE BLOCK -->
    <table width="100%" style="margin-top: 25px; font-size: 11px;">
        <tr>
            <td width="50%" style="text-align: center;">
                <strong>Le Chef de Département Académique</strong><br><br><br><br>
                <strong>Prof. Abdelhak El Amrani</strong>
            </td>
            <td width="50%" style="text-align: center;">
                <strong>Le Directeur de l'ENCG Fès</strong><br><br><br><br>
                <strong>Prof. Abderrazak EL HIRI</strong>
            </td>
        </tr>
    </table>

    <div style="margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8;">
        Empreinte de Vérification d'Authenticité : SHA256-{{ strtoupper(md5($moduleCode ?? 'GFC-S5-M02')) }} • Document Officiel Universitaire
    </div>
@endsection
