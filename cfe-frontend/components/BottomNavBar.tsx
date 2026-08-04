import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FileText, Home, Search, Settings, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, spacing, typography } from '@/theme';
import { useAppearance } from '@/theme/AppearanceContext';

export type NavTab = 'home' | 'verify' | 'reports' | 'profile' | 'settings';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
}

const TABS: { key: NavTab; label: string; Icon: typeof Home }[] = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'verify', label: 'Verify', Icon: Search },
  { key: 'reports', label: 'Reports', Icon: FileText },
  { key: 'profile', label: 'Profile', Icon: User },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

export function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  const { activeColors } = useAppearance();

  return (
    <View style={[
      styles.bar,
      elevation.modal,
      {
        backgroundColor: activeColors.surface,
        borderTopColor: activeColors.border,
        paddingBottom: Math.max(insets.bottom, spacing.xs)
      }
    ]}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = key === activeTab;
        const tint = isActive ? activeColors.primary : activeColors.textSecondary;
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
            <Icon size={20} color={tint} strokeWidth={isActive ? 2.4 : 2} />
            <Text style={[typography.labelSmall, { color: tint, marginTop: 2, fontSize: 10 }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.xs,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
