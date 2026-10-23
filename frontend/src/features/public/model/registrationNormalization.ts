export function normalizeAcademy(raw: string): string {
  const s = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (s.includes('ORIENTAL') || s.includes('EST') || s.includes('OUJDA') || s.includes('NADOR') || s.includes('BERKANE') || s.includes('GUERCIF') || s.includes('JERADA') || s.includes('TAOURIRT') || s.includes('DRIOUCH') || s.includes('FIGUIG')) return "ACADEMIE L'Oriental";
  if (s.includes('FES') || s.includes('FEZ') || s.includes('MEKNES') || s.includes('MEKNAS') || s.includes('SEFROU') || s.includes('TAZA') || s.includes('TAOUNATE') || s.includes('IFRANE') || s.includes('BOULEMANE') || s.includes('HAJEB')) return 'ACADEMIE Fès-Meknès';
  if (s.includes('RABAT') || s.includes('SALE') || s.includes('KENITRA') || s.includes('KENITRA') || s.includes('SKHIRAT') || s.includes('TEMARA') || s.includes('TIFLET') || s.includes('SIDI KACEM') || s.includes('SIDI SLIMANE')) return 'ACADEMIE Rabat-Salé-Kénitra';
  if (s.includes('CASABLANCA') || s.includes('SETTAT') || s.includes('BERRECHID') || s.includes('MOHAMMEDIA') || s.includes('BENSLIMANE') || s.includes('KHOURIBGA') || s.includes('EL JADIDA')) return 'ACADEMIE Casablanca-Settat';
  if (s.includes('TANGER') || s.includes('TETOUAN') || s.includes('HOCEIMA') || s.includes('CHEFCHAOUEN') || s.includes('LARACHE') || s.includes('OUAZZANE') || s.includes('FAHS') || s.includes('MDIQ')) return 'ACADEMIE Tanger-Tétouan-Al Hoceïma';
  if (s.includes('MARRAKECH') || s.includes('SAFI') || s.includes('CHICHAOUA') || s.includes('ESSAOUIRA') || s.includes('YOUSSOUFIA') || s.includes('RHAMNA') || s.includes('KALAA')) return 'ACADEMIE Marrakech-Safi';
  if (s.includes('AGADIR') || s.includes('SOUSS') || s.includes('MASSA') || s.includes('TAROUDANT') || s.includes('TIZNIT') || s.includes('CHTOUKA') || s.includes('INEZGANE')) return 'ACADEMIE Souss-Massa';
  if (s.includes('BENI MELLAL') || s.includes('KHENIFRA') || s.includes('FQUIH') || s.includes('AZILAL') || s.includes('MIDELT')) return 'ACADEMIE Béni Mellal-Khénifra';
  if (s.includes('DRAA') || s.includes('TAFILALET') || s.includes('ERRACHIDIA') || s.includes('OUARZAZATE') || s.includes('ZAGORA') || s.includes('TINGHIR')) return 'ACADEMIE Drâa-Tafilalet';
  if (s.includes('GUELMIM') || s.includes('OUED NOUN') || s.includes('SIDI IFNI') || s.includes('TAN TAN') || s.includes('ASSA')) return 'ACADEMIE Guelmim-Oued Noun';
  if (s.includes('LAAYOUNE') || s.includes('SAKIA') || s.includes('TARFAYA') || s.includes('BOUJDOUR') || s.includes('SMARA')) return 'ACADEMIE Laâyoune-Sakia El Hamra';
  if (s.includes('DAKHLA') || s.includes('OUED ED-DAHAB') || s.includes('DAHAB') || s.includes('AOUSSERD')) return 'ACADEMIE Dakhla-Oued Ed-Dahab';

  return raw; // return as-is if no match (user can correct manually)
}

/**
 * Normalize an OCR-extracted prefecture/delegation string to match the exact select option value.
 */
export function normalizeDelegation(raw: string): string {
  const s = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (s === 'GUERCIF' || s.includes('GUERCIF')) return 'Guercif';
  if (s.includes('OUJDA') || s.includes('ANGAD')) return 'Oujda-Angad';
  if (s.includes('NADOR')) return 'Nador';
  if (s.includes('BERKANE')) return 'Berkane';
  if (s.includes('TAOURIRT')) return 'Taourirt';
  if (s.includes('DRIOUCH')) return 'Driouch';
  if (s.includes('JERADA')) return 'Jerada';
  if (s.includes('FIGUIG')) return 'Figuig';
  if (s === 'FES' || s === 'FEZ' || s.includes('FES') || s.includes('FEZ')) return 'Fès';
  if (s.includes('MEKNES') || s.includes('MEKNAS')) return 'Meknès';
  if (s.includes('SEFROU')) return 'Sefrou';
  if (s.includes('TAOUNATE')) return 'Taounate';
  if (s.includes('TAZA')) return 'Taza';
  if (s.includes('IFRANE')) return 'Ifrane';
  if (s.includes('HAJEB')) return 'El Hajeb';
  if (s.includes('BOULEMANE')) return 'Boulemane';
  if (s.includes('RABAT')) return 'Rabat';
  if (s.includes('SALE') || s.includes('SALA')) return 'Salé';
  if (s.includes('KENITRA') || s.includes('KENITRA')) return 'Kénitra';
  if (s.includes('CASABLANCA') || s.includes('DAR EL BEIDA')) return 'Casablanca';
  if (s.includes('SETTAT')) return 'Settat';
  if (s.includes('TANGER')) return 'Tanger';
  if (s.includes('TETOUAN')) return 'Tétouan';
  if (s.includes('MARRAKECH')) return 'Marrakech';
  if (s.includes('AGADIR')) return 'Agadir';

  return raw; // return as-is if no match
}

/**
 * Normalize an OCR-extracted mention string to the canonical French value.
 * Handles: "BIEN", "TB", "très bien", "AB", "PASSABLE", "Félicitations", etc.
 */
export function normalizeMention(raw: string): string {
  const s = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (s === 'TB' || s.includes('TRES BIEN') || s.includes('TRESB') || s === 'TRÈS BIEN') return 'Très Bien';
  if (s.includes('FELICIT') || s.includes('HONOUR') || s.includes('HONOR')) return 'Très Bien'; // Félicitations → Très Bien
  if (s === 'B' || s === 'BIEN' || s === 'BI EN') return 'Bien';
  if (s === 'AB' || s.includes('ASSEZ BIEN') || s.includes('ASSEZ B') || s === 'A BIEN') return 'Assez Bien';
  if (s.includes('PASSABLE') || s === 'P' || s === 'PASS') return 'Passable';
  return raw;
}

/**
 * Parse and sanitize an OCR-extracted bac average string.
 * Handles: "15.41", "1541", "154 1", "15,41", "15/20", "15.4", etc.
 * Returns a string like "15.41" or empty string if invalid.
 */
export function normalizeAverage(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).replace(',', '.').replace('/', '.').replace(/\s+/g, '');
  // Strip non-numeric except dot
  s = s.replace(/[^0-9.]/g, '');
  const n = parseFloat(s);
  if (isNaN(n) || n < 0) return '';
  // OCR sometimes omits the decimal point: 1541 → 15.41, 1200 → 12.00
  if (n > 20 && n <= 2000) {
    const fixed = n / 100;
    if (fixed >= 0 && fixed <= 20) return fixed.toFixed(2);
  }
  // Clamp to [0, 20]
  const clamped = Math.min(20, Math.max(0, n));
  return clamped.toFixed(2);
}

/**
 * Derive the correct mention from a numeric bac average.
 * 10.00-11.99 → Passable, 12.00-13.99 → Assez Bien, 14.00-15.99 → Bien, ≥16.00 → Très Bien
 */
export function mentionFromAverage(avg: string | number): string {
  const n = parseFloat(String(avg));
  if (isNaN(n)) return '';
  if (n >= 16) return 'Très Bien';
  if (n >= 14) return 'Bien';
  if (n >= 12) return 'Assez Bien';
  if (n >= 10) return 'Passable';
  return '';
}

