import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '@/theme';
import { useAppearance } from '@/theme/AppearanceContext';
import { StatusChip, StatusChipVariant } from './StatusChip';

interface ActivityListItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  timestamp: string;
  statusLabel: string;
  statusVariant: StatusChipVariant;
  onPress?: () => void;
}

export function ActivityListItem({
  icon,
  title,
  subtitle,
  timestamp,
  statusLabel,
  statusVariant,
  onPress,
}: ActivityListItemProps) {
  const { activeColors, scaledTypography } = useAppearance();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}, ${statusLabel}`}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: activeColors.codeBackground }]}>{icon}</View>
      <View style={styles.textCol}>
        <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]} numberOfLines={1}>
          {subtitle} · {timestamp}
        </Text>
      </View>
      <StatusChip label={statusLabel} variant={statusVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.6 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textCol: { flex: 1, marginRight: spacing.sm },
});
