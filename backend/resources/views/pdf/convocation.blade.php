@extends('pdf.layout')

@section('title', 'Convocation aux Examens')

@section('document_title', 'CONVOCATION AUX EXAMENS')
@section('title_color', 'blue')

@section('meta_info', 'Réf : 2026/CONV/' . ($student->student_number ?? '0000') . ' &nbsp;&nbsp;&nbsp; Date : ' . date('d/m/Y'))

@section('content')
<div style="margin-bottom: 20px; padding: 15px; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 8px;">
    <h3 style="color: #0f2863; margin-top: 0;">Informations de l'étudiant</h3>
    <table style="width: 100%; font-size: 11px;">
        <tr>
            <td style="width: 30%; color: #64748b;"><strong>Nom et Prénom :</strong></td>
            <td style="font-weight: bold; color: #1e293b;">{{ $student->first_name ?? 'Étudiant' }} {{ $student->last_name ?? '' }}</td>
        </tr>
        <tr>
            <td style="color: #64748b;"><strong>Code Apogée :</strong></td>
            <td style="font-weight: bold; color: #1e293b;">{{ $student->apogee_code ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td style="color: #64748b;"><strong>Filière :</strong></td>
            <td style="font-weight: bold; color: #1e293b;">{{ $student->filiere->name ?? 'N/A' }}</td>
        </tr>
    </table>
</div>

<h3 style="color: #c01844; margin-top: 30px; font-size: 14px; text-transform: uppercase;">Détails de la session</h3>
<table class="info-table" style="margin-top: 10px;">
    <thead>
        <tr>
            <th>DATE</th>
            <th>HEURE</th>
            <th>MODULE</th>
            <th>SALLE (N° DE PLACE)</th>
        </tr>
    </thead>
    <tbody>
        @if(isset($session) && isset($session->date))
            <tr>
                <td>{{ \Carbon\Carbon::parse($session->date)->format('d/m/Y') }}</td>
                <td>{{ \Carbon\Carbon::parse($session->start_time)->format('H:i') }} - {{ \Carbon\Carbon::parse($session->end_time)->format('H:i') }}</td>
                <td>{{ $session->exam->module->name ?? 'Module N/A' }}</td>
                <td>Salle N/A (Place N/A)</td>
            </tr>
        @else
            <tr>
                <td colspan="4" style="text-align: center; color: #64748b; padding: 20px;">
                    <em>Les détails de la session apparaîtront ici.</em>
                </td>
            </tr>
        @endif
    </tbody>
</table>

<div style="margin-top: 40px; padding: 15px; border-left: 4px solid #c01844; background-color: #fff1f2; font-size: 10px;">
    <p style="color: #9f1239; font-weight: bold; margin-top: 0;">Important :</p>
    <ul style="color: #4c0519; margin-bottom: 0; padding-left: 20px;">
        <li>La présentation de la carte d'étudiant est obligatoire.</li>
        <li>Aucun retard ne sera toléré après la distribution des sujets.</li>
        <li>Les téléphones portables et montres connectées sont strictement interdits dans les salles d'examen.</li>
    </ul>
</div>
@endsection

@section('signature_right')
    <div style="margin-top: 20px;">DIRECTION DES EXAMENS</div>
@endsection
