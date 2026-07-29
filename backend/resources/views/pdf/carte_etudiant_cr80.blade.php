{{--
  ENCG Fès — Carte Étudiant Officielle — Format CR80 ISO ID-1
  Dimensions exactes : 85.60mm × 53.98mm paysage
  DPI : 300×600 | Marges : 0 | Profil : Evolis YMCKO
  Ruban : YMCKO + panneau noir "All black dots"
  Duplex : Short-edge (bord court)
  NE PAS IMPRIMER EN A4 — Sélectionner "Taille réelle" ou 100% dans l'imprimante.
--}}
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Carte Étudiant — {{ $studentName ?? 'ENCG FÈS' }}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* CR80 ISO ID-1 : 85.60mm × 53.98mm en paysage */
    html, body {
      width: 85.60mm;
      height: 53.98mm;
      overflow: hidden;
      font-family: 'Inter', Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── RECTO face ─────────────────────────────────────── */
    .card-recto {
      width: 85.60mm;
      height: 53.98mm;
      position: relative;
      background: linear-gradient(135deg, #0f2863 0%, #1a387e 40%, #0f2863 100%);
      overflow: hidden;
    }

    /* Gold diagonal stripe */
    .card-recto::before {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 28mm;
      height: 100%;
      background: linear-gradient(135deg, transparent 0%, rgba(251,191,36,0.15) 100%);
      clip-path: polygon(40% 0%, 100% 0%, 100% 100%, 0% 100%);
    }

    /* Subtle dot pattern overlay */
    .card-recto::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
      background-size: 4mm 4mm;
    }

    /* Header strip */
    .header-strip {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 10mm;
      background: rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      padding: 0 3mm;
      z-index: 10;
    }

    .header-encg-label {
      color: #fbbf24;
      font-size: 4.5pt;
      font-weight: 900;
      letter-spacing: 0.8pt;
      text-transform: uppercase;
      line-height: 1.3;
    }

    .header-encg-sub {
      color: rgba(255,255,255,0.7);
      font-size: 3.5pt;
      margin-top: 1pt;
      letter-spacing: 0.3pt;
    }

    .header-logo-placeholder {
      width: 8mm;
      height: 8mm;
      border: 1.5pt solid rgba(251,191,36,0.7);
      border-radius: 2pt;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 2mm;
      flex-shrink: 0;
      overflow: hidden;
    }

    /* Photo zone */
    .photo-zone {
      position: absolute;
      left: 3mm;
      top: 12mm;
      width: 18mm;
      height: 22mm;
      border: 1.5pt solid rgba(251,191,36,0.8);
      border-radius: 2pt;
      overflow: hidden;
      z-index: 10;
      background: rgba(255,255,255,0.1);
    }

    .photo-zone img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.4);
      font-size: 16pt;
    }

    /* Student info */
    .info-zone {
      position: absolute;
      left: 23mm;
      top: 12mm;
      right: 3mm;
      z-index: 10;
    }

    .info-name {
      color: #ffffff;
      font-size: 6pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
      line-height: 1.3;
      margin-bottom: 1.5mm;
    }

    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 1mm;
    }

    .info-label {
      color: #fbbf24;
      font-size: 4pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      min-width: 13mm;
    }

    .info-value {
      color: #e2e8f0;
      font-size: 4.5pt;
      font-weight: 700;
      font-family: monospace;
    }

    /* Status badge */
    .status-badge {
      position: absolute;
      right: 3mm;
      top: 12mm;
      background: #fbbf24;
      color: #0f2863;
      font-size: 3.5pt;
      font-weight: 900;
      padding: 1pt 3pt;
      border-radius: 2pt;
      letter-spacing: 0.5pt;
      text-transform: uppercase;
    }

    /* Barcode zone */
    .barcode-zone {
      position: absolute;
      bottom: 3mm;
      left: 3mm;
      right: 3mm;
      z-index: 10;
    }

    .barcode-text {
      color: rgba(255,255,255,0.5);
      font-size: 3pt;
      font-family: monospace;
      letter-spacing: 0.5pt;
      margin-bottom: 0.5mm;
    }

    /* Simulated barcode lines */
    .barcode-lines {
      display: flex;
      align-items: flex-end;
      gap: 0.3mm;
      height: 5mm;
      background: white;
      padding: 0.5mm 1mm;
      border-radius: 1pt;
      overflow: hidden;
    }

    .bar { background: #0f2863; }

    /* Validity strip at bottom */
    .validity-strip {
      position: absolute;
      bottom: 0;
      left: 0; right: 0;
      height: 4mm;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 3mm;
      z-index: 10;
    }

    .validity-text {
      color: rgba(255,255,255,0.7);
      font-size: 3.5pt;
    }

    .validity-year {
      color: #fbbf24;
      font-size: 4pt;
      font-weight: 900;
    }
  </style>
</head>
<body>
  <div class="card-recto">

    <!-- Header -->
    <div class="header-strip">
      <div class="header-logo-placeholder">
        @if(file_exists(public_path('images/encg_logo.png')))
          <img src="{{ public_path('images/encg_logo.png') }}" style="width:100%;height:100%;object-fit:contain;" alt="ENCG">
        @else
          <span style="color:#fbbf24;font-size:5pt;font-weight:900;">E</span>
        @endif
      </div>
      <div>
        <div class="header-encg-label">ENCG Fès — USMBA</div>
        <div class="header-encg-sub">École Nationale de Commerce et de Gestion</div>
      </div>
    </div>

    <!-- Status Badge -->
    <div class="status-badge">Valide 2026-2027</div>

    <!-- Photo Zone -->
    <div class="photo-zone">
      @if(!empty($photoPath) && file_exists($photoPath))
        <img src="{{ $photoPath }}" alt="Photo">
      @else
        <div class="photo-placeholder">📷</div>
      @endif
    </div>

    <!-- Student Info -->
    <div class="info-zone">
      <div class="info-name">{{ $studentName ?? 'NOM PRÉNOM' }}</div>

      <div class="info-row">
        <span class="info-label">CNE</span>
        <span class="info-value">{{ $cne ?? 'M145092428' }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">N° Inscr.</span>
        <span class="info-value" style="font-size:3.5pt;">{{ $studentNumber ?? 'ENCG-FES-2027-TC-00001' }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Filière</span>
        <span class="info-value" style="font-size:3.5pt;">{{ Str::limit($filiereName ?? 'Tronc Commun', 22) }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Année</span>
        <span class="info-value">{{ $academicYear ?? '2026-2027' }}</span>
      </div>
    </div>

    <!-- Barcode Zone -->
    <div class="barcode-zone">
      <div class="barcode-text">{{ $cne ?? 'M145092428' }} — ENCG-FES</div>
      <div class="barcode-lines">
        @php
          // Generate deterministic barcode pattern from CNE
          $cneStr = $cne ?? 'M145092428';
          $bars = [];
          for ($i = 0; $i < strlen($cneStr); $i++) {
              $val = ord($cneStr[$i]);
              $bars[] = ['w' => max(0.4, ($val % 3) * 0.4 + 0.4), 'h' => max(60, 50 + ($val % 5) * 10)];
              $bars[] = ['w' => 0.3, 'h' => 0, 'gap' => true];
          }
        @endphp
        @foreach($bars as $bar)
          @if(empty($bar['gap']))
            <div class="bar" style="width:{{ $bar['w'] }}mm;height:{{ $bar['h'] }}%;"></div>
          @else
            <div style="width:{{ $bar['w'] }}mm;"></div>
          @endif
        @endforeach
      </div>
    </div>

    <!-- Validity Strip -->
    <div class="validity-strip">
      <span class="validity-text">Carte strictement personnelle — En cas de perte, contacter la Scolarité</span>
      <span class="validity-year">{{ $academicYear ?? '2026-2027' }}</span>
    </div>

  </div>
</body>
</html>
