import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius } from '@/theme';

interface FullScreenLoaderProps {
  label?: string;
}

export function FullScreenLoader({ label }: FullScreenLoaderProps) {
  return (
    <View style={styles.fullScreen} accessibilityLabel={label ?? 'Loading'}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

/** A single shimmering skeleton block — compose several for a skeleton screen. */
export function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { backgroundColor: colors.border, borderRadius: radius.medium },
        style,
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
