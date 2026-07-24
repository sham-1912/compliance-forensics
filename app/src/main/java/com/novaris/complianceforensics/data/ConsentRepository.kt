package com.novaris.complianceforensics.data

import android.content.Context

/**
 * Owner: Person 3 (Database Developer)
 *
 * Single entry point used by CallReceiver (Person 2) and MainActivity
 * (Person 1) to verify an incoming caller. Checks the local SQLite
 * cache first; on a miss or stale entry, queries the mock DLT registry
 * over Retrofit and caches the result.
 *
 * Person 4 should call this from AuditLogger to hash + persist every
 * VerificationResult it returns.
 */
class ConsentRepository(
    context: Context,
    private val api: DltRegistryApi = DltRegistryApi.create()
) {
    private val databaseHelper = DatabaseHelper(context.applicationContext)

    suspend fun verifyCaller(phoneNumber: String): VerificationResult {
        databaseHelper.getCachedConsent(phoneNumber)?.let { cached ->
            return cached.toVerificationResult(VerificationSource.LOCAL_CACHE)
        }

        return try {
            val response = api.lookupConsent(phoneNumber)
            databaseHelper.cacheConsent(response)
            response.toVerificationResult(VerificationSource.LIVE_REGISTRY)
        } catch (e: Exception) {
            // Network failure: fail closed - don't claim verification we
            // couldn't confirm.
            VerificationResult(
                phoneNumber = phoneNumber,
                claimingEntity = null,
                consentId = null,
                isVerified = false,
                source = VerificationSource.UNKNOWN
            )
        }
    }

    private fun ConsentResponse.toVerificationResult(source: VerificationSource) =
        VerificationResult(
            phoneNumber = phoneNumber,
            claimingEntity = principalEntityName,
            consentId = consentId,
            isVerified = consentValid && registeredWithDlt,
            source = source
        )
}
