# Compliance Forensics Engine

Real-time consent verification for scam prevention — native Android app (Kotlin).

## Stack

- **Language**: Kotlin
- **Min SDK**: 26 (Android 8.0) / **Target SDK**: 34
- **Build**: Gradle (Kotlin DSL)
- **UI**: XML layouts + View Binding + Material Components
- **Networking**: Retrofit + OkHttp (mock DLT registry endpoint for hackathon scope)
- **Storage**: SQLiteOpenHelper (local consent cache + audit log)
- **Testing**: JUnit + Espresso

## Module ownership

| Module | Owner | Files |
|---|---|---|
| UI | Person 1 | `MainActivity.kt`, `res/layout/`, `res/values/` |
| Call detection | Person 2 | `CallReceiver.kt` |
| Database & verification | Person 3 | `data/DatabaseHelper.kt`, `data/DltRegistryApi.kt`, `data/ConsentRepository.kt`, `data/ConsentModels.kt` |
| Audit & integration | Person 4 | `AuditLogger.kt`, instrumented tests |

## Getting started

1. Open this folder in **Android Studio** (Koala+ recommended) — it will
   auto-generate the `gradlew` wrapper scripts and sync dependencies.
   If you're on the command line instead, run `gradle wrapper` once
   inside this folder to generate `gradlew`/`gradlew.bat`.
2. Sync Gradle.
3. Run on an emulator or device with API 26+.

## Verification flow

`CallReceiver` detects an incoming call → hands the number to
`ConsentRepository.verifyCaller()` → checks local SQLite cache, falls
back to the mock DLT registry via Retrofit → result flows to
`AuditLogger` (SHA-256 hash + persistence) and to `MainActivity` for
display.

## Notes

- `DltRegistryApi.BASE_URL` currently points at a mock endpoint.
  Swapping in the real TRAI DLT gateway URL is the first roadmap item
  once credentials are available.
- No call audio or voice biometrics are ever processed — only caller
  metadata (number, claimed entity, consent ID), per the privacy
  commitments in the pitch deck.
