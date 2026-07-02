@extends('pdf.layout')

@section('title', 'PV d\'Examen')

@section('document_title', 'PROCÈS-VERBAL D\'EXAMEN')
@section('title_color', 'blue')

@section('meta_info', 'Examen N° : ' . $exam_id . ' &nbsp;&nbsp;&nbsp; Date : ' . date('d/m/Y'))

@section('content')
<table class="info-table" style="margin-top: 10px;">
    <thead>
        <tr>
            <th>CNE</th>
            <th>NOM & PRÉNOM</th>
            <th style="width: 15%; text-align: center;">NOTE</th>
            <th style="width: 25%; text-align: center;">SIGNATURE</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td colspan="4" style="text-align: center; color: #64748b; padding: 20px;">
                <em>Données des étudiants à insérer dynamiquement ici...</em>
            </td>
        </tr>
    </tbody>
</table>
@endsection

@section('signature_left')
    <div style="margin-top: 20px;">SIGNATURE DU SURVEILLANT</div>
@endsection

@section('signature_right')
    <div style="margin-top: 20px;">SIGNATURE DU RESPONSABLE</div>
@endsection
