package com.novaris.complianceforensics.data

/**
 * Owner: Person 3 (Database Developer)
 *
 * Response shape returned by the (mocked, for hackathon scope) TRAI DLT
 * consent gateway. In production this maps to the DCA platform's
 * principal-entity + consent lookup response.
 */
data class ConsentResponse(
    val phoneNumber: String,
    val principalEntityName: String?,
    val consentId: String?,
    val consentValid: Boolean,
    val registeredWithDlt: Boolean
)

/**
 * Result surfaced up to the UI (Person 1) and audit log (Person 4)
 * after combining the local cache and/or live registry lookup.
 */
data class VerificationResult(
    val phoneNumber: String,
    val claimingEntity: String?,
    val consentId: String?,
    val isVerified: Boolean,
    val source: VerificationSource
)

enum class VerificationSource {
    LOCAL_CACHE,
    LIVE_REGISTRY,
    UNKNOWN
}
