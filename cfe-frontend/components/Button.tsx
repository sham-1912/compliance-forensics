import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { radius, spacing } from '@/theme';
import { useAppearance } from '@/theme/AppearanceContext';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

interface ButtonProps {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { activeColors, scaledTypography } = useAppearance();

  const variantStyles: Record<
    ButtonVariant,
    { bg: string; bgPressed: string; text: string; border?: string }
  > = {
    primary: { bg: activeColors.primary, bgPressed: activeColors.primaryPressed, text: '#FFFFFF' },
    secondary: {
      bg: 'transparent',
      bgPressed: activeColors.border,
      text: activeColors.primary,
      border: activeColors.primary,
    },
    tertiary: { bg: 'transparent', bgPressed: activeColors.border, text: activeColors.primary },
    destructive: { bg: activeColors.error, bgPressed: '#B91C1C', text: '#FFFFFF' },
  };

  const v = variantStyles[variant];
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: disabled ? activeColors.border : pressed ? v.bgPressed : v.bg,
          borderColor: v.border,
          borderWidth: v.border ? 1 : 0,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'secondary' || variant === 'tertiary' ? activeColors.primary : '#FFFFFF'}
            style={styles.spinner}
          />
        )}
        <Text
          style={[
            scaledTypography.labelLarge,
            { color: disabled ? activeColors.textDisabled : v.text },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center' },
  spinner: { marginRight: spacing.xs },
});
