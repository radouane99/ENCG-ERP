@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Travail')

@section('meta_info', 'Réf : 2026/ATT-TRAV/0007 &nbsp;&nbsp;&nbsp; Émis le : ' . date('d/m/Y'))

@section('document_title', 'ATTESTATION DE TRAVAIL')
@section('title_color', 'blue')

@section('styles')
<style>
    .document-title { color: #0f2863 !important; }
    .document-subtitle { color: #c01844; }
</style>
@endsection

@section('content')
<p style="margin-bottom: 20px; text-align: justify; line-height: 1.8;">
    Le Secrétariat Général de l'<strong>École Nationale de Commerce et de Gestion (ENCG) de Fès</strong> certifie par la présente que la personne dont l'identité est précisée ci-dessous est bien employée en qualité de <strong>membre du corps enseignant</strong> au sein de notre établissement.
</p>

<table class="info-table" style="margin-top: 30px;">
    <tr>
        <th>NOM COMPLET</th>
        <td>Prof. Radouane el asri</td>
    </tr>
    <tr>
        <th>DÉPARTEMENT</th>
        <td>Génie Informatique</td>
    </tr>
    <tr>
        <th>STATUT</th>
        <td>Enseignant(e)-Chercheur(se) — Temps plein</td>
    </tr>
    <tr>
        <th>ÉTABLISSEMENT</th>
        <td>École Nationale de Commerce et de Gestion (ENCG)</td>
    </tr>
    <tr>
        <th>ANNÉE UNIVERSITAIRE</th>
        <td>2025-2026</td>
    </tr>
</table>

<p style="margin-top: 30px; text-align: justify; line-height: 1.8;">
    Cette attestation est délivrée à l'intéressé(e) sur sa demande, pour servir et valoir ce que de droit, et ce sans aucune autre obligation de la part de notre institution.
</p>
@endsection

@section('signature_left')
    SIGNATURE DE L'INTÉRESSÉ(E)
    <div class="signature-name">Prof. Radouane el asri</div>
@endsection

@section('signature_right')
    FAIT À FÈS, LE {{ date('d/m/Y') }}
    <div class="signature-name" style="color: #1e293b;">LE DIRECTEUR DES RH</div>
@endsection
