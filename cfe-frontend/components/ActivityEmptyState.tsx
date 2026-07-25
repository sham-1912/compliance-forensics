import React from 'react';
import { Inbox } from 'lucide-react-native';
import { colors } from '@/theme';
import { EmptyState } from './EmptyState';

/** Empty-state variant for Recent Activity — not the default shown on
 * Home (mock data always has entries), but built per spec so it exists
 * once there is genuinely no activity to show. */
export function ActivityEmptyState() {
  return (
    <EmptyState
      icon={<Inbox size={40} color={colors.textSecondary} />}
      headline="No activity yet"
      supportingText="Verified calls, blocked numbers, and filed reports will show up here."
    />
  );
}
