// Design system color tokens — established once in Phase 1.
// Do NOT introduce ad hoc colors anywhere else in the app; every color
// used in a component or screen must come from this file.

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (num & 0xff) * (1 - amount));
  return `#${[r, g, b]
    .map((c) => Math.round(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

function withOpacity(hex: string, opacity: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const primary = '#0F766E';
const textSecondary = '#64748B';

export const colors = {
  background: '#EAF8F7',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FEFD', // cards sitting on background

  primary,
  primaryPressed: darken(primary, 0.1), // ~10% darker than primary

  secondary: '#14B8A6',
  accent: '#2DD4BF',

  border: '#D1FAE5',

  textPrimary: '#0F172A',
  textSecondary,
  textDisabled: withOpacity(textSecondary, 0.4),

  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',

  overlay: 'rgba(15, 23, 42, 0.5)', // dialogs, bottom sheets, scrims

  // Pre-approved additions (Section 4.1) — do not add further tokens here
  // without updating the spec; derive, never invent ad hoc.
  infoNeutral: '#5B8A87', // primary at reduced saturation — role badges, non-status labels
  codeBackground: '#F1F5F4', // monospace/forensic data blocks, distinct from surfaceElevated
};

export type ColorToken = keyof typeof colors;
