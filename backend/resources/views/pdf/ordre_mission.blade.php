@extends('pdf.layouts.pdf_master')

@section('title', 'Ordre de Mission')

@section('meta_info', 'Réf : 2026/ORD-MISS/0002 &nbsp;&nbsp;&nbsp; Émis le : ' . date('d/m/Y'))

@section('document_title', 'ORDRE DE MISSION')

@section('content')
<p style="margin-bottom: 20px;">
    Le Secrétariat Général de l'<strong>École Nationale de Commerce et de Gestion (ENCG) de Fès</strong> ordonne par la présente à l'enseignant(e) désigné(e) ci-dessous de se rendre dans le lieu indiqué aux dates spécifiées, afin d'accomplir la mission académique ou administrative décrite :
</p>

<table class="info-table">
    <tr>
        <th>NOM COMPLET</th>
        <td>{{ isset($professor) ? strtoupper(($professor->last_name ?? '') . ' ' . ($professor->first_name ?? '')) : 'Non spécifié' }}</td>
    </tr>
    <tr>
        <th>DÉPARTEMENT</th>
        <td>{{ (isset($professor) && isset($professor->department)) ? $professor->department->name : 'Non spécifié' }}</td>
    </tr>
    <tr>
        <th>ÉTABLISSEMENT</th>
        <td>École Nationale de Commerce et de Gestion (ENCG)</td>
    </tr>
    <tr>
        <th>DESTINATION</th>
        <td style="color: #0f2863;">{{ $mission['destination'] ?? 'Non spécifiée' }}</td>
    </tr>
    <tr>
        <th>PÉRIODE DE MISSION</th>
        <td>Du <strong>{{ $mission['start_date'] ?? '--/--/----' }}</strong> au <strong>{{ $mission['end_date'] ?? '--/--/----' }}</strong></td>
    </tr>
    <tr>
        <th>OBJET / MOTIF</th>
        <td>{{ $mission['motif'] ?? 'Non spécifié' }}</td>
    </tr>
</table>

<p style="font-style: italic; color: #64748b; font-size: 10px; border-left: 3px solid #cbd5e1; padding-left: 15px; margin-top: 30px;">
    Les autorités locales de la destination et tous représentants des services publics et de la force publique sont priés de faciliter l'accomplissement de la mission de l'intéressé(e) et de lui prêter assistance en cas de besoin.
</p>
@endsection

@section('signature_left')
    SIGNATURE DE L'INTÉRESSÉ(E)
    <div class="signature-name">{{ isset($professor) ? strtoupper(($professor->last_name ?? '') . ' ' . ($professor->first_name ?? '')) : '' }}</div>
@endsection

@section('signature_right')
    FAIT À FÈS, LE {{ date('d/m/Y') }}
    <div class="signature-name" style="color: #1e293b;">LE SECRÉTAIRE GÉNÉRAL</div>
@endsection
