import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, locale = 'fr-MA'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date, locale = 'fr-MA'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCurrency(amount: number, currency = 'MAD'): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
}

export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function cleanUtf8Text(str: string): string {
  if (!str) return ''
  return str
    .replace(/Math[^\w\s]*matiques\s*pour\s*la\s*Gestion/gi, 'Mathématiques pour la Gestion')
    .replace(/Math[├┬|─\-\s]*matiques/gi, 'Mathématiques')
    .replace(/^[\|\s]*[éeEÉ]conomie\s*G[^\w\s]*n[^\w\s]*rale\s*(I+)/gi, 'Économie Générale $1')
    .replace(/^[\|\s]*[éeEÉ]conomie\s*G[^\w\s]*n[^\w\s]*rale/gi, 'Économie Générale')
    .replace(/\|?\s*economie\s*g[^\w\s]*n[^\w\s]*rale\s*(I+)/gi, 'Économie Générale $1')
    .replace(/Économie\s*G[^\w\s]*n[^\w\s]*rale/gi, 'Économie Générale')
    .replace(/Management\s*Strat[^\w\s]*gique/gi, 'Management Stratégique')
    .replace(/Analyse\s*Financi[^\w\s]*re/gi, 'Analyse Financière')
    .replace(/Fiscalit[^\w\s]*\s*des\s*Entreprises/gi, 'Fiscalité des Entreprises')
    .replace(/Droit\s*des\s*Soci[^\w\s]*t[^\w\s]*s/gi, 'Droit des Sociétés')
    .replace(/Scolarit[\s\S]{1,6}/gi, 'Scolarité')
    .replace(/Relev[\s\S]{1,6}de/gi, 'Relevé de')
    .replace(/R[\s\S]{1,6}ussite/gi, 'Réussite')
    .replace(/Financi[\s\S]{1,6}re/gi, 'Financière')
    .replace(/├ëconomie|Ã‰conomie|├ë|Ã‰|\|├⌐conomie|\|├──conomie|├⌐conomie/g, 'Économie')
    .replace(/Appliqu├⌐e|Appliqu├¿e|AppliquÃ©e|AppliquÃ¨e/g, 'Appliquée')
    .replace(/╪╣┘ä┘ê┘à ╪º┘ä╪¬╪│┘è┘è╪▒|عـلوم الـتسيير/gi, 'شعبة علوم التدبير والتسيير')
    .replace(/╪º┘ä╪º┘é╪¬╪╡╪º╪» ╪º┘ä╪¬╪╖╪¿┘è┘é┘è|الاقتصـاد التطبيـقي/gi, 'شعبة الاقتصاد التطبيقي')
    .replace(/┘é╪º┘å┘ê┘å ╪º┘ä╪ú╪╣┘à╪º┘ä|قـانون الأعـمال/gi, 'شعبة قانون الأعمال')
    .replace(/╪º┘ä┘ä╪║╪º╪¬ ┘ê╪º┘ä╪¬┘ê╪º╪╡┘ä|اللـغات والتـواصل/gi, 'شعبة اللغات والتواصل')
    .replace(/╪Ñ╪╣┘ä╪º┘à┘è╪º╪¬ ╪º┘ä╪¬╪│┘è┘è╪▒|إعلاميات التسيير/gi, 'شعبة الإعلاميات وأنظمة المعلومات')
    .replace(/├─|Ã©|├®|├⌐|├──|┬é/g, 'é')
    .replace(/Ã¨|├¿|┬è/g, 'è')
    .replace(/Ãª|├ª|┬ê/g, 'ê')
    .replace(/Ã |├ |┬ /g, 'à')
    .replace(/Ã¹|├¹/g, 'ù')
    .replace(/Ã§|├§/g, 'ç')
    .replace(/Ã®|├®/g, 'î')
    .replace(/Ã¯|├¯/g, 'ï')
    .replace(/Ã´|├´/g, 'ô')
    .replace(/â€™/g, "'")
    .replace(/[\u0080-\u009F├┬Γ]/g, '')
    .trim()
}

export function getAcademicYearLabel(year: string): string {
  const [start] = year.split('-')
  return `${start}-${Number(start) + 1}`
}

export function gradeToMention(grade: number): string {
  if (grade >= 16) return 'Très Bien'
  if (grade >= 14) return 'Bien'
  if (grade >= 12) return 'Assez Bien'
  if (grade >= 10) return 'Passable'
  return 'Insuffisant'
}

export function gradeColor(grade: number): string {
  if (grade >= 16) return 'text-emerald-600'
  if (grade >= 14) return 'text-green-600'
  if (grade >= 12) return 'text-blue-600'
  if (grade >= 10) return 'text-yellow-600'
  return 'text-red-600'
}
