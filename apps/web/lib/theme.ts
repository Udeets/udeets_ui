// ─── uDeets Design System ───────────────────────────────────────────
// All color tokens, typography, spacing, and component classes.
// Colors reference CSS custom properties so they respond to dark mode.
// Import from '@/lib/theme' and use in Tailwind class strings.

// ─── RAW COLOR PALETTE (for reference / non-CSS-var usage) ──────────
export const palette = {
  green900: '#0C5C57',
  green800: '#0a4f4a',
  green700: '#1a8a82',
  green600: '#22a89e',
  green100: '#E3F1EF',
  green50: '#EAF6F3',

  dark950: '#0a0a0a',
  dark900: '#111111',
  dark800: '#1a1a1a',
  dark700: '#262626',
  dark600: '#333333',
  dark500: '#444444',

  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',

  white: '#ffffff',
  red500: '#ef4444',
  red600: '#dc2626',
  amber500: '#f59e0b',
  emerald500: '#22c55e',
} as const;

// ─── SEMANTIC COLOR TOKENS ──────────────────────────────────────────
// These map to CSS custom properties set in globals.css.
// Use via: `bg-[var(--ud-bg-page)]`, `text-[var(--ud-text-primary)]`, etc.
// Or use the helper class strings below.
export const cssVars = {
  // Backgrounds
  bgPage: 'var(--ud-bg-page)',
  bgCard: 'var(--ud-bg-card)',
  bgSubtle: 'var(--ud-bg-subtle)',
  bgElevated: 'var(--ud-bg-elevated)',
  bgInput: 'var(--ud-bg-input)',
  bgOverlay: 'var(--ud-bg-overlay)',

  // Brand
  brandPrimary: 'var(--ud-brand-primary)',
  brandPrimaryHover: 'var(--ud-brand-primary-hover)',
  brandLight: 'var(--ud-brand-light)',
  brandGradientFrom: 'var(--ud-gradient-from)',
  brandGradientTo: 'var(--ud-gradient-to)',

  // Text
  textPrimary: 'var(--ud-text-primary)',
  textSecondary: 'var(--ud-text-secondary)',
  textMuted: 'var(--ud-text-muted)',
  textInverse: 'var(--ud-text-inverse)',

  // Borders
  border: 'var(--ud-border)',
  borderFocus: 'var(--ud-border-focus)',
  borderSubtle: 'var(--ud-border-subtle)',

  // Status
  danger: 'var(--ud-danger)',
  warning: 'var(--ud-warning)',
  success: 'var(--ud-success)',
} as const;

// ─── TAILWIND CLASS HELPERS ─────────────────────────────────────────
// Ready-to-use className strings that use CSS variables for dark mode.

export const colors = {
  primary: palette.green900,
  primaryHover: palette.green800,
  primaryLight: palette.green100,
  primaryMid: '#A9D1CA',
  primaryDark: '#1a3a35',

  bgPage: palette.white,
  bgCard: palette.white,
  bgSubtle: palette.gray50,

  textPrimary: palette.dark900,
  textSecondary: palette.gray500,
  textMuted: palette.gray400,

  border: palette.gray200,
  borderFocus: palette.green900,

  danger: palette.red500,
  dangerHover: palette.red600,
  warning: palette.amber500,
  success: palette.emerald500,
} as const;

// ─── BUTTON CLASSES ─────────────────────────────────────────────────
export const buttons = {
  primary:
    'bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] text-white hover:opacity-90 transition-all duration-150',
  primaryRounded:
    'rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-all duration-150',
  outline:
    'border border-[var(--ud-brand-primary)] text-[var(--ud-brand-primary)] hover:bg-[var(--ud-brand-light)] transition-colors duration-150',
  ghost:
    'text-[var(--ud-brand-primary)] hover:bg-[var(--ud-brand-light)] transition-colors duration-150',
  danger:
    'bg-red-500 text-white hover:bg-red-600 transition-colors duration-150',
  dangerOutline:
    'border border-red-500 text-red-500 hover:bg-red-50 transition-colors duration-150',
} as const;

// ─── TYPOGRAPHY CLASSES ─────────────────────────────────────────────
export const typography = {
  h1: 'text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ud-text-primary)]',
  h2: 'text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)]',
  h3: 'text-xl font-semibold tracking-tight text-[var(--ud-text-primary)]',
  h4: 'text-lg font-semibold tracking-tight text-[var(--ud-text-primary)]',

  body: 'text-base text-[var(--ud-text-primary)]',
  bodySmall: 'text-sm text-[var(--ud-text-secondary)]',
  caption: 'text-xs text-[var(--ud-text-muted)]',

  label: 'text-sm font-medium text-[var(--ud-text-primary)]',
  labelMuted: 'text-sm font-medium text-[var(--ud-text-secondary)]',
} as const;

// ─── SURFACE / SPACING CLASSES ──────────────────────────────────────
export const surfaces = {
  page: 'bg-[var(--ud-bg-page)] text-[var(--ud-text-primary)]',
  card: 'rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm',
  cardHover: 'rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm hover:border-[var(--ud-border)] transition',
  elevated: 'rounded-2xl bg-[var(--ud-bg-elevated)] shadow-xl border border-[var(--ud-border-subtle)]',
  input: 'rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-4 py-2.5 text-sm text-[var(--ud-text-primary)] outline-none placeholder:text-[var(--ud-text-muted)] focus:border-[var(--ud-border-focus)] focus:ring-1 focus:ring-[var(--ud-border-focus)]',
  section: 'px-4 sm:px-6 lg:px-10',
} as const;

// Backwards compat alias
export const spacing = {
  card: surfaces.card,
  cardHover: surfaces.cardHover,
  section: surfaces.section,
  modal: surfaces.elevated,
} as const;

export const animations = {
  default: 'transition-colors duration-150',
  scale: 'hover:scale-[1.02] transition-transform duration-150',
  fadeIn: 'animate-fade-in',
} as const;

export const iconSize = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const;

// ─── HEADER / FOOTER CLASSES ────────────────────────────────────────
export const layout = {
  header: 'sticky top-0 z-50 bg-[var(--ud-bg-card)] border-b border-[var(--ud-border-subtle)]',
  footer: 'border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] py-6',
  maxContent: 'mx-auto max-w-4xl',
} as const;
