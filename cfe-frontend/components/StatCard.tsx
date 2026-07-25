import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Card } from './Card';

export type TrendVariant = 'positive' | 'negative' | 'neutral';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trendLabel?: string;
  trendDirection?: 'up' | 'down';
  /**
   * Whether the trend is good, bad, or neutral for THIS metric — not a
   * blind "up = green" rule. E.g. a rise in "Trust Score" is positive,
   * but a rise in "Consent Violations Blocked" is framed neutral/positive
   * (more caught) while a rise in a suspicious-activity count elsewhere
   * in the app is framed negative. Callers decide this per metric.
   */
  trendVariant?: TrendVariant;
}

const TREND_COLOR: Record<TrendVariant, string> = {
  positive: colors.success,
  negative: colors.error,
  neutral: colors.textSecondary,
};

/** Half-width stat tile used in the Home Dashboard's 2x2 grid and reused
 * later in Analytics. Always render two side by side inside a row with
 * `spacing.md` gap — this component does not set its own outer width. */
export function StatCard({ icon, label, value, trendLabel, trendDirection, trendVariant = 'neutral' }: StatCardProps) {
  const TrendIcon = trendDirection === 'down' ? TrendingDown : TrendingUp;
  const trendColor = TREND_COLOR[trendVariant];

  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[typography.headlineMedium, styles.value]}>{value}</Text>
      <Text style={[typography.bodySmall, styles.label]} numberOfLines={2}>
        {label}
      </Text>
      {trendLabel && (
        <View style={styles.trendRow}>
          <TrendIcon size={14} color={trendColor} />
          <Text style={[typography.labelSmall, { color: trendColor }]}>{trendLabel}</Text>
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
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: { color: colors.textPrimary },
  label: { color: colors.textSecondary, marginTop: 2 },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
});
