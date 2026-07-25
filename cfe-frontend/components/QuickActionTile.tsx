import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface QuickActionTileProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

/** Non-functional-stub tile (spec Phase 2, item 7) — every tile calls
 * back to the screen, which shows a "Coming soon" Snackbar. */
export function QuickActionTile({ icon, label, onPress }: QuickActionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[typography.labelMedium, styles.label]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.large,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  pressed: { backgroundColor: colors.border },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: { color: colors.textPrimary, textAlign: 'center' },
});
