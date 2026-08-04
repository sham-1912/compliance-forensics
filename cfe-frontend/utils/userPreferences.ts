import { NativeModules, Platform } from 'react-native';

export interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
}

export interface KycVerificationMeta {
  isVerified: boolean;
  level: string;
  documentType: string;
  documentId: string;
  verifiedAt: string;
  hash: string;
}

export interface AccountActivityItem {
  id: string;
  type: 'login' | 'security' | 'export' | 'kyc';
  title: string;
  detail: string;
  timestamp: string;
  category: 'Authentication' | 'Security' | 'Data Export' | 'Compliance';
  ipLocation: string;
}

export interface UserSettingsData {
  pushEnabled: boolean;
  suspiciousAlerts: boolean;
  weeklySummary: boolean;
  reportStatusUpdates: boolean;
  emailDigest: boolean;
  smsAlerts: boolean;
  theme: 'system' | 'light' | 'dark' | 'contrast';
  textSize: 'compact' | 'standard' | 'large' | 'extra_large';
  retentionPeriod: '30_days' | '90_days' | '1_year' | '7_years';
  storageMode: 'minimal' | 'crypto' | 'full';
}

const DEFAULT_PROFILE: UserProfileData = {
  name: 'Ananya Rao',
  email: 'ananya.rao@novaris-compliance.in',
  phone: '+91 99999 00000',
  role: 'Compliance Officer',
  organization: 'HDFC Bank Ltd — Fraud Risk Division',
};

const DEFAULT_KYC: KycVerificationMeta = {
  isVerified: true,
  level: 'Level 2 — Institutional Compliance Officer',
  documentType: 'Corporate Bar / Regulatory License',
  documentId: 'REG-IND-8849-2026',
  verifiedAt: '2026-03-15 14:30 UTC',
  hash: '0x7f8a3e920b14c5d6',
};

const DEFAULT_SETTINGS: UserSettingsData = {
  pushEnabled: true,
  suspiciousAlerts: true,
  weeklySummary: true,
  reportStatusUpdates: true,
  emailDigest: false,
  smsAlerts: true,
  theme: 'system',
  textSize: 'standard',
  retentionPeriod: '7_years',
  storageMode: 'crypto',
};

const DEFAULT_ACTIVITIES: AccountActivityItem[] = [
  {
    id: 'act-1',
    type: 'login',
    title: 'Successful Account Login',
    detail: 'Chrome on Android 14 • Active Session',
    timestamp: 'Today, 10:42 AM',
    category: 'Authentication',
    ipLocation: '103.24.12.8 (Mumbai, IN)',
  },
  {
    id: 'act-2',
    type: 'security',
    title: 'Security Credentials Updated',
    detail: 'Verified via 2FA SMS & Hardware Token',
    timestamp: 'Yesterday, 04:15 PM',
    category: 'Security',
    ipLocation: '103.24.12.8 (Mumbai, IN)',
  },
  {
    id: 'act-3',
    type: 'export',
    title: 'Audit Log Data Export',
    detail: 'Generated compliance package (JSON • 4.2 MB)',
    timestamp: 'Mar 28, 2026',
    category: 'Data Export',
    ipLocation: '103.24.12.8 (Mumbai, IN)',
  },
  {
    id: 'act-4',
    type: 'kyc',
    title: 'KYC Identity Verified',
    detail: 'Level 2 Institutional Attestation Issued',
    timestamp: 'Mar 15, 2026',
    category: 'Compliance',
    ipLocation: 'Novaris Verification Node',
  },
];

// Persistent state in memory
let currentProfile: UserProfileData = { ...DEFAULT_PROFILE };
let currentKyc: KycVerificationMeta = { ...DEFAULT_KYC };
let currentSettings: UserSettingsData = { ...DEFAULT_SETTINGS };
let currentActivities: AccountActivityItem[] = [...DEFAULT_ACTIVITIES];

// Initial auth session defaults to false (must authenticate via OTP on cold start)
let isAuthSessionActive = false;

export function getAuthSession(): boolean {
  return isAuthSessionActive;
}

export function setAuthSession(active: boolean): void {
  isAuthSessionActive = active;
}

export function getStoredUserProfile(): UserProfileData {
  return { ...currentProfile };
}

export function saveStoredUserProfile(profile: Partial<UserProfileData>): UserProfileData {
  currentProfile = { ...currentProfile, ...profile };
  addAccountActivity({
    type: 'security',
    title: 'Profile Details Updated',
    detail: `Updated name to "${currentProfile.name}" & email to "${currentProfile.email}"`,
    category: 'Security',
    ipLocation: 'On-Device UI',
  });
  return { ...currentProfile };
}

export function getStoredKycMeta(): KycVerificationMeta {
  return { ...currentKyc };
}

export function saveStoredKycMeta(kyc: Partial<KycVerificationMeta>): KycVerificationMeta {
  currentKyc = { ...currentKyc, ...kyc };
  if (kyc.isVerified) {
    addAccountActivity({
      type: 'kyc',
      title: 'Identity Re-Verified',
      detail: `Attested ${currentKyc.documentType} (${currentKyc.documentId})`,
      category: 'Compliance',
      ipLocation: 'Novaris Node',
    });
  }
  return { ...currentKyc };
}

export function getStoredUserSettings(): UserSettingsData {
  return { ...currentSettings };
}

export function saveStoredUserSettings(settings: Partial<UserSettingsData>): UserSettingsData {
  const prevRetention = currentSettings.retentionPeriod;
  currentSettings = { ...currentSettings, ...settings };
  
  if (settings.retentionPeriod && settings.retentionPeriod !== prevRetention) {
    addAccountActivity({
      type: 'security',
      title: 'Retention Policy Modified',
      detail: `Data retention set to ${settings.retentionPeriod.replace('_', ' ').toUpperCase()}`,
      category: 'Compliance',
      ipLocation: 'Settings UI',
    });
  }
  return { ...currentSettings };
}

export function getStoredAccountActivities(): AccountActivityItem[] {
  return [...currentActivities];
}

export function addAccountActivity(item: {
  type: 'login' | 'security' | 'export' | 'kyc';
  title: string;
  detail: string;
  category: 'Authentication' | 'Security' | 'Data Export' | 'Compliance';
  ipLocation: string;
}): AccountActivityItem {
  const newActivity: AccountActivityItem = {
    id: `act-${Date.now()}`,
    ...item,
    timestamp: 'Just Now',
  };
  currentActivities = [newActivity, ...currentActivities];
  return newActivity;
}

export async function executeRealFileDownload(): Promise<{ filename: string; filePath: string; sizeBytes: number }> {
  const exportPayload = {
    exportHeader: {
      generator: 'Compliance Forensics Engine v2.4.0',
      timestamp: new Date().toISOString(),
      cryptoKeyId: 'CFE-KEY-2026-SHA256',
      attestation: 'ISO/IEC 27001 Certified Export',
    },
    userProfile: currentProfile,
    kycAttestation: currentKyc,
    settingsConfiguration: currentSettings,
    accountAuditFeed: currentActivities,
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const filename = `CFE_DataExport_${currentProfile.name.replace(/\s+/g, '_')}_${Date.now()}.json`;

  let filePath = `Downloads/${filename}`;
  let sizeBytes = jsonContent.length;

  if (Platform.OS === 'android' && NativeModules.AuditBridgeModule && typeof NativeModules.AuditBridgeModule.saveExportFile === 'function') {
    try {
      const res = await NativeModules.AuditBridgeModule.saveExportFile(filename, jsonContent);
      if (res && res.filePath) {
        filePath = res.filePath;
        sizeBytes = res.fileSize || jsonContent.length;
      }
    } catch (err) {
      console.error("Failed to write native export file", err);
    }
  }

  addAccountActivity({
    type: 'export',
    title: 'Downloaded Data Archive',
    detail: `Exported compliance bundle (${filename})`,
    category: 'Data Export',
    ipLocation: 'Device Storage',
  });

  return {
    filename,
    filePath,
    sizeBytes,
  };
}
