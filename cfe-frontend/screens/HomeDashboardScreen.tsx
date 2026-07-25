import React, { useEffect, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Bell,
  Ban,
  BarChart3,
  FileText,
  ClipboardList,
  Settings as SettingsIcon,
  TrendingUp,
  Shield as ShieldIcon,
} from 'lucide-react-native';
import { colors, layout, spacing, typography } from '@/theme';
import {
  ActivityEmptyState,
  ActivityListItem,
  BottomNavBar,
  Card,
  DashboardSkeleton,
  IncomingCallCard,
  NavTab,
  ProtectionStatus,
  ProtectionStatusCard,
  QuickActionTile,
  QuickVerifyBar,
  Snackbar,
  StatCard,
  TopAppBar,
} from '@/components';
import { mockUser } from '@/mockData/mockUser';
import {
  mockDashboardMeta,
  mockIncomingCallerDemo,
  mockRecentActivity,
  mockTodayStats,
} from '@/mockData/mockDashboard';

const STAT_ICONS: Record<string, React.ReactNode> = {
  calls_verified: <ShieldIcon size={16} color={colors.primary} />,
  violations_blocked: <Ban size={16} color={colors.primary} />,
  reports_generated: <FileText size={16} color={colors.primary} />,
  trust_score: <TrendingUp size={16} color={colors.primary} />,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function HomeDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [protectionStatus, setProtectionStatus] = useState<ProtectionStatus>('active');
  const [hasIncomingCall, setHasIncomingCall] = useState(false);
  const [showEmptyActivity, setShowEmptyActivity] = useState(false);

  const [snackbar, setSnackbar] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const showComingSoon = (feature: string) => {
    setSnackbar({ message: `${feature} — coming soon`, visible: true });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900); // mock spinner, re-renders same data
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrolled(e.nativeEvent.contentOffset.y > 2);
  };

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'home') return;
    const labels: Record<NavTab, string> = {
      home: 'Home',
      verify: 'Verify',
      reports: 'Reports',
      settings: 'Settings',
    };
    showComingSoon(labels[tab]);
  };

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="CFE"
        elevated={scrolled}
        trailing={
          <Pressable
            onPress={() => showComingSoon('Notifications')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${mockDashboardMeta.unreadNotifications} unread`}
            style={styles.bellWrap}
          >
            <Bell size={22} color={colors.textPrimary} />
            {mockDashboardMeta.unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={[typography.labelSmall, styles.badgeText]}>
                  {mockDashboardMeta.unreadNotifications}
                </Text>
              </View>
            )}
          </Pressable>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {/* 1. Greeting + avatar. The notification bell lives in the sticky
              TopAppBar above (see README "header" decision note) — its
              trailing slot is a fixed 32px width sized for one icon, so
              the avatar sits here instead of being crammed in beside it. */}
          <View style={styles.greetingRow}>
            <View>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                {getGreeting()},
              </Text>
              <Text style={[typography.headlineMedium, { color: colors.textPrimary }]}>
                {mockUser.name.split(' ')[0]}
              </Text>
            </View>
            <Pressable
              onPress={() => showComingSoon('Profile')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              style={styles.avatarSmall}
            >
              <Text style={[typography.labelMedium, { color: colors.primary }]}>
                {getInitials(mockUser.name)}
              </Text>
            </Pressable>
          </View>

          {/* 2. Protection Status Card */}
          <View style={styles.section}>
            <ProtectionStatusCard
              status={protectionStatus}
              lastScanLabel={mockDashboardMeta.lastScanLabel}
              onToggleDemo={() =>
                setProtectionStatus((s) => (s === 'active' ? 'paused' : 'active'))
              }
            />
          </View>

          {/* 3. Incoming Call Verification Card */}
          <View style={styles.section}>
            <IncomingCallCard
              hasIncomingCall={hasIncomingCall}
              caller={mockIncomingCallerDemo}
              onManualCheck={() => showComingSoon('Manual check')}
              onViewFullReport={() => showComingSoon('Verification Result')}
              onToggleDemo={() => setHasIncomingCall((v) => !v)}
            />
          </View>

          {/* 4. Quick Verify */}
          <View style={styles.section}>
            <QuickVerifyBar onViewDetails={() => showComingSoon('Verification Result')} />
          </View>

          {/* 5. Today's Statistics */}
          <View style={styles.section}>
            <Text style={[typography.titleMedium, styles.sectionHeader]}>Today's Statistics</Text>
            <View style={styles.statRow}>
              <StatCard
                icon={STAT_ICONS[mockTodayStats[0].id]}
                label={mockTodayStats[0].label}
                value={mockTodayStats[0].value}
                trendLabel={mockTodayStats[0].trendLabel}
                trendDirection={mockTodayStats[0].trendDirection}
                trendVariant={mockTodayStats[0].trendVariant}
              />
              <StatCard
                icon={STAT_ICONS[mockTodayStats[1].id]}
                label={mockTodayStats[1].label}
                value={mockTodayStats[1].value}
                trendLabel={mockTodayStats[1].trendLabel}
                trendDirection={mockTodayStats[1].trendDirection}
                trendVariant={mockTodayStats[1].trendVariant}
              />
            </View>
            <View style={[styles.statRow, { marginTop: spacing.md }]}>
              <StatCard
                icon={STAT_ICONS[mockTodayStats[2].id]}
                label={mockTodayStats[2].label}
                value={mockTodayStats[2].value}
                trendLabel={mockTodayStats[2].trendLabel}
                trendDirection={mockTodayStats[2].trendDirection}
                trendVariant={mockTodayStats[2].trendVariant}
              />
              <StatCard
                icon={STAT_ICONS[mockTodayStats[3].id]}
                label={mockTodayStats[3].label}
                value={mockTodayStats[3].value}
                trendLabel={mockTodayStats[3].trendLabel}
                trendDirection={mockTodayStats[3].trendDirection}
                trendVariant={mockTodayStats[3].trendVariant}
              />
            </View>
          </View>

          {/* 6. Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Recent Activity
              </Text>
              <View style={styles.headerActions}>
                <Text
                  style={[typography.labelSmall, styles.demoToggle]}
                  onPress={() => setShowEmptyActivity((v) => !v)}
                >
                  {showEmptyActivity ? 'Show activity (demo)' : 'Preview empty (demo)'}
                </Text>
                <Text
                  style={[typography.labelMedium, { color: colors.primary }]}
                  onPress={() => showComingSoon('Full activity history')}
                >
                  See All
                </Text>
              </View>
            </View>
            <Card style={styles.activityCard}>
              {showEmptyActivity ? (
                <ActivityEmptyState />
              ) : (
                mockRecentActivity.map((item, i) => (
                  <View key={item.id}>
                    <ActivityListItem
                      icon={<ClipboardList size={16} color={colors.primary} />}
                      title={item.title}
                      subtitle={item.subtitle}
                      timestamp={item.timestamp}
                      statusLabel={item.statusLabel}
                      statusVariant={item.statusVariant}
                      onPress={() => showComingSoon('Activity detail')}
                    />
                    {i < mockRecentActivity.length - 1 && <View style={styles.divider} />}
                  </View>
                ))
              )}
            </Card>
          </View>

          {/* 7. Quick Actions */}
          <View style={styles.section}>
            <Text style={[typography.titleMedium, styles.sectionHeader]}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <QuickActionTile
                icon={<BarChart3 size={20} color={colors.primary} />}
                label="Generate Report"
                onPress={() => showComingSoon('Generate Report')}
              />
              <QuickActionTile
                icon={<Ban size={20} color={colors.primary} />}
                label="Block Number"
                onPress={() => showComingSoon('Block Number')}
              />
              <QuickActionTile
                icon={<ClipboardList size={20} color={colors.primary} />}
                label="Compliance Log"
                onPress={() => showComingSoon('Compliance Log')}
              />
              <QuickActionTile
                icon={<SettingsIcon size={20} color={colors.primary} />}
                label="Settings"
                onPress={() => showComingSoon('Settings')}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* 8. Bottom Navigation */}
      <BottomNavBar activeTab="home" onTabPress={handleTabPress} />

      <Snackbar
        message={snackbar.message}
        variant="info"
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingBottom: layout.bottomNavSafePadding,
  },
  bellWrap: { padding: 2 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, lineHeight: 11 },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.lg },
  sectionHeader: { color: colors.textPrimary, marginBottom: spacing.sm },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  demoToggle: { color: colors.textSecondary, textDecorationLine: 'underline' },
  activityCard: { padding: 0, paddingHorizontal: spacing.md },
  divider: { height: 1, backgroundColor: colors.border },
  statRow: { flexDirection: 'row', gap: spacing.md },
  quickActionsRow: { flexDirection: 'row', gap: spacing.sm },
});
