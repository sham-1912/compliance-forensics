import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

interface ButtonProps {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { bg: string; bgPressed: string; text: string; border?: string }
> = {
  primary: { bg: colors.primary, bgPressed: colors.primaryPressed, text: '#FFFFFF' },
  secondary: {
    bg: 'transparent',
    bgPressed: colors.border,
    text: colors.primary,
    border: colors.primary,
  },
  tertiary: { bg: 'transparent', bgPressed: colors.border, text: colors.primary },
  destructive: { bg: colors.error, bgPressed: '#B91C1C', text: '#FFFFFF' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityLabel,
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];
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
          backgroundColor: disabled ? colors.border : pressed ? v.bgPressed : v.bg,
          borderColor: v.border,
          borderWidth: v.border ? 1 : 0,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'secondary' || variant === 'tertiary' ? colors.primary : '#FFFFFF'}
            style={styles.spinner}
          />
        )}
        <Text
          style={[
            typography.labelLarge,
            { color: disabled ? colors.textDisabled : v.text },
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
