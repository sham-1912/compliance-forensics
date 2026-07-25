import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import { Button, InputField, TopAppBar } from '@/components';
import { colors, layout, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailSignIn'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailSignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const isValid = EMAIL_REGEX.test(email);
  const showError = touched && email.length > 0 && !isValid;

  function handleSendOtp() {
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OtpVerification', { mode: 'email', email });
    }, 1200);
  }

  return (
    <View style={styles.container}>
      <TopAppBar title="Sign in" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={[typography.bodyMedium, styles.helper]}>
          Enter your work email and we'll send you a one-time verification code.
        </Text>
        <InputField
          label="Email address"
          placeholder="you@organization.com"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTouched(true)}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          errorText={showError ? 'Enter a valid email address' : undefined}
        />
        <View style={styles.ctaSpacing}>
          <Button
            label="Send OTP"
            onPress={handleSendOtp}
            disabled={!isValid}
            loading={loading}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: layout.screenHorizontalPadding, paddingTop: spacing.md },
  helper: { color: colors.textSecondary, marginBottom: spacing.lg },
  ctaSpacing: { marginTop: spacing.lg },
});
