@extends('pdf.layouts.pdf_master')

@section('title', 'Procès-Verbal d\'Incident')

@section('document_title', 'PROCÈS-VERBAL D\'INCIDENT D\'EXAMEN')
@section('title_color', 'red')

@section('meta_info', 'Réf. PV : PV-' . ($incident_id ?? rand(100,999)) . ' &nbsp;&nbsp;&nbsp; Date : ' . ($incident_date ?? date('d/m/Y H:i')))

@section('content')
<style>
    .incident-box {
        border: 1.5px solid #dc2626;
        background-color: #fef2f2;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 16px;
    }
    .incident-type {
        font-size: 13px;
        font-weight: bold;
        color: #991b1b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .info-grid {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 16px;
        font-size: 11px;
    }
    .info-grid td {
        padding: 6px 8px;
        border-bottom: 1px solid #e2e8f0;
    }
    .info-label {
        font-weight: bold;
        color: #1e293b;
        width: 130px;
    }
    .statement-box {
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        padding: 12px 16px;
        font-size: 11px;
        line-height: 1.6;
        color: #334155;
        min-height: 120px;
        border-radius: 4px;
        margin-bottom: 20px;
    }
</style>

<div class="incident-box">
    <div class="incident-type">⚠️ NATURE DE L'INCIDENT : {{ strtoupper($incident_type ?? 'TENTATIVE DE FRAUDE') }}</div>
</div>

<table class="info-grid">
    <tr>
        <td class="info-label">Étudiant Concerné</td>
        <td><strong>{{ strtoupper($student_name ?? 'N/A') }}</strong></td>
        <td class="info-label">CNE / CIN</td>
        <td>{{ $cne ?? 'N/A' }} / {{ $cin ?? 'N/A' }}</td>
    </tr>
    <tr>
        <td class="info-label">Filière / Groupe</td>
        <td>{{ $filiere_name ?? 'N/A' }}</td>
        <td class="info-label">N° de Table</td>
        <td><strong>{{ $seat_number ?? '-' }}</strong></td>
    </tr>
    <tr>
        <td class="info-label">Module / Épreuve</td>
        <td>{{ $module_name ?? 'N/A' }}</td>
        <td class="info-label">Salle / Amphi</td>
        <td>{{ $room_name ?? 'N/A' }}</td>
    </tr>
    <tr>
        <td class="info-label">Date & Heure</td>
        <td>{{ $exam_date ?? date('d/m/Y') }} à {{ $exam_time ?? '09:00' }}</td>
        <td class="info-label">Président de Salle</td>
        <td>{{ $professor_name ?? 'Corps Professoral' }}</td>
    </tr>
</table>

<div style="font-weight: bold; font-size: 12px; color: #0f2863; margin-bottom: 8px;">
    DESCRIPTION DÉTAILLÉE DU PROCÈS-VERBAL :
</div>
<div class="statement-box">
    {{ $description ?? 'Aucune observation enregistrée.' }}
</div>

<div style="font-size: 10px; color: #64748b; margin-bottom: 30px;">
    * Ce Procès-Verbal est dressé en séance publique par les membres du corps de surveillance et sera immédiatement transmis au Conseil de Discipline de l'établissement.
</div>

@endsection

@section('signature_left')
    <div style="margin-top: 20px; font-size: 11px;">
        <strong>SIGNATURE DU SURVEILLANT</strong><br/>
        <span style="font-size: 9px; color: #64748b;">(Président de Salle)</span>
    </div>
@endsection

@section('signature_right')
    <div style="margin-top: 20px; font-size: 11px;">
        <strong>VISA DU DOYEN / DIRECTION</strong><br/>
        <span style="font-size: 9px; color: #64748b;">(Cachet Officiel ENCG)</span>
    </div>
@endsection
