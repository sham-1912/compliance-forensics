import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type StatusChipVariant = 'success' | 'warning' | 'error' | 'neutral';

interface StatusChipProps {
  label: string;
  variant: StatusChipVariant;
  icon?: React.ReactNode;
}

const VARIANT_COLORS: Record<StatusChipVariant, { bg: string; text: string }> = {
  success: { bg: '#DCFCE7', text: colors.success },
  warning: { bg: '#FEF3C7', text: colors.warning },
  error: { bg: '#FEE2E2', text: colors.error },
  // Neutral uses infoNeutral, deliberately distinct from the three status
  // colors so it never reads as a result (used for roles, categories, etc).
  neutral: { bg: colors.border, text: colors.infoNeutral },
};

export function StatusChip({ label, variant, icon }: StatusChipProps) {
  const c = VARIANT_COLORS[variant];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      {icon}
      <Text style={[typography.labelMedium, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.small,
  },
});
