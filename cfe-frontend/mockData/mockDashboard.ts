// PLACEHOLDER DATA — no backend. Feeds the Home Dashboard's stats,
// activity feed, and demo toggle states. Trend directions/variants are
// intentionally mixed (not a flat/lazy uniform pattern) and are marked
// per-metric so the screen can color them semantically correct.

export type DashboardTrendVariant = 'positive' | 'negative' | 'neutral';
export type DashboardStatusVariant = 'success' | 'warning' | 'error' | 'neutral';

export const mockDashboardMeta = {
  unreadNotifications: 3,
  lastScanLabel: '2 minutes ago',
};

export const mockTodayStats: {
  id: string;
  label: string;
  value: string;
  trendLabel: string;
  trendDirection: 'up' | 'down';
  trendVariant: DashboardTrendVariant;
}[] = [
  {
    id: 'calls_verified',
    label: 'Calls Verified',
    value: '24',
    trendLabel: '+12% vs yesterday',
    trendDirection: 'up',
    trendVariant: 'positive',
  },
  {
    id: 'violations_blocked',
    label: 'Consent Violations Blocked',
    value: '3',
    trendLabel: '+2 vs yesterday',
    trendDirection: 'up',
    // A rise here means more violations were caught, which is protective —
    // framed positive, not a blind "more = bad" reading.
    trendVariant: 'positive',
  },
  {
    id: 'reports_generated',
    label: 'Reports Generated',
    value: '5',
    trendLabel: 'No change',
    trendDirection: 'up',
    trendVariant: 'neutral',
  },
  {
    id: 'trust_score',
    label: 'Trust Score',
    value: '98%',
    trendLabel: '+1 pt this week',
    trendDirection: 'up',
    trendVariant: 'positive',
  },
];

export const mockRecentActivity: {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  statusLabel: string;
  statusVariant: DashboardStatusVariant;
}[] = [
  {
    id: 'act_1',
    title: 'TrustBank Services',
    subtitle: '+91 98450 XXXX2',
    timestamp: '9 min ago',
    statusLabel: 'Verified',
    statusVariant: 'success',
  },
  {
    id: 'act_2',
    title: 'Unknown Caller',
    subtitle: '+91 76XXX 44821',
    timestamp: '41 min ago',
    statusLabel: 'No Consent Found',
    statusVariant: 'error',
  },
  {
    id: 'act_3',
    title: 'QuickLoan Direct',
    subtitle: '+91 63XXX 90112',
    timestamp: '1 hr ago',
    statusLabel: 'Unverified',
    statusVariant: 'warning',
  },
  {
    id: 'act_4',
    title: 'Report filed — Meridian Tele-Sales',
    subtitle: 'Reference RPT-2026-00477',
    timestamp: '3 hr ago',
    statusLabel: 'Report Filed',
    statusVariant: 'neutral',
  },
  {
    id: 'act_5',
    title: 'Novaris Insurance Pvt Ltd',
    subtitle: '+91 88012 XXXX7',
    timestamp: 'Yesterday',
    statusLabel: 'Verified',
    statusVariant: 'success',
  },
];

export const mockIncomingCallerDemo = {
  maskedNumber: '+91 90XXX 51834',
  statusLabel: 'Unverified',
  statusVariant: 'warning' as DashboardStatusVariant,
};
