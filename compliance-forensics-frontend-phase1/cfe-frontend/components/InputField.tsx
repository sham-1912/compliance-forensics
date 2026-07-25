import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

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
  const hasError = !!errorText;

  const borderColor = hasError
    ? colors.error
    : focused
    ? colors.primary
    : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: disabled ? colors.surfaceElevated : colors.surface,
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
          placeholderTextColor={colors.textDisabled}
          style={[typography.bodyLarge, styles.input, { color: colors.textPrimary }]}
          {...rest}
        />
        {trailingIcon && <View style={styles.icon}>{trailingIcon}</View>}
      </View>
      <View style={styles.footerRow}>
        <Text
          style={[
            typography.bodySmall,
            { color: hasError ? colors.error : colors.textSecondary, flex: 1 },
          ]}
        >
          {errorText ?? helperText ?? ' '}
        </Text>
        {showCharacterCount && maxLength && (
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
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
