import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });

    // No real initialization happens here — this is a UI-only splash timer.
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.iconWrap}>
          <ShieldCheck size={56} color={colors.primary} strokeWidth={1.75} />
        </View>
        <Text style={[typography.headlineLarge, styles.wordmark]}>
          Compliance Forensics Engine
        </Text>
        <Text style={[typography.bodyMedium, styles.tagline]}>
          Verified Consent. Verified Trust.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center', paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  wordmark: { color: colors.textPrimary, textAlign: 'center' },
  tagline: { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
});
