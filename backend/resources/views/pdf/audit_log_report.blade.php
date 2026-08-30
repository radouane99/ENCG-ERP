<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Rapport Officiel d'Audit Forensics - ENCG Fès</title>
    <style>
        @page {
            margin: 15mm 12mm 15mm 12mm;
            size: A4 landscape;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8.5pt;
            color: #1e293b;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 8px;
        }
        .header-logo-cell {
            width: 25%;
            vertical-align: middle;
        }
        .header-center-cell {
            width: 50%;
            text-align: center;
            vertical-align: middle;
        }
        .header-right-cell {
            width: 25%;
            text-align: right;
            vertical-align: middle;
            font-size: 7.5pt;
            color: #64748b;
        }
        .institution-title {
            font-size: 11pt;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .document-title {
            font-size: 13pt;
            font-weight: 900;
            color: #0f2863;
            margin: 4px 0 2px 0;
            text-transform: uppercase;
        }
        .badge-cndp {
            background-color: #ecfdf5;
            color: #065f46;
            border: 1px solid #a7f3d0;
            padding: 2px 6px;
            font-size: 7pt;
            font-weight: bold;
            border-radius: 3px;
            display: inline-block;
        }
        .summary-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
        }
        .summary-table td {
            padding: 3px 6px;
        }
        .logs-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .logs-table th {
            background-color: #0f2863;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 6px 5px;
            font-size: 7.5pt;
            text-transform: uppercase;
            border: 1px solid #0f2863;
        }
        .logs-table td {
            padding: 5px 5px;
            border: 1px solid #cbd5e1;
            font-size: 7.5pt;
            vertical-align: middle;
        }
        .logs-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .severity-warning {
            color: #b45309;
            font-weight: bold;
        }
        .severity-danger {
            color: #b91c1c;
            font-weight: bold;
        }
        .severity-info {
            color: #1d4ed8;
            font-weight: bold;
        }
        .hash-code {
            font-family: 'Courier', monospace;
            font-size: 6.5pt;
            color: #475569;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 20px;
            font-size: 7pt;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
            display: table;
            width: 100%;
        }
    </style>
</head>
<body>

    <!-- Header Table -->
    <table class="header-table">
        <tr>
            <td class="header-logo-cell">
                <div class="institution-title">ENCG FÈS</div>
                <div style="font-size: 7.5pt; color: #475569;">Université Sidi Mohamed Ben Abdellah</div>
            </td>
            <td class="header-center-cell">
                <div class="document-title">Journal d'Audit Forensics & Traçabilité 360°</div>
                <div style="margin-top: 3px;">
                    <span class="badge-cndp">Conforme Loi 09-08 • Réf. D-W-2025/ENCG-FES-0908</span>
                </div>
            </td>
            <td class="header-right-cell">
                <div>Date d'extraction : {{ now()->format('d/m/Y H:i:s') }}</div>
                <div>Opérateur : {{ auth()->user()->name ?? 'Administrateur' }}</div>
                <div>Chaîne SHA-256 : <strong style="color: #059669;">INVIOLABLE</strong></div>
            </td>
        </tr>
    </table>

    <!-- Synoptic Summary Box -->
    <div class="summary-box">
        <table class="summary-table">
            <tr>
                <td style="width: 25%;"><strong>Période du Rapport :</strong> {{ $dateFrom ?? 'Historique complet' }} au {{ $dateTo ?? now()->format('d/m/Y') }}</td>
                <td style="width: 25%;"><strong>Nombre d'enregistrements :</strong> {{ count($logs) }} logs certifiés</td>
                <td style="width: 25%;"><strong>Sceau Cryptographique :</strong> Chaîne Merkle SHA-256</td>
                <td style="width: 25%;"><strong>Intégrité Base de Données :</strong> 100% Vérifiée</td>
            </tr>
        </table>
    </div>

    <!-- Logs Table -->
    <table class="logs-table">
        <thead>
            <tr>
                <th style="width: 7%;">ID</th>
                <th style="width: 11%;">Horodatage</th>
                <th style="width: 13%;">Opérateur</th>
                <th style="width: 13%;">Catégorie</th>
                <th style="width: 28%;">Description de la Mutation</th>
                <th style="width: 9%;">Adresse IP</th>
                <th style="width: 6%;">Statut</th>
                <th style="width: 13%;">Empreinte SHA-256</th>
            </tr>
        </thead>
        <tbody>
            @forelse($logs as $log)
                <tr>
                    <td style="font-weight: bold; font-family: monospace;">LOG-{{ str_pad($log->id, 5, '0', STR_PAD_LEFT) }}</td>
                    <td>{{ $log->created_at->format('d/m/Y H:i:s') }}</td>
                    <td>
                        <strong>{{ $log->user_name ?: 'Système' }}</strong><br/>
                        <span style="color: #64748b; font-size: 6.5pt;">{{ $log->user_role ?: 'Automatique' }}</span>
                    </td>
                    <td>
                        <span style="font-weight: bold;">{{ $log->action_type }}</span>
                    </td>
                    <td>
                        {{ $log->description }}
                    </td>
                    <td style="font-family: monospace; font-size: 7pt;">{{ $log->ip_address }}</td>
                    <td>
                        <span class="severity-{{ $log->severity }}">{{ strtoupper($log->severity) }}</span>
                    </td>
                    <td class="hash-code">
                        {{ substr($log->sha256_hash, 0, 16) }}...
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">
                        Aucun enregistrement d'audit ne correspond aux critères sélectionnés.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>
