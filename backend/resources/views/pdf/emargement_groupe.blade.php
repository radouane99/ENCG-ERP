@extends('pdf.layouts.pdf_master')

@section('title', 'LISTE D\'ÉMARGEMENT OFFICIELLE — ' . ($moduleName ?? 'EXAMEN'))

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm 10mm 10mm 10mm;
    }
    .footer-container {
        margin-top: 10px;
        padding-top: 6px;
        page-break-inside: avoid;
    }
    .official-logos-header {
        margin-bottom: 6px;
        padding-bottom: 3px;
    }
    
    /* Exam Specification Card */
    .exam-spec-card {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        font-size: 7.5pt;
        background-color: #ffffff;
        border: 1.2px solid #002147;
    }
    .exam-spec-card td {
        padding: 3.5px 7px;
        border: 1px solid #cbd5e1;
        vertical-align: middle;
    }
    .spec-label {
        background-color: #f1f5f9;
        font-weight: bold;
        color: #475569;
        width: 16%;
        font-size: 7pt;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    .spec-val {
        font-weight: bold;
        color: #002147;
        width: 34%;
        font-size: 8pt;
    }

    /* Attendance Table */
    table.attendance-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #002147;
        page-break-inside: auto;
    }
    table.attendance-table thead {
        display: table-header-group;
    }
    table.attendance-table th {
        background-color: #002147;
        color: #ffffff;
        font-size: 7.5pt;
        font-weight: bold;
        border: 1px solid #002147;
        padding: 5px 4px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }
    table.attendance-table tr {
        page-break-inside: avoid;
    }
    table.attendance-table td {
        border: 1px solid #cbd5e1;
        padding: 3px 6px;
        font-size: 8pt;
        vertical-align: middle;
    }
</style>
@endsection

@section('content')
    <!-- Banner Title with Bilingual Arabic / French Header -->
    <div style="background-color: #002147; color: #ffffff; text-align: center; padding: 6px 10px; border-radius: 3px; margin-bottom: 6px; border-bottom: 2.5px solid #c9a227;">
        <div style="font-size: 11pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; margin: 0;">
            LISTE D'ÉMARGEMENT ET DE PRÉSENCE AUX ÉPREUVES
        </div>
        @if(!empty($arabicTitle))
            <div style="font-size: 9.5pt; font-family: 'DejaVu Sans', sans-serif; color: #fbbf24; font-weight: bold; margin-top: 2px;">
                {{ $arabicTitle }}
            </div>
        @endif
        <div style="font-size: 7pt; color: #cbd5e1; margin-top: 2px; letter-spacing: 0.3px;">
            Système Intégré de Gestion Universitaire • ENCG Fès • Année Universitaire {{ date('Y') }}/{{ date('Y') + 1 }}
        </div>
    </div>

    <!-- Official Examination Metadata Grid -->
    <table class="exam-spec-card" cellpadding="0" cellspacing="0">
        <tr>
            <td class="spec-label">Épreuve / Module</td>
            <td class="spec-val" style="color: #002147; font-size: 8.5pt;">
                <strong>{{ $moduleName ?? 'Épreuve Écrite' }}</strong>
                @if(!empty($moduleCode))
                    <span style="color: #64748b; font-size: 7pt; font-family: monospace;">({{ $moduleCode }})</span>
                @endif
            </td>
            <td class="spec-label">Date & Horaire</td>
            <td class="spec-val">
                <span style="color: #b45309;">{{ $examDate ?? date('d/m/Y') }}</span>
                <span style="color: #002147; margin-left: 4px;">• {{ $timeRange ?? '08:30 – 10:30' }}</span>
            </td>
        </tr>
        <tr>
            <td class="spec-label">Filière & Semestre</td>
            <td class="spec-val">
                {{ $filiereName ?? 'Tronc Commun ENCG' }} — 
                <span style="color: #059669;">{{ $semester ?? $semestre ?? 'S1' }}</span>
            </td>
            <td class="spec-label">Lieu & Salle</td>
            <td class="spec-val" style="color: #002147;">
                <strong>{{ $roomName ?? 'Amphithéâtre B' }}</strong>
            </td>
        </tr>
        <tr>
            <td class="spec-label">Groupe / Section</td>
            <td class="spec-val">
                <span style="background-color: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 2px; font-weight: bold;">
                    {{ $groupName ?? 'Tous les Groupes' }}
                </span>
                <span style="color: #64748b; font-size: 7pt; margin-left: 5px;">({{ $sessionName ?? 'Session Normale' }})</span>
            </td>
            <td class="spec-label">Effectif Convoqué</td>
            <td class="spec-val">
                <strong style="color: #0f2863;">{{ $studentCount ?? count($realStudents ?? []) }} Candidats</strong>
                <span style="color: #059669; font-size: 7pt; margin-left: 6px;">● Cohorte Validée</span>
            </td>
        </tr>
        <tr>
            <td class="spec-label">Surveillants</td>
            <td class="spec-val" colspan="3" style="color: #1e293b; font-size: 7.5pt;">
                <strong>{{ $surveillantsText ?? 'Corps Enseignant & Surveillants désignés' }}</strong>
            </td>
        </tr>
    </table>

    <!-- Students Attendance Table -->
    <table class="attendance-table" cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th style="width: 4%; text-align: center;">N°</th>
                <th style="width: 16%; text-align: left; padding-left: 6px;">CNE / Massar</th>
                <th style="width: 13%; text-align: left; padding-left: 6px;">CIN</th>
                <th style="width: 37%; text-align: left; padding-left: 8px;">Nom & Prénom du Candidat</th>
                <th style="width: 30%; text-align: center; letter-spacing: 0.5px;">ÉMARGEMENT / SIGNATURE</th>
            </tr>
        </thead>
        <tbody>
            @php
                $list = $realStudents ?? [];
            @endphp

            @forelse($list as $index => $st)
                <tr style="background-color: {{ $index % 2 == 0 ? '#ffffff' : '#f8fafc' }}; height: 40px;">
                    <td style="text-align: center; font-weight: bold; font-size: 7.5pt; color: #64748b;">
                        {{ $index + 1 }}
                    </td>
                    <td style="font-family: monospace; font-weight: bold; font-size: 8pt; color: #1e293b; padding-left: 6px;">
                        {{ $st['cne'] ?? '—' }}
                    </td>
                    <td style="font-family: monospace; font-weight: bold; font-size: 8pt; color: #002147; padding-left: 6px;">
                        {{ $st['cin'] ?? '—' }}
                    </td>
                    <td style="font-weight: bold; color: #002147; font-size: 8.5pt; padding-left: 8px;">
                        {{ $st['name'] ?? '—' }}
                    </td>
                    <td style="background-color: #ffffff; vertical-align: bottom; padding: 0 8px 6px 8px; text-align: center;">
                        <div style="border-bottom: 1px dashed #94a3b8; width: 100%; height: 25px;"></div>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; padding: 25px; color: #64748b; font-size: 9pt;">
                        Aucun étudiant convoqué dans cette salle d'examen.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>
@endsection

@section('signature_right')
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="width: 48%; vertical-align: top; border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 5px 8px; text-align: left;">
                <div style="font-size: 6.8pt; font-weight: bold; color: #64748b; text-transform: uppercase;">
                    Surveillance de Salle
                </div>
                <div style="font-size: 7.8pt; font-weight: 900; color: #002147; margin-top: 1px;">
                    LES SURVEILLANTS
                </div>
                <div style="font-size: 6.5pt; color: #334155; margin-top: 2px;">
                    Copies remises : [ _____ ] &nbsp;&nbsp;•&nbsp;&nbsp; Absents : [ _____ ]
                </div>
                <div style="margin-top: 6px; font-size: 6.5pt; color: #94a3b8; font-style: italic;">
                    Visa & Signature des surveillants :
                </div>
                <div style="height: 18px; border-bottom: 0.8px dashed #94a3b8; width: 95%; margin-top: 2px;"></div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; vertical-align: top; border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 5px 8px; text-align: right;">
                <div style="font-size: 6.8pt; color: #334155; font-weight: bold;">
                    Fait à Fès, le {{ $examDate ?? date('d/m/Y') }}
                </div>
                <div style="font-size: 6.5pt; font-weight: bold; color: #64748b; margin-top: 1px;">
                    Pour le Directeur et par délégation
                </div>
                <div style="font-size: 7.8pt; font-weight: 900; color: #002147; text-transform: uppercase; margin-top: 1px;">
                    ADMINISTRATION DES EXAMENS
                </div>
                <div style="font-size: 6.5pt; color: #94a3b8; font-style: italic; margin-top: 2px;">
                    Cachet officiel & Visa
                </div>
                <div style="height: 18px; border-bottom: 0.8px dashed #94a3b8; width: 95%; margin-left: auto; margin-top: 2px;"></div>
            </td>
        </tr>
    </table>

    <script type="text/php">
        if (isset($pdf)) {
            $font = $fontMetrics->get_font("DejaVu Sans, Helvetica, Arial", "bold");
            $pdf->page_text(510, 824, "Page {PAGE_NUM} / {PAGE_COUNT}", $font, 7, array(0.06, 0.16, 0.39));
        }
    </script>
@endsection
