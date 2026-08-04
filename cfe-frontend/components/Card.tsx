import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { elevation, layout, radius } from '@/theme';
import { useAppearance } from '@/theme/AppearanceContext';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

export function Card({ variant = 'default', style, children, ...rest }: CardProps) {
  const { activeColors } = useAppearance();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: activeColors.surfaceElevated, borderColor: activeColors.border },
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
    borderRadius: radius.large,
    padding: layout.cardInternalPadding,
  },
  outlined: {
    borderWidth: 1,
  },
});
