import React, { useRef } from 'react';
import { StyleSheet, TextInput, View, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/theme';

const OTP_LENGTH = 6;

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  triggerShake?: number; // increment to trigger a shake animation
}

export function OTPInput({ value, onChange, error = false, triggerShake }: OTPInputProps) {
  const hiddenInputRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);

  React.useEffect(() => {
    if (triggerShake !== undefined) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerShake]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  return (
    <TouchableWithoutFeedback onPress={() => hiddenInputRef.current?.focus()}>
      <Animated.View style={[styles.row, animatedStyle]}>
        {digits.map((digit, index) => {
          const isActive = value.length === index;
          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  borderColor: error ? colors.error : isActive ? colors.primary : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Animated.Text style={[typography.codeMono, styles.digit]}>{digit}</Animated.Text>
            </View>
          );
        })}
        {/* Single hidden input drives all 6 boxes so auto-advance / backspace
            work natively without manual focus juggling between 6 TextInputs. */}
        <TextInput
          ref={hiddenInputRef}
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          style={styles.hiddenInput}
          autoFocus
          accessibilityLabel="One-time passcode"
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  box: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { color: colors.textPrimary, fontSize: 20 },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
});
