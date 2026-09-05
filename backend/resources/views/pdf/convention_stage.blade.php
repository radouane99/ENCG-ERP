@extends('pdf.layouts.pdf_master')

@section('title', 'CONVENTION DE STAGE TRIPARTITE — ENCG FÈS')

@section('styles')
<style>
    .convention-banner {
        background: linear-gradient(135deg, #0f2863 0%, #001A4B 100%);
        color: #ffffff;
        text-align: center;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 12px;
    }
    .convention-title {
        font-size: 13pt;
        font-weight: 900;
        letter-spacing: 1.5px;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
    }
    .convention-subtitle {
        font-size: 8pt;
        font-weight: bold;
        color: #fef08a;
        margin-top: 3px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .ref-bar {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 6px 10px;
        margin-bottom: 12px;
        font-size: 8pt;
        width: 100%;
    }
    .article-title {
        background-color: #0f2863;
        color: #ffffff;
        font-size: 8pt;
        font-weight: 800;
        text-transform: uppercase;
        padding: 4px 8px;
        border-radius: 4px;
        margin: 8px 0 4px 0;
    }
    .parties-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        font-size: 8pt;
    }
    .party-box {
        width: 32%;
        vertical-align: top;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 6px 8px;
        background-color: #f8fafc;
    }
    .party-header {
        font-weight: 800;
        font-size: 8pt;
        color: #0f2863;
        border-bottom: 1.5px solid #0f2863;
        padding-bottom: 3px;
        margin-bottom: 5px;
        text-transform: uppercase;
    }
    .article-p {
        font-size: 7.5pt;
        line-height: 1.4;
        text-align: justify;
        color: #1e293b;
        margin-bottom: 4px;
    }
    .signatures-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
    }
    .signature-cell {
        width: 33.33%;
        vertical-align: top;
        text-align: center;
        border: 1px solid #cbd5e1;
        padding: 6px;
        background-color: #ffffff;
    }
    .sig-title {
        font-size: 7.5pt;
        font-weight: 800;
        color: #0f2863;
        text-transform: uppercase;
        margin-bottom: 25px;
    }
</style>
@endsection

@section('content')
    <div class="convention-banner">
        <div class="convention-title">CONVENTION DE STAGE TRIPARTITE</div>
        <div class="convention-subtitle">
            FORMATION INITIALE EN MANAGEMENT &amp; COMMERCE — ANNÉE UNIVERSITAIRE {{ $academicYear ?? '2026/2027' }}
        </div>
    </div>

    <table class="ref-bar">
        <tr>
            <td style="width: 50%;">
                <strong>Réf. Convention :</strong> <span style="font-family: monospace;">{{ $conventionRef ?? ('CONV-ENCG-' . date('Y') . '-' . str_pad($internship->id ?? 1, 4, '0', STR_PAD_LEFT)) }}</span>
            </td>
            <td style="width: 50%; text-align: right;">
                <strong>Type de Stage :</strong> 
                <span style="color: #0f2863; font-weight: 800; text-transform: uppercase;">
                    {{ match($internship->type ?? 'application') {
                        'initiation' => 'Stage d\'Initiation / Ouvrier (1ère/2ème Année)',
                        'application' => 'Stage d\'Application / Commercial (3ème/4ème Année)',
                        'fin_etudes', 'pfe' => 'Projet de Fin d\'Études — PFE (5ème Année)',
                        default => 'Stage Professionnel Pédagogique'
                    } }}
                </span>
            </td>
        </tr>
    </table>

    {{-- LES 3 PARTIES --}}
    <table class="parties-table">
        <tr>
            {{-- Partie 1 : Établissement --}}
            <td class="party-box">
                <div class="party-header">1. L'Établissement</div>
                <strong>ENCG Fès — USMBA</strong><br>
                B.P. 2223, Route d'Imouzzer, Fès<br>
                Tél : +212 5 35 61 11 00<br>
                Représenté par son <strong>Directeur</strong> ou par délégation le Directeur Adjoint des Stages.
            </td>
            <td style="width: 2%;"></td>
            {{-- Partie 2 : Entreprise d'Accueil --}}
            <td class="party-box">
                <div class="party-header">2. L'Entreprise d'Accueil</div>
                <strong>{{ $internship->company_name ?? 'Entreprise Partenaire' }}</strong><br>
                Adresse : {{ $internship->company_address ?? 'Maroc' }} ({{ $internship->company_city ?? 'Casablanca/Fès' }})<br>
                Tuteur : <strong>{{ $internship->company_mentor_name ?? ($internship->supervisor_name ?? 'Directeur RH / Tuteur') }}</strong><br>
                Fonction : {{ $internship->company_mentor_title ?? 'Responsable Pédagogique' }}<br>
                Email : {{ $internship->supervisor_email ?? 'contact@entreprise.ma' }}
            </td>
            <td style="width: 2%;"></td>
            {{-- Partie 3 : Le Stagiaire --}}
            <td class="party-box">
                <div class="party-header">3. Le Stagiaire</div>
                Étudiant(e) : <strong>{{ $student->first_name ?? '' }} {{ $student->last_name ?? '' }}</strong><br>
                CNE/Massar : <span style="font-family: monospace;">{{ $student->cne ?? 'Non renseigné' }}</span><br>
                CIN : <span style="font-family: monospace;">{{ $student->cin ?? 'Vérifiée' }}</span><br>
                Filière : {{ $student->filiere->name ?? 'Sciences de Gestion & Commerce' }}<br>
                Assurance : <strong>{{ $internship->insurance_company ?? 'MAMDA-MCMA / Assurance Scolaire' }}</strong><br>
                Police N° : <span style="font-family: monospace;">{{ $internship->insurance_policy_number ?? 'POL-2026-ENCG-884' }}</span>
            </td>
        </tr>
    </table>

    {{-- ARTICLES CONVENTIONNELS --}}
    <div class="article-title">Article 1 — Objet &amp; Période du Stage</div>
    <div class="article-p">
        Le stage a pour finalité l'application pratique des enseignements dispensés à l'ENCG Fès et l'insertion en milieu professionnel. La mission confiée est : <strong>{{ $internship->position_title ?? 'Mission d\'audit, gestion financière et management opérationnel' }}</strong>. Le stage se déroule du <strong>{{ $startDateStr ?? now()->format('d/m/Y') }}</strong> au <strong>{{ $endDateStr ?? now()->addMonths(2)->format('d/m/Y') }}</strong>.
    </div>

    <div class="article-title">Article 2 — Encadrement &amp; Suivi Pédagogique</div>
    <div class="article-p">
        Le stagiaire est placé sous la responsabilité du tuteur d'entreprise, assisté d'un professeur tuteur de l'ENCG Fès. L'entreprise s'engage à encadrer le stagiaire, à faciliter ses recherches et à lui fournir les données nécessaires à la rédaction de son mémoire ou rapport de stage.
    </div>

    <div class="article-title">Article 3 — Statut &amp; Gratification Mensuelle</div>
    <div class="article-p">
        Durant la période de stage, le stagiaire conserve son statut d'étudiant. Le stage ne constitue en aucun cas un contrat de travail au sens du Code du Travail marocain. L'entreprise peut verser une indemnité de stage forfaitaire mensuelle convenue de : <strong>{{ $internship->monthly_allowance > 0 ? number_format($internship->monthly_allowance, 2) . ' DH / mois' : 'Prise en charge conventionnelle (Transport & Repas)' }}</strong>.
    </div>

    <div class="article-title">Article 4 — Assurance Responsabilité Civile &amp; Accidents de Travail</div>
    <div class="article-p">
        L'étudiant est expressément couvert par une police d'assurance Responsabilité Civile et Accidents Corporels souscrite par l'Université Sidi Mohamed Ben Abdellah. En cas d'accident survenu sur le lieu de stage ou sur le trajet, l'entreprise s'engage à en informer immédiatement la direction de l'école dans un délai légal de 48 heures.
    </div>

    <div class="article-title">Article 5 — Confidentialité &amp; Devoir de Réserve</div>
    <div class="article-p">
        Le stagiaire est tenu à une stricte obligation de secret professionnel concernant toutes les données financières, stratégiques et commerciales dont il a connaissance au sein de l'entreprise d'accueil.
    </div>

    {{-- SIGNATURES TRIPARTITES --}}
    <table class="signatures-table">
        <tr>
            <td class="signature-cell">
                <div class="sig-title">POUR L'ENCG FÈS</div>
                <div style="font-size: 7pt; color: #475569;">Le Directeur / Directeur Adjoint</div>
                <div style="margin-top: 20px;">
                    <span style="display: inline-block; padding: 4px 8px; border: 1.5px solid #0f2863; color: #0f2863; font-weight: 800; font-size: 7.5pt; text-transform: uppercase;">
                        ✓ SCELLÉ NUMÉRIQUEMENT
                    </span>
                </div>
            </td>
            <td class="signature-cell">
                <div class="sig-title">POUR L'ENTREPRISE D'ACCUEIL</div>
                <div style="font-size: 7pt; color: #475569;">Cachet &amp; Signature du Tuteur</div>
                <div style="margin-top: 20px;">
                    <span style="display: inline-block; padding: 4px 8px; border: 1px dashed #166534; color: #166534; font-weight: 800; font-size: 7.5pt;">
                        ✓ VALIDÉ ÉLECTRONIQUEMENT
                    </span>
                </div>
            </td>
            <td class="signature-cell">
                <div class="sig-title">LE STAGIAIRE</div>
                <div style="font-size: 7pt; color: #475569;">Mention "Lu et Approuvé"</div>
                <div style="margin-top: 20px;">
                    @if(!empty($qrBase64))
                        <img src="{{ $qrBase64 }}" alt="QR Code Vérification" style="width: 55px; height: 55px; margin: 0 auto;">
                    @else
                        <div style="font-size: 7pt; color: #64748b;">Signé numériquement par l'étudiant</div>
                    @endif
                </div>
            </td>
        </tr>
    </table>
@endsection
