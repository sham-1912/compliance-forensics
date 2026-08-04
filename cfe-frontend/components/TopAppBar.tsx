import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, spacing } from '@/theme';
import { useAppearance } from '@/theme/AppearanceContext';

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  elevated?: boolean;
}

export function TopAppBar({ title, onBack, trailing, elevated = false }: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const { activeColors, scaledTypography } = useAppearance();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: activeColors.background,
          paddingTop: insets.top + spacing.xs
        },
        elevated && styles.elevatedShadow,
      ]}
    >
      <View style={styles.slot}>
        {onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <ChevronLeft size={24} color={activeColors.textPrimary} />
          </Pressable>
        )}
      </View>
      <Text style={[scaledTypography.titleLarge, { color: activeColors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.slot, styles.trailingSlot]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingBottom: spacing.sm,
  },
  elevatedShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  slot: { width: 32, alignItems: 'flex-start' },
  trailingSlot: { alignItems: 'flex-end' },
});
