import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  ShieldCheck,
  Edit3,
  Save,
  X,
  FileText,
  Download,
  History,
  Lock,
  Key,
  Shield,
  Search,
  CheckCircle2,
  Camera,
  ChevronRight,
  Info,
  User,
  RefreshCw,
  Check,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react-native';
import { elevation, spacing } from '@/theme';
import { Card } from './Card';
import { Button } from './Button';
import { InputField } from './InputField';
import {
  getStoredUserProfile,
  saveStoredUserProfile,
  getStoredKycMeta,
  saveStoredKycMeta,
  getStoredAccountActivities,
  executeRealFileDownload,
  UserProfileData,
  KycVerificationMeta,
  AccountActivityItem,
} from '@/utils/userPreferences';
import { useAppearance } from '@/theme/AppearanceContext';

interface ProfileViewProps {
  onShowSnackbar: (msg: string) => void;
  onProfileUpdated?: (updated: UserProfileData) => void;
  onNavigateToSettings?: () => void;
}

export function ProfileView({
  onShowSnackbar,
  onProfileUpdated,
  onNavigateToSettings,
}: ProfileViewProps) {
  const { activeColors, scaledTypography } = useAppearance();

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfileData>(getStoredUserProfile());

  // Inline Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editEmail, setEditEmail] = useState(userProfile.email);
  const [editPhone, setEditPhone] = useState(userProfile.phone);
  const [editError, setEditError] = useState<string | null>(null);

  // Identity Verification (KYC) State
  const [kycMeta, setKycMeta] = useState<KycVerificationMeta>(getStoredKycMeta());
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycStep, setKycStep] = useState<1 | 2 | 3 | 4>(1);
  const [docType, setDocType] = useState('regulatory_id');
  const [docNumber, setDocNumber] = useState(kycMeta.documentId || 'REG-IND-8849-2026');
  const [scanning, setScanning] = useState(false);
  const [kycProgress, setKycProgress] = useState(0);

  // Account Activity Feed State
  const [activities, setActivities] = useState<AccountActivityItem[]>(getStoredAccountActivities());
  const [activityCategory, setActivityCategory] = useState<'all' | 'Authentication' | 'Security' | 'Data Export' | 'Compliance'>('all');
  const [activitySearch, setActivitySearch] = useState('');

  // Data Download Modal & State
  const [showDataModal, setShowDataModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [exportedFileResult, setExportedFileResult] = useState<{ filename: string; sizeBytes: number } | null>(null);
  const [showRetentionModal, setShowRetentionModal] = useState(false);

  // Handlers for Inline Edit
  const handleStartEdit = () => {
    setEditName(userProfile.name);
    setEditEmail(userProfile.email);
    setEditPhone(userProfile.phone);
    setEditError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      setEditError('Full name cannot be empty');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setEditError('Please enter a valid email address');
      return;
    }

    const updated = saveStoredUserProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
    });
    setUserProfile(updated);
    setIsEditing(false);
    setEditError(null);
    onShowSnackbar('Profile updated successfully!');
    if (onProfileUpdated) {
      onProfileUpdated(updated);
    }
  };

  // Handlers for KYC Modal
  const handleStartKyc = () => {
    setKycStep(1);
    setKycProgress(0);
    setScanning(false);
    setShowKycModal(true);
  };

  const handleSimulateScan = () => {
    if (!docNumber.trim()) {
      onShowSnackbar('Please enter a document or license number');
      return;
    }
    setKycStep(2);
    setScanning(true);
    setKycProgress(0);

    let p = 0;
    const inv = setInterval(() => {
      p += 20;
      setKycProgress(p);
      if (p >= 100) {
        clearInterval(inv);
        setScanning(false);
        setKycStep(3);
      }
    }, 300);
  };

  const handleCompleteKyc = () => {
    const docLabels: Record<string, string> = {
      regulatory_id: 'Corporate Bar / Regulatory License',
      govt_id: 'Government Official ID',
      passport: 'Institutional Passport',
    };
    const updatedKyc = saveStoredKycMeta({
      isVerified: true,
      level: 'Level 2 — Institutional Compliance Officer',
      documentType: docLabels[docType] || 'Regulatory License',
      documentId: docNumber.trim(),
      verifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      hash: '0x' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10),
    });
    setKycMeta(updatedKyc);
    setActivities(getStoredAccountActivities());
    setKycStep(4);
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
        setActivities(getStoredAccountActivities());
        setDownloading(false);
        onShowSnackbar(`Export ready! Downloaded ${result.filename}`);
      }
    }, 200);
  };

  // Filtered Activity List
  const filteredActivities = activities.filter((act) => {
    const matchesCategory = activityCategory === 'all' || act.category === activityCategory;
    const matchesSearch =
      act.title.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.detail.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.category.toLowerCase().includes(activitySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* 1. Minimal Identity Verified Badge Card */}
      <Card style={styles.identityCard}>
        <View style={styles.identityHeader}>
          <View style={[styles.badgePill, { backgroundColor: kycMeta.isVerified ? activeColors.success + '20' : activeColors.warning + '20' }]}>
            {kycMeta.isVerified ? (
              <ShieldCheck size={15} color={activeColors.success} />
            ) : (
              <AlertTriangle size={15} color={activeColors.warning} />
            )}
            <Text style={[scaledTypography.labelSmall, { color: kycMeta.isVerified ? activeColors.success : activeColors.warning, fontWeight: '700' }]}>
              {kycMeta.isVerified ? 'Identity Verified' : 'Unverified Identity'}
            </Text>
          </View>
          <Pressable
            onPress={handleStartKyc}
            style={({ pressed }) => [styles.kycActionBtn, { backgroundColor: activeColors.primary + '15' }, pressed && { opacity: 0.8 }]}
          >
            <RefreshCw size={12} color={activeColors.primary} />
            <Text style={[scaledTypography.labelSmall, { color: activeColors.primary, fontWeight: '700' }]}>
              {kycMeta.isVerified ? 'Re-verify KYC' : 'Verify Identity'}
            </Text>
          </Pressable>
        </View>

        <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary, marginTop: spacing.xs }]}>
          {kycMeta.isVerified ? 'KYC Compliance Attestation' : 'Action Required: Verify Identity'}
        </Text>
        <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary, marginTop: 2 }]}>
          {kycMeta.isVerified
            ? `${kycMeta.level}. Cryptographically attested by Novaris Node.`
            : 'Complete identity verification to enable certified audit exports.'}
        </Text>

        {kycMeta.isVerified && (
          <View style={[styles.verifyMetaBox, { backgroundColor: activeColors.codeBackground, borderColor: activeColors.border }]}>
            <View style={styles.verifyMetaRow}>
              <Text style={[styles.metaLabel, { color: activeColors.textSecondary }]}>DOCUMENT:</Text>
              <Text style={[styles.metaValue, { color: activeColors.textPrimary }]}>{kycMeta.documentType} ({kycMeta.documentId})</Text>
            </View>
            <View style={styles.verifyMetaRow}>
              <Text style={[styles.metaLabel, { color: activeColors.textSecondary }]}>VERIFIED AT:</Text>
              <Text style={[styles.metaValue, { color: activeColors.textPrimary }]}>{kycMeta.verifiedAt}</Text>
            </View>
            <View style={styles.verifyMetaRow}>
              <Text style={[styles.metaLabel, { color: activeColors.textSecondary }]}>PROOFS HASH:</Text>
              <Text style={[styles.metaValue, { color: activeColors.primary, fontFamily: 'monospace' }]}>{kycMeta.hash}</Text>
            </View>
          </View>
        )}
      </Card>

      {/* 2. Editable Profile Fields Card */}
      <Card style={styles.profileFieldsCard}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <User size={16} color={activeColors.primary} />
            <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Profile Details</Text>
          </View>
          {!isEditing ? (
            <Pressable
              onPress={handleStartEdit}
              style={({ pressed }) => [styles.inlineEditBtn, { backgroundColor: activeColors.primary + '15' }, pressed && { opacity: 0.7 }]}
            >
              <Edit3 size={13} color={activeColors.primary} />
              <Text style={[scaledTypography.labelSmall, { color: activeColors.primary, fontWeight: '700' }]}>Edit</Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={handleCancelEdit}
                style={({ pressed }) => [styles.cancelBtn, { backgroundColor: activeColors.border }, pressed && { opacity: 0.7 }]}
              >
                <X size={13} color={activeColors.textSecondary} />
                <Text style={[scaledTypography.labelSmall, { color: activeColors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: activeColors.primary }, pressed && { opacity: 0.7 }]}
              >
                <Save size={13} color="#FFFFFF" />
                <Text style={[scaledTypography.labelSmall, { color: '#FFFFFF', fontWeight: '700' }]}>Save</Text>
              </Pressable>
            </View>
          )}
        </View>

        {editError ? (
          <View style={styles.errorBox}>
            <AlertTriangle size={13} color={activeColors.error} />
            <Text style={[scaledTypography.bodySmall, { color: activeColors.error }]}>{editError}</Text>
          </View>
        ) : null}

        <View style={styles.fieldsGrid}>
          {/* Name Field */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>FULL NAME</Text>
            {!isEditing ? (
              <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>{userProfile.name}</Text>
            ) : (
              <TextInput
                style={[styles.fieldInput, { color: activeColors.textPrimary, backgroundColor: activeColors.surface, borderColor: activeColors.primary }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={activeColors.textDisabled}
              />
            )}
          </View>

          {/* Email Field */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>EMAIL ADDRESS</Text>
            {!isEditing ? (
              <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>{userProfile.email}</Text>
            ) : (
              <TextInput
                style={[styles.fieldInput, { color: activeColors.textPrimary, backgroundColor: activeColors.surface, borderColor: activeColors.primary }]}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email address"
                placeholderTextColor={activeColors.textDisabled}
              />
            )}
          </View>

          {/* Phone Field */}
          <View style={styles.fieldItem}>
            <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>MOBILE PHONE</Text>
            {!isEditing ? (
              <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>{userProfile.phone}</Text>
            ) : (
              <TextInput
                style={[styles.fieldInput, { color: activeColors.textPrimary, backgroundColor: activeColors.surface, borderColor: activeColors.primary }]}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor={activeColors.textDisabled}
              />
            )}
          </View>

          {/* Role & Org */}
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>ROLE</Text>
              <Text style={[scaledTypography.bodySmall, { color: activeColors.textPrimary, fontWeight: '500' }]}>{userProfile.role}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: activeColors.textSecondary }]}>ORGANIZATION</Text>
              <Text style={[scaledTypography.bodySmall, { color: activeColors.textPrimary, fontWeight: '500' }]} numberOfLines={1}>
                {userProfile.organization}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* 3. Account-Level Activity Audit Feed */}
      <Card style={styles.activityCard}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <History size={16} color={activeColors.primary} />
            <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Account Audit Feed</Text>
          </View>
          <Text style={[scaledTypography.labelSmall, { color: activeColors.textSecondary }]}>{filteredActivities.length} events</Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: activeColors.codeBackground }]}>
          <Search size={14} color={activeColors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: activeColors.textPrimary }]}
            placeholder="Search logins, exports, security events..."
            placeholderTextColor={activeColors.textDisabled}
            value={activitySearch}
            onChangeText={setActivitySearch}
          />
          {activitySearch.length > 0 && (
            <Pressable onPress={() => setActivitySearch('')}>
              <X size={14} color={activeColors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { key: 'all', label: 'All Events' },
            { key: 'Authentication', label: 'Logins' },
            { key: 'Security', label: 'Security' },
            { key: 'Data Export', label: 'Exports' },
            { key: 'Compliance', label: 'KYC' },
          ].map(({ key, label }) => {
            const isSel = activityCategory === key;
            return (
              <Pressable
                key={key}
                onPress={() => setActivityCategory(key as any)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSel ? activeColors.primary : activeColors.codeBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    scaledTypography.labelSmall,
                    { color: isSel ? '#FFFFFF' : activeColors.textSecondary, fontWeight: isSel ? '700' : '400' },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Audit List */}
        <View style={styles.activityList}>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyList}>
              <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>No matching audit items found.</Text>
            </View>
          ) : (
            filteredActivities.map((act, index) => {
              const isLast = index === filteredActivities.length - 1;
              return (
                <View key={act.id} style={[styles.actItem, !isLast && { borderBottomWidth: 1, borderBottomColor: activeColors.border }]}>
                  <View style={[styles.actIconContainer, { backgroundColor: activeColors.primary + '15' }]}>
                    {act.type === 'login' ? (
                      <Key size={13} color={activeColors.primary} />
                    ) : act.type === 'export' ? (
                      <Download size={13} color={activeColors.primary} />
                    ) : act.type === 'kyc' ? (
                      <ShieldCheck size={13} color={activeColors.success} />
                    ) : (
                      <Lock size={13} color={activeColors.warning} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>{act.title}</Text>
                      <Text style={[scaledTypography.labelSmall, { color: activeColors.textSecondary }]}>{act.timestamp}</Text>
                    </View>
                    <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>{act.detail}</Text>
                    <Text style={[scaledTypography.labelSmall, { color: activeColors.primary, fontSize: 10, marginTop: 1 }]}>
                      {act.category} • {act.ipLocation}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Card>

      {/* 4. Data & Privacy Quick Links */}
      <Card style={styles.privacyCard}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FileText size={16} color={activeColors.primary} />
            <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Data & Privacy Quick Actions</Text>
          </View>
        </View>

        <View style={styles.quickLinksGrid}>
          {/* Download My Data Link */}
          <Pressable
            onPress={() => {
              setShowDataModal(true);
              handleStartDataDownload();
            }}
            style={({ pressed }) => [styles.quickLinkTile, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: activeColors.primary + '15' }]}>
              <Download size={15} color={activeColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>Download My Data</Text>
              <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Export full JSON archive to device</Text>
            </View>
            <ChevronRight size={16} color={activeColors.textSecondary} />
          </Pressable>

          <View style={[styles.tileSeparator, { backgroundColor: activeColors.border }]} />

          {/* Data Retention Info Link */}
          <Pressable
            onPress={() => setShowRetentionModal(true)}
            style={({ pressed }) => [styles.quickLinkTile, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: activeColors.primary + '15' }]}>
              <Info size={15} color={activeColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>Data Retention Policy</Text>
              <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Review regulatory storage & purge rules</Text>
            </View>
            <ChevronRight size={16} color={activeColors.textSecondary} />
          </Pressable>
        </View>
      </Card>

      {/* KYC Scanner Modal */}
      <Modal visible={showKycModal} transparent animationType="fade" onRequestClose={() => setShowKycModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Identity Verification (KYC)</Text>
              <Pressable onPress={() => setShowKycModal(false)}>
                <X size={18} color={activeColors.textSecondary} />
              </Pressable>
            </View>

            {kycStep === 1 && (
              <View style={{ gap: spacing.sm, paddingTop: spacing.xs }}>
                <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>Select official credential type and enter identifier for verification:</Text>

                <View style={styles.docTypeSelector}>
                  {[
                    { key: 'regulatory_id', label: 'Corporate Bar / Regulatory License' },
                    { key: 'govt_id', label: 'Government Official ID' },
                    { key: 'passport', label: 'Institutional Passport' },
                  ].map(({ key, label }) => {
                    const isSel = docType === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setDocType(key)}
                        style={[styles.docTypeOption, { borderColor: isSel ? activeColors.primary : activeColors.border, backgroundColor: isSel ? activeColors.primary + '15' : activeColors.surface }]}
                      >
                        <Text style={[scaledTypography.bodySmall, { color: isSel ? activeColors.primary : activeColors.textPrimary, fontWeight: isSel ? '700' : '400' }]}>{label}</Text>
                        {isSel && <Check size={14} color={activeColors.primary} />}
                      </Pressable>
                    );
                  })}
                </View>

                <InputField
                  label="Credential Number / License ID"
                  placeholder="e.g. REG-IND-8849-2026"
                  value={docNumber}
                  onChangeText={setDocNumber}
                />

                <Button label="Scan Document" onPress={handleSimulateScan} />
              </View>
            )}

            {kycStep === 2 && (
              <View style={{ alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm }}>
                <View style={[styles.cameraScanBox, { borderColor: activeColors.primary }]}>
                  <Camera size={36} color={activeColors.primary} />
                  <View style={[styles.scanLine, { top: `${kycProgress}%` }]} />
                </View>
                <Text style={[scaledTypography.bodyMedium, { color: activeColors.textPrimary, fontWeight: '600' }]}>Scanning Document & Extracting Attestation...</Text>
                <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary }]}>{kycProgress}% processed</Text>
              </View>
            )}

            {kycStep === 3 && (
              <View style={{ gap: spacing.sm, paddingTop: spacing.xs }}>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={40} color={activeColors.success} />
                  <Text style={[scaledTypography.titleSmall, { color: activeColors.textPrimary }]}>Attestation Hash Generated</Text>
                  <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary, textAlign: 'center' }]}>
                    Document verified against Novaris Institutional Registry. Ready to seal attestation.
                  </Text>
                </View>

                <Button label="Issue Level 2 KYC Attestation" onPress={handleCompleteKyc} />
              </View>
            )}

            {kycStep === 4 && (
              <View style={{ alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm }}>
                <View style={[styles.successCircle, { backgroundColor: activeColors.success + '20' }]}>
                  <CheckCircle2 size={36} color={activeColors.success} />
                </View>
                <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Verification Complete!</Text>
                <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary, textAlign: 'center' }]}>
                  Level 2 Institutional Attestation issued. Your profile is now verified.
                </Text>
                <Button label="Done" onPress={() => setShowKycModal(false)} />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Data Download Modal */}
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
                  <Text style={[scaledTypography.titleSmall, { color: activeColors.textPrimary }]}>Export Saved</Text>
                  <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary, textAlign: 'center' }]}>
                    JSON bundle saved to device Downloads folder:{'\n'}{exportedFileResult.filename}
                  </Text>
                </View>

                <Button label="Done" onPress={() => setShowDataModal(false)} />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Retention Policy Modal */}
      <Modal visible={showRetentionModal} transparent animationType="fade" onRequestClose={() => setShowRetentionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[scaledTypography.titleMedium, { color: activeColors.textPrimary }]}>Data Retention Policy</Text>
              <Pressable onPress={() => setShowRetentionModal(false)}>
                <X size={18} color={activeColors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: spacing.sm }}>
              <Text style={[scaledTypography.bodySmall, { color: activeColors.textSecondary, lineHeight: 18 }]}>
                Compliance Forensics Engine adheres strictly to regulatory data retention laws (ISO/IEC 27001 & RBI Cyber Security Guidelines).{'\n\n'}
                • <Text style={{ fontWeight: '700', color: activeColors.textPrimary }}>Default Retention Window:</Text> 7 Years (Regulatory Archive).{'\n'}
                • <Text style={{ fontWeight: '700', color: activeColors.textPrimary }}>Automatic Purging:</Text> Records older than the configured threshold are cryptographically erased.{'\n'}
                • <Text style={{ fontWeight: '700', color: activeColors.textPrimary }}>Export Availability:</Text> Active users may download full JSON audit bundles at any time.
              </Text>
            </ScrollView>

            <Button label="Got It" onPress={() => setShowRetentionModal(false)} />
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
  identityCard: {
    padding: spacing.md,
  },
  identityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  kycActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifyMetaBox: {
    marginTop: spacing.sm,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  verifyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '500',
  },

  profileFieldsCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  fieldsGrid: {
    gap: 10,
    marginTop: 2,
  },
  fieldItem: {
    gap: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fieldInput: {
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  activityCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
  },
  activityList: {
    marginTop: 2,
  },
  emptyList: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  actItem: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  actIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  privacyCard: {
    padding: spacing.md,
    gap: 2,
  },
  quickLinksGrid: {
    marginTop: 4,
  },
  quickLinkTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 4,
    paddingVertical: 8,
  },
  tileSeparator: {
    height: 1,
  },
  quickIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  docTypeSelector: {
    gap: 6,
  },
  docTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
  },
  cameraScanBox: {
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#38BDF8',
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
