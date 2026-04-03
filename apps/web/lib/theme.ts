// uDeets Design System
// Primary: Band app inspired - clean, premium, mobile-first

export const colors = {
  primary: '#0C5C57',
  primaryHover: '#0a4f4a',
  primaryLight: '#E3F1EF',
  primaryMid: '#A9D1CA',
  primaryDark: '#1a3a35',

  bgPage: '#ffffff',
  bgCard: '#ffffff',
  bgSubtle: '#fafafa',

  textPrimary: '#111111',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',

  border: '#e5e7eb',
  borderFocus: '#0C5C57',

  danger: '#ef4444',
  dangerHover: '#dc2626',
  warning: '#f59e0b',
  success: '#22c55e',
} as const;

export const buttons = {
  primary: 'bg-[#0C5C57] text-white hover:bg-[#0a4f4a] transition-colors duration-150',
  outline: 'border border-[#0C5C57] text-[#0C5C57] hover:bg-[#E3F1EF] transition-colors duration-150',
  ghost: 'text-[#0C5C57] hover:bg-[#E3F1EF] transition-colors duration-150',
  danger: 'bg-red-500 text-white hover:bg-red-600 transition-colors duration-150',
  dangerOutline: 'border border-red-500 text-red-500 hover:bg-red-50 transition-colors duration-150',
} as const;

export const typography = {
  // Headings - semibold, tight tracking
  h1: 'text-3xl sm:text-4xl font-semibold tracking-tight text-[#111111]',
  h2: 'text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]',
  h3: 'text-xl font-semibold tracking-tight text-[#111111]',
  h4: 'text-lg font-semibold tracking-tight text-[#111111]',

  // Body
  body: 'text-base text-[#111111]',
  bodySmall: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500',

  // Labels
  label: 'text-sm font-medium text-[#111111]',
  labelMuted: 'text-sm font-medium text-gray-500',
} as const;

export const spacing = {
  card: 'rounded-xl border border-slate-100 bg-white shadow-sm',
  cardHover: 'rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-300 transition',
  section: 'px-4 sm:px-6 lg:px-10',
  modal: 'rounded-2xl bg-white shadow-xl border border-slate-100',
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
