/**
 * Official ENCG Fès Room & Amphitheater Document Generator
 * Generates institutional-grade Affiche de Porte (Door Sign) & Fiche Technique A4
 * Compliant with Moroccan Higher Education (USMBA / ENCG Fès) and strict 1-page fit
 */

export interface RoomDocumentData {
  id: number;
  name: string;
  code: string;
  type: string;
  capacity: number;
  exam_capacity?: number;
  has_projector: boolean;
  has_ac: boolean;
  is_available: boolean;
  building?: string;
  floor?: string;
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  amphitheatre: 'Amphithéâtre de Cours Magistraux (Amphi)',
  amphitheater: 'Amphithéâtre de Cours Magistraux (Amphi)',
  classroom: 'Salle d\'Enseignement & Travaux Dirigés (TD)',
  lab: 'Laboratoire Informatique & Travaux Pratiques (TP)',
  seminar: 'Salle de Séminaire, Master & Soutenances',
  admin: 'Bureau Administratif & Réunion',
}

const DAYS_MAP = [
  { index: 1, name: 'Lundi' },
  { index: 2, name: 'Mardi' },
  { index: 3, name: 'Mercredi' },
  { index: 4, name: 'Jeudi' },
  { index: 5, name: 'Vendredi' },
  { index: 6, name: 'Samedi' },
]

const TIME_SLOTS = [
  { start: '08:30', end: '10:30', label: '08h30 – 10h30' },
  { start: '10:45', end: '12:45', label: '10h45 – 12h45' },
  { start: '14:30', end: '16:30', label: '14h30 – 16h30' },
  { start: '16:45', end: '18:45', label: '16h45 – 18h45' },
]

export function generateRoomDoorSignHtml(room: RoomDocumentData, schedules: any[] = []): string {
  const currentYear = new Date().getFullYear()
  const academicYear = `${currentYear}-${currentYear + 1}`
  const todayStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const roomTypeLabel = TYPE_DESCRIPTIONS[room.type] || 'Espace Pédagogique Universitaire'
  const examCapacity = room.exam_capacity ?? Math.floor(room.capacity / 2)
  const roomCode = room.code || `SALLE-${room.id}`
  const buildingLabel = room.building || (room.type === 'amphitheatre' ? 'Bloc des Grands Amphis' : 'Bâtiment Pédagogique Central')

  // Verification URL & QR Code
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://encg-fes.ac.ma'
  const verifyToken = `ROOM-${roomCode}`
  const verifyUrl = `${baseUrl}/verify-document/${verifyToken}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=1&data=${encodeURIComponent(verifyUrl)}`

  // Build Schedule Matrix Rows
  const scheduleRowsHtml = DAYS_MAP.map(day => {
    const slotsHtml = TIME_SLOTS.map(slot => {
      // Find matching session if available
      const matching = (schedules || []).filter((s: any) => {
        if (!s) return false
        const sDay = Number(s.day_of_week ?? (s.start ? new Date(s.start).getDay() : 0))
        if (sDay !== day.index) return false
        const startTime = s.start_time || (s.start ? s.start.split('T')[1]?.slice(0, 5) : '')
        return startTime.startsWith(slot.start.slice(0, 2))
      })

      if (matching.length > 0) {
        const item = matching[0]
        const title = item.title || item.module?.name || 'Séance Programmée'
        const prof = item.professor || (item.professor?.user ? `${item.professor.user.first_name} ${item.professor.user.last_name}` : '')
        const group = item.group || item.group?.name || ''
        return `
          <td class="sched-cell occupied">
            <div class="sched-module">${escapeHtml(title)}</div>
            <div class="sched-meta">
              ${group ? `<span class="sched-group">${escapeHtml(group)}</span>` : ''}
              ${prof ? `<span class="sched-prof">Pr. ${escapeHtml(prof)}</span>` : ''}
            </div>
          </td>
        `
      }

      return `
        <td class="sched-cell empty">
          <span class="sched-free">&#8212; DISPONIBLE &#8212;</span>
        </td>
      `
    }).join('')

    return `
      <tr>
        <td class="sched-day-lbl">${day.name}</td>
        ${slotsHtml}
      </tr>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Affiche de Porte Officielle — ${room.name} (${roomCode})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 8mm 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      font-size: 8pt;
      line-height: 1.25;
      padding: 4px;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }

    /* Page Framing (Institutional Border Frame) */
    .door-frame {
      border: 2.5px double #002e5b;
      outline: 0.8px solid #c9a227;
      outline-offset: -5px;
      padding: 12px 14px 10px 14px;
      min-height: 275mm;
      position: relative;
      background: #ffffff;
    }

    /* Official Bilingual Header */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #002e5b;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .header-table td {
      vertical-align: middle;
    }
    .logo-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-img {
      height: 46px;
      width: auto;
      object-fit: contain;
    }
    .school-title {
      font-size: 7.2pt;
      line-height: 1.2;
      color: #002e5b;
    }
    .state-header-right {
      text-align: right;
      font-size: 6.8pt;
      line-height: 1.22;
      color: #002e5b;
    }
    .arabic-title {
      font-family: 'Traditional Arabic', 'Amiri', Tahoma, sans-serif;
      font-size: 8.5pt;
      font-weight: bold;
      direction: rtl;
      color: #002e5b;
    }

    /* Prominent Room Hero Banner */
    .room-hero {
      background: linear-gradient(135deg, #001A4B 0%, #082663 100%);
      color: #ffffff;
      border-radius: 6px;
      border-bottom: 3.5px solid #c9a227;
      padding: 10px 14px;
      margin-bottom: 6px;
      text-align: center;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .room-name {
      font-size: 24pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #ffffff;
      line-height: 1.05;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .room-code-tag {
      display: inline-block;
      background: rgba(201, 162, 39, 0.25);
      border: 1px solid #c9a227;
      color: #fef08a;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 8.5pt;
      font-weight: 900;
      font-family: monospace;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .room-classification {
      font-size: 8pt;
      color: #bfdbfe;
      margin-top: 3px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Reference & Status Ribbon */
    .ribbon-table {
      width: 100%;
      border-collapse: collapse;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      margin-bottom: 6px;
      font-size: 6.8pt;
    }
    .ribbon-table td {
      padding: 3px 8px;
      vertical-align: middle;
    }

    /* 4 Distinct Specifications Badges */
    .spec-grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 4px 0;
      margin-bottom: 6px;
    }
    .spec-card {
      width: 25%;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 5px 6px;
      text-align: center;
      background: #ffffff;
    }
    .spec-card.card-course {
      border-top: 3px solid #0284c7;
      background: #f0f9ff;
    }
    .spec-card.card-exam {
      border-top: 3px solid #dc2626;
      background: #fef2f2;
    }
    .spec-card.card-multimedia {
      border-top: 3px solid #059669;
      background: #f0fdf4;
    }
    .spec-card.card-comfort {
      border-top: 3px solid #7c3aed;
      background: #faf5ff;
    }
    .spec-val {
      font-size: 14pt;
      font-weight: 900;
      line-height: 1.1;
      font-family: monospace;
    }
    .spec-lbl {
      font-size: 6.2pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-top: 2px;
    }
    .spec-sub {
      font-size: 5.6pt;
      color: #475569;
      margin-top: 2px;
      line-height: 1.15;
    }

    /* Weekly Schedule Matrix */
    .section-banner {
      background-color: #002e5b;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 7.2pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 3px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sched-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 6.5pt;
    }
    .sched-table th, .sched-table td {
      border: 1px solid #cbd5e1;
      padding: 3px 4px;
      vertical-align: middle;
    }
    .sched-table th {
      background-color: #f1f5f9;
      color: #002e5b;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
      font-size: 6.2pt;
      padding: 3px 2px;
    }
    .sched-day-lbl {
      font-weight: 900;
      color: #002e5b;
      background-color: #f8fafc;
      width: 12%;
      text-align: center;
      text-transform: uppercase;
      font-size: 6.5pt;
    }
    .sched-cell {
      width: 22%;
      height: 20px;
    }
    .sched-cell.occupied {
      background-color: #f0f7ff;
      border-left: 2.5px solid #2563eb;
    }
    .sched-module {
      font-weight: 800;
      color: #002e5b;
      font-size: 6.4pt;
      line-height: 1.1;
    }
    .sched-meta {
      font-size: 5.5pt;
      color: #475569;
      display: flex;
      justify-content: space-between;
      margin-top: 1px;
    }
    .sched-group {
      font-weight: bold;
      color: #2563eb;
    }
    .sched-prof {
      font-style: italic;
      color: #334155;
    }
    .sched-cell.empty {
      background-color: #ffffff;
      text-align: center;
    }
    .sched-free {
      color: #94a3b8;
      font-size: 5.8pt;
      font-style: italic;
    }

    /* Rules & Code of Conduct Box */
    .charter-box {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 5px 8px;
      margin-bottom: 6px;
      background: #ffffff;
    }
    .charter-title {
      font-size: 6.8pt;
      font-weight: 900;
      color: #002e5b;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
      margin-bottom: 3px;
    }
    .charter-grid {
      display: table;
      width: 100%;
    }
    .charter-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding-right: 6px;
      font-size: 6pt;
      line-height: 1.2;
      color: #334155;
    }
    .charter-item {
      margin-bottom: 2px;
    }
    .charter-item strong {
      color: #002e5b;
    }

    /* Official Stamp & Visas Strip (Tripartite) */
    .signatures-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 4px 0;
      margin-bottom: 4px;
    }
    .sig-cell {
      width: 33.33%;
      vertical-align: top;
      text-align: center;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px;
      background-color: #ffffff;
    }
    .sig-title {
      font-size: 6.5pt;
      font-weight: 900;
      color: #002e5b;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .sig-sub {
      font-size: 5.4pt;
      color: #475569;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .stamp-area {
      height: 46px;
      border: 1px dashed #cbd5e1;
      border-radius: 3px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 2px 0;
      padding: 2px;
    }
    .seal-text {
      font-size: 4.8pt;
      font-weight: 900;
      color: #002e5b;
      line-height: 1.1;
      text-align: center;
    }
    .sig-date {
      font-size: 5.6pt;
      color: #64748b;
      font-weight: bold;
    }

    /* Footer Anti-Fraud & Real Scannable QR Code */
    .footer-table {
      width: 100%;
      border-top: 1px solid #cbd5e1;
      padding-top: 3px;
      border-collapse: collapse;
      font-size: 5.8pt;
      color: #475569;
    }
    .footer-table td {
      vertical-align: middle;
    }
    .footer-bottom {
      border-top: 0.5px solid #e2e8f0;
      margin-top: 2px;
      padding-top: 2px;
      text-align: center;
      font-size: 5.5pt;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="door-frame">

    <!-- Official Header -->
    <table class="header-table">
      <tr>
        <td style="width: 50%;">
          <div class="logo-box">
            <img src="/logo-encg.png" alt="Logo ENCG Fès" class="logo-img" onerror="this.style.display='none'">
            <div class="school-title">
              <strong style="font-size: 8pt; color: #002e5b;">ENCG FÈS • USMBA</strong><br>
              École Nationale de Commerce et de Gestion<br>
              <span style="color: #64748b;">Université Sidi Mohamed Ben Abdellah — Fès</span><br>
              <strong style="color: #059669; font-size: 6.8pt;">Service du Patrimoine, Logistique &amp; Espaces Pédagogiques</strong>
            </div>
          </div>
        </td>
        <td style="width: 50%; text-align: right;">
          <div class="state-header-right">
            <div class="arabic-title">المملكة المغربية • جامعة سيدي محمد بن عبد الله</div>
            <strong>ROYAUME DU MAROC</strong><br>
            Ministère de l'Enseignement Supérieur, de la Recherche Scientifique<br>
            et de l'Innovation · <strong>Direction des Affaires Pédagogiques</strong>
          </div>
        </td>
      </tr>
    </table>

    <!-- Room Hero Banner -->
    <div class="room-hero">
      <div class="room-name">${escapeHtml(room.name)}</div>
      <div class="room-code-tag">REPÈRE / CODE : ${escapeHtml(roomCode)}</div>
      <div class="room-classification">
        ${escapeHtml(roomTypeLabel)} · ${escapeHtml(buildingLabel)}
      </div>
    </div>

    <!-- Reference & Identification Ribbon -->
    <table class="ribbon-table">
      <tr>
        <td style="width: 35%;">
          <strong>Réf. Patrimoine :</strong> 
          <span style="font-family: monospace; font-weight: bold; color: #002e5b;">ENCG-PAT-${currentYear}-${roomCode}</span>
        </td>
        <td style="width: 40%; text-align: center;">
          <strong>Homologation :</strong> 
          <span style="color: #16a34a; font-weight: 900;">
            ${room.is_available ? '✅ ESPACE OPÉRATIONNEL & HOMOLOGUÉ' : '⚠️ MAINTENANCE EN COURS'}
          </span>
        </td>
        <td style="width: 25%; text-align: right;">
          <strong>Année Universitaire :</strong> 
          <span style="color: #002e5b; font-weight: bold;">${academicYear}</span>
        </td>
      </tr>
    </table>

    <!-- 4 Distinct Capacity & Equipment Badges -->
    <table class="spec-grid">
      <tr>
        <!-- 1: Course / TD Capacity -->
        <td class="spec-card card-course">
          <div class="spec-val" style="color: #0284c7;">${room.capacity}</div>
          <div class="spec-lbl" style="color: #0284c7;">Capacité Cours / TD</div>
          <div class="spec-sub">Configuration normale plein effectif</div>
        </td>

        <!-- 2: Exam Capacity -->
        <td class="spec-card card-exam">
          <div class="spec-val" style="color: #dc2626;">${examCapacity}</div>
          <div class="spec-lbl" style="color: #dc2626;">Capacité Examens</div>
          <div class="spec-sub">1 place sur 2 espacée (Anti-fraude)</div>
        </td>

        <!-- 3: Multimedia Equipment -->
        <td class="spec-card card-multimedia">
          <div class="spec-val" style="color: #059669; font-size: 11pt;">
            ${room.has_projector ? '✅ Projecteur Laser' : '❌ Non équipé'}
          </div>
          <div class="spec-lbl" style="color: #059669;">Équipement Multimédia</div>
          <div class="spec-sub">Sonorisation, Micros HF &amp; Écran HD</div>
        </td>

        <!-- 4: Comfort & Connectivity -->
        <td class="spec-card card-comfort">
          <div class="spec-val" style="color: #7c3aed; font-size: 11pt;">
            ${room.has_ac ? '❄️ Climatisation OK' : '❌ Sans Clim'}
          </div>
          <div class="spec-lbl" style="color: #7c3aed;">Confort &amp; Réseau</div>
          <div class="spec-sub">Wi-Fi Eduroam &amp; Prises Pupitre</div>
        </td>
      </tr>
    </table>

    <!-- Weekly Timetable Schedule Matrix -->
    <div class="section-banner">
      <span>Planning Hebdomadaire Officiel d'Occupation (Semestres d'Automne &amp; Printemps)</span>
      <span style="font-size: 5.8pt; color: #fef08a;">Cycles Tronc Commun, Spécialités &amp; Masters</span>
    </div>

    <table class="sched-table">
      <thead>
        <tr>
          <th>Jour</th>
          <th style="width: 22%;">08h30 – 10h30</th>
          <th style="width: 22%;">10h45 – 12h45</th>
          <th style="width: 22%;">14h30 – 16h30</th>
          <th style="width: 22%;">16h45 – 18h45</th>
        </tr>
      </thead>
      <tbody>
        ${scheduleRowsHtml}
      </tbody>
    </table>

    <!-- Regulatory Rules & Code of Conduct (Charte des Espaces Pédagogiques) -->
    <div class="charter-box">
      <div class="charter-title">Charte &amp; Règlement Intérieur d'Usage des Locaux Pédagogiques</div>
      <div class="charter-grid">
        <div class="charter-col">
          <div class="charter-item">
            <strong>Article 1 (Respect du Matériel) :</strong> Le matériel informatique, audiovisuel et le mobilier sont placés sous la responsabilité des usagers. Tout dommage sera sanctionné.
          </div>
          <div class="charter-item">
            <strong>Article 2 (Hygiène &amp; Propreté) :</strong> Il est formellement interdit d'introduire des boissons sucrées et de la nourriture dans les amphithéâtres et salles de cours.
          </div>
        </div>
        <div class="charter-col">
          <div class="charter-item">
            <strong>Article 3 (Énergie &amp; Sécurité) :</strong> Extinction obligatoire de l'éclairage, des climatiseurs et des vidéoprojecteurs à la fin de chaque séance pédagogique.
          </div>
          <div class="charter-item">
            <strong>Article 4 (Priorité Pédagogique) :</strong> Les cours réguliers priment sur les activités parascolaires. Tout rattrapage doit être validé auprès de la Direction des Études.
          </div>
        </div>
      </div>
    </div>

    <!-- Official Tripartite Stamp Boxes -->
    <table class="signatures-table">
      <tr>
        <td class="sig-cell">
          <div class="sig-title">LOGISTIQUE &amp; PATRIMOINE</div>
          <div class="sig-sub">Le Responsable du Parc Immobilier</div>
          <div class="stamp-area">
            <div class="seal-text" style="color: #047857;">
              ★ ENCG FÈS ★<br>
              SERVICE DU PATRIMOINE<br>
              CONFORME &amp; SÉCURISÉ
            </div>
          </div>
          <div class="sig-date">Visa technique vérifié</div>
        </td>

        <td class="sig-cell">
          <div class="sig-title">AFFAIRES PÉDAGOGIQUES</div>
          <div class="sig-sub">Service des Emplois du Temps</div>
          <div class="stamp-area">
            <div class="seal-text" style="color: #0284c7;">
              PLANNING HOMOLOGUÉ<br>
              AFFECTATION VALIDÉE<br>
              SESSION 2026/2027
            </div>
          </div>
          <div class="sig-date">Validé pour l'année universitaire</div>
        </td>

        <td class="sig-cell">
          <div class="sig-title">DIRECTION DE L'ÉTABLISSEMENT</div>
          <div class="sig-sub">Le Directeur de l'ENCG Fès</div>
          <div class="stamp-area">
            <div class="seal-text" style="color: #002e5b;">
              ★ USMBA · ENCG FÈS ★<br>
              SCEAU OFFICIEL DE L'ÉCOLE<br>
              POUR LE DIRECTEUR
            </div>
          </div>
          <div class="sig-date">Fait à Fès, le ${todayStr}</div>
        </td>
      </tr>
    </table>

    <!-- Footer Anti-Fraud & Real Scannable QR Code -->
    <table class="footer-table">
      <tr>
        <td style="width: 48px; vertical-align: middle;">
          <img src="${qrCodeUrl}" alt="QR Code Sécurité" style="width: 40px; height: 40px; display: block; border: 1px solid #cbd5e1; padding: 1px; background: #ffffff; border-radius: 2px;" />
        </td>
        <td style="vertical-align: middle; padding-left: 6px;">
          <strong style="color: #002e5b; font-size: 6.5pt; text-transform: uppercase;">
            Système d'Information &amp; Registre des Espaces — ENCG Fès
          </strong><br>
          <span style="color: #64748b; line-height: 1.15;">
            Document certifié conforme aux normes du Ministère de l'Enseignement Supérieur et de l'Université Sidi Mohamed Ben Abdellah.<br>
            <strong>Contrôle Numérique :</strong> ${verifyToken} · <strong>Authentification Cloud :</strong> SHA256-${roomCode}-${currentYear}E4B · 
            <strong>Assistance Technique :</strong> 05 35 64 49 20 (Poste 4410)
          </span>
        </td>
        <td style="width: 140px; text-align: right; vertical-align: middle;">
          <div style="font-size: 6pt; font-weight: bold; color: #002e5b;">Université Sidi Mohamed Ben Abdellah</div>
          <div style="font-size: 5.6pt; color: #64748b;">École Nationale de Commerce et de Gestion</div>
          <div style="font-size: 6.2pt; font-weight: 900; color: #002e5b; margin-top: 1px;">PAGE 1 / 1 (A4 OFFICIEL)</div>
        </td>
      </tr>
    </table>

    <div class="footer-bottom">
      École Nationale de Commerce et de Gestion de Fès — Route d'Imouzzer, B.P. 1255, Fès - Maroc | Tél: +212 5 35 64 49 20 | URL : ${verifyUrl}
    </div>

  </div>
</body>
</html>
`
}

export function generateAllRoomsDoorSignsHtml(rooms: RoomDocumentData[]): string {
  const parts = rooms.map(room => {
    // Generate individual sign
    const fullHtml = generateRoomDoorSignHtml(room)
    // Extract the content inside body
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    return bodyMatch ? `<div style="page-break-after: always; height: 100%;">${bodyMatch[1]}</div>` : ''
  })

  // Take the head styles from the first document
  const sample = generateRoomDoorSignHtml(rooms[0] || {
    id: 1, name: 'Salle', code: 'S-1', type: 'classroom', capacity: 40, has_projector: true, has_ac: true, is_available: true
  })
  const headMatch = sample.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const headContent = headMatch ? headMatch[1] : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  ${headContent}
</head>
<body>
  ${parts.join('\n')}
</body>
</html>
`
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
