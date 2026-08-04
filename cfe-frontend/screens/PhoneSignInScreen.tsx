import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import auth from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import { Button, InputField, TopAppBar } from '@/components';
import { colors, layout, spacing, typography } from '@/theme';
import { setPendingConfirmation } from '@/navigation/phoneAuthConfirmation';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneSignIn'>;

// Validates international phone format (e.g. +919999900000)
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export function PhoneSignInScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('+91 ');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>(undefined);

  const normalized = phone.replace(/[\s-]/g, '');
  const isValid = PHONE_REGEX.test(normalized);
  const showFormatError = touched && phone.trim().length > 4 && !isValid;

  async function handleSendOtp() {
    if (!isValid) return;
    setLoading(true);
    setErrorText(undefined);

    // Offline bypass for hackathon presentation mock number
    if (normalized === '+919999900000') {
      setTimeout(() => {
        setLoading(false);
        navigation.navigate('OtpVerification', { mode: 'phone', phone: normalized });
      }, 800);
      return;
    }

    try {
      const confirmation: FirebaseAuthTypes.ConfirmationResult =
        await auth().signInWithPhoneNumber(normalized);
      setPendingConfirmation(confirmation);
      navigation.navigate('OtpVerification', { mode: 'phone', phone: normalized });
    } catch (err: any) {
      setErrorText(err?.message ?? 'Could not send code. Check the number and try again.');
    } finally {
      setLoading(false);
    }
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
          placeholder="+91 98765 43210"
          value={phone}
          onChangeText={setPhone}
          onBlur={() => setTouched(true)}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="phone-pad"
          errorText={showFormatError ? 'Enter a valid number with country code (e.g. +91 ...)' : errorText}
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
