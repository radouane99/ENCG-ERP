@extends('pdf.layouts.pdf_master')

@section('title', 'FICHE D\'ÉMARGEMENT & LISTE OFFICIELLE DES ÉTUDIANTS — ENCG FÈS')

@section('styles')
<style>
    @page {
        size: {{ ($mode ?? 'emargement') === 'seances' ? 'A4 landscape' : 'A4 portrait' }};
        margin: 8mm 10mm 10mm 10mm;
    }
    .roster-header {
        text-align: center;
        margin-bottom: 8px;
    }
    .roster-title {
        font-size: 13pt;
        font-weight: 900;
        color: #002e5b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
    }
    .roster-subtitle {
        font-size: 9.5pt;
        font-weight: bold;
        color: #059669;
        margin-top: 3px;
    }
    .cartouche-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        font-size: 8pt;
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
    }
    .cartouche-table td {
        padding: 4px 8px;
        border: 0.5px solid #e2e8f0;
        vertical-align: middle;
    }
    .cartouche-label {
        font-weight: bold;
        color: #475569;
        width: 18%;
    }
    .cartouche-value {
        color: #0f172a;
        font-weight: bold;
    }
    table.roster-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #002e5b;
        page-break-inside: auto;
    }
    table.roster-table thead {
        display: table-header-group;
    }
    table.roster-table th {
        background-color: #002e5b;
        color: #ffffff;
        font-size: 8pt;
        font-weight: bold;
        padding: 5px 4px;
        border: 0.8px solid #002e5b;
        text-align: center;
    }
    table.roster-table tr {
        page-break-inside: avoid;
    }
    table.roster-table td {
        border: 0.6px solid #cbd5e1;
        font-size: 7.5pt;
        padding: 3px 5px;
        vertical-align: middle;
    }
    .sig-box {
        border-bottom: 0.8px dashed #94a3b8;
        height: 24px;
        width: 100%;
    }
    .signatures-block {
        margin-top: 12px;
        width: 100%;
        page-break-inside: avoid;
    }
    .sig-column {
        width: 48%;
        border: 1px solid #cbd5e1;
        background-color: #f8fafc;
        padding: 8px;
        font-size: 8pt;
    }
</style>
@endsection

@section('content')
    <div class="roster-header">
        <h1 class="roster-title">
            {{ ($mode ?? 'emargement') === 'seances' ? 'FEUILLE DE PRÉSENCE OFFICIELLE AUX SÉANCES' : 'LISTE OFFICIELLE DES ÉTUDIANTS & FICHE D\'ÉMARGEMENT' }}
        </h1>
        <div class="roster-subtitle">
            {{ $filiereName ?? 'Tronc Commun' }} ({{ $filiereCode ?? 'TC' }}) — Semestre {{ $semester ?? 1 }}
        </div>
    </div>

    <!-- CARTOUCHE D'IDENTIFICATION PÉDAGOGIQUE -->
    <table class="cartouche-table" cellpadding="0" cellspacing="0">
        <tr>
            <td class="cartouche-label">Enseignant :</td>
            <td class="cartouche-value" width="32%">
                <strong>{{ $professorName ?? 'Enseignant Non Spécifié' }}</strong>
                <span style="font-size: 7pt; color: #64748b; font-weight: normal;">({{ $professorStatus ?? 'Permanent' }})</span>
            </td>
            <td class="cartouche-label">Année Universitaire :</td>
            <td class="cartouche-value" width="32%">{{ $academicYear ?? (date('Y').'/'.(date('Y')+1)) }}</td>
        </tr>
        <tr>
            <td class="cartouche-label">Module / Matière :</td>
            <td class="cartouche-value"><strong>{{ $moduleName ?? 'Tous les modules' }}</strong></td>
            <td class="cartouche-label">Type d'Enseignement :</td>
            <td class="cartouche-value">
                @if(!empty($subGroup))
                    <span style="color: #059669; font-weight: 900;">Travaux Dirigés (TD) • Sous-Groupe {{ $subGroup }}</span>
                @else
                    <span style="color: #002e5b; font-weight: 900;">Cours Magistral (CM) • Section {{ $groupName ?? 'Section 1' }}</span>
                @endif
            </td>
        </tr>
        <tr>
            <td class="cartouche-label">Section / Groupe :</td>
            <td class="cartouche-value">{{ $groupName ?? 'Section 1' }}</td>
            <td class="cartouche-label">Effectif Total Inscrits :</td>
            <td class="cartouche-value">
                <strong style="color: #002e5b; font-size: 8.5pt;">{{ count($students ?? []) }} Étudiants</strong>
                @if(!empty($subGroup))
                    <span style="font-size: 7pt; color: #059669;">(Sous-groupe équilibré)</span>
                @else
                    <span style="font-size: 7pt; color: #64748b;">(Section entière)</span>
                @endif
            </td>
        </tr>
    </table>

    <!-- TABLEAU OFFICIEL DES ÉTUDIANTS -->
    <table class="roster-table" cellpadding="0" cellspacing="0">
        <thead>
            @if(($mode ?? 'emargement') === 'seances')
                <!-- MODE GRILLE MULTI-SÉANCES (PAYSAGE) -->
                <tr>
                    <th style="width: 4%;">N°</th>
                    <th style="width: 10%;">Matricule</th>
                    <th style="width: 12%;">CNE / Massar</th>
                    <th style="width: 26%; text-align: left; padding-left: 6px;">Nom & Prénom de l'Étudiant</th>
                    <th style="width: 6%;">Sous-Gr.</th>
                    <th style="width: 4%;">S1</th>
                    <th style="width: 4%;">S2</th>
                    <th style="width: 4%;">S3</th>
                    <th style="width: 4%;">S4</th>
                    <th style="width: 4%;">S5</th>
                    <th style="width: 4%;">S6</th>
                    <th style="width: 4%;">S7</th>
                    <th style="width: 4%;">S8</th>
                    <th style="width: 4%;">S9</th>
                    <th style="width: 4%;">S10</th>
                    <th style="width: 6%;">Total Abs.</th>
                </tr>
            @else
                <!-- MODE ÉMARGEMENT / SIGNATURES (PORTRAIT) -->
                <tr>
                    <th style="width: 5%;">N°</th>
                    <th style="width: 14%;">Matricule</th>
                    <th style="width: 15%;">CNE / Massar</th>
                    <th style="width: 13%;">CIN</th>
                    <th style="width: 28%; text-align: left; padding-left: 8px;">Nom & Prénom de l'Étudiant</th>
                    <th style="width: 8%;">S-Groupe</th>
                    <th style="width: 17%;">SIGNATURE / ÉMARGEMENT</th>
                </tr>
            @endif
        </thead>
        <tbody>
            @forelse($students as $index => $st)
                <tr style="background-color: {{ $index % 2 === 0 ? '#ffffff' : '#f8fafc' }};">
                    <td style="text-align: center; font-weight: bold; color: #64748b;">{{ $index + 1 }}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold; color: #002e5b;">
                        {{ $st['student_number'] ?? '—' }}
                    </td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold; color: #334155;">
                        {{ $st['cne'] ?? $st['massar_code'] ?? '—' }}
                    </td>
                    @if(($mode ?? 'emargement') !== 'seances')
                        <td style="text-align: center; font-family: monospace; color: #475569;">
                            {{ $st['cin'] ?? '—' }}
                        </td>
                    @endif
                    <td style="font-weight: bold; color: #0f172a; padding-left: 6px;">
                        {{ $st['last_name'] ?? '' }} {{ $st['first_name'] ?? '' }}
                    </td>
                    <td style="text-align: center; font-weight: bold; color: {{ !empty($st['sub_group']) && str_contains($st['sub_group'], '.1') ? '#059669' : '#4338ca' }};">
                        {{ $st['sub_group'] ?? '—' }}
                    </td>

                    @if(($mode ?? 'emargement') === 'seances')
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; border-color: #cbd5e1;"></td>
                        <td style="text-align: center; background-color: #f1f5f9;"></td>
                    @else
                        <td style="text-align: center; background-color: #ffffff; padding: 2px 6px;">
                            <div class="sig-box"></div>
                        </td>
                    @endif
                </tr>
            @empty
                <tr>
                    <td colspan="{{ ($mode ?? 'emargement') === 'seances' ? 16 : 7 }}" style="text-align: center; padding: 18px; color: #94a3b8; font-style: italic;">
                        Aucun étudiant inscrit dans cette section / ce sous-groupe pour l'année universitaire en cours.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- BLOC SIGNATURES & VALIDATION OFFICIELLE -->
    <div class="signatures-block">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td class="sig-column" style="margin-right: 4%;">
                    <div style="font-weight: bold; color: #002e5b; margin-bottom: 4px;">Visa & Signature de l'Enseignant :</div>
                    <div style="font-size: 7pt; color: #64748b; margin-bottom: 35px;">
                        Fait à Fès, le {{ date('d/m/Y') }}<br>
                        Prof. {{ $professorName ?? '' }}
                    </div>
                    <div style="border-top: 0.8px dotted #94a3b8; text-align: center; font-size: 7pt; color: #94a3b8;">
                        Signature
                    </div>
                </td>
                <td width="4%"></td>
                <td class="sig-column">
                    <div style="font-weight: bold; color: #002e5b; margin-bottom: 4px;">Visa & Cachet de l'Administration :</div>
                    <div style="font-size: 7pt; color: #64748b; margin-bottom: 35px;">
                        Direction des Études & Scolarité ENCG Fès<br>
                        Document officiel extrait du Système d'Information Intégré
                    </div>
                    <div style="border-top: 0.8px dotted #94a3b8; text-align: center; font-size: 7pt; color: #94a3b8;">
                        Cachet de l'Établissement
                    </div>
                </td>
            </tr>
        </table>
    </div>
@endsection
