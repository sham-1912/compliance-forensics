import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import { Button, InputField, TopAppBar } from '@/components';
import { colors, layout, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailSignIn'>;

const PHONE_REGEX = /^\d{10}$/;

export function EmailSignInScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = PHONE_REGEX.test(phone);
  const showError = touched && phone.length > 0 && !isValid;

  function handleSendOtp() {
    if (!isValid) return;
    setLoading(true);
    // Simulated async — no real network call.
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OtpVerification', { email: phone });
    }, 1200);
  }

  return (
    <View style={styles.container}>
      <TopAppBar title="Sign in" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={[typography.bodyMedium, styles.helper]}>
          Enter your phone number and we'll send you a one-time verification code.
        </Text>
        <InputField
          label="Phone number"
          placeholder="99999 00000"
          value={phone}
          onChangeText={(text) => {
            // Keep only digits
            const digits = text.replace(/\D/g, '').slice(0, 10);
            setPhone(digits);
          }}
          onBlur={() => setTouched(true)}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="phone-pad"
          errorText={showError ? 'Enter a valid 10-digit phone number' : undefined}
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
