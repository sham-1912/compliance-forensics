import { Platform, TextStyle } from 'react-native';

// Single system font family (Roboto on Android) + one monospace family.
// Every screen after Phase 1 must reference these tokens — no inline
// fontSize/fontWeight/lineHeight values anywhere else in the app.

const systemFont = Platform.select({ android: 'Roboto', default: 'System' });
const monoFont = Platform.select({
  android: 'monospace',
  ios: 'Menlo',
  default: 'monospace',
});

type Scale = Record<
  | 'displayLarge'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall'
  | 'codeMono',
  TextStyle
>;

export const typography: Scale = {
  displayLarge: {
    fontFamily: systemFont,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.25,
  },
  headlineLarge: {
    fontFamily: systemFont,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: systemFont,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: systemFont,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: systemFont,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  titleSmall: {
    fontFamily: systemFont,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: systemFont,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily: systemFont,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.15,
  },
  bodySmall: {
    fontFamily: systemFont,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  labelLarge: {
    fontFamily: systemFont,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: systemFont,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontFamily: systemFont,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  // Monospace, tabular figures — hashes, IDs, raw JSON, OTP digits, numeric alignment.
  codeMono: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
  },
};
