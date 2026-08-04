// 8pt base grid. Every margin/padding/gap in the app must use one of
// these raw values via the semantic aliases below — never a one-off number.

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// Semantic aliases — reference these in components/screens, not raw scale
// values, so the mapping stays documented and swappable in one place.
export const layout = {
  screenHorizontalPadding: spacing.md, // 16 — every screen, no exceptions
  cardGap: spacing.md, // 16 — gap between sibling cards
  cardInternalPadding: spacing.md, // 16 — padding inside a card
  formFieldGap: spacing.sm, // 12 — gap between stacked form fields
  sectionGap: spacing.lg, // 24 — gap between distinct page sections
  bottomNavSafePadding: spacing.xl, // 32 — bottom padding above Bottom Nav / safe area
} as const;
