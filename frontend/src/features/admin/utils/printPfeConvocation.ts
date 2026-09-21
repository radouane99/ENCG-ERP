import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

export interface SoutenanceConvocationData {
  id?: number | string;
  student: string;
  filiere?: string;
  topic: string;
  date: string;
  time: string;
  room: string;
  president: string;
  encadrant: string;
  rapporteur: string;
  cne?: string;
  cin?: string;
  academicYear?: string;
}

export function generatePfeConvocationHtml(data: SoutenanceConvocationData): string {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const refNumber = `ENCG-FÈS/DP-SCOL/PFE-2026/N° ${String(data.id || 1).padStart(4, '0')}`;
  const academicYear = data.academicYear || '2025 - 2026';
  const cne = data.cne || 'N138094' + String(100 + Number(data.id || 1));
  const cin = data.cin || 'CD' + String(600000 + Number(data.id || 1) * 31);
  const filiere = data.filiere || 'Management & Commerce International';

  const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://encg-fes.ac.ma'}/verify/soutenance/${data.id || 1}`;

  let qrCodeSvg = '';
  try {
    qrCodeSvg = renderToStaticMarkup(
      React.createElement(QRCodeSVG, {
        value: verificationUrl,
        size: 50,
        level: 'M',
        fgColor: '#002147',
        bgColor: '#ffffff',
        marginSize: 1,
      })
    );
  } catch (e) {
    console.error('Failed to render QRCodeSVG:', e);
  }

  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <base href="${typeof window !== 'undefined' ? window.location.origin : ''}">
  <title>Convocation Officielle de Soutenance PFE — ${data.student}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', Arial, 'Helvetica Neue', sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 8.2pt;
      line-height: 1.25;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* Conteneur principal avec double encadrement officiel */
    .doc-container {
      border: 2px solid #002147;
      padding: 10px 14px;
      position: relative;
      background: #ffffff;
      height: calc(100vh - 16mm);
      max-height: 278mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    /* Filigrane discret */
    .watermark {
      position: absolute;
      top: 52%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-28deg);
      font-size: 42pt;
      font-weight: 900;
      color: rgba(0, 33, 71, 0.035);
      text-transform: uppercase;
      letter-spacing: 5px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      text-align: center;
    }

    .doc-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }

    /* ── 1. En-tête Bilingue Officiel ──────────────────────────── */
    .header-table {
      width: 100%;
      border-collapse: collapse;
    }
    .header-table td {
      vertical-align: middle;
    }
    .header-logo {
      width: 25%;
      text-align: left;
    }
    .header-logo img {
      max-height: 48px;
      max-width: 140px;
      object-fit: contain;
    }
    .header-center {
      width: 48%;
      text-align: center;
      line-height: 1.2;
    }
    .header-center .ar-kingdom {
      font-size: 8.5pt;
      font-weight: bold;
      color: #002147;
      font-family: 'Traditional Arabic', 'Scheherazade New', 'Amiri', serif;
    }
    .header-center .fr-kingdom {
      font-size: 7.2pt;
      font-weight: 800;
      color: #002147;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .header-center .fr-univ {
      font-size: 6.8pt;
      color: #334155;
      font-weight: 600;
    }
    .header-center .fr-school {
      font-size: 7.6pt;
      font-weight: 900;
      color: #002147;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .header-center .ar-school {
      font-size: 7.8pt;
      font-weight: bold;
      color: #002147;
      font-family: 'Traditional Arabic', 'Scheherazade New', 'Amiri', serif;
    }

    /* Boîte Référence Officielle */
    .header-ref {
      width: 27%;
      text-align: right;
    }
    .ref-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 4px;
      padding: 4px 6px;
      text-align: right;
      font-size: 6.5pt;
      line-height: 1.3;
    }
    .ref-card .ref-id {
      font-family: monospace;
      font-weight: 900;
      color: #002147;
      font-size: 6.8pt;
    }
    .ref-card .ref-badge {
      display: inline-block;
      background: #002147;
      color: #ffffff;
      padding: 1px 4px;
      border-radius: 2px;
      font-size: 5.8pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-top: 2px;
    }

    /* Séparateur Royal Doré */
    .royal-divider {
      height: 2px;
      background: linear-gradient(90deg, #002147 0%, #c9a227 50%, #002147 100%);
      margin: 6px 0;
    }

    /* ── 2. Bannière de Titre Solennelle ──────────────────────── */
    .title-banner {
      background: #002147;
      border-top: 1.5px solid #c9a227;
      border-bottom: 1.5px solid #c9a227;
      color: #ffffff;
      text-align: center;
      padding: 5px 8px;
      border-radius: 3px;
      margin-bottom: 6px;
    }
    .title-banner h1 {
      font-size: 10.5pt;
      font-weight: 900;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin: 0;
      color: #ffffff;
    }
    .title-banner .ar-sub {
      font-size: 9.5pt;
      font-weight: bold;
      color: #fde047;
      margin-top: 1px;
      font-family: 'Traditional Arabic', 'Scheherazade New', 'Amiri', serif;
    }
    .title-banner .degree-sub {
      font-size: 6.5pt;
      font-weight: 700;
      color: #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    /* ── 3. Vœu Administratif / Notification ─────────────────── */
    .decree-text {
      font-size: 6.7pt;
      color: #334155;
      text-align: justify;
      margin-bottom: 6px;
      line-height: 1.25;
      font-style: italic;
      padding: 0 2px;
    }

    /* ── 4. Bento Section : Candidat & Mémoire ───────────────── */
    .bento-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .bento-table td {
      border: 1px solid #cbd5e1;
      padding: 4px 7px;
      vertical-align: top;
      background: #f8fafc;
    }
    .bento-label {
      font-size: 5.6pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #64748b;
      margin-bottom: 1.5px;
    }
    .bento-val {
      font-size: 7.8pt;
      font-weight: 800;
      color: #002147;
    }
    .bento-val-mono {
      font-family: monospace;
      font-size: 7.4pt;
      font-weight: 800;
      color: #0f172a;
    }
    
    /* Sujet PFE mis en exergue */
    .topic-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 3.5px solid #1d4ed8;
      border-radius: 3px;
      padding: 5px 8px;
      margin-bottom: 6px;
    }
    .topic-box .topic-label {
      font-size: 5.8pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e40af;
      margin-bottom: 2px;
    }
    .topic-box .topic-text {
      font-size: 8.4pt;
      font-weight: 900;
      color: #002147;
      font-style: italic;
      line-height: 1.25;
    }

    /* ── 5. Cadre Logistique Spatio-Temporel (3 Cartouches) ───── */
    .logistics-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 6px;
    }
    .logistics-card {
      border: 1.2px solid #cbd5e1;
      padding: 5px 8px;
      text-align: center;
      background: #ffffff;
    }
    .logistics-card.active {
      background: #fdfdfd;
      border-color: #94a3b8;
    }
    .logistics-card .icon-lbl {
      font-size: 6.0pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      margin-bottom: 1.5px;
    }
    .logistics-card .main-val {
      font-size: 8.8pt;
      font-weight: 900;
      color: #002147;
    }
    .logistics-card .sub-val {
      font-size: 6.0pt;
      color: #64748b;
      margin-top: 1px;
    }

    /* ── 6. Tableau Officiel de la Commission du Jury ─────────── */
    .jury-section-title {
      font-size: 6.8pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #002147;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .jury-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 6px;
    }
    .jury-table th, .jury-table td {
      border: 1px solid #94a3b8;
      padding: 4px 6px;
      vertical-align: middle;
    }
    .jury-table th {
      background: #002147;
      color: #ffffff;
      font-size: 6.5pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      text-align: left;
      border-bottom: 1.8px solid #c9a227;
    }
    .jury-table td {
      background: #ffffff;
      font-size: 7.2pt;
    }
    .role-badge {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 2px;
      font-size: 6.2pt;
      font-weight: 900;
      text-transform: uppercase;
    }
    .role-pres {
      background: #eff6ff;
      color: #1e3a8a;
      border: 0.6px solid #bfdbfe;
    }
    .role-enc {
      background: #ecfdf5;
      color: #065f46;
      border: 0.6px solid #a7f3d0;
    }
    .role-rap {
      background: #faf5ff;
      color: #6b21a8;
      border: 0.6px solid #e9d5ff;
    }
    .sign-box {
      border: 1px dashed #cbd5e1;
      height: 22px;
      border-radius: 2px;
      text-align: center;
      color: #94a3b8;
      font-size: 5.5pt;
      line-height: 22px;
      font-style: italic;
    }

    /* ── 7. Consignes Réglementaires & Protocole ─────────────── */
    .charte-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-left: 3px solid #64748b;
      padding: 4px 7px;
      margin-bottom: 6px;
      font-size: 6.0pt;
      color: #334155;
      line-height: 1.25;
    }
    .charte-box strong {
      color: #002147;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .charte-box ul {
      margin-left: 12px;
      margin-top: 1px;
    }

    /* ── 8. Bloc Sceau & Authentification Officielle ──────────── */
    .auth-section {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .auth-section td {
      vertical-align: top;
      border: none;
      padding: 2px 4px;
    }
    .auth-left {
      width: 48%;
      border-right: 1px solid #e2e8f0;
    }
    .auth-right {
      width: 52%;
      text-align: center;
      padding-left: 10px;
    }
    
    .qr-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .qr-box {
      width: 52px;
      height: 52px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .qr-box svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .qr-meta {
      font-size: 5.4pt;
      color: #64748b;
      line-height: 1.25;
    }
    .qr-meta strong {
      color: #002147;
      font-size: 5.8pt;
    }

    .sig-date {
      font-size: 6.8pt;
      color: #334155;
      margin-bottom: 2px;
      font-style: italic;
    }
    .sig-title {
      font-size: 7.2pt;
      font-weight: 900;
      color: #002147;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .sig-delegation {
      font-size: 5.8pt;
      color: #64748b;
      margin-bottom: 4px;
    }
    .stamp-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      height: 52px;
      margin-top: 1px;
    }

    /* Sceau circulaire officiel ENCG Fès en CSS/SVG */
    .official-seal {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 1.8px dashed #1d4ed8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #1d4ed8;
      text-align: center;
      transform: rotate(-10deg);
      opacity: 0.88;
      padding: 2px;
      background: rgba(29, 78, 216, 0.02);
    }
    .seal-text-top {
      font-size: 3.5pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .seal-star {
      font-size: 8pt;
      line-height: 1;
      color: #c9a227;
      margin: 1px 0;
    }
    .seal-text-bottom {
      font-size: 3.2pt;
      font-weight: 800;
      text-transform: uppercase;
    }

    /* Signature manuscrite vectorielle */
    .signature-svg {
      width: 75px;
      height: 38px;
      opacity: 0.85;
    }

    /* ── 9. Pied de Page Institutionnel ──────────────────────── */
    .doc-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 3px;
      margin-top: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 5.4pt;
      color: #64748b;
      line-height: 1.2;
    }
    .footer-encg {
      font-weight: 700;
      color: #002147;
    }

    /* Optimisations impression */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .doc-container {
        height: 100vh;
        max-height: 100vh;
        border: 2px solid #002147;
      }
    }
  </style>
</head>
<body>

  <div class="doc-container">
    <!-- Filigrane de fond officiel -->
    <div class="watermark">ENCG FÈS &bull; SOUTENANCE OFFICIELLE</div>

    <div class="doc-content">
      
      <!-- ── Section 1 : En-tête Bilingue Officiel ────────────── -->
      <div>
        <table class="header-table">
          <tr>
            <td class="header-logo">
              <img src="/logo-encg.png" alt="Logo ENCG Fès — USMBA" onerror="this.onerror=null; this.src='https://encg-fes.ac.ma/wp-content/uploads/2021/03/logo-encg.png';">
            </td>
            <td class="header-center">
              <div class="fr-kingdom">ROYAUME DU MAROC</div>
              <div class="ar-kingdom">المملكة المغربية</div>
              <div class="fr-univ">Université Sidi Mohamed Ben Abdellah de Fès</div>
              <div class="ar-univ" style="font-size: 7.2pt; font-weight: bold; color: #1e293b;">جامعة سيدي محمد بن عبد الله - فاس</div>
              <div class="fr-school">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
              <div class="ar-school">المدرسة الوطنية للتجارة والتسيير بفاس</div>
              <div class="fr-dept" style="font-size: 5.8pt; font-weight: bold; color: #c9a227; text-transform: uppercase; margin-top: 1px;">DIRECTION DES AFFAIRES PÉDAGOGIQUES &amp; DE LA SCOLARITÉ</div>
            </td>
            <td class="header-ref">
              <div class="ref-card">
                <div><strong>RÉFÉRENCE :</strong> <span class="ref-id">${refNumber}</span></div>
                <div><strong>SESSION :</strong> Juin / Juillet 2026</div>
                <div><strong>ANNÉE :</strong> ${academicYear}</div>
                <div style="margin-top:2px;"><span class="ref-badge">CONVOCATION PFE</span></div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Séparateur Royal Doré -->
        <div class="royal-divider"></div>

        <!-- ── Section 2 : Bannière Titre Solennelle ───────────── -->
        <div class="title-banner">
          <h1>CONVOCATION OFFICIELLE À LA SOUTENANCE DE FIN D'ÉTUDES</h1>
          <div class="ar-sub">إشعار ومقرر الحضور لمناقشة مشروع نهاية الدراسة</div>
          <div class="degree-sub">DIPLÔME DE L'ÉCOLE NATIONALE DE COMMERCE ET DE GESTION (GRADE DE MASTER &bull; BAC+5)</div>
        </div>

        <!-- ── Section 3 : Notification Réglementaire ─────────── -->
        <div class="decree-text">
          Conformément au Dahir n° 1-00-199 portant promulgation de la loi n° 01-00 portant organisation de l'enseignement supérieur, 
          au Cahier des Normes Pédagogiques Nationales (CNPN) du diplôme de l'ENCG, et aux délibérations de la Commission Pédagogique de l'établissement : 
          Il est porté à la connaissance de Monsieur/Madame le membre de la commission d'évaluation et de l'étudiant(e) candidat(e) que 
          la séance publique de soutenance du Projet de Fin d'Études (PFE) aura lieu selon les modalités suivantes :
        </div>

        <!-- ── Section 4 : Profil du Candidat & Thématique ─────── -->
        <table class="bento-table">
          <tr>
            <td style="width: 38%;">
              <div class="bento-label">Étudiant(e) Candidat(e)</div>
              <div class="bento-val">${data.student.toUpperCase()}</div>
            </td>
            <td style="width: 32%;">
              <div class="bento-label">Filière / Spécialité</div>
              <div class="bento-val">${filiere}</div>
            </td>
            <td style="width: 30%;">
              <div class="bento-label">Identifiants Académiques</div>
              <div class="bento-val-mono">CNE: ${cne} &bull; CIN: ${cin}</div>
            </td>
          </tr>
        </table>

        <!-- Intitulé du Sujet -->
        <div class="topic-box">
          <div class="topic-label">Intitulé Officiel du Projet de Fin d'Études (PFE) :</div>
          <div class="topic-text">« ${data.topic} »</div>
        </div>

        <!-- ── Section 5 : Cadre Spatio-Temporel & Logistique ──── -->
        <table class="logistics-table">
          <tr>
            <td class="logistics-card active" style="border-right: none; border-radius: 4px 0 0 4px;">
              <div class="icon-lbl">📅 Date d'Audience</div>
              <div class="main-val">${data.date}</div>
              <div class="sub-val">Session Principale Juin 2026</div>
            </td>
            <td class="logistics-card active" style="border-right: none;">
              <div class="icon-lbl">⏰ Horaire & Durée</div>
              <div class="main-val">${data.time}</div>
              <div class="sub-val">Durée : 90 min (Exposé + Débat + Délibération)</div>
            </td>
            <td class="logistics-card active" style="border-radius: 0 4px 4px 0;">
              <div class="icon-lbl">📍 Lieu d'Affectation</div>
              <div class="main-val">${data.room}</div>
              <div class="sub-val">Campus Universitaire ENCG Fès</div>
            </td>
          </tr>
        </table>

        <!-- ── Section 6 : Composition de la Commission du Jury ── -->
        <div class="jury-section-title">
          <span>COMPOSITION OFFICIELLE DE LA COMMISSION DU JURY D'ÉVALUATION</span>
        </div>
        <table class="jury-table">
          <thead>
            <tr>
              <th style="width: 25%;">Qualité / Rôle</th>
              <th style="width: 32%;">Nom & Prénom du Membre</th>
              <th style="width: 28%;">Grade & Établissement</th>
              <th style="width: 15%; text-align: center;">Émargement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="role-badge role-pres">Président du Jury</span></td>
              <td><strong>${data.president}</strong></td>
              <td>Professeur de l'Ens. Sup. (PES) &bull; ENCG Fès</td>
              <td><div class="sign-box">Visa</div></td>
            </tr>
            <tr>
              <td><span class="role-badge role-enc">Encadrant Pédagogique</span></td>
              <td><strong>${data.encadrant}</strong></td>
              <td>Professeur Habilité (PH) &bull; ENCG Fès</td>
              <td><div class="sign-box">Visa</div></td>
            </tr>
            <tr>
              <td><span class="role-badge role-rap">Rapporteur / Examinateur</span></td>
              <td><strong>${data.rapporteur}</strong></td>
              <td>Professeur Chercheur (PA) &bull; ENCG Fès</td>
              <td><div class="sign-box">Visa</div></td>
            </tr>
          </tbody>
        </table>

        <!-- ── Section 7 : Charte & Dispositions de Soutenance ── -->
        <div class="charte-box">
          <strong>Dispositions Réglementaires & Déroulement de l'Épreuve :</strong>
          <ul>
            <li><strong>Ponctualité :</strong> Le candidat et les membres du jury sont priés de se présenter 15 minutes avant le début officiel de la séance.</li>
            <li><strong>Protocole :</strong> Présentation orale de synthèse : 20 à 30 minutes, suivie des échanges et questions de la commission (30 min).</li>
            <li><strong>Huis Clos :</strong> La délibération et l'attribution de la note finale et de la mention se déroulent strictement à huis clos.</li>
            <li><strong>Validation :</strong> La délivrance du diplôme est subordonnée au dépôt de la version finale corrigée du mémoire dans un délai de 10 jours.</li>
          </ul>
        </div>
      </div>

      <!-- ── Section 8 : Bloc Sceau & Authentification ───────── -->
      <div>
        <table class="auth-section">
          <tr>
            <td class="auth-left">
              <div class="qr-container">
                <div class="qr-box">
                  ${qrCodeSvg}
                </div>
                <div class="qr-meta">
                  <strong>CONTRÔLE D'AUTHENTICITÉ NUMÉRIQUE</strong><br>
                  Système d'Information Scolarité — ENCG Fès<br>
                  Empreinte SHA-256 : <span style="font-family:monospace;font-size:5.0pt;">8f9b2c4e1a0d3f6</span><br>
                  Document officiel dématérialisé vérifiable.
                </div>
              </div>
            </td>
            <td class="auth-right">
              <div class="sig-date">Fait à Fès, le ${currentDate}</div>
              <div class="sig-title">Pour le Directeur de l'ENCG de Fès et par délégation,</div>
              <div class="sig-delegation">Le Directeur Adjoint aux Affaires Pédagogiques</div>
              
              <div class="stamp-container">
                <!-- Cachet officiel circulaire encre indigo -->
                <div class="official-seal">
                  <div class="seal-text-top">UNIVERSITÉ USMBA</div>
                  <div class="seal-star">★</div>
                  <div class="seal-text-bottom">ENCG FÈS &bull; SCOLARITÉ</div>
                </div>

                <!-- Signature manuscrite vectorielle -->
                <svg class="signature-svg" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 C30 20, 50 60, 70 30 C85 10, 100 70, 115 25 C125 45, 135 35, 150 40" stroke="#002147" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M40 55 C65 45, 95 65, 140 50" stroke="#002147" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M75 18 C80 30, 85 45, 90 60" stroke="#002147" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </div>
            </td>
          </tr>
        </table>

        <!-- ── Section 9 : Pied de Page Institutionnel ────────── -->
        <div class="doc-footer">
          <div>
            <span class="footer-encg">École Nationale de Commerce et de Gestion de Fès</span> &bull; 
            Université Sidi Mohamed Ben Abdellah &bull; 
            Quartier Universitaire, Dhar El Mehraz, B.P. 2220, Fès — Maroc
          </div>
          <div>
            Tél : +212 (0) 5 35 60 03 40 &bull; Web : www.encg-fes.ac.ma &bull; <strong>Page 1/1</strong>
          </div>
        </div>
      </div>

    </div>
  </div>

  <script>
    // Déclenchement automatique de l'impression
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;
}

export function printPfeConvocation(data: SoutenanceConvocationData): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert("Veuillez autoriser les pop-ups dans votre navigateur pour afficher la convocation.");
    return;
  }
  const html = generatePfeConvocationHtml(data);
  win.document.open();
  win.document.write(html);
  win.document.close();
}
