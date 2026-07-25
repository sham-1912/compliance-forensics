import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, elevation, layout, radius, spacing, typography } from '@/theme';
import { Button, ButtonVariant } from './Button';

interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
}

interface DialogProps {
  visible: boolean;
  title: string;
  body: string;
  primaryAction: DialogAction;
  secondaryAction?: DialogAction;
  onRequestClose?: () => void;
}

export function Dialog({
  visible,
  title,
  body,
  primaryAction,
  secondaryAction,
  onRequestClose,
}: DialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <View style={styles.scrim}>
        <View style={[styles.dialog, elevation.modal]}>
          <Text style={[typography.titleLarge, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            {body}
          </Text>
          <View style={styles.actions}>
            {secondaryAction && (
              <View style={styles.actionSlot}>
                <Button
                  label={secondaryAction.label}
                  onPress={secondaryAction.onPress}
                  variant={secondaryAction.variant ?? 'tertiary'}
                />
              </View>
            )}
            <View style={styles.actionSlot}>
              <Button
                label={primaryAction.label}
                onPress={primaryAction.onPress}
                variant={primaryAction.variant ?? 'primary'}
                loading={primaryAction.loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenHorizontalPadding,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    padding: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionSlot: { minWidth: 100 },
});
