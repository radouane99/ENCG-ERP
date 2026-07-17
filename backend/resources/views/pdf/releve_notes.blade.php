@extends('pdf.layouts.pdf_master')

@section('title', 'Relevé de Notes')

@section('styles')
<style>
    .doc-title {
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        color: #0f2863;
        letter-spacing: 1px;
        margin: 15px 0 25px 0;
    }

    .student-info {
        width: 100%;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 15px;
        background-color: #f8fafc;
        margin-bottom: 25px;
        font-size: 10px;
    }
    .student-info table { width: 100%; border-collapse: collapse; }
    .student-info td { padding: 4px; }
    .student-info .label { color: #64748b; font-weight: bold; width: 20%; }
    .student-info .val { font-weight: bold; color: #1e293b; }

    .grades-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        font-size: 10px;
        border: 1px solid #0f2863;
    }
    .grades-header {
        background-color: #0f2863;
        color: white;
    }
    .grades-header th {
        padding: 8px 10px;
        text-align: left;
        font-size: 11px;
    }
    .grades-sub-header th {
        padding: 8px 10px;
        background-color: #f1f5f9;
        color: #64748b;
        font-weight: bold;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }
    .grades-table td {
        padding: 8px 10px;
        border-bottom: 1px solid #e2e8f0;
    }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-green { color: #059669; font-weight: bold; }
    .text-red { color: #dc2626; font-weight: bold; }

    .result-box {
        border: 2px solid #0f2863;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        margin-bottom: 30px;
        background-color: #fff;
    }
    .result-main {
        font-size: 12px;
        font-weight: bold;
        color: #0f2863;
        margin-bottom: 5px;
    }
    .result-main span { color: #059669; }
    .result-sub {
        font-size: 10px;
        color: #64748b;
    }
    .result-sub span { color: #059669; font-weight: bold; }
</style>
@endsection

@section('content')
<div class="doc-title">
    RELEVÉ DE NOTES - {{ $semesterName ?? 'SEMESTRE S1' }}
</div>

<div class="student-info">
    <table>
        <tr>
            <td class="label">Nom & Prénom :</td>
            <td class="val">{{ strtoupper($student->last_name) }} {{ $student->first_name }}</td>
            <td class="label">N° Étudiant :</td>
            <td class="val">{{ $student->student_number ?? 'N/A' }} (CNE: {{ $student->cne ?? 'N/A' }})</td>
        </tr>
        <tr>
            <td class="label">Filière :</td>
            <td class="val">{{ $student->latestPathway ? $student->latestPathway->filiere->name : 'Non affecté' }}</td>
            <td class="label">Session :</td>
            <td class="val">Principale</td>
        </tr>
        <tr>
            <td class="label">Année Académique :</td>
            <td class="val" colspan="3">{{ $year }}</td>
        </tr>
    </table>
</div>

<table class="grades-table">
    <tr class="grades-header">
        <th colspan="2">📝 Résultats</th>
        <th colspan="2" class="text-right">Moyenne: {{ number_format($avgGrade, 2) }} / 20</th>
    </tr>
    <tr class="grades-sub-header">
        <th>CODE MODULE</th>
        <th>INTITULÉ DU MODULE</th>
        <th class="text-center">NOTE / 20</th>
        <th class="text-center">RÉSULTAT</th>
    </tr>
    @forelse($modules as $module)
    <tr>
        <td>{{ $module['code'] }}</td>
        <td>{{ $module['name'] }}</td>
        <td class="text-center {{ $module['is_validated'] ? 'text-green' : 'text-red' }}">{{ number_format($module['score'], 2) }}</td>
        <td class="text-center {{ $module['is_validated'] ? 'text-green' : 'text-red' }}">{{ $module['is_validated'] ? 'Validé' : 'Rattrapage' }}</td>
    </tr>
    @empty
    <tr>
        <td colspan="4" class="text-center">Aucune note enregistrée pour ce semestre.</td>
    </tr>
    @endforelse
</table>

<div class="result-box">
    <div class="result-main">RÉSULTAT DU SEMESTRE : <span>MOYENNE GÉNÉRALE = {{ number_format($avgGrade, 2) }} / 20</span></div>
    <div class="result-sub">Décision du Jury : <span>{{ $avgGrade >= 10 ? 'ADMIS(E) AU NIVEAU SUPÉRIEUR' : 'NON ADMIS(E) / RATTRAPAGE' }}</span></div>
</div>
@endsection
