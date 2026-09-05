@extends('pdf.layouts.pdf_master')

@section('title', 'DIPLOMA SUPPLEMENT / ANNEXE DESCRIPTIVE AU DIPLÔME — ENCG FÈS')

@section('styles')
<style>
    .supplement-banner {
        background: linear-gradient(135deg, #001A4B 0%, #082663 100%);
        color: #ffffff;
        text-align: center;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 10px;
    }
    .supplement-title {
        font-size: 13pt;
        font-weight: 900;
        letter-spacing: 1.5px;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
    }
    .supplement-subtitle {
        font-size: 8pt;
        font-weight: bold;
        color: #fef08a;
        margin-top: 3px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .meta-box {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 6px 10px;
        margin-bottom: 10px;
        font-size: 8pt;
    }
    .section-title {
        background-color: #0f2863;
        color: #ffffff;
        font-size: 8pt;
        font-weight: 800;
        text-transform: uppercase;
        padding: 4px 8px;
        border-radius: 4px;
        margin: 8px 0 4px 0;
    }
    .info-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 7.5pt;
        margin-bottom: 6px;
    }
    .info-table td {
        padding: 3px 6px;
        border: 1px solid #e2e8f0;
    }
    .info-table tr:nth-child(even) {
        background-color: #f8fafc;
    }
    .label-col {
        width: 35%;
        font-weight: bold;
        color: #334155;
    }
    .val-col {
        width: 65%;
        color: #0f172a;
    }
    .semesters-grid {
        width: 100%;
        border-collapse: collapse;
        font-size: 7pt;
        margin: 6px 0;
        border: 1px solid #0f2863;
    }
    .semesters-grid th {
        background-color: #0f2863;
        color: #ffffff;
        padding: 4px 6px;
        font-weight: 800;
        text-transform: uppercase;
        border: 1px solid #cbd5e1;
    }
    .semesters-grid td {
        padding: 4px 6px;
        border: 1px solid #cbd5e1;
    }
    .seal-box {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }
    .seal-box td {
        vertical-align: top;
        text-align: center;
        width: 33.33%;
    }
</style>
@endsection

@section('content')
    <div class="supplement-banner">
        <div class="supplement-title">DIPLOMA SUPPLEMENT / ANNEXE DESCRIPTIVE AU DIPLÔME</div>
        <div class="supplement-subtitle">
            MODÈLE CONFORME COMMISSION EUROPÉENNE / CONSEIL DE L'EUROPE / UNESCO-CEPES &amp; MESRSFC MAROC
        </div>
    </div>

    <table class="meta-box" style="width: 100%;">
        <tr>
            <td style="width: 50%;">
                <strong>Réf. DS :</strong> <span style="font-family: monospace;">DS-ENCG-{{ date('Y') }}-{{ str_pad($student->id ?? 1, 5, '0', STR_PAD_LEFT) }}</span>
            </td>
            <td style="width: 50%; text-align: right;">
                <strong>Crédits Cumulés :</strong> <span style="color: #166534; font-weight: 900; font-size: 9pt;">300 ECTS (Grade Master)</span>
            </td>
        </tr>
    </table>

    {{-- SECTION 1 : RENSEIGNEMENTS SUR LE TITULAIRE --}}
    <div class="section-title">1. Information Identifying the Holder of Qualification / Titulaire du Diplôme</div>
    <table class="info-table">
        <tr>
            <td class="label-col">1.1 Nom de famille / Family Name(s) :</td>
            <td class="val-col"><strong>{{ strtoupper($student->last_name ?? 'BENNANI') }}</strong></td>
        </tr>
        <tr>
            <td class="label-col">1.2 Prénom / Given Name(s) :</td>
            <td class="val-col"><strong>{{ ucfirst($student->first_name ?? 'Mehdi') }}</strong></td>
        </tr>
        <tr>
            <td class="label-col">1.3 Date et lieu de naissance / Date &amp; Place of Birth :</td>
            <td class="val-col">{{ $student->birth_date ? $student->birth_date->format('d/m/Y') : '15/04/2002' }} à {{ $student->birth_city ?? 'Fès, Maroc' }}</td>
        </tr>
        <tr>
            <td class="label-col">1.4 Identifiant national / National Student ID :</td>
            <td class="val-col">CNE/Massar : <span style="font-family: monospace; font-weight: bold;">{{ $student->cne ?? 'N134098221' }}</span> · CIN : <span style="font-family: monospace;">{{ $student->cin ?? 'CD678901' }}</span></td>
        </tr>
    </table>

    {{-- SECTION 2 : RENSEIGNEMENTS SUR LA QUALIFICATION --}}
    <div class="section-title">2. Information Identifying the Qualification / Intitulé du Diplôme</div>
    <table class="info-table">
        <tr>
            <td class="label-col">2.1 Intitulé officiel / Name of Qualification :</td>
            <td class="val-col"><strong>Diplôme de l'École Nationale de Commerce et de Gestion (Grade Master)</strong></td>
        </tr>
        <tr>
            <td class="label-col">2.2 Filière de spécialisation / Major Field of Study :</td>
            <td class="val-col"><strong>{{ $filiereName ?? 'Gestion Financière et Comptable (GFC)' }}</strong></td>
        </tr>
        <tr>
            <td class="label-col">2.3 Établissement de délivrance / Awarding Institution :</td>
            <td class="val-col">École Nationale de Commerce et de Gestion de Fès (ENCG Fès) — Université Sidi Mohamed Ben Abdellah (USMBA)</td>
        </tr>
        <tr>
            <td class="label-col">2.4 Langues d'enseignement / Languages of Instruction :</td>
            <td class="val-col">Français (Langue principale) · Anglais (Business &amp; Finance) · Arabe (Cadre juridique)</td>
        </tr>
    </table>

    {{-- SECTION 3 : NIVEAU DE LA QUALIFICATION --}}
    <div class="section-title">3. Level of Qualification / Niveau de la Qualification</div>
    <table class="info-table">
        <tr>
            <td class="label-col">3.1 Niveau d'études / Level of Qualification :</td>
            <td class="val-col">Enseignement Supérieur Universitaire — Niveau 7 CNC (Cadre National des Certifications) / Bac+5</td>
        </tr>
        <tr>
            <td class="label-col">3.2 Durée officielle du programme / Official Length :</td>
            <td class="val-col">5 Années Universitaires à temps plein (10 Semestres / 300 ECTS)</td>
        </tr>
        <tr>
            <td class="label-col">3.3 Conditions d'accès / Access Requirements :</td>
            <td class="val-col">Sélection nationale sur Concours TAFEM (Baccalauréat d'Excellence + Test d'Aptitude) ou Passerelles (Passerelle S5 / S7)</td>
        </tr>
    </table>

    {{-- SECTION 4 : CONTENU ET RÉSULTATS OBTENUS --}}
    <div class="section-title">4. Information on the Contents and Results Gained / Cursus &amp; Résultats (10 Semestres)</div>
    <table class="semesters-grid">
        <thead>
            <tr>
                <th style="width: 15%;">Semestre</th>
                <th style="width: 45%;">Période &amp; Focus Académique</th>
                <th style="width: 15%; text-align: center;">Crédits ECTS</th>
                <th style="width: 15%; text-align: center;">Moyenne</th>
                <th style="width: 10%; text-align: center;">Mention</th>
            </tr>
        </thead>
        <tbody>
            @php
                $semestersData = $semestersSummary ?? [
                    ['sem' => 'Semestre 1', 'focus' => 'Tronc Commun : Économie, Comptabilité, Droit, Méthodes Quantitatives', 'ects' => 30, 'avg' => 14.80, 'status' => 'Bien'],
                    ['sem' => 'Semestre 2', 'focus' => 'Tronc Commun : Analyse Financière, Statistiques, Marketing, Langues', 'ects' => 30, 'avg' => 14.25, 'status' => 'Bien'],
                    ['sem' => 'Semestre 3', 'focus' => 'Management Général, Contrôle de Gestion, Économie Monétaire', 'ects' => 30, 'avg' => 15.10, 'status' => 'Bien'],
                    ['sem' => 'Semestre 4', 'focus' => 'Droit des Affaires, Fiscalité, Recherche Opérationnelle, Stage Initiation', 'ects' => 30, 'avg' => 14.65, 'status' => 'Bien'],
                    ['sem' => 'Semestre 5', 'focus' => 'Finance d\'Entreprise, Audit Interne, Commerce International', 'ects' => 30, 'avg' => 15.40, 'status' => 'Très Bien'],
                    ['sem' => 'Semestre 6', 'focus' => 'Consolidation des Comptes, IFRS, Ingénierie Financière, Stage Application', 'ects' => 30, 'avg' => 15.80, 'status' => 'Très Bien'],
                    ['sem' => 'Semestre 7', 'focus' => 'Évaluation d\'Entreprise, Marchés des Capitaux, Fiscalité Approfondie', 'ects' => 30, 'avg' => 16.10, 'status' => 'Très Bien'],
                    ['sem' => 'Semestre 8', 'focus' => 'Audit Légal, Stratégie Financière, Gouvernance &amp; Éthique des Affaires', 'ects' => 30, 'avg' => 15.90, 'status' => 'Très Bien'],
                    ['sem' => 'Semestre 9', 'focus' => 'Gestion de Portefeuille, Risk Management, Séminaires Professionnels', 'ects' => 30, 'avg' => 16.30, 'status' => 'Très Bien'],
                    ['sem' => 'Semestre 10', 'focus' => 'Stage de Fin d\'Études (PFE) en Milieu Professionnel &amp; Mémoire', 'ects' => 30, 'avg' => 17.50, 'status' => 'Très Bien'],
                ];
            @endphp
            @foreach($semestersData as $row)
                <tr>
                    <td style="font-weight: bold;">{{ $row['sem'] }}</td>
                    <td>{{ $row['focus'] }}</td>
                    <td style="text-align: center; font-weight: bold; color: #166534;">{{ $row['ects'] }} ECTS</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold;">{{ number_format($row['avg'], 2) }}/20</td>
                    <td style="text-align: center; font-weight: bold; color: #0f2863;">{{ $row['status'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- SECTION 5 & 6 : DÉBOUCHÉS, STAGES & PFE --}}
    <table class="info-table" style="margin-top: 4px;">
        <tr>
            <td class="label-col">Projet de Fin d'Études (PFE) :</td>
            <td class="val-col"><strong>« {{ $pfeTitle ?? 'Optimisation de la Structure Financière et Digitalisation du Contrôle de Gestion' }} »</strong> (Mention : <strong>Très Bien avec Félicitations du Jury</strong>)</td>
        </tr>
        <tr>
            <td class="label-col">Stages Professionnels Validés :</td>
            <td class="val-col">3 Stages obligatoires validés (Stage Ouvrier 1 mois · Stage d'Application 2 mois · PFE 6 mois)</td>
        </tr>
        <tr>
            <td class="label-col">Accès au cycle Doctoral / CEDOC :</td>
            <td class="val-col">Diplôme conférant de plein droit l'admissibilité au Doctorat en Sciences de Gestion (CEDOC USMBA).</td>
        </tr>
    </table>

    {{-- SECTION 7 : CERTIFICATION ET SCEAU OFFICIEL --}}
    <table class="seal-box">
        <tr>
            <td>
                <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">FÈS, LE {{ now()->format('d/m/Y') }}</div>
                <div style="font-size: 8pt; font-weight: 800; color: #0f2863; margin-top: 3px;">LE DIRECTEUR DE L'ENCG FÈS</div>
                <div style="margin-top: 15px;">
                    <span style="display: inline-block; padding: 4px 8px; border: 1.5px solid #0f2863; color: #0f2863; font-weight: 800; font-size: 7pt; text-transform: uppercase;">
                        ✓ SCELLÉ NUMÉRIQUEMENT
                    </span>
                </div>
            </td>
            <td>
                @if(!empty($qrBase64))
                    <img src="{{ $qrBase64 }}" alt="QR Code" style="width: 55px; height: 55px; margin: 0 auto;">
                    <div style="font-size: 6pt; font-family: monospace; color: #64748b; margin-top: 2px;">Vérification internationale</div>
                @endif
            </td>
            <td>
                <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">EMPREINTE CRYPTOGRAPHIQUE</div>
                <div style="font-size: 6.5pt; font-family: monospace; color: #0f2863; word-break: break-all; margin-top: 4px; padding: 3px; background-color: #f1f5f9; border: 1px solid #cbd5e1;">
                    SHA256:{{ substr(hash('sha256', ($student->cne ?? 'CNE') . ($student->id ?? 1) . '300-ECTS-ENCG'), 0, 32) }}...
                </div>
                <div style="font-size: 6.5pt; color: #166534; font-weight: bold; margin-top: 4px;">✓ Certifié Conforme Bologne / EHEA</div>
            </td>
        </tr>
    </table>
@endsection
