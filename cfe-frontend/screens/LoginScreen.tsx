import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import { Button } from '@/components';
import { colors, layout, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.iconWrap}>
          <ShieldCheck size={48} color={colors.primary} strokeWidth={1.75} />
        </View>
        <Text style={[typography.headlineMedium, styles.title]}>
          Compliance Forensics Engine
        </Text>
        <Text style={[typography.bodyMedium, styles.subtitle]}>
          Government-grade consent verification for every incoming call
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <Button
          label="Continue with Phone"
          onPress={() => navigation.navigate('PhoneSignIn')}
        />
        <Text style={[typography.bodySmall, styles.legal]}>
          By continuing, you agree to our{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/terms')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://example.com/privacy')}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingBottom: spacing.xl,
  },
  heroSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: colors.textPrimary, textAlign: 'center' },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  bottomSection: { gap: spacing.md },
  legal: { color: colors.textSecondary, textAlign: 'center' },
  link: { color: colors.primary, fontWeight: '600' },
});
