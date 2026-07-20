<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 10px; color: #1e293b; background: #fff; }

    /* Header — table-based for DomPDF compatibility */
    .header-table { width: 100%; border-collapse: collapse; border-bottom: 3px solid #0f2863; padding-bottom: 14px; margin-bottom: 16px; }
    .header-table td { vertical-align: middle; }
    .institution { font-size: 16px; font-weight: 900; color: #0f2863; letter-spacing: -0.5px; }
    .address { font-size: 8px; color: #64748b; margin-top: 2px; }
    .doc-label { font-size: 13px; font-weight: 900; color: #0f2863; text-transform: uppercase; letter-spacing: 1px; }
    .doc-sub { font-size: 8px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Student info card — table-based */
    .student-card-table { width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; }
    .student-card-table td { padding: 10px 14px; vertical-align: middle; }
    .info-label { font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 2px; }
    .info-value { font-size: 11px; font-weight: 700; color: #0f172a; }
    .info-filiere { font-size: 9px; color: #475569; margin-top: 2px; }

    /* Academic year badge */
    .year-badge { background: #0f2863; color: white; border-radius: 6px; padding: 6px 12px; text-align: center; }
    .year-badge .year { font-size: 13px; font-weight: 900; }
    .year-badge .year-label { font-size: 7px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Grades Table */
    .grades-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9px; }
    .grades-table th { background: #0f2863; color: white; padding: 8px 6px; text-align: center; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .grades-table th.left { text-align: left; }
    .grades-table td { padding: 7px 6px; border-bottom: 1px solid #f1f5f9; text-align: center; }
    .grades-table td.left { text-align: left; }
    .grades-table tr:nth-child(even) td { background: #f8fafc; }

    /* Decision badges */
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 8px; font-weight: 900; }
    .badge-v  { background: #d1fae5; color: #065f46; }
    .badge-r  { background: #fef3c7; color: #92400e; }
    .badge-nv { background: #fee2e2; color: #991b1b; }
    .badge-dash { color: #94a3b8; }

    /* GPA section — table-based */
    .gpa-outer { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .gpa-card { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 20px; text-align: center; }
    .gpa-label { font-size: 7.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; }
    .gpa-value { font-size: 22px; font-weight: 900; color: #0f2863; }
    .gpa-sub { font-size: 8px; color: #64748b; }

    /* Signature area — table-based */
    .sig-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    .sig-table td { text-align: center; vertical-align: bottom; padding: 0 10px; }
    .sig-title { font-size: 9px; font-weight: 700; color: #334155; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 40px; }

    /* Footer — table-based */
    .footer-table { width: 100%; border-collapse: collapse; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    .footer-table td { vertical-align: middle; padding-top: 8px; }
    .footer-seal { font-size: 7.5px; font-family: monospace; color: #94a3b8; word-break: break-all; }
    .footer-right { font-size: 7.5px; color: #94a3b8; text-align: right; }
  </style>
</head>
<body>

  {{-- Header — Royaume du Maroc official header --}}
  <table class="header-table">
    <tr>
      <td style="width:35%; text-align:left;">
        <span style="font-size:8.5px; font-weight:bold; color:#1e293b; line-height:1.4;">
          ROYAUME DU MAROC<br>
          Ministère de l'Enseignement Supérieur,<br>
          de la Recherche Scientifique et de l'Innovation
        </span>
      </td>
      <td style="width:30%; text-align:center;">
        @if(!empty($logoBase64))
          <img src="{{ $logoBase64 }}" alt="ENCG Logo" style="height:44px; margin-bottom:4px;" />
        @endif
        <div class="institution">ENCG Fès</div>
        <div class="address">Route d'Imouzzer, Fès 30000, Maroc</div>
      </td>
      <td style="width:35%; text-align:right;">
        <div class="doc-label">Relevé de Notes Officiel</div>
        <div class="doc-sub" style="margin-top:4px;">Document officiel — ENCG Fès ERP</div>
        <div class="doc-sub">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS</div>
      </td>
    </tr>
  </table>

  {{-- Student Info — table-based for DomPDF --}}
  <table class="student-card-table">
    <tr>
      <td style="width:45%;">
        <div class="info-label">Étudiant(e)</div>
        <div class="info-value">{{ strtoupper($student->user->last_name ?? '') }} {{ ucfirst($student->user->first_name ?? '') }}</div>
        <div class="info-filiere">{{ $filiere?->name ?? 'Filière non définie' }} — CNE : {{ $student->cne_cme ?? $student->student_number ?? '—' }}</div>
      </td>
      <td style="width:20%;">
        <div class="info-label">N° Apogée</div>
        <div class="info-value">{{ $student->student_number ?? '—' }}</div>
      </td>
      <td style="width:15%;">
        <div class="info-label">CIN</div>
        <div class="info-value">{{ $student->user->cin ?? '—' }}</div>
      </td>
      <td style="width:20%; text-align:center;">
        <div class="year-badge">
          <div class="year">{{ $academic_year?->name ?? date('Y') }}</div>
          <div class="year-label">Année académique</div>
        </div>
      </td>
    </tr>
  </table>

  {{-- Grades Table --}}
  <table class="grades-table">
    <thead>
      <tr>
        <th class="left" style="width:30%">Module</th>
        <th style="width:8%">Code</th>
        <th style="width:6%">Crédits</th>
        @foreach($rows->first()['grades_detail'] ?? [] as $type => $g)
          <th>{{ $type }}</th>
        @endforeach
        <th>Moy. Sess.</th>
        <th>Rattr.</th>
        <th>Moy. Fin.</th>
        <th>Décision</th>
      </tr>
    </thead>
    <tbody>
      @forelse($rows as $row)
        <tr>
          <td class="left" style="font-weight:600">{{ $row['module'] }}</td>
          <td style="font-family:monospace; font-size:8px">{{ $row['code'] }}</td>
          <td>{{ $row['credits'] }}</td>
          @foreach($row['grades_detail'] as $g)
            <td>
              @if($g['absent'])
                <span style="color:#ef4444;font-weight:700">ABS</span>
              @elseif($g['value'] !== null)
                {{ number_format($g['value'], 2) }}
              @else
                <span style="color:#94a3b8">—</span>
              @endif
            </td>
          @endforeach
          <td style="font-weight:700">{{ $row['moyenne'] !== null ? number_format($row['moyenne'],2) : '—' }}</td>
          <td>{{ $row['rattrapage'] !== null ? number_format($row['rattrapage'],2) : '—' }}</td>
          <td style="font-weight:900; color:#0f2863">{{ $row['moyenne_finale'] !== null ? number_format($row['moyenne_finale'],2) : '—' }}</td>
          <td>
            @php $d = $row['decision']; @endphp
            @if(str_starts_with($d,'Validé'))
              <span class="badge badge-v">{{ $d }}</span>
            @elseif($d === 'Non Validé')
              <span class="badge badge-nv">Non Validé</span>
            @elseif($d === 'Rattrapage')
              <span class="badge badge-r">Rattrapage</span>
            @else
              <span class="badge-dash">—</span>
            @endif
          </td>
        </tr>
      @empty
        <tr>
          <td colspan="10" style="text-align:center; padding:20px; color:#94a3b8; font-style:italic">
            Aucune note disponible pour cet étudiant dans cette filière.
          </td>
        </tr>
      @endforelse
    </tbody>
  </table>

  {{-- GPA — table-based for DomPDF --}}
  <table class="gpa-outer">
    <tr>
      <td style="width:60%;"></td>
      <td style="width:40%;">
        <div class="gpa-card">
          <div class="gpa-label">Moyenne Générale (GPA)</div>
          <div class="gpa-value">{{ $gpa !== null ? number_format($gpa, 2) : '—' }}</div>
          <div class="gpa-sub">sur 20 points</div>
        </div>
      </td>
    </tr>
  </table>

  {{-- Signature area — table-based for DomPDF --}}
  <table class="sig-table">
    <tr>
      <td style="width:45%;">
        <div class="sig-title">Signature de l'Étudiant(e)</div>
      </td>
      <td style="width:10%;"></td>
      <td style="width:45%;">
        <div class="sig-title">Le Chef de la Scolarité — ENCG Fès</div>
      </td>
    </tr>
  </table>

  {{-- Footer — table-based for DomPDF --}}
  <table class="footer-table">
    <tr>
      <td class="footer-seal" style="width:65%;">
        Document généré le {{ $generated_at }} · Vérification : {{ $verify_url }}
      </td>
      <td class="footer-right" style="width:35%;">
        © {{ date('Y') }} ENCG Fès ERP<br>Document officiel — Ne pas modifier
      </td>
    </tr>
  </table>

</body>
</html>
