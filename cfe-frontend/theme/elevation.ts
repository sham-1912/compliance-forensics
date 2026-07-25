import { ViewStyle } from 'react-native';

// 4 elevation levels, consistent with MD3 elevation tokens.
// Every Card/Dialog/AppBar in the app pulls its shadow from here.

type ElevationStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const elevation: Record<'flat' | 'resting' | 'raised' | 'modal', ElevationStyle> = {
  flat: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  resting: {
    // Default card state
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  raised: {
    // Pressed card / active state
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  modal: {
    // Dialogs, bottom sheets
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
};
