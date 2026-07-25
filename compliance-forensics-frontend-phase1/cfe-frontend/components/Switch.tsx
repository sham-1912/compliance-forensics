import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, radius } from '@/theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;

export function Switch({ value, onValueChange, disabled = false, accessibilityLabel }: SwitchProps) {
  const progress = useDerivedValue(() => withTiming(value ? 1 : 0, { duration: 150 }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.border, colors.primary]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * (TRACK_WIDTH - THUMB_SIZE - 6) },
    ],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? 0.5 : 1 }}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    justifyContent: 'center',
    padding: 3,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
  },
});
