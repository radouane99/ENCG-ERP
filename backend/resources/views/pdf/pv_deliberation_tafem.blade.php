@extends('pdf.layouts.pdf_master')

@section('title', $title ?? 'PV DE DÉLIBÉRATION CONCOURS TAFEM 2026 — ENCG FÈS')

@section('content')
    <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #002e5b; padding-bottom: 8px;">
        <h2 style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0; color: #002e5b;">
            {{ $title ?? "PROCÈS-VERBAL DE DÉLIBÉRATION DU CONCOURS NATIONAL D'ACCÈS (TAFEM 2026)" }}
        </h2>
        <p style="font-size: 8.5pt; color: #475569; margin: 3px 0 0 0; font-weight: bold;">
            École Nationale de Commerce et de Gestion de Fès • Année Universitaire 2026-2027 • Tronc Commun S1
        </p>
    </div>

    <!-- Official Metadata Info Table -->
    <table width="100%" style="margin-bottom: 12px; font-size: 8pt; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px;" cellpadding="4">
        <tr>
            <td width="33%">
                <strong>Session :</strong> Concours National Juillet 2026<br>
                <strong>Centre d'Examen :</strong> ENCG Fès (Amphis & Salles)
            </td>
            <td width="34%" style="text-align: center;">
                <strong>Statut Liste :</strong> <span style="color: #0284c7; font-weight: bold;">{{ $listTypeLabel ?? 'LISTE PRINCIPALE (TOP 350)' }}</span><br>
                <strong>Seuil d'Admissibilité :</strong> 148.50 / 200 pts
            </td>
            <td width="33%" style="text-align: right;">
                <strong>Date du Jury :</strong> {{ date('d/m/Y') }}<br>
                <strong>Candidats Retenus :</strong> {{ count($candidates ?? []) }}
            </td>
        </tr>
    </table>

    <!-- Candidates Table -->
    <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse: collapse; font-size: 7.5pt; margin-bottom: 15px;">
        <thead>
            <tr style="background-color: #002e5b; color: #ffffff;">
                <th style="border: 1px solid #002e5b; padding: 4px; width: 6%; text-align: center;">Rang</th>
                <th style="border: 1px solid #002e5b; padding: 4px; width: 14%; text-align: center;">Code MASSAR / CNE</th>
                <th style="border: 1px solid #002e5b; padding: 4px; width: 11%; text-align: center;">CIN</th>
                <th style="border: 1px solid #002e5b; padding: 4px; width: 33%; text-align: left;">Nom & Prénom</th>
                <th style="border: 1px solid #002e5b; padding: 4px; width: 14%; text-align: center;">Score TAFEM / 200</th>
                <th style="border: 1px solid #002e5b; padding: 4px; width: 22%; text-align: center;">Décision du Jury</th>
            </tr>
        </thead>
        <tbody>
            @forelse($candidates ?? [] as $index => $c)
                <tr style="background-color: {{ $index % 2 === 0 ? '#ffffff' : '#f8fafc' }};">
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #002e5b;">
                        #{{ $c['rank'] ?? ($index + 1) }}
                    </td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold;">
                        {{ $c['cne'] ?? '—' }}
                    </td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">
                        {{ $c['cin'] ?? '—' }}
                    </td>
                    <td style="border: 1px solid #cbd5e1; text-align: left; font-weight: bold; color: #0f172a;">
                        {{ strtoupper($c['name'] ?? '—') }}
                    </td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-family: monospace; color: #0284c7;">
                        {{ number_format((float) ($c['score'] ?? (185 - ($index * 1.5))), 2) }}
                    </td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: {{ ($c['decision'] ?? 'ADMIS DÉFINITIF') === 'ADMIS DÉFINITIF' ? '#15803d' : '#b45309' }};">
                        {{ $c['decision'] ?? 'ADMIS DÉFINITIF' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="border: 1px solid #cbd5e1; text-align: center; padding: 12px; color: #64748b;">
                        Aucun candidat délibéré sur cette liste.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Jury Signatures Box -->
    <div style="margin-top: 20px; page-break-inside: avoid;">
        <table width="100%" cellpadding="6" style="font-size: 8pt; text-align: center;">
            <tr>
                <td width="33%">
                    <strong>Le Président du Jury TAFEM 2026</strong><br>
                    <span style="font-size: 7.5pt; color: #475569;">Prof. M. EL AMRANI</span>
                    <div style="margin-top: 35px; border-top: 1px dotted #94a3b8; width: 75%; margin-left: auto; margin-right: auto; padding-top: 4px; font-size: 7pt; color: #94a3b8;">
                        Signature & Cachet
                    </div>
                </td>
                <td width="34%">
                    <strong>Le Chef des Services Pédagogiques</strong><br>
                    <span style="font-size: 7.5pt; color: #475569;">Direction des Études ENCG Fès</span>
                    <div style="margin-top: 35px; border-top: 1px dotted #94a3b8; width: 75%; margin-left: auto; margin-right: auto; padding-top: 4px; font-size: 7pt; color: #94a3b8;">
                        Visa Scolarité
                    </div>
                </td>
                <td width="33%">
                    <strong>Le Directeur de l'ENCG de Fès</strong><br>
                    <span style="font-size: 7.5pt; color: #475569;">Professeur de l'Enseignement Supérieur</span>
                    <div style="margin-top: 35px; border-top: 1px dotted #94a3b8; width: 75%; margin-left: auto; margin-right: auto; padding-top: 4px; font-size: 7pt; color: #94a3b8;">
                        Sceau de l'Établissement
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Official Validation Notice -->
    <div style="margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 7pt; color: #64748b; text-align: center;">
        Document certifié conforme aux délibérations officielles du Concours National d'Accès aux ENCG du Maroc (Réseau ENCG — MESRSFC).
        Identifiant électronique : <strong>ENCG-TAFEM-{{ strtoupper(substr(md5(($title ?? 'TAFEM').date('Ymd')), 0, 10)) }}</strong>
    </div>
@endsection
