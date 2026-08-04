import React from 'react';
import { StyleSheet, View } from 'react-native';
import { layout, radius, spacing } from '@/theme';
import { SkeletonBlock } from './LoadingIndicator';

/** Shown ~800ms on mount (and briefly on pull-to-refresh) before real
 * dashboard content fades in. Mirrors the real layout's proportions so
 * the transition doesn't jump. */
export function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <SkeletonBlock style={styles.avatar} />
        <SkeletonBlock style={styles.greeting} />
        <SkeletonBlock style={styles.bell} />
      </View>

      <SkeletonBlock style={styles.heroCard} />
      <SkeletonBlock style={styles.mediumCard} />
      <SkeletonBlock style={styles.mediumCard} />

      <View style={styles.statGrid}>
        <SkeletonBlock style={styles.statCard} />
        <SkeletonBlock style={styles.statCard} />
      </View>
      <View style={styles.statGrid}>
        <SkeletonBlock style={styles.statCard} />
        <SkeletonBlock style={styles.statCard} />
      </View>

      <SkeletonBlock style={styles.rowItem} />
      <SkeletonBlock style={styles.rowItem} />
      <SkeletonBlock style={styles.rowItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: layout.screenHorizontalPadding, paddingTop: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 40, height: 40, borderRadius: radius.full },
  greeting: { flex: 1, height: 20, marginLeft: spacing.sm, borderRadius: radius.small },
  bell: { width: 24, height: 24, borderRadius: radius.small },
  heroCard: { height: 96, borderRadius: radius.large, marginBottom: spacing.md },
  mediumCard: { height: 84, borderRadius: radius.large, marginBottom: spacing.md },
  statGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: { flex: 1, height: 96, borderRadius: radius.large },
  rowItem: { height: 48, borderRadius: radius.medium, marginBottom: spacing.sm },
});
