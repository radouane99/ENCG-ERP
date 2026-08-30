@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Réussite — ENCG Fès')

@section('encg_compact', '1')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 4mm 7mm 22mm 7mm;
    }

    .doc-title-container {
        text-align: center;
        margin: 0 0 10px 0;
    }
    .doc-title {
        font-size: 13pt;
        font-weight: 900;
        color: #002e5b;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        border-bottom: 1.5px solid #002e5b;
        display: inline-block;
        padding-bottom: 3px;
    }
    .doc-subtitle {
        font-size: 7pt;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        margin-top: 3px;
    }

    .attestation-body {
        font-size: 9pt;
        line-height: 1.55;
        text-align: justify;
        color: #1e293b;
    }
    .attestation-body p { margin: 0 0 8px 0; }

    .info-table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0 10px 0;
        border: 0.5px solid #002e5b;
        table-layout: fixed;
    }
    .info-table td {
        border: 0.5px solid #94a3b8;
        padding: 4px 6px;
        vertical-align: middle;
    }
    .info-table .label {
        width: 32%;
        background: #f1f5f9;
        color: #64748b;
        font-weight: 700;
        font-size: 6.8pt;
        text-transform: uppercase;
    }
    .info-table .val {
        color: #0f172a;
        font-weight: 800;
        font-size: 8pt;
    }
    .info-table .val-name {
        font-size: 9pt;
        color: #002e5b;
        text-transform: uppercase;
        font-weight: 900;
    }
    .info-table .val-mono {
        font-family: DejaVu Sans Mono, monospace;
        font-weight: 800;
        color: #002e5b;
    }
    .result-banner {
        width: 100%;
        background: #002e5b;
        color: #ffffff;
        padding: 6px 10px;
        margin: 8px 0;
        text-align: center;
        box-sizing: border-box;
    }
    .result-banner .main {
        font-size: 8pt;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    .result-banner .sub {
        font-size: 7.2pt;
        font-weight: 700;
        margin-top: 3px;
        color: #fef08a;
    }
</style>
@endsection

@section('content')
<div class="doc-title-container">
    <div class="doc-title">ATTESTATION DE RÉUSSITE</div>
    <div class="doc-subtitle">ANNÉE UNIVERSITAIRE {{ $year ?? '2026-2027' }}</div>
</div>

<div class="attestation-body">
    <p>
        Le Directeur de l'École Nationale de Commerce et de Gestion de Fès
        (Université Sidi Mohamed Ben Abdellah) atteste que l'étudiant(e) :
    </p>

    <table class="info-table" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td class="label">Nom et Prénom</td>
            <td class="val val-name">
                {{ strtoupper($student->last_name ?? '') }} {{ ucfirst($student->first_name ?? '') }}
            </td>
        </tr>
        <tr>
            <td class="label">N° Apogée</td>
            <td class="val val-mono">{{ $student->student_number ?? '—' }}</td>
        </tr>
        <tr>
            <td class="label">CNE / Massar</td>
            <td class="val val-mono">{{ $student->cne ?? '—' }}</td>
        </tr>
        <tr>
            <td class="label">CIN / CNIE</td>
            <td class="val val-mono">{{ $student->cin ?? '—' }}</td>
        </tr>
        <tr>
            <td class="label">Filière</td>
            <td class="val" style="color: #002e5b;">
                {{ $student->latestPathway?->filiere?->name ?? '—' }}
            </td>
        </tr>
    </table>

    <div class="result-banner">
        <div class="main">Déclaré(e) définitivement admis(e) aux épreuves du diplôme ENCG</div>
        <div class="sub">
            Année {{ $year ?? '2026-2027' }}
            @if(!empty($mention))
                · Mention : {{ strtoupper($mention) }}
            @endif
        </div>
    </div>

    <p>
        La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit,
        en attendant l'établissement du diplôme définitif.
    </p>
</div>
@endsection
