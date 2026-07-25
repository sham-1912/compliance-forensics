import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, elevation, layout, radius } from '@/theme';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

export function Card({ variant = 'default', style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && elevation.raised,
        variant === 'default' && elevation.resting,
        variant === 'outlined' && styles.outlined,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.large,
    padding: layout.cardInternalPadding,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});
