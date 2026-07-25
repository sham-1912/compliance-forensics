import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing, typography } from '@/theme';

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  elevated?: boolean; // true once content has scrolled beneath it
}

export function TopAppBar({ title, onBack, trailing, elevated = false }: TopAppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + spacing.xs },
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
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>
      <Text style={[typography.titleLarge, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.slot, styles.trailingSlot]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background,
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
