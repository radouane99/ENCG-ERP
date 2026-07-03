@extends('pdf.layouts.pdf_master')

@section('title', 'Emploi du temps')

@section('document_title', 'EMPLOI DU TEMPS')
@section('title_color', 'blue')

@section('meta_info', 'Généré le : ' . date('d/m/Y H:i'))

@section('content')
<table class="info-table" style="margin-top: 10px;">
    <thead>
        <tr>
            <th>JOUR</th>
            <th>HEURE</th>
            <th>MODULE</th>
            <th>PROFESSEUR</th>
            <th>SALLE</th>
        </tr>
    </thead>
    <tbody>
        @forelse($schedules ?? [] as $session)
            <tr>
                <td>Jour {{ $session->day_of_week }}</td>
                <td>{{ $session->start_time }} - {{ $session->end_time }}</td>
                <td>{{ $session->module_name }}</td>
                <td>{{ $session->prof_name }}</td>
                <td>{{ $session->room_name }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">
                    <em>Aucun emploi du temps disponible pour cette sélection.</em>
                </td>
            </tr>
        @endforelse
    </tbody>
</table>
@endsection

@section('signature_right')
    <div style="margin-top: 20px;">DIRECTION ACADÉMIQUE</div>
@endsection
