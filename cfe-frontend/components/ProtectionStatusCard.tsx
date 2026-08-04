import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Shield, ShieldOff } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { radius, spacing } from '@/theme';
import { useAppearance } from '@/theme/AppearanceContext';
import { Card } from './Card';

export type ProtectionStatus = 'active' | 'paused';

interface ProtectionStatusCardProps {
  status: ProtectionStatus;
  lastScanLabel: string;
  onToggleDemo: () => void;
}

export function ProtectionStatusCard({ status, lastScanLabel, onToggleDemo }: ProtectionStatusCardProps) {
  const { activeColors, scaledTypography } = useAppearance();
  const isActive = status === 'active';
  const tint = isActive ? activeColors.success : activeColors.warning;
  const tintBg = isActive ? '#DCFCE7' : '#FEF3C7';
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (isActive) {
      ringScale.value = withRepeat(
        withTiming(1.6, { duration: 1800, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    } else {
      ringScale.value = 1;
      ringOpacity.value = 0;
    }
  }, [isActive, ringScale, ringOpacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: tintBg }]}>
          {isActive && (
            <Animated.View
              pointerEvents="none"
              style={[styles.ring, { borderColor: tint }, ringStyle]}
            />
          )}
          {isActive ? (
            <Shield size={28} color={tint} fill={tint} fillOpacity={0.15} />
          ) : (
            <ShieldOff size={28} color={tint} />
          )}
        </View>
        <View style={styles.textCol}>
          <Text style={[scaledTypography.titleLarge, { color: activeColors.textPrimary }]}>
            {isActive ? 'Protection Active' : 'Protection Paused'}
          </Text>
          <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary, marginTop: 2 }]}>
            {isActive
              ? 'Consent verification is running on all incoming calls.'
              : 'Incoming calls will not be checked until you resume.'}
          </Text>
        </View>
      </View>
      <View style={[styles.footerRow, { borderTopColor: activeColors.border }]}>
        <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Last scan: {lastScanLabel}</Text>
        <Pressable onPress={onToggleDemo} hitSlop={8} accessibilityRole="button" accessibilityLabel="Toggle protection status (demo)">
          <Text style={[scaledTypography.labelSmall, { color: activeColors.primary }]}>
            {isActive ? 'Pause (demo)' : 'Resume (demo)'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  ring: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: radius.full,
    borderWidth: 2,
  },
  textCol: { flex: 1 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
});
