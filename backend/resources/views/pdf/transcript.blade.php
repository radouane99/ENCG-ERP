<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 10px; color: #1e293b; background: #fff; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 3px solid #0f2863; margin-bottom: 16px; }
    .header-left .institution { font-size: 18px; font-weight: 900; color: #0f2863; letter-spacing: -0.5px; }
    .header-left .address { font-size: 8px; color: #64748b; margin-top: 2px; }
    .header-right { text-align: right; }
    .header-right .doc-label { font-size: 13px; font-weight: 900; color: #0f2863; text-transform: uppercase; letter-spacing: 1px; }
    .header-right .doc-sub { font-size: 8px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Student info card */
    .student-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .student-info-block { flex: 1; }
    .student-info-block .label { font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 2px; }
    .student-info-block .value { font-size: 11px; font-weight: 700; color: #0f172a; }
    .student-info-block .filiere { font-size: 9px; color: #475569; margin-top: 2px; }

    /* Academic year badge */
    .year-badge { background: #0f2863; color: white; border-radius: 6px; padding: 6px 12px; text-align: center; align-self: center; }
    .year-badge .year { font-size: 13px; font-weight: 900; }
    .year-badge .year-label { font-size: 7px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9px; }
    th { background: #0f2863; color: white; padding: 8px 6px; text-align: center; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    th.left { text-align: left; }
    td { padding: 7px 6px; border-bottom: 1px solid #f1f5f9; text-align: center; }
    td.left { text-align: left; }
    tr:nth-child(even) td { background: #f8fafc; }

    /* Decision badges */
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 8px; font-weight: 900; }
    .badge-v  { background: #d1fae5; color: #065f46; }
    .badge-r  { background: #fef3c7; color: #92400e; }
    .badge-nv { background: #fee2e2; color: #991b1b; }
    .badge-dash { color: #94a3b8; }

    /* GPA section */
    .gpa-row { display: flex; justify-content: flex-end; margin-bottom: 20px; gap: 10px; }
    .gpa-card { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 20px; text-align: center; }
    .gpa-card .gpa-label { font-size: 7.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; }
    .gpa-card .gpa-value { font-size: 22px; font-weight: 900; color: #0f2863; }
    .gpa-card .gpa-sub { font-size: 8px; color: #64748b; }

    /* Signature area */
    .sig-area { display: flex; justify-content: space-between; margin-top: 24px; }
    .sig-box { text-align: center; width: 45%; }
    .sig-box .sig-title { font-size: 9px; font-weight: 700; color: #334155; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 40px; }

    /* Footer */
    .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .footer-seal { font-size: 7.5px; font-family: monospace; color: #94a3b8; max-width: 55%; word-break: break-all; }
    .footer-right { font-size: 7.5px; color: #94a3b8; text-align: right; }
  </style>
</head>
<body>

  {{-- Header --}}
  <div class="header">
    <div class="header-left">
      <div class="institution">ENCG Fès</div>
      <div class="address">École Nationale de Commerce et de Gestion — Route d'Imouzzer, Fès 30000, Maroc</div>
    </div>
    <div class="header-right">
      <div class="doc-label">Relevé de Notes Officiel</div>
      <div class="doc-sub">Document officiel — ENCG Fès ERP</div>
    </div>
  </div>

  {{-- Student Info --}}
  <div class="student-card">
    <div class="student-info-block" style="flex:2">
      <div class="label">Étudiant(e)</div>
      <div class="value">{{ strtoupper($student->user->last_name ?? '') }} {{ ucfirst($student->user->first_name ?? '') }}</div>
      <div class="filiere">{{ $filiere?->name ?? 'Filière non définie' }} — CNE : {{ $student->cne_cme ?? $student->student_number ?? '—' }}</div>
    </div>
    <div class="student-info-block">
      <div class="label">N° Apogée</div>
      <div class="value">{{ $student->student_number ?? '—' }}</div>
    </div>
    <div class="student-info-block">
      <div class="label">CIN</div>
      <div class="value">{{ $student->user->cin ?? '—' }}</div>
    </div>
    <div class="year-badge">
      <div class="year">{{ $academic_year?->name ?? date('Y') }}</div>
      <div class="year-label">Année académique</div>
    </div>
  </div>

  {{-- Grades Table --}}
  <table>
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

  {{-- GPA --}}
  <div class="gpa-row">
    <div class="gpa-card">
      <div class="gpa-label">Moyenne Générale (GPA)</div>
      <div class="gpa-value">{{ $gpa !== null ? number_format($gpa, 2) : '—' }}</div>
      <div class="gpa-sub">sur 20 points</div>
    </div>
  </div>

  {{-- Signature area --}}
  <div class="sig-area">
    <div class="sig-box">
      <div class="sig-title">Signature de l'Étudiant(e)</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Le Chef de la Scolarité — ENCG Fès</div>
    </div>
  </div>

  {{-- Footer --}}
  <div class="footer">
    <div class="footer-seal">
      Document généré le {{ $generated_at }} · Vérification : {{ $verify_url }}
    </div>
    <div class="footer-right">
      © {{ date('Y') }} ENCG Fès ERP<br>Document officiel — Ne pas modifier
    </div>
  </div>

</body>
</html>
