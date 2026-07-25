// Fixed corner-radius scale. Every component in every phase pulls
// from this — never a one-off radius value.

export const radius = {
  small: 6, // chips, badges
  medium: 10, // inputs, buttons
  large: 16, // cards
  full: 999, // pills, avatars, FAB
} as const;
