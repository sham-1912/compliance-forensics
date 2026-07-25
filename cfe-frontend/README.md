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

---

## Phase 2 summary — Home Dashboard

**Status: complete.** `PlaceholderHomeScreen.tsx` is deleted, per its own
comment — `HomeDashboardScreen` now mounts directly wherever it stood.

**Components added (`/components`):** `StatCard`, `ProtectionStatusCard`,
`IncomingCallCard`, `QuickVerifyBar`, `ActivityListItem`,
`ActivityEmptyState`, `QuickActionTile`, `BottomNavBar`,
`DashboardSkeleton` — the full Phase 2 inventory from spec Section 5.
All pull exclusively from `/theme` tokens established in Phase 1; no new
colors, spacing, or radii were introduced.

**Screens built:** `HomeDashboardScreen` — the single Phase 2 screen,
composing all 8 sections (App Bar, Protection Status, Incoming Call,
Quick Verify, Today's Statistics, Recent Activity, Quick Actions, Bottom
Nav) under a sticky app bar whose elevation appears only once content
scrolls beneath it (tracked via `onScroll` + a `scrolled` boolean, no
extra library).

**Mock data added:** `mockDashboard.ts` — today's stats (4, each with a
distinct trend direction and a **per-metric** trend variant, not a blind
"up = green" rule), 5 recent-activity entries deliberately covering all
4 `StatusChip` variants (success/warning/error/neutral), and one
incoming-caller demo object.

**Decisions made where the spec left a choice open:**
- **Bottom Nav is presentational only, not yet a real tab navigator.**
  Phase 2 is explicitly a single screen, and Home is the only functional
  tab per spec item 8. Rather than standing up a `createBottomTabNavigator`
  with empty stub screens for Verify/Reports/Settings (screens that don't
  exist until Phases 3–5), `BottomNavBar` is a custom-built, fully
  presentational component: Home is permanently marked active, and
  pressing any other tab fires a "coming soon" Snackbar without
  navigating. **This means a real bottom-tab `MainTabs` navigator still
  needs to be introduced in Phase 3**, once `VerifyNumber` exists as a
  genuine destination — `RootNavigator` will swap from mounting
  `HomeDashboardScreen` directly to mounting a tab navigator at that
  point. Flagged here so it isn't missed.
- **TopAppBar's trailing slot is a fixed 32px width** (sized to balance
  the leading back-button slot for title centering on auth screens).
  Section 6's spec asks the dashboard header for a logo mark, greeting,
  bell, *and* avatar — more than that slot can hold without overflowing.
  Rather than modifying the shared `TopAppBar` contract (forbidden after
  Phase 1), the app bar carries a short "CFE" wordmark as its `title` and
  the notification bell (with unread badge) as `trailing`; the
  time-of-day greeting and the initials avatar moved into the first
  scrollable section instead, directly under the sticky bar.
- **Recent Activity's empty state** is reachable via a small "Preview
  empty (demo)" text toggle next to "See All", mirroring the demo-toggle
  pattern already used on `ProtectionStatusCard` and `IncomingCallCard`,
  so all three togglable states in this phase follow one consistent
  interaction convention.
- **Quick Verify's mock result** is derived deterministically from the
  last digit of the entered number (cycling Verified / No Consent Found
  / Unverified) rather than randomly, so the same input always
  reproduces the same demo outcome.

## Acceptance criteria check (Phase 2, per spec)

- [x] Every card/list has realistic, non-lorem-ipsum content (`mockDashboard.ts`)
- [x] Protection Status Card demonstrably supports both Active (success) and Paused (warning) states via its demo toggle
- [x] Incoming Call Card demonstrably supports both idle and incoming-call states via its demo toggle
- [x] Skeleton (`DashboardSkeleton`) shown ~800ms on mount before content fades in
- [x] Pull-to-refresh implemented via `RefreshControl` (mock ~900ms spinner, re-renders same data)

## Next up

Phase 3 — Verification module (Verify Number, Verification Result,
Incoming Call Overlay), wired from Home's Quick Verify and Quick
Actions. This is also where `BottomNavBar` gains a real destination for
its "Verify" tab and the `MainTabs` navigator decision above gets
resolved.
