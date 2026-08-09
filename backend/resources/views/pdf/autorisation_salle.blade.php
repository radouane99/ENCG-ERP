@extends('pdf.layouts.pdf_master')

@section('title', $title)

@section('styles')
<style>
    .doc-title-container {
        text-align: center;
        margin: 15px 0 25px 0;
    }
    .doc-title {
        font-size: 16px;
        font-weight: 900;
        color: #002e5b;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 2px solid #002e5b;
        display: inline-block;
        padding-bottom: 4px;
    }
    .doc-sub {
        font-size: 10px;
        color: #64748b;
        font-weight: bold;
        margin-top: 6px;
        text-transform: uppercase;
    }
    .details-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 25px;
    }
    .details-table td {
        padding: 12px 16px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 12px;
    }
    .details-table tr:last-child td {
        border-bottom: none;
    }
    .label-col {
        width: 38%;
        font-weight: bold;
        color: #475569;
        background-color: #f8fafc;
        border-right: 1px solid #e2e8f0;
    }
    .value-col {
        font-weight: 900;
        color: #0f172a;
    }
    .charter-box {
        background-color: #f1f5f9;
        border-left: 4px solid #002e5b;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 25px;
    }
    .charter-title {
        font-size: 11px;
        font-weight: 900;
        color: #002e5b;
        text-transform: uppercase;
        margin-bottom: 8px;
    }
    .charter-list {
        margin: 0;
        padding-left: 15px;
        font-size: 10px;
        color: #334155;
        line-height: 1.6;
    }
    .stamp-signatures {
        width: 100%;
        margin-top: 30px;
    }
    .stamp-signatures td {
        width: 33.33%;
        text-align: center;
        vertical-align: top;
        font-size: 11px;
        font-weight: bold;
        color: #002e5b;
    }
    .signature-space {
        height: 60px;
    }
</style>
@endsection

@section('content')
    <div class="doc-title-container">
        <div class="doc-title">AUTORISATION D'OCCUPATION DES LOCAUX ET AMPHITHÉÂTRES</div>
        <div class="doc-sub">SERVICE LOGISTIQUE & GESTION DU PATRIMOINE — N° {{ $trackingCode }}</div>
    </div>

    <p style="font-size: 12px; line-height: 1.5; color: #1e293b; margin-bottom: 20px;">
        Le Directeur de l'École Nationale de Commerce et de Gestion de Fès (ENCG Fès) autorise par la présente l'occupation temporaire des locaux de l'établissement au profit de l'événement étudiant désigné ci-dessous :
    </p>

    <table class="details-table">
        <tr>
            <td class="label-col">Club Organisateurs / Association :</td>
            <td class="value-col" style="color: #0284c7;">{{ $clubName }}</td>
        </tr>
        <tr>
            <td class="label-col">Représentant Responsable :</td>
            <td class="value-col">{{ $responsibleName }}</td>
        </tr>
        <tr>
            <td class="label-col">Espace / Salle Autorisée :</td>
            <td class="value-col" style="color: #002e5b; font-size: 14px;">{{ $roomName }} (Capacité: {{ $capacity }} Places)</td>
        </tr>
        <tr>
            <td class="label-col">Objet & Intitulé de l'Événement :</td>
            <td class="value-col">« {{ $purpose }} »</td>
        </tr>
        <tr>
            <td class="label-col">Date d'Occupation Autorisée :</td>
            <td class="value-col" style="color: #059669;">{{ $dateDisplay }}</td>
        </tr>
        <tr>
            <td class="label-col">Créneaux Horaires Accordés :</td>
            <td class="value-col">{{ $timeDisplay }}</td>
        </tr>
    </table>

    <div class="charter-box">
        <div class="charter-title">Charte & Conditions d'Occupation des Locaux</div>
        <ol class="charter-list">
            <li>L'occupation des locaux est exclusivement réservée à l'activité déclarée ci-dessus.</li>
            <li>Le représentant du club s'engage à préserver le mobilier, les équipements audiovisuels et la propreté de l'amphithéâtre.</li>
            <li>La restitution des clés et la fermeture des portes doivent être effectuées immédiatement après la fin du créneau horaire auprès du Service Logistique.</li>
            <li>Toute dégradation engagera la responsabilité directe du club organisateur.</li>
        </ol>
    </div>

    <table class="stamp-signatures">
        <tr>
            <td>
                Le Président du Club<br>
                <div class="signature-space"></div>
                <span style="font-size: 9px; color: #64748b;">Signature & Date</span>
            </td>
            <td>
                Le Chef du Service Logistique<br>
                <div class="signature-space"></div>
                <span style="font-size: 9px; color: #64748b;">Visa & Validation</span>
            </td>
            <td>
                Pour le Directeur de l'ENCG Fès<br>
                Le Secrétaire Général<br>
                <div class="signature-space"></div>
                <span style="font-size: 9px; color: #64748b;">Cachet Officiel & Signé</span>
            </td>
        </tr>
    </table>
@endsection

@section('footer_left')
    <div class="qr-placeholder">
        <img src="{{ $qrBase64 }}" alt="QR Verification">
    </div>
    <strong>Autorisation officielle d'utilisation d'espace campus.</strong><br>
    Vérification d'authenticité via scellé QR Code.<br>
    Délivré à Fès, le {{ $dateIssued }}.
@endsection

@section('footer_right')
    <strong>ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</strong><br>
    Scolarité & Gestion Logistique Campus
@endsection
