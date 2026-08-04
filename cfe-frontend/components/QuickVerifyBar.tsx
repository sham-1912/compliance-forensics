import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronRight, Search } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Card } from './Card';
import { StatusChip, StatusChipVariant } from './StatusChip';

interface QuickVerifyResult {
  label: string;
  variant: StatusChipVariant;
}

interface QuickVerifyBarProps {
  onViewDetails: () => void;
}

const RESULT_CYCLE: QuickVerifyResult[] = [
  { label: 'Verified', variant: 'success' },
  { label: 'No Consent Found', variant: 'error' },
  { label: 'Unverified', variant: 'warning' },
];

/** Inline phone input + "Verify" button. Pure UI simulation — the result
 * is derived deterministically from the input so the same number always
 * demos the same outcome, never a real lookup. */
export function QuickVerifyBar({ onViewDetails }: QuickVerifyBarProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickVerifyResult | null>(null);

  const canSubmit = phone.replace(/\D/g, '').length >= 6 && !loading;

  const handleVerify = () => {
    if (!canSubmit) return;
    setResult(null);
    setLoading(true);
    setTimeout(() => {
      const digits = phone.replace(/\D/g, '');
      const lastDigit = Number(digits[digits.length - 1] ?? '0');
      setResult(RESULT_CYCLE[lastDigit % RESULT_CYCLE.length]);
      setLoading(false);
    }, 1000);
  };

  return (
    <Card variant="default" style={styles.card}>
      <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>Quick Verify</Text>
      <View style={styles.inputRow}>
        <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            setResult(null);
          }}
          placeholder="Enter phone number"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
          style={[typography.bodyMedium, styles.input, { color: colors.textPrimary }]}
        />
        <Pressable
          onPress={handleVerify}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Verify number"
          style={[styles.verifyBtn, { opacity: canSubmit ? 1 : 0.5 }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[typography.labelMedium, { color: '#FFFFFF' }]}>Verify</Text>
          )}
        </Pressable>
      </View>

      {result && (
        <View style={styles.resultRow}>
          <StatusChip label={result.label} variant={result.variant} />
          <Pressable
            onPress={onViewDetails}
            style={styles.detailsLink}
            accessibilityRole="button"
            accessibilityLabel="View verification details"
          >
            <Text style={[typography.labelMedium, { color: colors.primary }]}>View Details</Text>
            <ChevronRight size={14} color={colors.primary} />
          </Pressable>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  searchIcon: { marginRight: spacing.xs },
  input: { flex: 1, paddingVertical: spacing.sm },
  verifyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  detailsLink: { flexDirection: 'row', alignItems: 'center' },
});
