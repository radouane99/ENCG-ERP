/**
 * ENCG ERP Design System — TypeScript Design Tokens
 * Single source of truth for all design decisions.
 * Import these in components instead of hardcoding values.
 */

// ─────────────────────────────────────────────────────────────────
// BRAND COLORS (raw hex for use in non-Tailwind contexts, e.g. charts)
// ─────────────────────────────────────────────────────────────────
export const colors = {
  brand: {
    red:       '#A80A0B', // ENCG Primary Red
    redLight:  '#C41213',
    redDark:   '#8B0809',
    navy:      '#1F3A5F', // ENCG Navy Blue
    navyLight: '#2A4D7C',
    navyDark:  '#162B46',
  },
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error:   '#EF4444',
    info:    '#3B82F6',
  },
  chart: {
    blue:   '#3B82F6',
    green:  '#22C55E',
    amber:  '#F59E0B',
    purple: '#A855F7',
    red:    '#A80A0B',
  },
} as const

// ─────────────────────────────────────────────────────────────────
// SPACING (based on 4px grid — 8dp rhythm)
// ─────────────────────────────────────────────────────────────────
export const spacing = {
  px:  '1px',
  0:   '0',
  1:   '0.25rem',  // 4px
  2:   '0.5rem',   // 8px
  3:   '0.75rem',  // 12px
  4:   '1rem',     // 16px
  5:   '1.25rem',  // 20px
  6:   '1.5rem',   // 24px
  8:   '2rem',     // 32px
  10:  '2.5rem',   // 40px
  12:  '3rem',     // 48px
  16:  '4rem',     // 64px
  20:  '5rem',     // 80px
  24:  '6rem',     // 96px
} as const

// ─────────────────────────────────────────────────────────────────
// TYPOGRAPHY SCALE
// ─────────────────────────────────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: "'Inter', 'Noto Sans Arabic', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs:   ['0.75rem',   { lineHeight: '1rem' }],
    sm:   ['0.875rem',  { lineHeight: '1.25rem' }],
    base: ['0.9375rem', { lineHeight: '1.5rem' }],
    lg:   ['1.0625rem', { lineHeight: '1.75rem' }],
    xl:   ['1.25rem',   { lineHeight: '1.75rem' }],
    '2xl':['1.5rem',    { lineHeight: '2rem' }],
    '3xl':['1.875rem',  { lineHeight: '2.25rem' }],
    '4xl':['2.25rem',   { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    light:    300,
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
    extrabold:800,
  },
} as const

// ─────────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────────
export const radius = {
  none:  '0',
  xs:    '0.25rem',  // 4px
  sm:    '0.375rem', // 6px
  md:    '0.5rem',   // 8px  — buttons, inputs
  lg:    '0.625rem', // 10px — cards
  xl:    '0.75rem',  // 12px
  '2xl': '1rem',     // 16px — modals
  '3xl': '1.5rem',   // 24px — hero sections
  full:  '9999px',   // pill badges
} as const

// ─────────────────────────────────────────────────────────────────
// SHADOWS — Elevation levels
// ─────────────────────────────────────────────────────────────────
export const shadows = {
  sm:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md:  '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)',
  lg:  '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)',
  xl:  '0 20px 25px rgba(0,0,0,0.10), 0 8px 10px rgba(0,0,0,0.06)',
} as const

// ─────────────────────────────────────────────────────────────────
// ANIMATION DURATIONS & EASINGS
// ─────────────────────────────────────────────────────────────────
export const animation = {
  duration: {
    instant: '75ms',
    fast:    '150ms',  // micro-interactions (hover, press)
    normal:  '200ms',  // state transitions
    slow:    '300ms',  // entrances / complex transitions
    slower:  '500ms',  // page-level transitions
  },
  easing: {
    default:  'cubic-bezier(0.4, 0, 0.2, 1)',
    enter:    'cubic-bezier(0, 0, 0.2, 1)',
    exit:     'cubic-bezier(0.4, 0, 1, 1)',
    spring:   'cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const

// ─────────────────────────────────────────────────────────────────
// COMPONENT SIZE SCALES
// ─────────────────────────────────────────────────────────────────
export const componentSizes = {
  // Touch targets (WCAG: min 44×44pt)
  button: {
    sm:  { height: '2rem',    paddingX: '0.75rem', fontSize: '0.8125rem' },
    md:  { height: '2.5rem',  paddingX: '1rem',    fontSize: '0.875rem' },
    lg:  { height: '2.75rem', paddingX: '1.5rem',  fontSize: '0.9375rem' },
    xl:  { height: '3rem',    paddingX: '2rem',    fontSize: '1rem' },
    icon:{ height: '2.5rem',  width: '2.5rem' },
  },
  input: {
    sm:  { height: '2rem',    paddingX: '0.625rem', fontSize: '0.8125rem' },
    md:  { height: '2.5rem',  paddingX: '0.75rem',  fontSize: '0.875rem' },
    lg:  { height: '3rem',    paddingX: '1rem',      fontSize: '0.9375rem' },
  },
} as const

// ─────────────────────────────────────────────────────────────────
// BADGE / STATUS VARIANTS — CSS variable references for Tailwind
// ─────────────────────────────────────────────────────────────────
export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'
export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
export type ButtonSize    = 'sm' | 'md' | 'lg' | 'xl' | 'icon'
export type InputSize     = 'sm' | 'md' | 'lg'
export type AlertVariant  = 'info' | 'success' | 'warning' | 'destructive'
