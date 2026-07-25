import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, PhoneIncoming, ShieldQuestion } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Card } from './Card';
import { Button } from './Button';
import { StatusChip, StatusChipVariant } from './StatusChip';

interface IncomingCaller {
  maskedNumber: string;
  statusLabel: string;
  statusVariant: StatusChipVariant;
}

interface IncomingCallCardProps {
  hasIncomingCall: boolean;
  caller?: IncomingCaller;
  onManualCheck: () => void;
  onViewFullReport: () => void;
  onToggleDemo: () => void;
}

/** Default idle state ("no active calls") plus a togglable "incoming call"
 * state, per spec Section 6 / Phase 2 item 3. */
export function IncomingCallCard({
  hasIncomingCall,
  caller,
  onManualCheck,
  onViewFullReport,
  onToggleDemo,
}: IncomingCallCardProps) {
  return (
    <Card variant="outlined" style={styles.card}>
      {hasIncomingCall && caller ? (
        <View>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.codeBackground }]}>
              <PhoneIncoming size={22} color={colors.primary} />
            </View>
            <View style={styles.textCol}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Incoming call
              </Text>
              <Text style={[typography.codeMono, { color: colors.textSecondary }]}>
                {caller.maskedNumber}
              </Text>
            </View>
            <StatusChip label={caller.statusLabel} variant={caller.statusVariant} />
          </View>
          <Pressable
            onPress={onViewFullReport}
            style={styles.linkRow}
            accessibilityRole="button"
            accessibilityLabel="View full report"
          >
            <Text style={[typography.labelLarge, { color: colors.primary }]}>View Full Report</Text>
            <ChevronRight size={16} color={colors.primary} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.idleRow}>
          <View style={styles.idleIconWrap}>
            <ShieldQuestion size={22} color={colors.textSecondary} />
          </View>
          <View style={styles.textCol}>
            <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>No active calls</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              We'll verify consent the moment a call comes in.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        {!hasIncomingCall && (
          <View style={styles.manualCheckBtn}>
            <Button label="Run Manual Check" onPress={onManualCheck} variant="secondary" fullWidth={false} />
          </View>
        )}
        <Pressable onPress={onToggleDemo} hitSlop={8} accessibilityRole="button" accessibilityLabel="Toggle incoming call preview (demo)">
          <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
            {hasIncomingCall ? 'Clear (demo)' : 'Simulate call (demo)'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: { flexDirection: 'row', alignItems: 'center' },
  idleRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  idleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.medium,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textCol: { flex: 1 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  manualCheckBtn: { minWidth: 170 },
});
