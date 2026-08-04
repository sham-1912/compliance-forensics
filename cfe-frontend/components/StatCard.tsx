import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { radius, spacing } from '@/theme';
import { useAppearance } from '@/theme/AppearanceContext';
import { Card } from './Card';

export type TrendVariant = 'positive' | 'negative' | 'neutral';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trendLabel?: string;
  trendDirection?: 'up' | 'down';
  trendVariant?: TrendVariant;
}

export function StatCard({ icon, label, value, trendLabel, trendDirection, trendVariant = 'neutral' }: StatCardProps) {
  const { activeColors, scaledTypography } = useAppearance();
  const TrendIcon = trendDirection === 'down' ? TrendingDown : TrendingUp;

  const trendColor = trendVariant === 'positive' ? activeColors.success : trendVariant === 'negative' ? activeColors.error : activeColors.textSecondary;

  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: activeColors.border }]}>{icon}</View>
      <Text style={[scaledTypography.headlineMedium, { color: activeColors.textPrimary }]}>{value}</Text>
      <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary, marginTop: 2 }]} numberOfLines={2}>
        {label}
      </Text>
      {trendLabel && (
        <View style={styles.trendRow}>
          <TrendIcon size={14} color={trendColor} />
          <Text style={[scaledTypography.labelSmall, { color: trendColor }]}>{trendLabel}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
});
