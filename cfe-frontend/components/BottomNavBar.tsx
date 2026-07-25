import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FileText, Home, Search, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, spacing, typography } from '@/theme';

export type NavTab = 'home' | 'verify' | 'reports' | 'settings';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
}

const TABS: { key: NavTab; label: string; Icon: typeof Home }[] = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'verify', label: 'Verify', Icon: Search },
  { key: 'reports', label: 'Reports', Icon: FileText },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

/**
 * Fully custom bottom tab bar (Section 3 forbids Material-library
 * components). In Phase 2 only "Home" is a real destination — the other
 * three tabs stay visually present but non-functional; pressing them is
 * handled entirely by the parent screen (a "coming soon" Snackbar), per
 * spec Phase 2 item 8. Real navigation for Verify/Reports/Settings gets
 * wired up as those screens are built in later phases.
 */
export function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, elevation.modal, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = key === activeTab;
        const tint = isActive ? colors.primary : colors.textSecondary;
        return (
          <Pressable
            key={key}
            onPress={() => onTabPress(key)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
            style={styles.tab}
            hitSlop={4}
          >
            <Icon size={22} color={tint} strokeWidth={isActive ? 2.4 : 2} />
            <Text style={[typography.labelSmall, { color: tint, marginTop: 2 }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
