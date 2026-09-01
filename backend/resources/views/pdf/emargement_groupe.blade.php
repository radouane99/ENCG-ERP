@extends('pdf.layouts.pdf_master')

@section('title', 'LISTE D\'ÉMARGEMENT OFFICIELLE — EXAMEN')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 10mm 12mm 12mm 12mm;
    }
    .footer-container {
        margin-top: 15px;
        padding-top: 8px;
        page-break-inside: avoid;
    }
    .official-logos-header {
        margin-bottom: 10px;
        padding-bottom: 5px;
    }
    table.attendance-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #0f2863;
        page-break-inside: auto;
    }
    table.attendance-table thead {
        display: table-header-group;
    }
    table.attendance-table tr {
        page-break-inside: avoid;
    }
</style>
@endsection

@section('content')
    <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="font-size: 15px; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f2863; letter-spacing: 0.5px;">
            LISTE D'ÉMARGEMENT ET DE PRÉSENCE AUX ÉPREUVES
        </h2>
        <div style="font-size: 11.5px; font-weight: bold; margin-top: 3px; color: #059669;">
            {{ $filiereName ?? 'Tronc Commun ENCG' }} — Semestre {{ $semester ?? 'S1' }} (Tous les Groupes)
        </div>
        <div style="font-size: 9pt; color: #64748b; margin-top: 2px;">
            ENCG Fès • Année Universitaire 2026/2027 • Effectif Convoqué : <strong>{{ $studentCount ?? 24 }} Étudiants</strong>
        </div>
    </div>

    <!-- METRICS BAR -->
    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-bottom: 10px; font-size: 9pt; background-color: #f8fafc; border: 1px solid #cbd5e1;">
        <tr>
            <td width="30%" style="padding-left: 10px;">
                <strong>Filière :</strong> {{ $filiereName ?? 'Tronc Commun ENCG' }}
            </td>
            <td width="25%" style="text-align: center;">
                <strong>Semestre :</strong> {{ $semester ?? 'S1' }} (G1 & G2)
            </td>
            <td width="25%" style="text-align: center;">
                <strong>Effectif Total :</strong> <span style="color: #0f2863; font-weight: bold;">{{ $studentCount ?? 24 }} Étudiants</span>
            </td>
            <td width="20%" style="text-align: right; padding-right: 10px;">
                <strong>Statut :</strong> <span style="color: #059669; font-weight: bold;">Cohorte Validée</span>
            </td>
        </tr>
    </table>

    <!-- STUDENTS ATTENDANCE TABLE (LUXURY 52PX TALL SIGNATURE BOXES ACROSS 2 BALANCED PAGES) -->
    <table class="attendance-table" cellpadding="0" cellspacing="0">
        <thead>
            <tr style="background-color: #0f2863; color: #ffffff; font-size: 9pt;">
                <th style="border: 1px solid #0f2863; width: 5%; text-align: center; padding: 7px 0;">N°</th>
                <th style="border: 1px solid #0f2863; width: 17%; text-align: left; padding-left: 8px;">CNE / Massar</th>
                <th style="border: 1px solid #0f2863; width: 15%; text-align: left; padding-left: 8px;">CIN</th>
                <th style="border: 1px solid #0f2863; width: 33%; text-align: left; padding-left: 8px;">Nom & Prénom de l'Étudiant</th>
                <th style="border: 1px solid #0f2863; width: 30%; text-align: center; padding: 7px 0; letter-spacing: 0.5px;">SIGNATURE / ÉMARGEMENT</th>
            </tr>
        </thead>
        <tbody>
            @php
                $list = (isset($realStudents) && count($realStudents) > 0) ? $realStudents : [
                    ['cne' => 'N13809281', 'cin' => 'CD567812', 'name' => 'Ghita Berrada'],
                    ['cne' => 'N13409122', 'cin' => 'KB123456', 'name' => 'Othmane El Alami'],
                    ['cne' => 'N13098177', 'cin' => 'A987654', 'name' => 'Malak Guessous'],
                    ['cne' => 'N13778129', 'cin' => 'CD345678', 'name' => 'Hajar El Fassi'],
                    ['cne' => 'N13221904', 'cin' => 'KB765432', 'name' => 'Anas Tazi'],
                    ['cne' => 'N13567812', 'cin' => 'A123789', 'name' => 'Zineb Alaoui'],
                    ['cne' => 'N13998123', 'cin' => 'CD890123', 'name' => 'Mehdi Filali'],
                    ['cne' => 'N13112344', 'cin' => 'KB456123', 'name' => 'Karima Belkhayat'],
                ];
            @endphp

            @foreach($list as $index => $st)
                <tr style="background-color: {{ $index % 2 == 0 ? '#ffffff' : '#f8fafc' }}; height: 52px;">
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 8.5pt; color: #475569; vertical-align: middle;">
                        {{ $index + 1 }}
                    </td>
                    <td style="border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; padding-left: 8px; font-size: 9pt; color: #334155; vertical-align: middle;">
                        {{ $st['cne'] ?? 'N13800000' }}
                    </td>
                    <td style="border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #0f2863; padding-left: 8px; font-size: 9pt; vertical-align: middle;">
                        {{ $st['cin'] ?? 'CD123456' }}
                    </td>
                    <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #0f2863; padding-left: 8px; font-size: 9.5pt; vertical-align: middle;">
                        {{ $st['name'] ?? 'Étudiant' }}
                    </td>
                    <td style="border: 1px solid #cbd5e1; background-color: #ffffff; vertical-align: bottom; padding: 0 12px 8px 12px; text-align: center;">
                        <div style="border-bottom: 0.8px dashed #94a3b8; width: 100%; height: 35px;"></div>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection

@section('signature_right')
    <div style="font-size: 8pt; color: #334155; font-weight: bold;">
        Fait à Fès, le {{ $date ?? now()->format('d/m/Y') }}
    </div>
    <div style="font-size: 7pt; font-weight: bold; color: #64748b; margin-top: 1px;">
        Surveillance & Contrôle d'Épreuve
    </div>
    <div style="font-size: 8.5pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 1px;">
        LE SURVEILLANT RESPONSABLE
    </div>
    <div style="margin-top: 6px; font-size: 7.5pt; color: #94a3b8; font-style: italic;">
        Signature : _________________
    </div>

    <script type="text/php">
        if (isset($pdf)) {
            $font = $fontMetrics->get_font("DejaVu Sans, Helvetica, Arial", "bold");
            $pdf->page_text(515, 822, "Page {PAGE_NUM} / {PAGE_COUNT}", $font, 7.5, array(0.06, 0.16, 0.39));
        }
    </script>
@endsection
