import React, { useCallback, useEffect } from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/theme';

export type SnackbarVariant = 'success' | 'error' | 'info';

interface SnackbarProps {
  message: string;
  variant?: SnackbarVariant;
  visible: boolean;
  onDismiss: () => void;
  durationMs?: number;
}

const VARIANT_BG: Record<SnackbarVariant, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.textPrimary,
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export function Snackbar({
  message,
  variant = 'info',
  visible,
  onDismiss,
  durationMs = 3000,
}: SnackbarProps) {
  const translateY = useSharedValue(80);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(80, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onDismiss)();
        });
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [visible, durationMs, onDismiss, translateY, opacity]);

  const dismiss = useCallback(() => onDismiss(), [onDismiss]);

  const swipeGesture = Gesture.Pan().onUpdate((e) => {
    translateX.value = e.translationX;
  }).onEnd((e) => {
    if (Math.abs(e.translationX) > SCREEN_WIDTH * 0.3) {
      translateX.value = withTiming(Math.sign(e.translationX) * SCREEN_WIDTH, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished) runOnJS(dismiss)();
      });
    } else {
      translateX.value = withTiming(0);
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        style={[styles.container, { backgroundColor: VARIANT_BG[variant] }, animatedStyle]}
      >
        <Text style={[typography.bodyMedium, { color: '#FFFFFF' }]}>{message}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xl,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
