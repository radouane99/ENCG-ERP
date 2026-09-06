@extends('pdf.layouts.pdf_master')

@section('title', 'ÉPREUVE OFFICIELLE D\'EXAMEN — ENCG FÈS')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm 10mm 10mm 10mm;
    }
    .exam-header-banner {
        text-align: center;
        border-bottom: 2px solid #002e5b;
        padding-bottom: 6px;
        margin-bottom: 8px;
    }
    .exam-main-title {
        font-size: 13pt;
        font-weight: 900;
        color: #002e5b;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 0;
    }
    .exam-subtitle {
        font-size: 9.5pt;
        font-weight: bold;
        color: #7c2d12;
        margin-top: 3px;
    }
    .cartouche-grid {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
        font-size: 8pt;
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
    }
    .cartouche-grid td {
        padding: 4px 8px;
        border: 0.5px solid #e2e8f0;
        vertical-align: middle;
    }
    .cartouche-lbl {
        font-weight: bold;
        color: #475569;
        width: 18%;
    }
    .cartouche-val {
        color: #0f172a;
        font-weight: bold;
    }
    .instructions-box {
        background-color: #fefce8;
        border: 1px solid #fef08a;
        border-left: 3.5px solid #ca8a04;
        padding: 6px 10px;
        margin-bottom: 10px;
        font-size: 7.5pt;
        color: #713f12;
    }
    .context-box {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-left: 3.5px solid #16a34a;
        padding: 8px 10px;
        margin-bottom: 12px;
        font-size: 8pt;
        color: #14532d;
        line-height: 1.4;
    }
    .context-title {
        font-weight: 900;
        text-transform: uppercase;
        font-size: 8.5pt;
        color: #15803d;
        margin-bottom: 4px;
    }
    .section-banner {
        background-color: #002e5b;
        color: #ffffff;
        font-weight: 900;
        font-size: 8.5pt;
        padding: 4px 8px;
        margin-top: 10px;
        margin-bottom: 6px;
        border-radius: 2px;
    }
    .question-row {
        margin-bottom: 8px;
        font-size: 8pt;
        line-height: 1.35;
    }
    .question-num {
        font-weight: 900;
        color: #002e5b;
    }
    .question-pts {
        font-weight: bold;
        color: #b91c1c;
        font-size: 7.5pt;
    }
    .expected-answer {
        margin-top: 2px;
        padding: 4px 8px;
        background-color: #f8fafc;
        border-left: 2px solid #94a3b8;
        font-size: 7pt;
        color: #475569;
        font-style: italic;
    }
    table.rubric-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        font-size: 7.5pt;
        border: 1px solid #cbd5e1;
    }
    table.rubric-table th {
        background-color: #f1f5f9;
        color: #1e293b;
        padding: 5px;
        border: 1px solid #cbd5e1;
        text-align: left;
        font-weight: bold;
    }
    table.rubric-table td {
        padding: 4px 6px;
        border: 1px solid #e2e8f0;
    }
    .exam-footer-integrity {
        margin-top: 14px;
        padding-top: 4px;
        border-top: 0.8px solid #cbd5e1;
        font-size: 6.5pt;
        color: #64748b;
    }
</style>
@endsection

@section('content')
    <div class="watermark-bg">
        ENCG FÈS • ÉPREUVE OFFICIELLE • CONFIDENTIEL
    </div>

    <div class="exam-header-banner">
        <h1 class="exam-main-title">{{ $title ?? 'ÉPREUVE OFFICIELLE D\'EXAMEN' }}</h1>
        <div class="exam-subtitle">
            Épreuve Universitaire Semestrielle • Session Ordinaire & Contrôle Continu
        </div>
    </div>

    <!-- CARTOUCHE OFFICIEL -->
    <table class="cartouche-grid" cellpadding="0" cellspacing="0">
        <tr>
            <td class="cartouche-lbl">Module :</td>
            <td class="cartouche-val" width="35%">{{ $moduleName ?? 'Module Pédagogique' }}</td>
            <td class="cartouche-lbl">Filière & Semestre :</td>
            <td class="cartouche-val">{{ $filiereName ?? 'Management' }} • Semestre {{ $semester ?? 1 }}</td>
        </tr>
        <tr>
            <td class="cartouche-lbl">Enseignant :</td>
            <td class="cartouche-val">Pr. {{ $professorName ?? 'ENCG Fès' }}</td>
            <td class="cartouche-lbl">Année Universitaire :</td>
            <td class="cartouche-val">{{ $academicYear ?? (date('Y').'/'.(date('Y')+1)) }}</td>
        </tr>
        <tr>
            <td class="cartouche-lbl">Durée de l'épreuve :</td>
            <td class="cartouche-val"><span style="color: #b91c1c;">{{ $duration ?? '2 Heures' }}</span></td>
            <td class="cartouche-lbl">Barème Total :</td>
            <td class="cartouche-val"><span style="color: #002e5b; font-size: 9pt;">{{ $totalPoints ?? 20 }} / 20</span> (Validation ≥ 10/20)</td>
        </tr>
    </table>

    <!-- CONSIGNES EXAMEN -->
    <div class="instructions-box">
        <strong>Consignes Générales :</strong> Les calculatrices non programmables sont autorisées. Aucun document personnel n'est permis. Une attention particulière sera portée à la rigueur conceptuelle, à la structure de l'argumentation et à l'esprit d'analyse managériale. Barème LMD national en vigueur (Note éliminatoire < 06/20).
    </div>

    <!-- CONTEXTE ENTREPRISE / MISE EN SITUATION -->
    @if(!empty($context))
    <div class="context-box">
        <div class="context-title">🏢 Mise en Situation d'Entreprise & Contexte Managérial :</div>
        <p style="margin: 0;">{{ $context }}</p>
    </div>
    @endif

    <!-- SECTIONS ET QUESTIONS -->
    @if(!empty($sections) && is_array($sections))
        @foreach($sections as $secIndex => $sec)
            <div class="section-banner">
                {{ $sec['section_title'] ?? ('Partie ' . ($secIndex + 1)) }}
                @if(isset($sec['points']))
                    <span style="float: right;">[{{ $sec['points'] }} Points]</span>
                @endif
            </div>

            @if(!empty($sec['questions']) && is_array($sec['questions']))
                <div style="padding-left: 6px; padding-right: 6px;">
                    @foreach($sec['questions'] as $q)
                        <div class="question-row">
                            <div>
                                <span class="question-num">Question {{ $q['num'] ?? ($loop->iteration) }} :</span>
                                <span>{{ $q['text'] ?? '' }}</span>
                                @if(isset($q['points']))
                                    <span class="question-pts">({{ $q['points'] }} pt{{ $q['points'] > 1 ? 's' : '' }})</span>
                                @endif
                            </div>
                            @if(!empty($q['expected_answer']) && !empty($includeCorrigé))
                                <div class="expected-answer">
                                    <strong>Éléments de réponse attendus :</strong> {{ $q['expected_answer'] }}
                                </div>
                            @endif
                        </div>
                    @endforeach
                </div>
            @endif
        @endforeach
    @endif

    <!-- GRILLE D'ÉVALUATION & BARÈME -->
    @if(!empty($rubric) && is_array($rubric))
        <div style="margin-top: 12px; page-break-inside: avoid;">
            <div style="font-weight: 900; color: #002e5b; font-size: 8pt; text-transform: uppercase; margin-bottom: 4px;">
                📋 Grille d'Évaluation & Critères d'Excellence Pédagogique ENCG :
            </div>
            <table class="rubric-table" cellpadding="0" cellspacing="0">
                <thead>
                    <tr>
                        <th width="35%">Critère d'évaluation</th>
                        <th width="15%" style="text-align: center;">Pondération</th>
                        <th width="50%">Description & Attentes du Jury</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($rubric as $r)
                        <tr>
                            <td><strong>{{ $r['criteria'] ?? '' }}</strong></td>
                            <td style="text-align: center; font-weight: bold; color: #b91c1c;">{{ $r['points'] ?? '' }} pt{{ ($r['points'] ?? 0) > 1 ? 's' : '' }}</td>
                            <td>{{ $r['description'] ?? '' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    <!-- BANDEAU D'INTÉGRITÉ NUMÉRIQUE -->
    <div class="exam-footer-integrity">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td style="text-align: left;">
                    <strong>Référence Sujet :</strong> #{{ $trackingCode ?? ('EXAM-'.date('Y').'-'.str_pad($module->id ?? 1, 4, '0', STR_PAD_LEFT)) }} • Empreinte SHA-256 : <span style="font-family: monospace;">{{ substr($securityHash ?? hash('sha256', date('YmdHis')), 0, 24) }}…</span>
                </td>
                <td style="text-align: right;">
                    Généré via Copilote IA ENCG Fès • Fait à Fès, le {{ date('d/m/Y') }}
                </td>
            </tr>
        </table>
    </div>
@endsection
