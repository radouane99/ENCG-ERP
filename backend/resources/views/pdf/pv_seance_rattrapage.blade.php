@extends('pdf.layouts.pdf_master')

@section('title', 'PROCÈS-VERBAL DE SÉANCE DE RATTRAPAGE & RÉGULARISATION — ENCG FÈS')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm 10mm 10mm 10mm;
    }
    .pv-header {
        text-align: center;
        margin-bottom: 8px;
    }
    .pv-title {
        font-size: 13pt;
        font-weight: 900;
        color: #1a3673;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
    }
    .pv-subtitle {
        font-size: 9pt;
        font-weight: bold;
        color: #6b21a8;
        margin-top: 3px;
    }
    .article14-banner {
        background-color: #f5f3ff;
        border-left: 3px solid #7c3aed;
        padding: 5px 8px;
        margin-bottom: 8px;
        font-size: 7.5pt;
        color: #4c1d95;
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
        border: 1.5px solid #1a3673;
        page-break-inside: auto;
    }
    table.roster-table thead {
        display: table-header-group;
    }
    table.roster-table th {
        background-color: #1a3673;
        color: #ffffff;
        font-size: 7.5pt;
        font-weight: 800;
        text-transform: uppercase;
        padding: 6px 4px;
        border: 0.5px solid #0f172a;
        text-align: center;
    }
    table.roster-table td {
        font-size: 8pt;
        padding: 5px 4px;
        border: 0.5px solid #cbd5e1;
        color: #1e293b;
        vertical-align: middle;
    }
    table.roster-table tr:nth-child(even) td {
        background-color: #f8fafc;
    }
    .status-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 7pt;
        font-weight: bold;
        text-transform: uppercase;
    }
    .badge-present {
        background-color: #d1fae5;
        color: #065f46;
        border: 0.5px solid #10b981;
    }
    .badge-absent {
        background-color: #ffe4e6;
        color: #9f1239;
        border: 0.5px solid #f43f5e;
    }
    .badge-late {
        background-color: #fef3c7;
        color: #92400e;
        border: 0.5px solid #f59e0b;
    }
    .badge-excused {
        background-color: #e0f2fe;
        color: #0369a1;
        border: 0.5px solid #0ea5e9;
    }
    .stats-table {
        width: 100%;
        margin-top: 8px;
        margin-bottom: 8px;
        border-collapse: collapse;
    }
    .stats-table td {
        padding: 6px;
        text-align: center;
        border: 1px solid #cbd5e1;
        background-color: #f1f5f9;
        font-size: 8pt;
    }
    .stats-num {
        font-size: 11pt;
        font-weight: 900;
        color: #1a3673;
    }
    .signatures-block {
        margin-top: 12px;
        width: 100%;
        page-break-inside: avoid;
    }
    .sig-column {
        width: 48%;
        border: 0.8px solid #cbd5e1;
        border-radius: 6px;
        background-color: #ffffff;
        padding: 8px 12px;
        vertical-align: top;
    }
    .integrity-footer {
        margin-top: 10px;
        border-top: 0.8px solid #cbd5e1;
        padding-top: 4px;
        color: #64748b;
    }
</style>
@endsection

@section('content')
    <div class="pv-header">
        <h1 class="pv-title">PROCÈS-VERBAL OFFICIEL DE SÉANCE DE RATTRAPAGE</h1>
        <div class="pv-subtitle">Feuille d'Appel, Régularisation d'Absence & Validation Pédagogique</div>
    </div>

    <!-- CARTOUCHE ADMINISTRATIF -->
    <table class="cartouche-table">
        <tr>
            <td class="cartouche-label">Enseignant :</td>
            <td class="cartouche-value" colspan="2">{{ $professorName ?? 'Professeur Titulaire' }}</td>
            <td class="cartouche-label">Statut :</td>
            <td class="cartouche-value">{{ $professorStatus ?? 'Professeur ENCG' }}</td>
        </tr>
        <tr>
            <td class="cartouche-label">Module / Matière :</td>
            <td class="cartouche-value" colspan="2">{{ $moduleName ?? 'Module Pédagogique' }} ({{ $moduleCode ?? 'MOD' }})</td>
            <td class="cartouche-label">Année Univ. :</td>
            <td class="cartouche-value">{{ $academicYear ?? (date('Y').'/'.(date('Y')+1)) }}</td>
        </tr>
        <tr>
            <td class="cartouche-label">Filière / Niveau :</td>
            <td class="cartouche-value">{{ $filiereName ?? 'Tronc Commun' }} (S{{ $semester ?? 1 }})</td>
            <td class="cartouche-label">Groupe :</td>
            <td class="cartouche-value">{{ $groupName ?? 'Section' }} {{ $subGroup ? "($subGroup)" : '' }}</td>
            <td class="cartouche-label">Séance Cible :</td>
            <td class="cartouche-value" style="color: #7c3aed;">Séance {{ $seanceCode ?? 'S1' }}</td>
        </tr>
        <tr>
            <td class="cartouche-label">Date Rattrapage :</td>
            <td class="cartouche-value" style="color: #1a3673;">{{ $rattrapageDate ?? date('d/m/Y') }}</td>
            <td class="cartouche-label">Créneau :</td>
            <td class="cartouche-value">{{ $timeSlot ?? '14:00 - 16:00' }}</td>
            <td class="cartouche-label">Salle / Lieu :</td>
            <td class="cartouche-value">{{ $room ?? 'Salle de Rattrapage' }}</td>
        </tr>
    </table>

    <div class="article14-banner">
        <strong>Cadre Réglementaire (Article 14 du Règlement Pédagogique ENCG Fès) :</strong>
        Ce procès-verbal certifie l'émargement effectif de la séance de rattrapage. Tout étudiant marqué « PRÉSENT (RÉGULARISÉ) » voit son absence de la séance d'origine {{ $seanceCode ?? 'S1' }} régularisée, évitant ainsi le décompte vers le seuil des 3 absences entraînant l'exclusion de la session normale d'examens.
    </div>

    <!-- TABLEAU D'APPEL ET D'ÉMARGEMENT DU RATTRAPAGE -->
    <table class="roster-table">
        <thead>
            <tr>
                <th width="4%">N°</th>
                <th width="12%">Matricule</th>
                <th width="14%">Code CNE / Massar</th>
                <th width="28%">Nom & Prénom</th>
                <th width="18%">Statut Rattrapage</th>
                <th width="12%">Émargement</th>
                <th width="12%">Observations</th>
            </tr>
        </thead>
        <tbody>
            @forelse($records as $index => $row)
                @php
                    $st = $row['status'] ?? 'absent';
                    $isPres = ($st === 'present');
                    $isAbs = ($st === 'absent');
                    $isLate = ($st === 'retard' || $st === 'late');
                    $isExc = ($st === 'excuse' || $st === 'excused');
                @endphp
                <tr>
                    <td style="text-align: center; font-weight: bold; color: #64748b;">{{ $index + 1 }}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold;">{{ $row['student_number'] ?? '—' }}</td>
                    <td style="text-align: center; font-family: monospace; color: #475569;">{{ $row['cne'] ?? '—' }}</td>
                    <td style="font-weight: bold; text-transform: uppercase;">
                        {{ $row['last_name'] ?? '' }} <span style="text-transform: capitalize; font-weight: 500;">{{ $row['first_name'] ?? '' }}</span>
                    </td>
                    <td style="text-align: center;">
                        @if($isPres)
                            <span class="status-badge badge-present">✓ Présent (Régularisé)</span>
                        @elseif($isAbs)
                            <span class="status-badge badge-absent">✗ Non régularisé (Absent)</span>
                        @elseif($isLate)
                            <span class="status-badge badge-late">⏱ Retard</span>
                        @else
                            <span class="status-badge badge-excused">⚖ Excusé</span>
                        @endif
                    </td>
                    <td style="text-align: center;">
                        @if($isPres)
                            <span style="color: #059669; font-weight: bold; font-size: 7pt;">ÉMARGÉ</span>
                        @elseif($isAbs)
                            <span style="color: #e11d48; font-size: 6.5pt;">DÉFAILLANT</span>
                        @else
                            <span style="color: #475569; font-size: 7pt;">JUSTIFIÉ</span>
                        @endif
                    </td>
                    <td style="font-size: 7pt; color: #475569;">
                        {{ $row['note'] ?? ($isPres ? 'Absence régularisée' : '') }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; padding: 18px; color: #94a3b8; font-style: italic;">
                        Aucun étudiant inscrit dans cette séance de rattrapage.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- BILAN NUMÉRIQUE DU RATTRAPAGE -->
    @php
        $totalConvoques = count($records);
        $totalPresents = count(array_filter($records, fn($r) => ($r['status'] ?? '') === 'present'));
        $totalAbsents = count(array_filter($records, fn($r) => ($r['status'] ?? '') === 'absent'));
        $totalAutres = $totalConvoques - $totalPresents - $totalAbsents;
        $tauxRegul = $totalConvoques > 0 ? round(($totalPresents / $totalConvoques) * 100) : 0;
    @endphp
    <table class="stats-table">
        <tr>
            <td width="25%">
                <div>Étudiants Convoqués</div>
                <div class="stats-num">{{ $totalConvoques }}</div>
            </td>
            <td width="25%">
                <div style="color: #059669; font-weight: bold;">Présents Régularisés</div>
                <div class="stats-num" style="color: #059669;">{{ $totalPresents }}</div>
            </td>
            <td width="25%">
                <div style="color: #e11d48; font-weight: bold;">Absents Persistants</div>
                <div class="stats-num" style="color: #e11d48;">{{ $totalAbsents }}</div>
            </td>
            <td width="25%">
                <div>Taux de Régularisation</div>
                <div class="stats-num" style="color: #7c3aed;">{{ $tauxRegul }}%</div>
            </td>
        </tr>
    </table>

    <!-- BLOC SIGNATURES & VALIDATION OFFICIELLE -->
    <div class="signatures-block">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td class="sig-column">
                    <div style="font-weight: bold; color: #1a3673; margin-bottom: 4px;">Visa & Signature de l'Enseignant :</div>
                    <div style="font-size: 7pt; color: #64748b; margin-bottom: 30px;">
                        Fait à Fès, le {{ date('d/m/Y') }}<br>
                        Prof. {{ $professorName ?? '' }} ({{ $professorStatus ?? 'Enseignant' }})<br>
                        <em>Certifie sur l'honneur l'exactitude des pointages ci-dessus.</em>
                    </div>
                    <div style="border-top: 0.8px dotted #94a3b8; text-align: center; font-size: 7pt; color: #94a3b8;">
                        Signature de l'Enseignant
                    </div>
                </td>
                <td width="4%"></td>
                <td class="sig-column">
                    <div style="font-weight: bold; color: #1a3673; margin-bottom: 4px;">Visa de la Direction des Études & Scolarité :</div>
                    <div style="font-size: 7pt; color: #64748b; margin-bottom: 30px;">
                        École Nationale de Commerce et de Gestion de Fès<br>
                        Régularisation enregistrée au Système d'Information Pédagogique<br>
                        <em>Heures effectives enregistrées au Cahier de Texte Numérique.</em>
                    </div>
                    <div style="border-top: 0.8px dotted #94a3b8; text-align: center; font-size: 7pt; color: #94a3b8;">
                        Cachet & Visa de l'Établissement
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- BANDEAU D'INTÉGRITÉ NUMÉRIQUE -->
    <div class="integrity-footer">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td style="text-align: left; font-size: 6.5pt;">
                    <strong>Authentification & Traçabilité :</strong> Réf PV-RAT-{{ date('Y') }}-{{ str_pad($group->id ?? 1, 4, '0', STR_PAD_LEFT) }}-{{ $seanceCode ?? 'S1' }} • SHA-256 : <span style="font-family: monospace; color: #1a3673; font-weight: bold;">{{ substr($securityHash ?? hash('sha256', date('YmdHis')), 0, 32) }}…</span>
                </td>
                <td style="text-align: right; font-size: 6.5pt;">
                    Extrait officiel du {{ date('d/m/Y à H:i') }} • Portail ENCG Fès
                </td>
            </tr>
        </table>
    </div>
@endsection
