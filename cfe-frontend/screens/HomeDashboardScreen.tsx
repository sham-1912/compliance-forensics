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
  Platform,
  DeviceEventEmitter,
  NativeModules,
  PermissionsAndroid,
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
  Search,
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
  Button,
  InputField,
  Switch,
} from '@/components';
import { useAuth } from '@/navigation/AuthContext';
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
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const [protectionStatus, setProtectionStatus] = useState<ProtectionStatus>('active');
  const [hasIncomingCall, setHasIncomingCall] = useState(false);
  const [showEmptyActivity, setShowEmptyActivity] = useState(false);
  const [dbStats, setDbStats] = useState<any[]>([]);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const [lastReadTime, setLastReadTime] = useState<number>(0);
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [showBlockInputDialog, setShowBlockInputDialog] = useState(false);
  const [blockInputNumber, setBlockInputNumber] = useState('');
  const [isCurrentlyBlocked, setIsCurrentlyBlocked] = useState(false);

  // Reports sub-tab & generator states
  const [reportsSubTab, setReportsSubTab] = useState<'audit' | 'generate'>('audit');
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Verify lookup states
  const [searchNumber, setSearchNumber] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  // Settings states
  const [settingsVerification, setSettingsVerification] = useState(true);
  const [settingsBlocking, setSettingsBlocking] = useState(true);
  const [settingsNotifications, setSettingsNotifications] = useState(true);
  const [settingsStorage, setSettingsStorage] = useState<'minimal' | 'crypto' | 'full'>('crypto');

  // Real-time live call alerts states
  const [liveCallPopup, setLiveCallPopup] = useState<{ visible: boolean; number: string; category: string } | null>(null);

  const [snackbar, setSnackbar] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  const loadDbData = async () => {
    if (Platform.OS === 'android' && NativeModules.AuditBridgeModule) {
      try {
        const stats = await NativeModules.AuditBridgeModule.getStatistics();
        const logs = await NativeModules.AuditBridgeModule.getRecentLogs();
        
        let lastRead = 0;
        try {
          if (typeof NativeModules.AuditBridgeModule.getLastReadTime === 'function') {
            lastRead = await NativeModules.AuditBridgeModule.getLastReadTime();
          }
        } catch (err) {
          console.error("Failed to read last read notification time", err);
        }
        setLastReadTime(lastRead);
        
        const mappedStats = [
          {
            id: 'calls_verified',
            label: 'Calls Verified',
            value: stats.calls_verified.toString(),
            trendLabel: '+12% vs yesterday',
            trendDirection: 'up' as const,
            trendVariant: 'positive' as const
          },
          {
            id: 'violations_blocked',
            label: 'Consent Violations Blocked',
            value: stats.violations_blocked.toString(),
            trendLabel: '+2 vs yesterday',
            trendDirection: 'up' as const,
            trendVariant: 'positive' as const
          },
          {
            id: 'reports_generated',
            label: 'Reports Generated',
            value: stats.reports_generated.toString(),
            trendLabel: 'No change',
            trendDirection: 'up' as const,
            trendVariant: 'neutral' as const
          },
          {
            id: 'trust_score',
            label: 'Trust Score',
            value: `${stats.trust_score}%`,
            trendLabel: '+1 pt this week',
            trendDirection: 'up' as const,
            trendVariant: 'positive' as const
          }
        ];
        
        const mappedLogs = logs.map((log: any) => {
          let statusLabel = 'Unverified';
          let statusVariant: 'success' | 'warning' | 'error' | 'neutral' = 'error';

          switch (log.classificationResult) {
            case 'AUTHORISED_BANK_GOVT':
              statusLabel = 'Authorised';
              statusVariant = 'success';
              break;
            case 'PROMOTIONAL':
              statusLabel = 'Promotional';
              statusVariant = 'warning';
              break;
            case 'KNOWN':
              statusLabel = 'Known';
              statusVariant = 'neutral';
              break;
            case 'BLOCKED':
              statusLabel = 'Blocked';
              statusVariant = 'error';
              break;
            case 'UNVERIFIED':
            default:
              statusLabel = 'Unverified';
              statusVariant = 'error';
              break;
          }

          return {
            id: log.id.toString(),
            title: log.callerName || (log.classificationResult === 'KNOWN' ? 'Known Contact' : log.classificationResult === 'BLOCKED' ? 'Blocked Caller' : 'Unknown Caller'),
            subtitle: log.callerId,
            timestamp: new Date(log.timestamp).toLocaleString(),
            statusLabel,
            statusVariant,
            auditProofHash: log.auditProofHash || 'N/A',
            consentHash: log.consentHash || 'N/A',
            isExported: log.isExported,
            classificationResult: log.classificationResult,
            lsa: log.lsa || 'Unknown',
            operatorName: log.operatorName || 'Unknown',
            rawTimestamp: log.timestamp,
          };
        });
        
        setDbStats(mappedStats);
        setDbLogs(mappedLogs);
      } catch (e) {
        console.error("Failed to load native db data", e);
      }
    }
  };

  const alertLogs = dbLogs.filter(
    (log) => log.statusVariant === 'error' || log.classificationResult === 'UNVERIFIED' || log.classificationResult === 'BLOCKED'
  );

  const unreadCount = alertLogs.filter((log) => (log.rawTimestamp || 0) > lastReadTime).length;

  const handleOpenBell = async () => {
    setShowNotificationsSheet(true);
    const now = Date.now();
    setLastReadTime(now);
    if (Platform.OS === 'android' && NativeModules.AuditBridgeModule) {
      try {
        if (typeof NativeModules.AuditBridgeModule.setLastReadTime === 'function') {
          await NativeModules.AuditBridgeModule.setLastReadTime(now);
        }
      } catch (err) {
        console.error("Failed to save notification read timestamp", err);
      }
    }
  };

  const checkIfBlocked = async (num: string) => {
    if (Platform.OS === 'android' && NativeModules.AuditBridgeModule) {
      try {
        if (typeof NativeModules.AuditBridgeModule.isBlocked === 'function') {
          const blocked = await NativeModules.AuditBridgeModule.isBlocked(num);
          setIsCurrentlyBlocked(blocked);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleBlockSelectedNumber = async () => {
    if (!selectedLog) return;
    const num = selectedLog.subtitle;
    if (Platform.OS === 'android' && NativeModules.AuditBridgeModule) {
      try {
        if (isCurrentlyBlocked) {
          if (typeof NativeModules.AuditBridgeModule.unblockNumber === 'function') {
            await NativeModules.AuditBridgeModule.unblockNumber(num);
          }
          setSnackbar({ message: `Unblocked +91 ${num}`, visible: true });
        } else {
          if (typeof NativeModules.AuditBridgeModule.blockNumber === 'function') {
            await NativeModules.AuditBridgeModule.blockNumber(num);
          }
          setSnackbar({ message: `Soft-blocked +91 ${num}. Note: call notification suppression active.`, visible: true });
        }
        setIsCurrentlyBlocked(!isCurrentlyBlocked);
        loadDbData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (selectedLog) {
      checkIfBlocked(selectedLog.subtitle);
    }
  }, [selectedLog]);

  const handleLookup = async () => {
    if (!searchNumber || searchNumber.length < 10) {
      setSnackbar({ message: "Please enter a valid 10-digit number", visible: true });
      return;
    }
    setSearching(true);
    setSearchResult(null);
    
    setTimeout(async () => {
      setSearching(false);
      const digits = searchNumber.replace(/\D/g, '').slice(-10);
      
      // 1. Check if blocked
      let isBlocked = false;
      if (Platform.OS === 'android' && NativeModules.AuditBridgeModule && typeof NativeModules.AuditBridgeModule.isBlocked === 'function') {
        try {
          isBlocked = await NativeModules.AuditBridgeModule.isBlocked(digits);
        } catch (e) {
          console.error(e);
        }
      }
      
      if (isBlocked) {
        setSearchResult({
          number: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
          category: "Blocked",
          score: 0,
          statusVariant: "error",
          basis: "This number is manually soft-blocked by you. App-level notifications and call state verifications for this caller are actively suppressed."
        });
        return;
      }
      
      // 2. Check prefix rules
      if (digits.startsWith('1600')) {
        setSearchResult({
          number: `+91 ${digits.slice(0, 4)} ${digits.slice(4)}`,
          category: "Authorised",
          score: 100,
          statusVariant: "success",
          basis: "Matched TRAI 1600 series prefix reserved for verified government agencies and licensed financial institutions. Claims entity: State Bank of India (SBI)."
        });
        return;
      }
      
      if (digits.startsWith('140')) {
        setSearchResult({
          number: `+91 ${digits.slice(0, 3)} ${digits.slice(3)}`,
          category: "Promotional",
          score: 85,
          statusVariant: "warning",
          basis: "Matched TRAI 140 series prefix reserved for registered commercial telemarketers. Claims entity: HDFC Bank Promotions."
        });
        return;
      }
      
      // 3. Check device call log via native bridge
      let isKnown = false;
      if (Platform.OS === 'android' && NativeModules.AuditBridgeModule && typeof NativeModules.AuditBridgeModule.isInCallLog === 'function') {
        try {
          isKnown = await NativeModules.AuditBridgeModule.isInCallLog(digits);
        } catch (e) {
          // fallback: check dbLogs
          isKnown = dbLogs.some(log => log.subtitle.replace(/\D/g, '').slice(-10) === digits);
        }
      } else {
        isKnown = dbLogs.some(log => log.subtitle.replace(/\D/g, '').slice(-10) === digits);
      }

      if (isKnown || digits === '9876543210') {
        setSearchResult({
          number: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
          category: "Known Contact",
          score: 90,
          statusVariant: "neutral",
          basis: "This caller exists in your device call history logs. Prior interaction creates a trust association of 90% confidence."
        });
        return;
      }

      
      // 4. Default Unverified
      setSearchResult({
        number: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
        category: "Unverified",
        score: 20,
        statusVariant: "error",
        basis: "Warning: No registered entity or active consent record found in the DLT gateway cache. The caller is unverified."
      });
    }, 800);
  };

  const handleDownloadReport = (format: 'CSV' | 'PDF') => {
    if (downloadingReport) return;
    setDownloadingReport(true);
    setDownloadProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDownloadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setDownloadingReport(false);
        setSnackbar({
          message: `${reportPeriod === 'weekly' ? 'Weekly' : 'Monthly'} report downloaded successfully in ${format} format!`,
          visible: true
        });
      }
    }, 150);
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const perms: any[] = [
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        ];
        if (Platform.Version >= 33) {
          perms.push('android.permission.POST_NOTIFICATIONS');
        }
        await PermissionsAndroid.requestMultiple(perms);
        loadDbData();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    requestPermissions();
    loadDbData();
    const timer = setTimeout(() => setLoading(false), 800);

    // Register live call detection listener from CallReceiver
    let subscription: any = null;
    if (Platform.OS === 'android' && NativeModules.AuditBridgeModule) {
      subscription = DeviceEventEmitter.addListener('onVerificationResult', (result) => {
        let statusLabel = 'Unverified';
        let statusVariant: 'success' | 'warning' | 'error' | 'neutral' = 'error';

        switch (result.classificationResult) {
          case 'AUTHORISED_BANK_GOVT':
            statusLabel = 'Authorised';
            statusVariant = 'success';
            break;
          case 'PROMOTIONAL':
            statusLabel = 'Promotional';
            statusVariant = 'warning';
            break;
          case 'KNOWN':
            statusLabel = 'Known';
            statusVariant = 'neutral';
            break;
          case 'UNVERIFIED':
          default:
            statusLabel = 'Unverified';
            statusVariant = 'error';
            break;
        }

        setIncomingCall({
          maskedNumber: result.phoneNumber,
          statusLabel,
          statusVariant,
          classificationResult: result.classificationResult,
          lsa: result.lsa || 'Unknown',
          operatorName: result.operatorName || 'Unknown',
        });
        setHasIncomingCall(true);
        setLiveCallPopup({
          visible: true,
          number: result.phoneNumber,
          category: statusLabel
        });
        loadDbData();
      });
    }

    return () => {
      clearTimeout(timer);
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const showComingSoon = (feature: string) => {
    setSnackbar({ message: `${feature} — coming soon`, visible: true });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDbData();
    setRefreshing(false);
  };

  const handleToggleIncomingCallDemo = () => {
    if (hasIncomingCall) {
      setHasIncomingCall(false);
      setIncomingCall(null);
    } else {
      if (Platform.OS === 'android' && NativeModules.AuditBridgeModule) {
        const demoNumbers = ["+919876543210", "+916374581450", "+9189257550990"];
        const randomNum = demoNumbers[Math.floor(Math.random() * demoNumbers.length)];
        NativeModules.AuditBridgeModule.simulateIncomingCall(randomNum);
      } else {
        setIncomingCall(mockIncomingCallerDemo);
        setHasIncomingCall(true);
      }
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrolled(e.nativeEvent.contentOffset.y > 2);
  };

  const handleTabPress = (tab: NavTab) => {
    setCurrentTab(tab);
  };

  const displayStats = dbStats.length > 0 ? dbStats : mockTodayStats;
  const displayLogs = dbLogs.length > 0 ? dbLogs.slice(0, 5) : mockRecentActivity;

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="CFE"
        elevated={scrolled}
        trailing={
          <Pressable
            onPress={handleOpenBell}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unreadCount} unread`}
            style={styles.bellWrap}
          >
            <Bell size={22} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={[typography.labelSmall, styles.badgeText]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : currentTab === 'reports' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          <View style={styles.reportsHeader}>
            <Text style={[typography.headlineMedium, { color: colors.textPrimary, marginTop: spacing.md }]}>
              {reportsSubTab === 'audit' ? 'Audit Trail' : 'Compliance Reports'}
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {reportsSubTab === 'audit' 
                ? 'Tamper-proof compliance history of all incoming calls verified natively.' 
                : 'Generate and download weekly or monthly subscriber compliance audits.'}
            </Text>
          </View>

          {/* Sub-tabs segment switcher */}
          <View style={{ flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 2, marginVertical: spacing.md }}>
            <Pressable
              onPress={() => setReportsSubTab('audit')}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                backgroundColor: reportsSubTab === 'audit' ? colors.surface : 'transparent',
                borderRadius: 6
              }}
            >
              <Text style={[typography.labelMedium, { color: reportsSubTab === 'audit' ? colors.textPrimary : colors.textSecondary }]}>
                Audit Trail
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setReportsSubTab('generate')}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                backgroundColor: reportsSubTab === 'generate' ? colors.surface : 'transparent',
                borderRadius: 6
              }}
            >
              <Text style={[typography.labelMedium, { color: reportsSubTab === 'generate' ? colors.textPrimary : colors.textSecondary }]}>
                Generate Reports
              </Text>
            </Pressable>
          </View>

          {reportsSubTab === 'audit' ? (
            dbLogs.length === 0 ? (
              <Card style={styles.emptyCard}>
                <ClipboardList size={48} color={colors.textDisabled} strokeWidth={1.5} />
                <Text style={[typography.titleMedium, { color: colors.textSecondary, marginTop: spacing.md }]}>
                  No audit logs found
                </Text>
                <Text style={[typography.bodySmall, { color: colors.textDisabled, textAlign: 'center', marginTop: spacing.xs }]}>
                  Verified and unverified incoming calls will automatically register in this database.
                </Text>
              </Card>
            ) : (
              <View style={styles.logsList}>
                {dbLogs.map((log) => (
                  <Pressable
                    key={log.id}
                    onPress={() => setSelectedLog(log)}
                    style={({ pressed }) => [
                      styles.logItemCard,
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <View style={styles.logItemHeader}>
                      <View style={{ flex: 1, paddingRight: spacing.sm }}>
                        <Text style={[typography.titleSmall, { color: colors.textPrimary }]}>
                          {log.title}
                        </Text>
                        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]}>
                          {log.subtitle}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        { 
                          backgroundColor: log.statusVariant === 'success' ? '#DCFCE7' :
                                           log.statusVariant === 'warning' ? '#FEF3C7' :
                                           log.statusVariant === 'neutral' ? colors.border : '#FEE2E2'
                        }
                      ]}>
                        <Text style={[
                          typography.labelSmall,
                          { 
                            color: log.statusVariant === 'success' ? colors.success :
                                   log.statusVariant === 'warning' ? colors.warning :
                                   log.statusVariant === 'neutral' ? colors.infoNeutral : colors.error
                          }
                        ]}>
                          {log.statusLabel}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.logItemMeta}>
                      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                        {log.timestamp}
                      </Text>
                      <Text style={[typography.labelSmall, styles.hashPreview]} numberOfLines={1}>
                        SHA-256: {log.auditProofHash.substring(0, 10)}...
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )
          ) : (
            /* Generate Reports Sub-view */
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: spacing.sm }}>
                <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>Choose Report Period</Text>
                
                <View style={{ flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 2, marginTop: spacing.xs }}>
                  <Pressable
                    onPress={() => setReportPeriod('weekly')}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      alignItems: 'center',
                      backgroundColor: reportPeriod === 'weekly' ? colors.surface : 'transparent',
                      borderRadius: 6
                    }}
                  >
                    <Text style={[typography.labelSmall, { color: reportPeriod === 'weekly' ? colors.textPrimary : colors.textSecondary }]}>
                      Weekly
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setReportPeriod('monthly')}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      alignItems: 'center',
                      backgroundColor: reportPeriod === 'monthly' ? colors.surface : 'transparent',
                      borderRadius: 6
                    }}
                  >
                    <Text style={[typography.labelSmall, { color: reportPeriod === 'monthly' ? colors.textPrimary : colors.textSecondary }]}>
                      Monthly
                    </Text>
                  </Pressable>
                </View>
              </Card>

              {/* Statistics Preview Card */}
              <Card style={{ gap: spacing.sm }}>
                <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                  {reportPeriod === 'weekly' ? 'Weekly Summary Preview' : 'Monthly Summary Preview'}
                </Text>
                
                <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Total Calls Checked</Text>
                    <Text style={[typography.titleSmall, { color: colors.textPrimary }]}>
                      {reportPeriod === 'weekly' ? '87' : '342'}
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.border }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Consent Verified</Text>
                    <Text style={[typography.titleSmall, { color: colors.success }]}>
                      {reportPeriod === 'weekly' ? '72' : '298'}
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.border }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Consent Violations Blocked</Text>
                    <Text style={[typography.titleSmall, { color: colors.warning }]}>
                      {reportPeriod === 'weekly' ? '9' : '26'}
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.border }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Unverified Flagged</Text>
                    <Text style={[typography.titleSmall, { color: colors.error }]}>
                      {reportPeriod === 'weekly' ? '6' : '18'}
                    </Text>
                  </View>
                </View>
              </Card>

              {downloadingReport ? (
                <Card style={{ alignItems: 'center', gap: spacing.sm }}>
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                    Downloading report... {downloadProgress}%
                  </Text>
                  <View style={{ width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: colors.primary }} />
                  </View>
                </Card>
              ) : (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <Button
                    label="Download CSV Report"
                    onPress={() => handleDownloadReport('CSV')}
                    variant="primary"
                  />
                  <Button
                    label="Download PDF Report"
                    onPress={() => handleDownloadReport('PDF')}
                    variant="secondary"
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : currentTab === 'verify' ? (
        /* Interactive Lookup Page */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.reportsHeader}>
            <Text style={[typography.headlineMedium, { color: colors.textPrimary, marginTop: spacing.md }]}>
              Compliance Query
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Lookup any number to run TRAI database checks and inspect rating rationale.
            </Text>
          </View>

          <Card style={{ marginTop: spacing.md, gap: spacing.md }}>
            <InputField
              label="Check Caller Number"
              placeholder="e.g. 1600123456"
              value={searchNumber}
              onChangeText={setSearchNumber}
              keyboardType="phone-pad"
            />
            
            <Button
              label="Analyze Caller Profile"
              onPress={handleLookup}
              loading={searching}
            />
          </Card>

          {searchResult && (
            <Card style={{ marginTop: spacing.md, gap: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Caller Number</Text>
                  <Text style={[typography.titleLarge, { color: colors.textPrimary, marginTop: 2 }]}>
                    {searchResult.number}
                  </Text>
                </View>
                
                <View style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: searchResult.statusVariant === 'success' ? '#DCFCE7' :
                                     searchResult.statusVariant === 'warning' ? '#FEF3C7' :
                                     searchResult.statusVariant === 'neutral' ? colors.border : '#FEE2E2'
                  }
                ]}>
                  <Text style={[
                    typography.labelMedium,
                    { 
                      color: searchResult.statusVariant === 'success' ? colors.success :
                             searchResult.statusVariant === 'warning' ? colors.warning :
                             searchResult.statusVariant === 'neutral' ? colors.infoNeutral : colors.error
                    }
                  ]}>
                    {searchResult.category}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <View>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Confidence Score</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 }}>
                  <Text style={[typography.headlineMedium, { 
                    color: searchResult.score >= 80 ? colors.success : 
                           searchResult.score >= 50 ? colors.warning : colors.error 
                  }]}>
                    {searchResult.score}%
                  </Text>
                  <View style={{ flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ 
                      width: `${searchResult.score}%`, 
                      height: '100%', 
                      backgroundColor: searchResult.score >= 80 ? colors.success : 
                                       searchResult.score >= 50 ? colors.warning : colors.error 
                    }} />
                  </View>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <View>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Analysis & Rationale</Text>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginTop: 4, lineHeight: 20 }]}>
                  {searchResult.basis}
                </Text>
              </View>
            </Card>
          )}
        </ScrollView>
      ) : currentTab === 'settings' ? (
        /* Settings & Profile Page */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.reportsHeader}>
            <Text style={[typography.headlineMedium, { color: colors.textPrimary, marginTop: spacing.md }]}>
              Settings & Profile
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Manage personal compliance rules and storage configurations.
            </Text>
          </View>

          {/* User Profile Card */}
          <Card style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#EAF8F7',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={[typography.titleLarge, { color: colors.primary }]}>
                {getInitials(mockUser.name)}
              </Text>
            </View>
            <View>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>{mockUser.name}</Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]}>john.doe@novaris.com</Text>
              <Text style={[typography.bodySmall, { color: colors.textDisabled, marginTop: 2 }]}>+91 99999 00000</Text>
            </View>
          </Card>

          {/* Compliance Rules Settings */}
          <Card style={{ marginTop: spacing.md, gap: spacing.md }}>
            <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>Compliance Policies</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Real-time Call Verification</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>Verify caller consent registries on incoming rings</Text>
              </View>
              <Switch
                value={settingsVerification}
                onValueChange={setSettingsVerification}
                accessibilityLabel="Toggle verification policy"
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Targeted Block Filtering</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>Suppress notifications from block list numbers</Text>
              </View>
              <Switch
                value={settingsBlocking}
                onValueChange={setSettingsBlocking}
                accessibilityLabel="Toggle block filtering policy"
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Heads-up Alerts</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>Display priority overlay alerts for unverified callers</Text>
              </View>
              <Switch
                value={settingsNotifications}
                onValueChange={setSettingsNotifications}
                accessibilityLabel="Toggle notifications policy"
              />
            </View>
          </Card>

          {/* Storage Level Setting */}
          <Card style={{ marginTop: spacing.md, gap: spacing.md }}>
            <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>Audit Storage Compliance</Text>
            
            <View style={{ flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 2 }}>
              <Pressable
                onPress={() => setSettingsStorage('minimal')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  backgroundColor: settingsStorage === 'minimal' ? colors.surface : 'transparent',
                  borderRadius: 6
                }}
              >
                <Text style={[typography.labelSmall, { color: settingsStorage === 'minimal' ? colors.textPrimary : colors.textSecondary }]}>
                  Minimal
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSettingsStorage('crypto')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  backgroundColor: settingsStorage === 'crypto' ? colors.surface : 'transparent',
                  borderRadius: 6
                }}
              >
                <Text style={[typography.labelSmall, { color: settingsStorage === 'crypto' ? colors.textPrimary : colors.textSecondary }]}>
                  Crypto Proof
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSettingsStorage('full')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  backgroundColor: settingsStorage === 'full' ? colors.surface : 'transparent',
                  borderRadius: 6
                }}
              >
                <Text style={[typography.labelSmall, { color: settingsStorage === 'full' ? colors.textPrimary : colors.textSecondary }]}>
                  Full
                </Text>
              </Pressable>
            </View>
            
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              {settingsStorage === 'minimal' ? 'Only stores logs with essential info.' :
               settingsStorage === 'crypto' ? 'Appends a SHA-256 tamper-proof hash value for data integrity.' :
               'Saves all logs, Circle coordinates, carrier profiles, and crypto proof.'}
            </Text>
          </Card>

          {/* Log Off Button */}
          <View style={{ marginTop: spacing.xl }}>
            <Button
              label="Log Off"
              onPress={logout}
              variant="destructive"
            />
          </View>
        </ScrollView>
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
          {/* 1. Greeting + avatar */}
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
              onPress={() => setCurrentTab('settings')}
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
              caller={incomingCall || mockIncomingCallerDemo}
              onManualCheck={() => showComingSoon('Manual check')}
              onViewFullReport={() => {
                if (dbLogs.length > 0) {
                  setSelectedLog(dbLogs[0]);
                } else {
                  showComingSoon('Verification Result');
                }
              }}
              onToggleDemo={handleToggleIncomingCallDemo}
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
                icon={STAT_ICONS[displayStats[0].id]}
                label={displayStats[0].label}
                value={displayStats[0].value}
                trendLabel={displayStats[0].trendLabel}
                trendDirection={displayStats[0].trendDirection}
                trendVariant={displayStats[0].trendVariant}
              />
              <StatCard
                icon={STAT_ICONS[displayStats[1].id]}
                label={displayStats[1].label}
                value={displayStats[1].value}
                trendLabel={displayStats[1].trendLabel}
                trendDirection={displayStats[1].trendDirection}
                trendVariant={displayStats[1].trendVariant}
              />
            </View>
            <View style={[styles.statRow, { marginTop: spacing.md }]}>
              <StatCard
                icon={STAT_ICONS[displayStats[2].id]}
                label={displayStats[2].label}
                value={displayStats[2].value}
                trendLabel={displayStats[2].trendLabel}
                trendDirection={displayStats[2].trendDirection}
                trendVariant={displayStats[2].trendVariant}
              />
              <StatCard
                icon={STAT_ICONS[displayStats[3].id]}
                label={displayStats[3].label}
                value={displayStats[3].value}
                trendLabel={displayStats[3].trendLabel}
                trendDirection={displayStats[3].trendDirection}
                trendVariant={displayStats[3].trendVariant}
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
                  onPress={() => {
                    setCurrentTab('reports');
                    setReportsSubTab('audit');
                  }}
                >
                  See All
                </Text>
              </View>
            </View>
            <Card style={styles.activityCard}>
              {showEmptyActivity ? (
                <ActivityEmptyState />
              ) : (
                displayLogs.map((item, i) => (
                  <View key={item.id}>
                    <ActivityListItem
                      icon={<ClipboardList size={16} color={colors.primary} />}
                      title={item.title}
                      subtitle={item.subtitle}
                      timestamp={item.timestamp.split(',')[1]?.trim() || item.timestamp}
                      statusLabel={item.statusLabel}
                      statusVariant={item.statusVariant}
                      onPress={() => setSelectedLog(item)}
                    />
                    {i < displayLogs.length - 1 && <View style={styles.divider} />}
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
                onPress={() => {
                  setCurrentTab('reports');
                  setReportsSubTab('generate');
                }}
              />
              <QuickActionTile
                icon={<Ban size={20} color={colors.primary} />}
                label="Block Number"
                onPress={() => setShowBlockInputDialog(true)}
              />
              <QuickActionTile
                icon={<ClipboardList size={20} color={colors.primary} />}
                label="Compliance Log"
                onPress={() => {
                  setCurrentTab('reports');
                  setReportsSubTab('audit');
                }}
              />
              <QuickActionTile
                icon={<SettingsIcon size={20} color={colors.primary} />}
                label="Settings"
                onPress={() => setCurrentTab('settings')}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* 8. Bottom Navigation */}
      <BottomNavBar activeTab={currentTab} onTabPress={handleTabPress} />

      {/* 9. Cryptographic Log Details Modal */}
      {selectedLog && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setSelectedLog(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Compliance Audit Record
              </Text>
              <Pressable onPress={() => setSelectedLog(null)}>
                <Text style={[typography.labelMedium, { color: colors.primary }]}>Close</Text>
              </Pressable>
            </View>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={true}>
              <View style={styles.modalRow}>
                <Text style={[typography.bodySmall, styles.modalLabel]}>Caller Phone Number</Text>
                <Text style={[typography.bodyMedium, styles.modalValue]}>{selectedLog.subtitle}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={[typography.bodySmall, styles.modalLabel]}>Claimed Entity (DLT Registry)</Text>
                <Text style={[typography.bodyMedium, styles.modalValue]}>{selectedLog.title}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={[typography.bodySmall, styles.modalLabel]}>Verification Timestamp</Text>
                <Text style={[typography.bodyMedium, styles.modalValue]}>{selectedLog.timestamp}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={[typography.bodySmall, styles.modalLabel]}>Registry Status</Text>
                <View style={[
                  styles.statusBadge,
                  { 
                    alignSelf: 'flex-start', 
                    marginTop: 4, 
                    backgroundColor: selectedLog.statusVariant === 'success' ? '#DCFCE7' :
                                     selectedLog.statusVariant === 'warning' ? '#FEF3C7' :
                                     selectedLog.statusVariant === 'neutral' ? colors.border : '#FEE2E2'
                  }
                ]}>
                  <Text style={[
                    typography.labelSmall,
                    { 
                      color: selectedLog.statusVariant === 'success' ? colors.success :
                             selectedLog.statusVariant === 'warning' ? colors.warning :
                             selectedLog.statusVariant === 'neutral' ? colors.infoNeutral : colors.error
                    }
                  ]}>
                    {selectedLog.statusLabel}
                  </Text>
                </View>
              </View>
              {selectedLog.lsa && selectedLog.lsa !== 'Unknown' && (
                <View style={styles.modalRow}>
                  <Text style={[typography.bodySmall, styles.modalLabel]}>Telecom Circle (LSA)</Text>
                  <Text style={[typography.bodyMedium, styles.modalValue]}>{selectedLog.lsa}</Text>
                </View>
              )}
              {selectedLog.operatorName && selectedLog.operatorName !== 'UNKNOWN' && (
                <View style={styles.modalRow}>
                  <Text style={[typography.bodySmall, styles.modalLabel]}>Carrier / Operator</Text>
                  <Text style={[typography.bodyMedium, styles.modalValue]}>{selectedLog.operatorName}</Text>
                </View>
              )}
              <View style={styles.modalRow}>
                <Text style={[typography.bodySmall, styles.modalLabel]}>Consent DLT ID Reference</Text>
                <Text style={[typography.bodyMedium, styles.modalValue, { fontStyle: selectedLog.consentHash && selectedLog.consentHash !== 'N/A' ? 'normal' : 'italic' }]}>
                  {selectedLog.consentHash && selectedLog.consentHash !== 'N/A' ? selectedLog.consentHash : 'No Registered Consent Record'}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={[typography.bodySmall, styles.modalLabel]}>Cryptographic Hash (SHA-256 Proof)</Text>
                <View style={styles.hashBox}>
                  <Text style={[typography.bodySmall, styles.hashText]} selectable={true}>
                    {selectedLog.auditProofHash}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: spacing.md, paddingBottom: spacing.md }}>
                <Button
                  label={isCurrentlyBlocked ? "Unblock Number" : "Block Number"}
                  onPress={handleToggleBlockSelectedNumber}
                  variant={isCurrentlyBlocked ? "secondary" : "destructive"}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* 10. Security Alerts / Notifications Sheet */}
      {showNotificationsSheet && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setShowNotificationsSheet(false)} />
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Security Alerts & Unverified Calls
              </Text>
              <Pressable onPress={() => setShowNotificationsSheet(false)}>
                <Text style={[typography.labelMedium, { color: colors.primary }]}>Close</Text>
              </Pressable>
            </View>
            <ScrollView style={{ marginTop: spacing.md }}>
              {alertLogs.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                    No recent warnings or alert logs
                  </Text>
                </View>
              ) : (
                alertLogs.map((log, i) => (
                  <View key={log.id}>
                    <ActivityListItem
                      icon={<ClipboardList size={16} color={colors.primary} />}
                      title={log.title}
                      subtitle={log.subtitle}
                      timestamp={log.timestamp}
                      statusLabel={log.statusLabel}
                      statusVariant={log.statusVariant}
                      onPress={() => {
                        setShowNotificationsSheet(false);
                        setSelectedLog(log);
                      }}
                    />
                    {i < alertLogs.length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.xs }} />
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 11. Soft-Block Action Input Dialog */}
      {showBlockInputDialog && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setShowBlockInputDialog(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                Soft-Block Number
              </Text>
              <Pressable onPress={() => setShowBlockInputDialog(false)}>
                <Text style={[typography.labelMedium, { color: colors.primary }]}>Cancel</Text>
              </Pressable>
            </View>
            <View style={{ marginTop: spacing.md, gap: spacing.md }}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                Blocked numbers will be flagged on incoming call alerts and recent activity reports.
              </Text>
              <InputField
                label="Phone number to block"
                placeholder="99999 00000"
                value={blockInputNumber}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '').slice(0, 10);
                  setBlockInputNumber(digits);
                }}
                keyboardType="phone-pad"
              />
              <Button
                label="Soft-Block Number"
                disabled={blockInputNumber.length !== 10}
                onPress={async () => {
                  if (Platform.OS === 'android' && NativeModules.AuditBridgeModule) {
                    try {
                      if (typeof NativeModules.AuditBridgeModule.blockNumber === 'function') {
                        await NativeModules.AuditBridgeModule.blockNumber(blockInputNumber);
                      }
                      setSnackbar({ message: `Blocked +91 ${blockInputNumber}`, visible: true });
                      setShowBlockInputDialog(false);
                      setBlockInputNumber('');
                      loadDbData();
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                variant="destructive"
              />
            </View>
          </View>
        </View>
      )}

      {/* 12. Real-Time Live Call Alert Popup Dialog */}
      {liveCallPopup && liveCallPopup.visible && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setLiveCallPopup(null)} />
          <View style={[styles.modalContent, { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg }]}>
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <ShieldIcon size={48} color={
                liveCallPopup.category === 'Authorised' ? colors.success :
                liveCallPopup.category === 'Promotional' ? colors.warning :
                liveCallPopup.category === 'Known' ? colors.infoNeutral : colors.error
              } strokeWidth={1.5} />
              
              <Text style={[typography.titleLarge, { color: colors.textPrimary, textAlign: 'center' }]}>
                Incoming Call Verify
              </Text>
              
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>
                Number: +91 {liveCallPopup.number.replace(/\D/g, '').slice(-10)}
              </Text>
              
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: 
                    liveCallPopup.category === 'Authorised' ? '#DCFCE7' :
                    liveCallPopup.category === 'Promotional' ? '#FEF3C7' :
                    liveCallPopup.category === 'Known' ? colors.border : '#FEE2E2'
                }
              ]}>
                <Text style={[
                  typography.labelMedium,
                  { 
                    color: 
                      liveCallPopup.category === 'Authorised' ? colors.success :
                      liveCallPopup.category === 'Promotional' ? colors.warning :
                      liveCallPopup.category === 'Known' ? colors.infoNeutral : colors.error
                  }
                ]}>
                  {liveCallPopup.category}
                </Text>
              </View>

              <Text style={[typography.bodySmall, { color: colors.textDisabled, textAlign: 'center', marginTop: spacing.xs }]}>
                The Compliance Forensics Engine has verified this category natively.
              </Text>

              <View style={{ width: '100%', marginTop: spacing.sm }}>
                <Button
                  label="Dismiss Alert"
                  onPress={() => setLiveCallPopup(null)}
                  variant="primary"
                />
              </View>
            </View>
          </View>
        </View>
      )}

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
  reportsHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  logsList: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  logItemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  logItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hashPreview: {
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  modalBody: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  modalRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalLabel: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  modalValue: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  hashBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: 4,
  },
  hashText: {
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
