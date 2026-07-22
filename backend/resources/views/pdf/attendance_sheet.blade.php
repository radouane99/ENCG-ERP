@extends('pdf.layouts.pdf_master')

@section('title', 'Fiche d\'émargement')

@section('styles')
<style>
    .info-table { width: 100%; font-size: 11px; margin-bottom: 20px; border-collapse: collapse; }
    .info-table td { padding: 4px 0; }
    .info-label { font-weight: bold; color: #0f2863; width: 120px; display: inline-block; }
    .students-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .students-table th, .students-table td { border: 1px solid #cbd5e1; padding: 6px; text-align: center; }
    .students-table th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
    .text-left { text-align: left !important; }
    .uppercase { text-transform: uppercase; }
</style>
@endsection

@section('content')
    <h2 style="text-align: right; color: #0f2863; text-transform: uppercase; margin-bottom: 20px; font-size: 18px;">
        Fiche D'Émargement
    </h2>

    <table class="info-table">
        <tr>
            <td style="width: 50%;">
                <span class="info-label">Module:</span> {{ $exam->module->name ?? 'N/A' }}
            </td>
            <td style="width: 50%;">
                <span class="info-label">Heure:</span> {{ substr($exam->start_time, 0, 5) }} ({{ $exam->duration_minutes }} min)
            </td>
        </tr>
        <tr>
            <td>
                <span class="info-label">Filière & Groupe:</span> {{ $exam->module->filiere->name ?? 'N/A' }} {{ $exam->group ? ' - ' . $exam->group->name : '' }}
            </td>
            <td>
                <span class="info-label">Salle:</span> {{ $exam->room->name ?? 'N/A' }}
            </td>
        </tr>
        <tr>
            <td>
                <span class="info-label">Date:</span> {{ $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->format('d/m/Y') : 'N/A' }}
            </td>
            <td>
                <span class="info-label">Effectif Attendu:</span> {{ count($students) }} étudiants
            </td>
        </tr>
    </table>

    <table class="students-table">
        <thead>
            <tr>
                <th style="width: 40px;">N°</th>
                <th class="text-left" style="width: 140px;">CNE &amp; CIN</th>
                <th class="text-left">NOM ET PRÉNOM</th>
                <th style="width: 65px;">N° TABLE</th>
                <th style="width: 140px;">SIGNATURE ÉTUDIANT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($students as $index => $seating)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td class="text-left">
                    <div style="font-weight: bold; color: #0f2863;">{{ $seating->student->cne ?? $seating->student->user->cne ?? 'N/A' }}</div>
                    @if(!empty($seating->student->user->cin ?? $seating->student->cin))
                        <div style="font-size: 8px; color: #475569;">CIN: {{ $seating->student->user->cin ?? $seating->student->cin }}</div>
                    @endif
                </td>
                <td class="text-left uppercase">{{ $seating->student->user->name ?? $seating->student->user->first_name . ' ' . $seating->student->user->last_name }}</td>
                <td><strong style="color: #0f2863;">{{ $seating->seat_number }}</strong></td>
                <td></td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection

@section('signature_right')
    <div style="margin-top: 30px; font-weight: bold; font-size: 12px;">
        Signatures des Surveillants
    </div>
@endsection
