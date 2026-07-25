import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, layout, spacing, typography } from '@/theme';
import { Button } from '@/components';
import { useAuth } from '@/navigation/AuthContext';

/**
 * TEMPORARY — stands in for Home Dashboard so Phase 1's login flow has
 * somewhere to land and can be demoed end-to-end. Replace entirely with
 * the real Home Dashboard in Phase 2; do not build on top of this file.
 */
export function PlaceholderHomeScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={[typography.headlineMedium, { color: colors.textPrimary }]}>
        Phase 1 complete
      </Text>
      <Text style={[typography.bodyMedium, styles.body]}>
        You're signed in. Home Dashboard, Bottom Nav, and everything else
        lands here in Phase 2.
      </Text>
      <View style={styles.ctaSpacing}>
        <Button label="Log out" onPress={logout} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontalPadding,
  },
  body: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  ctaSpacing: { marginTop: spacing.xl, minWidth: 160 },
});
