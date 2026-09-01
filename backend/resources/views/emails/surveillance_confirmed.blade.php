<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation d'Ordre de Mission — ENCG Fès</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 30px 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            width: 100%;
            max-width: 680px;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 35px rgba(15, 40, 99, 0.12);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #0f2863 0%, #1a3d8a 100%);
            padding: 24px 28px;
            color: #ffffff;
            text-align: center;
        }
        .sub-header-text {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.75);
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .school-title {
            font-size: 18px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: 0.3px;
        }
        .badge-bar {
            background: rgba(0, 0, 0, 0.22);
            padding: 10px 20px;
            text-align: center;
            font-size: 12px;
            font-weight: 700;
            color: #38bdf8;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
        .body-content {
            padding: 32px 32px 24px;
        }
        .status-box {
            background: #f0fdf4;
            border: 1.5px solid #86efac;
            border-radius: 12px;
            padding: 18px 20px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .status-icon {
            width: 48px;
            height: 48px;
            background: #22c55e;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            flex-shrink: 0;
        }
        .status-title {
            font-size: 16px;
            font-weight: 800;
            color: #166534;
            margin-bottom: 3px;
        }
        .status-desc {
            font-size: 13px;
            color: #15803d;
            line-height: 1.5;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-size: 10.5px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .info-val {
            font-size: 13.5px;
            color: #0f172a;
            font-weight: 700;
        }
        .info-val.highlight {
            color: #0f2863;
        }
        .section-title {
            font-size: 12px;
            font-weight: 800;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .seances-table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            margin-bottom: 24px;
            font-size: 12.5px;
        }
        .seances-table th {
            background: #0f2863;
            color: #ffffff;
            padding: 10px 12px;
            font-weight: 700;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .seances-table td {
            padding: 11px 12px;
            border-top: 1px solid #f1f5f9;
            color: #334155;
            vertical-align: middle;
        }
        .seances-table tr:nth-child(even) td {
            background: #f8fafc;
        }
        .role-badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 10.5px;
            font-weight: 800;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            white-space: nowrap;
        }
        .role-badge.principal {
            background: #0f2863;
            color: #ffffff;
        }
        .role-badge.secondaire {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #cbd5e1;
        }
        .notice-card {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            border-radius: 0 8px 8px 0;
            padding: 12px 16px;
            margin-bottom: 24px;
            font-size: 12.5px;
            color: #1e40af;
            line-height: 1.6;
        }
        .footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 16px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #94a3b8;
        }
        @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; }
            .status-box { flex-direction: column; text-align: center; }
            .footer { flex-direction: column; gap: 8px; text-align: center; }
        }
    </style>
</head>
<body>
@php
    $profUser = $surveillance->professor?->user ?? $surveillance->professor;
    $profName = $profUser?->name ?? 'Enseignant';
    $sessionName = $surveillance->exam?->examSession?->name ?? 'Session d\'Examens Universitaires';
    $academicYear = '2025 — 2026';
    $seances = $allSurveillances ?? collect([$surveillance]);
@endphp

<div class="container">
    {{-- Header --}}
    <div class="header">
        <div class="sub-header-text">Royaume du Maroc — Université Sidi Mohamed Ben Abdellah</div>
        <div class="school-title">École Nationale de Commerce et de Gestion — Fès</div>
    </div>
    <div class="badge-bar">
        Ordre de Mission • Confirmation d'Émargement Officiel
    </div>

    {{-- Body --}}
    <div class="body-content">
        {{-- Success Box --}}
        <div class="status-box">
            <div class="status-icon">✓</div>
            <div>
                <div class="status-title">Présence Validée et Enregistrée</div>
                <div class="status-desc">
                    Votre confirmation a été prise en compte avec succès pour l'ensemble des séances de la session.
                </div>
            </div>
        </div>

        {{-- General Info Card --}}
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Enseignant-Chercheur</span>
                <span class="info-val highlight">Pr. {{ $profName }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Session Académique</span>
                <span class="info-val">{{ $sessionName }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Année Universitaire</span>
                <span class="info-val">{{ $academicYear }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Date & Heure de Validation</span>
                <span class="info-val" style="color:#166534;">{{ now()->format('d/m/Y à H:i:s') }}</span>
            </div>
        </div>

        {{-- Planning Récapitulatif des Séances Confirmées --}}
        <div class="section-title">
            📋 Planning Récapitulatif des Séances Confirmées ({{ $seances->count() }} {{ $seances->count() > 1 ? 'séances' : 'séance' }})
        </div>
        <table class="seances-table">
            <thead>
                <tr>
                    <th>Date &amp; Heure</th>
                    <th>Matière / Épreuve</th>
                    <th>Salle</th>
                    <th style="text-align:center;">Rôle</th>
                </tr>
            </thead>
            <tbody>
                @foreach($seances as $s)
                    @php
                        $isPrincipal = stripos((string)($s->role ?? ''), 'Principal') !== false;
                        $dateStr = $s->exam?->exam_date ? \Carbon\Carbon::parse($s->exam->exam_date)->format('d/m/Y') : 'À venir';
                        $timeStr = $s->exam?->formattedTimeRange() ?? ($s->exam?->start_time ? substr($s->exam->start_time, 0, 5) : '14:30');
                    @endphp
                    <tr>
                        <td style="font-weight:700;color:#0f2863;white-space:nowrap;">
                            📅 {{ $dateStr }}<br>
                            <span style="font-size:11px;color:#64748b;font-weight:500;">⏰ {{ $timeStr }}</span>
                        </td>
                        <td style="font-weight:700;color:#0f172a;">
                            {{ $s->exam?->module?->name ?? 'Épreuve Académique' }}
                        </td>
                        <td style="font-weight:700;color:#0f2863;">
                            {{ $s->room?->name ?? ($s->exam?->room?->name ?? 'Amphithéâtre B') }}
                        </td>
                        <td style="text-align:center;">
                            @if($isPrincipal)
                                <span class="role-badge principal">Surveillant Principal</span>
                            @else
                                <span class="role-badge secondaire">Surveillant Adjoint</span>
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        {{-- Consigne --}}
        <div class="notice-card">
            📌 <strong>Rappel aux surveillants :</strong> La présence en salle est impérative <strong>15 minutes avant</strong> le début de chaque épreuve. Veuillez vous munir de votre convocation imprimée ou sur smartphone pour l'émargement QR Code.
        </div>
    </div>

    {{-- Footer --}}
    <div class="footer">
        <div>
            <strong>ENCG Fès</strong> · Direction des Examens &amp; Affaires Pédagogiques
        </div>
        <div>
            Document certifié numériquement
        </div>
    </div>
</div>

</body>
</html>
