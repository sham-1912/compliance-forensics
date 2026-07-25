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

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

export function OtpVerificationScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { login } = useAuth();

  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleResend() {
    if (cooldown > 0) return;
    setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    // Simulated resend — no real OTP dispatch.
  }

  function handleVerify() {
    if (otp.length !== 6) return;
    setVerifying(true);
    // Simulated async verification. Typing the designated demo "wrong
    // code" resolves as failure; any other 6-digit code succeeds.
    setTimeout(() => {
      setVerifying(false);
      if (otp === MOCK_INCORRECT_OTP_DEMO) {
        setShakeTrigger((n) => n + 1);
        setSnackbarVisible(true);
        setOtp('');
        return;
      }
      setVerified(true);
      setTimeout(() => {
        // Reset the nav stack — user should not be able to back-navigate
        // into the auth flow after this point.
        login();
      }, 600);
    }, 1200);
  }

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
            <Text style={[typography.bodyMedium, styles.helper]}>
              Code sent to {maskEmail(email)}
            </Text>
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
        message="Incorrect code — please try again"
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
  helper: { color: colors.textSecondary, marginBottom: spacing.lg },
  resendRow: { alignItems: 'center', marginTop: spacing.lg },
  ctaSpacing: { marginTop: spacing.xl },
  successState: { alignItems: 'center', paddingTop: spacing.xxl },
  successText: { color: colors.textPrimary, marginTop: spacing.md },
});
