# Compliance Forensics Engine — Frontend

Expo / React Native / TypeScript. **Android app only** — standalone native Android build included.

## Folder structure

```
/theme        design tokens (colors, typography, spacing, elevation, radius)
/components   reusable component library
/screens      application screens (Home, Profile, Settings, Verify, Reports, Auth)
/navigation   stack config, auth context & persistent session management
/mockData     mock datasets & fallback regulatory registry data
/utils        persistent user preferences, KYC state, audit logs & native file exporter
/android      native Android Gradle project & AuditBridge Kotlin native modules
```

## How to Run & Build

### 1. Development Server (Metro / Expo)
```bash
cd cfe-frontend
npm install
npx expo start --android
```

### 2. Standalone Release APK Build (Native Gradle)
To compile the standalone executable Release APK directly:

**On Windows:**
```powershell
cd cfe-frontend/android
.\gradlew.bat assembleRelease
```

**On macOS / Linux:**
```bash
cd cfe-frontend/android
chmod +x gradlew
./gradlew assembleRelease
```

The compiled APK will be generated at:
`cfe-frontend/android/app/build/outputs/apk/release/app-release.apk`

---

## Key Features & Customizations

- **Standalone Native Execution**: Native Kotlin bridge (`AuditBridgeModule.kt`) and `ConsentRegistryRepository.kt` built-in.
- **Persistent Auth Session**: State survives app backgrounding, home button navigation, and app restarts.
- **Appearance & Dynamic Formatting**: Instant switching between Light, Dark (`#0F172A`), and High-Contrast (`#000000` with cyan accents) themes with dynamic text scaling (88% to 128%).
- **Unclustered Profile & Settings**: 5 distinct navigation destinations (`Home`, `Verify`, `Reports`, `Profile`, `Settings`).
- **Native File Downloading**: "Download My Data" exports signed JSON compliance archives directly to the device `/storage/emulated/0/Download/` folder.
