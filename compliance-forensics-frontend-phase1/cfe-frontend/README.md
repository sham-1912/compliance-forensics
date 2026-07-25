# Compliance Forensics Engine — Frontend

Expo / React Native / TypeScript. **Android app only** — no iOS, no web
build target. Frontend-only — no backend, no real auth, every async
action is a simulated `setTimeout`. See the full spec this was built
from for details.

## Folder structure

```
/theme        design tokens (colors, typography, spacing, elevation, radius)
/components   reusable component library (Section 5 inventory)
/screens      one file per screen
/navigation   stack config + auth context
/mockData     one file per mock dataset
```

## Run it

```
npm install
npx expo start --android
```
Requires an Android emulator or a physical Android device with Expo Go.

---

## Phase 1 summary — Foundation & Authentication

**Status: complete.** Built per the spec's own execution order (Section
9): design system first, then the 4 auth screens, then a navigation
skeleton — nothing later depends on anything not yet built.

**Theme (`/theme`):** `colors.ts`, `typography.ts`, `spacing.ts`,
`elevation.ts`, `radius.ts` — all values locked per spec Section 4,
including the two pre-approved additions (`infoNeutral`,
`codeBackground`/`codeMono`).

**Components added (`/components`):** `Button`, `InputField`,
`OTPInput`, `Card`, `Badge`, `StatusChip`, `TopAppBar`, `Snackbar`,
`Dialog`, `FullScreenLoader` + `SkeletonBlock`, `EmptyState`, `Switch`
— the full Section 4.6 base library. `StatusChip` already supports all
4 variants (success/warning/error/neutral) since later phases depend
on it immediately.

**Screens built:** `SplashScreen`, `LoginScreen`, `EmailSignInScreen`,
`OtpVerificationScreen`.

**Mock data added:** `mockUser.ts`, `mockOTP.ts`.

**Navigation:** `AuthStack` (Splash → Login → EmailSignIn →
OtpVerification) + `AuthContext` (UI-only `isAuthenticated` state) +
`RootNavigator`, which mounts `AuthStack` or the main app as *siblings*
rather than nesting — this is what produces "reset, not push" on both
login success and logout, satisfying the spec's requirement without
needing `navigation.reset()` calls scattered through screen code.

**Decisions made where the spec left a choice open:**
- *Temporary landing screen:* Since Phase 2 (Home Dashboard) doesn't
  exist yet, `PlaceholderHomeScreen.tsx` stands in so the login flow is
  demoable end-to-end right now. It is explicitly marked as throwaway
  and should be deleted, not built upon, when Phase 2 starts.
- *OTP failure trigger:* Since there's no real backend, "incorrect
  code" needed a deterministic trigger for demo purposes. Typing
  `000000` simulates a failed verification (shake + error Snackbar);
  any other 6-digit code succeeds. Documented in `mockData/mockOTP.ts`.
- *Monospace font on Android:* Used the platform's built-in `monospace`
  family for `codeMono` rather than bundling a custom font, since the
  spec didn't name a specific typeface and this avoids an asset-loading
  dependency this early in the build.

## Acceptance criteria check (Phase 1, per spec)

- [x] All 4 screens use only Section 4 tokens (no inline colors/spacing found outside `/theme`)
- [x] Every button has visible pressed/disabled/loading states (`Button.tsx`)
- [x] OTP screen handles Android hardware back button correctly (native stack default pop behavior; no override needed since OTP isn't the reset point — dashboard is)

## Next up

Phase 2 — Home Dashboard + Bottom Nav, replacing `PlaceholderHomeScreen`
with the real 8-section dashboard and introducing the Bottom Tab
navigator that Phases 3–5 hang off of.
