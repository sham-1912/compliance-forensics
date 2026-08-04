import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing } from '@/theme';
import { useAppearance } from '@/theme/AppearanceContext';

interface InputFieldProps extends TextInputProps {
  label: string;
  errorText?: string;
  helperText?: string;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export function InputField({
  label,
  errorText,
  helperText,
  disabled = false,
  leadingIcon,
  trailingIcon,
  maxLength,
  showCharacterCount = false,
  value,
  onFocus,
  onBlur,
  ...rest
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const { activeColors, scaledTypography } = useAppearance();
  const hasError = !!errorText;

  const borderColor = hasError
    ? activeColors.error
    : focused
    ? activeColors.primary
    : activeColors.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[scaledTypography.labelMedium, { color: activeColors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: disabled ? activeColors.surfaceElevated : activeColors.surface,
          },
        ]}
      >
        {leadingIcon && <View style={styles.icon}>{leadingIcon}</View>}
        <TextInput
          value={value}
          editable={!disabled}
          maxLength={maxLength}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={activeColors.textDisabled}
          style={[scaledTypography.bodyLarge, styles.input, { color: activeColors.textPrimary }]}
          {...rest}
        />
        {trailingIcon && <View style={styles.icon}>{trailingIcon}</View>}
      </View>
      <View style={styles.footerRow}>
        <Text
          style={[
            scaledTypography.bodySmall,
            { color: hasError ? activeColors.error : activeColors.textSecondary, flex: 1 },
          ]}
        >
          {errorText ?? helperText ?? ' '}
        </Text>
        {showCharacterCount && maxLength && (
          <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>
            {(value?.length ?? 0)}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xxs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.sm,
    minHeight: 48,
  },
  input: { flex: 1, paddingVertical: spacing.xs },
  icon: { marginHorizontal: spacing.xxs },
  footerRow: { flexDirection: 'row', minHeight: 16 },
});
