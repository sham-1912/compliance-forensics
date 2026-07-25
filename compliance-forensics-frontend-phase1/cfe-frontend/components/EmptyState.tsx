import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  headline: string;
  supportingText: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Single consistent empty/error-state pattern reused across every
 * list-bearing screen in the app (Recent Activity, Recent Searches,
 * Audit Logs, History, Analytics charts, etc). */
export function EmptyState({
  icon,
  headline,
  supportingText,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon}
      <Text style={[typography.titleMedium, styles.headline]}>{headline}</Text>
      <Text style={[typography.bodyMedium, styles.supporting]}>{supportingText}</Text>
      {actionLabel && onAction && (
        <View style={styles.actionWrap}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  headline: { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' },
  supporting: {
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  actionWrap: { marginTop: spacing.lg },
});
