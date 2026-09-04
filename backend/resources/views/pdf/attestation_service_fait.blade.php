@extends('pdf.layouts.pdf_master')

@section('title', 'ATTESTATION DE SERVICE FAIT PÉDAGOGIQUE — ENCG FÈS')

@section('styles')
<style>
    .service-banner {
        background: #0f2863;
        color: #ffffff;
        text-align: center;
        padding: 12px 18px;
        border-radius: 6px;
        margin-bottom: 14px;
    }
    .service-title {
        font-size: 14pt;
        font-weight: 900;
        letter-spacing: 1.5px;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
    }
    .service-subtitle {
        font-size: 8.5pt;
        font-weight: bold;
        color: #fef08a;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .meta-ref-bar {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 8px 14px;
        margin-bottom: 14px;
    }
    .meta-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
    }
    .intro-paragraph {
        margin: 12px 0 16px 0;
        text-align: justify;
        line-height: 1.7;
        font-size: 9.5pt;
        color: #1e293b;
    }
    .details-table-card {
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 14px;
    }
    .details-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
    }
    .details-table td {
        padding: 8px 12px;
        vertical-align: middle;
    }
    .details-table tr:nth-child(even) {
        background-color: #f8fafc;
    }
    .label-col {
        width: 35%;
        font-weight: bold;
        color: #334155;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
    }
    .val-col {
        width: 65%;
        font-weight: 600;
        color: #0f172a;
        border-bottom: 1px solid #e2e8f0;
    }
    .sessions-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8.5pt;
        margin: 14px 0;
        border: 1.5px solid #0f2863;
    }
    .sessions-table th {
        background-color: #0f2863;
        color: #ffffff;
        padding: 8px 10px;
        font-weight: 800;
        text-transform: uppercase;
        font-size: 8pt;
        border: 1px solid #cbd5e1;
    }
    .sessions-table td {
        padding: 7px 10px;
        border: 1px solid #cbd5e1;
    }
    .signature-grid {
        width: 100%;
        border-collapse: collapse;
        margin-top: 25px;
    }
    .signature-grid td {
        vertical-align: top;
        text-align: center;
        width: 33.33%;
    }
</style>
@endsection

@section('content')
    {{-- Header Banner --}}
    <div class="service-banner">
        <div class="service-title">ATTESTATION DE SERVICE FAIT PÉDAGOGIQUE</div>
        <div class="service-subtitle">VALIDATION DU SYLLABUS &amp; ACCOMPLISSEMENT DES VOLUMES HORAIRES STATUTAIRES</div>
    </div>

    {{-- Meta Reference Bar --}}
    <div class="meta-ref-bar">
        <table class="meta-table">
            <tr>
                <td style="width: 50%;">
                    <strong>Réf. Attestation :</strong> <span style="font-family: monospace;">ASF-{{ date('Y') }}-{{ $trackingCode ?? '0092' }}</span>
                </td>
                <td style="width: 50%; text-align: right;">
                    <strong>Fès, le :</strong> {{ now()->format('d/m/Y') }}
                </td>
            </tr>
            <tr>
                <td>
                    <strong>Département :</strong> {{ $departmentName ?? 'Sciences de Gestion & Finance' }}
                </td>
                <td style="text-align: right;">
                    <strong>Année Universitaire :</strong> {{ date('Y') }}/{{ date('Y')+1 }}
                </td>
            </tr>
        </table>
    </div>

    {{-- Intro Text --}}
    <div class="intro-paragraph">
        Le Directeur de l'<strong>École Nationale de Commerce et de Gestion de Fès (ENCG Fès)</strong>, Université Sidi Mohamed Ben Abdellah, certifie par la présente, au vu des vérifications opérées dans le <strong>Cahier de Texte Numérique</strong> et sur avis favorable du Chef de Département, que :
    </div>

    {{-- Teacher Details --}}
    <div class="details-table-card">
        <table class="details-table">
            <tr>
                <td class="label-col">Nom et Prénom de l'Enseignant :</td>
                <td class="val-col"><span style="font-size: 11pt; font-weight: 800; color: #0f2863;">{{ $professor->first_name ?? '' }} {{ $professor->last_name ?? '' }}</span></td>
            </tr>
            <tr>
                <td class="label-col">Statut / Corps Pédagogique :</td>
                <td class="val-col">{{ !empty($isVacataire) ? 'Enseignant Vacataire (Prestation à la Vacation)' : 'Professeur de l\'Enseignement Supérieur (Titulaire MESRSFC)' }}</td>
            </tr>
            <tr>
                <td class="label-col">Carte d'Identité Nationale (CIN) :</td>
                <td class="val-col"><span style="font-family: monospace;">{{ $professor->cin ?? 'Vérifiée au dossier RH' }}</span></td>
            </tr>
            <tr>
                <td class="label-col">Module Pédagogique Dispensé :</td>
                <td class="val-col"><strong>{{ $module->name ?? 'Finance d\'Entreprise' }}</strong> (Code: <span style="font-family: monospace;">{{ $module->code ?? 'GFC-S5-M03' }}</span>)</td>
            </tr>
            <tr>
                <td class="label-col">Filière / Niveau / Groupe :</td>
                <td class="val-col">{{ $filiereName ?? 'Gestion Financière et Comptable' }} · {{ $groupName ?? 'Groupe G1' }}</td>
            </tr>
            <tr>
                <td class="label-col">Volume Horaire Réalisé &amp; Certifié :</td>
                <td class="val-col"><span style="color: #166534; font-weight: 800; font-size: 10pt;">{{ $completedHours ?? 36 }} Heures</span> (CM: {{ $cmHours ?? 18 }}h | TD: {{ $tdHours ?? 18 }}h)</td>
            </tr>
            <tr>
                <td class="label-col">Taux de Couverture du Syllabus :</td>
                <td class="val-col"><span style="color: #0f2863; font-weight: 800; font-size: 10pt;">100% Conforme au Cahier des Charges NPN / LMD</span></td>
            </tr>
            <tr>
                <td class="label-col">Évaluations &amp; PV de Notes :</td>
                <td class="val-col">Contrôles Continus (CC) et Épreuves d'Examens réalisés et remis dans les délais impartis.</td>
            </tr>
        </table>
    </div>

    <div class="intro-paragraph" style="font-size: 9pt; margin-top: 8px;">
        En conséquence, le <strong>SERVICE FAIT</strong> est formellement constaté et validé pour servir et valoir ce que de droit, notamment pour l'ordonnancement des indemnités pour les vacataires ou la décharge annuelle d'activité pour les professeurs titulaires.
    </div>

    {{-- Signatures & Verification --}}
    <table class="signature-grid">
        <tr>
            <td>
                <div style="font-size: 8pt; font-weight: bold; color: #475569; margin-bottom: 6px;">LE CHEF DE DÉPARTEMENT</div>
                <div style="font-size: 8.5pt; font-weight: 800; color: #0f2863;">VISA FAVORABLE ACCORDÉ</div>
                <div style="margin-top: 30px; font-size: 7.5pt; color: #166534; font-weight: bold;">✓ Service Fait Vérifié</div>
            </td>
            <td>
                @if(!empty($qrBase64))
                    <img src="{{ $qrBase64 }}" alt="QR Code Vérification" style="width: 70px; height: 70px; margin: 0 auto;">
                    <div style="font-size: 6.5pt; font-family: monospace; color: #64748b; margin-top: 3px;">Vérification d'authenticité</div>
                @endif
            </td>
            <td>
                <div style="font-size: 8pt; font-weight: bold; color: #475569; margin-bottom: 6px;">POUR LE DIRECTEUR DE L'ENCG FÈS</div>
                <div style="font-size: 8.5pt; font-weight: 800; color: #0f2863;">LE SECRÉTAIRE GÉNÉRAL</div>
                <div style="margin-top: 25px;">
                    <span style="display: inline-block; padding: 5px 12px; border: 1.5px solid #0f2863; color: #0f2863; font-weight: 900; font-size: 8pt; text-transform: uppercase;">
                        ✓ SCELLÉ NUMÉRIQUEMENT
                    </span>
                </div>
            </td>
        </tr>
    </table>
@endsection
