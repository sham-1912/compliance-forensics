import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import { useAuth } from '@/navigation/AuthContext';
import { Button, OTPInput, Snackbar, TopAppBar } from '@/components';
import { colors, layout, spacing, typography } from '@/theme';
import {
  MOCK_INCORRECT_OTP_DEMO,
  OTP_RESEND_COOLDOWN_SECONDS,
  maskEmail,
} from '@/mockData/mockOTP';
import { getPendingConfirmation, clearPendingConfirmation } from '@/navigation/phoneAuthConfirmation';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length !== 10) return phone;
  return `+91 ${clean.slice(0, 5)} ${clean.charAt(5)}****${clean.charAt(9)}`;
}

export function OtpVerificationScreen({ navigation, route }: Props) {
  const { mode, email, phone } = route.params;
  const { login } = useAuth();

  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('Incorrect code — please try again');
  const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleResend() {
    if (cooldown > 0) return;
    setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
  }

  function handleVerify() {
    if (otp.length !== 6) return;
    if (mode === 'phone') {
      handleVerifyPhone();
    } else {
      handleVerifyEmailMock();
    }
  }

  async function handleVerifyPhone() {
    setVerifying(true);
        // Offline bypass for hackathon presentation mock number
      const normalizedPhone = (phone || '').replace(/\D/g, '');
      if (normalizedPhone.slice(-10) === '9999900000') {
        setTimeout(async () => {
          setVerifying(false);
          if (otp === '123456') {
            setVerified(true);
            // Create a Firebase anonymous session so auth persists across restarts
            try {
              const firebaseAuth = require('@react-native-firebase/auth').default;
              await firebaseAuth().signInAnonymously();
            } catch (_) {}
            setTimeout(() => login(), 600);
          } else {
            setShakeTrigger((n) => n + 1);
            setSnackbarMessage('Incorrect code — please try again');
            setSnackbarVisible(true);
            setOtp('');
          }
        }, 1000);
        return;
      }

    const confirmation = getPendingConfirmation();
    if (!confirmation) {
      setVerifying(false);
      setSnackbarMessage('Session expired — go back and resend the code.');
      setSnackbarVisible(true);
      return;
    }

    try {
      await confirmation.confirm(otp);
      clearPendingConfirmation();
      setVerifying(false);
      setVerified(true);
      setTimeout(() => login(), 600);
    } catch (err: any) {
      setVerifying(false);
      setShakeTrigger((n) => n + 1);
      setSnackbarMessage(err?.message ?? 'Incorrect code — please try again');
      setSnackbarVisible(true);
      setOtp('');
    }
  }

  function handleVerifyEmailMock() {
    setVerifying(true);
    setTimeout(async () => {
      setVerifying(false);
      if (otp === MOCK_INCORRECT_OTP_DEMO) {
        setShakeTrigger((n) => n + 1);
        setSnackbarMessage('Incorrect code — please try again');
        setSnackbarVisible(true);
        setOtp('');
        return;
      }
      setVerified(true);
      // Create a Firebase anonymous session so auth persists across restarts
      try {
        const firebaseAuth = require('@react-native-firebase/auth').default;
        await firebaseAuth().signInAnonymously();
      } catch (_) {}
      setTimeout(() => {
        login();
      }, 600);
    }, 1200);
  }

  const helperText = mode === 'phone'
    ? `Code sent to ${phone ? maskPhone(phone) : ''}`
    : `Code sent to ${maskEmail(email ?? '')}`;

  return (
    <View style={styles.container}>
      <TopAppBar title="Verify code" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        {verified ? (
          <View style={styles.successState}>
            <CheckCircle2 size={56} color={colors.success} strokeWidth={1.75} />
            <Text style={[typography.titleMedium, styles.successText]}>Verified</Text>
          </View>
        ) : (
          <>
            <Text style={[typography.bodyMedium, styles.helper]}>{helperText}</Text>
            <OTPInput value={otp} onChange={setOtp} triggerShake={shakeTrigger} />

            <View style={styles.resendRow}>
              <Text
                style={[
                  typography.bodySmall,
                  { color: cooldown > 0 ? colors.textDisabled : colors.primary },
                ]}
                onPress={handleResend}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </Text>
            </View>

            <View style={styles.ctaSpacing}>
              <Button
                label="Verify"
                onPress={handleVerify}
                disabled={otp.length !== 6}
                loading={verifying}
              />
            </View>
          </>
        )}
      </View>

      <Snackbar
        message={snackbarMessage}
        variant="error"
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: layout.screenHorizontalPadding, paddingTop: spacing.lg },
  resendRow: { alignItems: 'center', marginTop: spacing.lg },
  ctaSpacing: { marginTop: spacing.xl },
  successState: { alignItems: 'center', paddingTop: spacing.xxl },
  successText: { color: colors.textPrimary, marginTop: spacing.md },
  helper: { color: colors.textSecondary, marginBottom: spacing.lg },
});
