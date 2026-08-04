import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Bell,
  Sun,
  Moon,
  Monitor,
  Type,
  Shield,
  Download,
  Trash2,
  Info,
  ChevronRight,
  AlertTriangle,
  Lock,
  Sliders,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { elevation, spacing } from '@/theme';
import { Card } from './Card';
import { Button } from './Button';
import { Switch } from './Switch';
import { useAppearance } from '@/theme/AppearanceContext';
import {
  getStoredUserSettings,
  saveStoredUserSettings,
  executeRealFileDownload,
  UserSettingsData,
} from '@/utils/userPreferences';

interface SettingsViewProps {
  onLogout: () => void;
  onShowSnackbar: (msg: string) => void;
  onNavigateToDownloadData?: () => void;
}

export function SettingsView({
  onLogout,
  onShowSnackbar,
  onNavigateToDownloadData,
}: SettingsViewProps) {
  const { setTheme: setAppTheme, setTextSize: setAppTextSize, activeColors, scaledTypography } = useAppearance();

  // Load executable stored settings
  const [settings, setSettings] = useState<UserSettingsData>(getStoredUserSettings());

  // Executable Download Data Modal
  const [showDataModal, setShowDataModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [exportedFileResult, setExportedFileResult] = useState<{ filename: string; sizeBytes: number } | null>(null);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Logout Confirm Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Info Modals
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; body: string } | null>(null);

  // Handlers
  const updateSetting = <K extends keyof UserSettingsData>(key: K, value: UserSettingsData[K]) => {
    const updated = saveStoredUserSettings({ [key]: value });
    setSettings(updated);
  };

  const handleThemeChange = (newTheme: 'system' | 'light' | 'dark' | 'contrast') => {
    updateSetting('theme', newTheme);
    setAppTheme(newTheme);
    onShowSnackbar(`Theme updated: ${newTheme.toUpperCase()}`);
  };

  const handleTextSizeChange = (newSize: 'compact' | 'standard' | 'large' | 'extra_large') => {
    updateSetting('textSize', newSize);
    setAppTextSize(newSize);
    onShowSnackbar(`Text scaling updated: ${newSize.replace('_', ' ').toUpperCase()}`);
  };

  const handleRetentionChange = (newPeriod: '30_days' | '90_days' | '1_year' | '7_years') => {
    updateSetting('retentionPeriod', newPeriod);
    const labels: Record<string, string> = {
      '30_days': '30 Days (Minimal)',
      '90_days': '90 Days (Standard)',
      '1_year': '1 Year (Extended)',
      '7_years': '7 Years (Regulatory Archive)',
    };
    onShowSnackbar(`Data Retention set to: ${labels[newPeriod]}`);
  };

  const handleStartDataDownload = () => {
    setDownloading(true);
    setDownloadProgress(0);
    setExportedFileResult(null);

    let p = 0;
    const inv = setInterval(async () => {
      p += 25;
      setDownloadProgress(p);
      if (p >= 100) {
        clearInterval(inv);
        const result = await executeRealFileDownload();
        setExportedFileResult({
          filename: result.filename,
          sizeBytes: result.sizeBytes,
        });
        setDownloading(false);
        onShowSnackbar(`Export ready! Downloaded ${result.filename}`);
      }
    }, 200);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'delete') {
      onShowSnackbar('Type "DELETE" to confirm account termination.');
      return;
    }
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setShowDeleteModal(false);
      onShowSnackbar('Account deletion request initiated.');
      onLogout();
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* GROUP 1: NOTIFICATIONS */}
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <Bell size={16} color={activeColors.primary} />
          <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Notifications</Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>Push Notifications</Text>
            <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Instant mobile alerts for compliance events</Text>
          </View>
          <Switch
            value={settings.pushEnabled}
            onValueChange={(val) => {
              updateSetting('pushEnabled', val);
              onShowSnackbar(`Push notifications ${val ? 'enabled' : 'disabled'}`);
            }}
            accessibilityLabel="Toggle push notifications"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>Suspicious-Call Alerts</Text>
            <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Heads-up warning for unverified callers</Text>
          </View>
          <Switch
            value={settings.suspiciousAlerts}
            onValueChange={(val) => {
              updateSetting('suspiciousAlerts', val);
              onShowSnackbar(`Suspicious call alerts ${val ? 'enabled' : 'disabled'}`);
            }}
            accessibilityLabel="Toggle suspicious-call alerts"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>Weekly Summary Digest</Text>
            <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Weekly audit statistics & blocked call counts</Text>
          </View>
          <Switch
            value={settings.weeklySummary}
            onValueChange={(val) => {
              updateSetting('weeklySummary', val);
              onShowSnackbar(`Weekly summary digest ${val ? 'enabled' : 'disabled'}`);
            }}
            accessibilityLabel="Toggle weekly summary"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>Report Status Updates</Text>
              <View style={[styles.newChip, { backgroundColor: activeColors.primary }]}>
                <Text style={styles.newChipText}>NEW</Text>
              </View>
            </View>
            <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Alert when background forensic reports finish exporting</Text>
          </View>
          <Switch
            value={settings.reportStatusUpdates}
            onValueChange={(val) => {
              updateSetting('reportStatusUpdates', val);
              onShowSnackbar(`Report status updates ${val ? 'enabled' : 'disabled'}`);
            }}
            accessibilityLabel="Toggle report status updates"
          />
        </View>
      </Card>

      {/* GROUP 2: APPEARANCE */}
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <Sliders size={16} color={activeColors.primary} />
          <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Appearance</Text>
        </View>

        {/* Theme Selector */}
        <View style={styles.settingBlock}>
          <Text style={[styles.settingBlockTitle, { color: activeColors.textSecondary }]}>THEME</Text>
          <View style={styles.selectorGrid}>
            {[
              { key: 'system', label: 'System', Icon: Monitor },
              { key: 'light', label: 'Light', Icon: Sun },
              { key: 'dark', label: 'Dark', Icon: Moon },
              { key: 'contrast', label: 'Contrast', Icon: Shield },
            ].map(({ key, label, Icon }) => {
              const isSel = settings.theme === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleThemeChange(key as any)}
                  style={[
                    styles.selectorChip,
                    {
                      borderColor: isSel ? activeColors.primary : activeColors.border,
                      backgroundColor: isSel ? activeColors.primary + '25' : activeColors.surface,
                    },
                  ]}
                >
                  <Icon size={13} color={isSel ? activeColors.primary : activeColors.textSecondary} />
                  <Text
                    style={[
                      scaledTypography.labelSmall,
                      { color: isSel ? activeColors.primary : activeColors.textSecondary, fontWeight: isSel ? '700' : '400' },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

        {/* Text Size Selector */}
        <View style={styles.settingBlock}>
          <Text style={[styles.settingBlockTitle, { color: activeColors.textSecondary }]}>TEXT SCALING</Text>
          <View style={styles.selectorGrid}>
            {[
              { key: 'compact', label: 'Compact' },
              { key: 'standard', label: 'Standard' },
              { key: 'large', label: 'Large' },
              { key: 'extra_large', label: 'XL' },
            ].map(({ key, label }) => {
              const isSel = settings.textSize === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleTextSizeChange(key as any)}
                  style={[
                    styles.selectorChip,
                    {
                      borderColor: isSel ? activeColors.primary : activeColors.border,
                      backgroundColor: isSel ? activeColors.primary + '25' : activeColors.surface,
                    },
                  ]}
                >
                  <Type size={13} color={isSel ? activeColors.primary : activeColors.textSecondary} />
                  <Text
                    style={[
                      scaledTypography.labelSmall,
                      { color: isSel ? activeColors.primary : activeColors.textSecondary, fontWeight: isSel ? '700' : '400' },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      {/* GROUP 3: COMPLIANCE & DATA */}
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <Shield size={16} color={activeColors.primary} />
          <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Compliance & Data</Text>
        </View>

        {/* Retention Period Picker */}
        <View style={styles.settingBlock}>
          <Text style={[styles.settingBlockTitle, { color: activeColors.textSecondary }]}>DATA RETENTION PERIOD</Text>
          <View style={styles.retentionList}>
            {[
              { key: '30_days', label: '30 Days', desc: 'Minimal storage footprint' },
              { key: '90_days', label: '90 Days', desc: 'Standard regulatory window' },
              { key: '1_year', label: '1 Year', desc: 'Extended audit compliance' },
              { key: '7_years', label: '7 Years', desc: 'Regulatory Archive (ISO/IEC certified)' },
            ].map(({ key, label, desc }) => {
              const isSel = settings.retentionPeriod === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleRetentionChange(key as any)}
                  style={[
                    styles.retentionOption,
                    {
                      borderColor: isSel ? activeColors.primary : activeColors.border,
                      backgroundColor: isSel ? activeColors.primary + '15' : activeColors.surface,
                    },
                  ]}
                >
                  <View style={[styles.radioCircle, { borderColor: isSel ? activeColors.primary : activeColors.border }]}>
                    {isSel && <View style={[styles.radioDot, { backgroundColor: activeColors.primary }]} />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>{label}</Text>
                    <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>{desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

        {/* Download My Data Action */}
        <Pressable
          onPress={() => {
            setShowDataModal(true);
            handleStartDataDownload();
          }}
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
        >
          <Download size={18} color={activeColors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>Download My Data</Text>
            <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Export full JSON audit archive to device</Text>
          </View>
          <ChevronRight size={16} color={activeColors.textSecondary} />
        </Pressable>

        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

        {/* Delete Account Action */}
        <Pressable
          onPress={() => setShowDeleteModal(true)}
          style={({ pressed }) => [styles.dangerActionRow, pressed && { opacity: 0.7 }]}
        >
          <Trash2 size={18} color={activeColors.error} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[scaledTypography.bodyMedium, { color: activeColors.error, fontWeight: '600' }]}>Delete Account</Text>
            <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Permanently erase profile & regulatory logs</Text>
          </View>
          <ChevronRight size={16} color={activeColors.error} />
        </Pressable>
      </Card>

      {/* GROUP 4: ABOUT */}
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <Info size={16} color={activeColors.primary} />
          <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>About Compliance Forensics</Text>
        </View>

        <View style={styles.aboutRow}>
          <Text style={[scaledTypography.bodyMedium, { color: activeColors.textSecondary }]}>Engine Version</Text>
          <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>v2.4.0 (Build 8849)</Text>
        </View>

        <View style={styles.aboutRow}>
          <Text style={[scaledTypography.bodyMedium, { color: activeColors.textSecondary }]}>Security Standard</Text>
          <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>ISO/IEC 27001 Certified</Text>
        </View>

        <View style={styles.aboutRow}>
          <Text style={[scaledTypography.bodyMedium, { color: activeColors.textSecondary }]}>Kernel Module</Text>
          <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>Novaris-Consent-v4.2</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

        <Pressable
          onPress={() => setInfoModalContent({
            title: 'Terms of Service',
            body: 'Compliance Forensics Engine operates under regulatory consent verification frameworks. All caller checks are attested against authorized institutional nodes.',
          })}
          style={styles.linkRow}
        >
          <Text style={[scaledTypography.bodyMedium, { color: activeColors.primary, fontWeight: '600' }]}>Terms of Service</Text>
          <ChevronRight size={14} color={activeColors.primary} />
        </Pressable>

        <Pressable
          onPress={() => setInfoModalContent({
            title: 'Privacy Policy',
            body: 'Your data is encrypted end-to-end using AES-256. Zero personal call recordings are stored. Consent logs are cryptographically sealed.',
          })}
          style={styles.linkRow}
        >
          <Text style={[scaledTypography.bodyMedium, { color: activeColors.primary, fontWeight: '600' }]}>Privacy Policy</Text>
          <ChevronRight size={14} color={activeColors.primary} />
        </Pressable>
      </Card>

      {/* GROUP 5: ACCOUNT */}
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <Lock size={16} color={activeColors.primary} />
          <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Account Session</Text>
        </View>

        <Button
          label="Log Out of Account"
          variant="secondary"
          onPress={() => setShowLogoutModal(true)}
        />
      </Card>

      {/* Executable Download Data Modal */}
      <Modal visible={showDataModal} transparent animationType="fade" onRequestClose={() => setShowDataModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Exporting Compliance Archive</Text>
              {!downloading && (
                <Pressable onPress={() => setShowDataModal(false)}>
                  <X size={18} color={activeColors.textSecondary} />
                </Pressable>
              )}
            </View>

            {downloading ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.md }}>
                <ActivityIndicator size="large" color={activeColors.primary} />
                <Text style={[scaledTypography.bodyMedium, { color: activeColors.textSecondary }]}>Compiling JSON archive... {downloadProgress}%</Text>
                <View style={{ width: '100%', height: 6, backgroundColor: activeColors.border, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: activeColors.primary }} />
                </View>
              </View>
            ) : exportedFileResult ? (
              <View style={{ gap: spacing.md, paddingTop: spacing.md }}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={44} color={activeColors.success} />
                  <Text style={[scaledTypography.titleSmall, { color: activeColors.textPrimary }]}>Export Ready & Saved</Text>
                  <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary, textAlign: 'center' }]}>
                    File saved to device Downloads folder:{'\n'}{exportedFileResult.filename}
                  </Text>
                </View>

                <Button label="Done" onPress={() => setShowDataModal(false)} />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Delete Account Dialog Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={18} color={activeColors.error} />
                <Text style={[scaledTypography.titleMedium, { color: activeColors.error }]}>Delete Account</Text>
              </View>
              <Pressable onPress={() => setShowDeleteModal(false)}>
                <X size={18} color={activeColors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[scaledTypography.bodyMedium, { color: activeColors.textSecondary, marginTop: spacing.xs }]}>
              This action cannot be undone. Type <Text style={{ fontWeight: '700', color: activeColors.textPrimary }}>"DELETE"</Text> below to permanently terminate your account and erase audit records.
            </Text>

            <TextInput
              style={[styles.deleteInput, { color: activeColors.textPrimary, backgroundColor: activeColors.surface, borderColor: activeColors.error }]}
              placeholder='Type "DELETE" to confirm'
              placeholderTextColor={activeColors.textDisabled}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="characters"
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" onPress={() => setShowDeleteModal(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Delete"
                  variant="destructive"
                  onPress={handleDeleteAccount}
                  loading={deleting}
                  disabled={deleteConfirmText.trim().toLowerCase() !== 'delete'}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
            <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Log Out of Account</Text>
            <Text style={[scaledTypography.bodyMedium, { color: activeColors.textSecondary, marginTop: spacing.xs }]}>
              Are you sure you want to end your current session? You will need to sign in again via OTP.
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" onPress={() => setShowLogoutModal(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Log Out"
                  variant="destructive"
                  onPress={() => {
                    setShowLogoutModal(false);
                    onLogout();
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info Content Modal */}
      <Modal visible={!!infoModalContent} transparent animationType="fade" onRequestClose={() => setInfoModalContent(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>{infoModalContent?.title}</Text>
              <Pressable onPress={() => setInfoModalContent(null)}>
                <X size={18} color={activeColors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[scaledTypography.bodyMedium, { color: activeColors.textSecondary, marginTop: spacing.sm, lineHeight: 20 }]}>
              {infoModalContent?.body}
            </Text>

            <View style={{ marginTop: spacing.md }}>
              <Button label="Close" onPress={() => setInfoModalContent(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  groupCard: {
    gap: spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  newChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  newChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  settingBlock: {
    gap: 6,
    marginVertical: 2,
  },
  settingBlockTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  selectorGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  selectorChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  retentionList: {
    gap: 6,
  },
  retentionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dangerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: spacing.md,
    ...elevation.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteInput: {
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
});
