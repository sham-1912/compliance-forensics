package com.novaris.complianceforensics

import com.novaris.complianceforensics.data.VerificationResult

/**
 * Owner: Person 1 (Team Lead / UI Developer)
 *
 * Maps a raw [VerificationResult] (or its absence) onto the distinct
 * visual states the incoming-call card can render, matching the
 * "Real-Time Verification" mockup: checking -> verified / unverified.
 */
sealed class VerificationUiState {

    object Idle : VerificationUiState()

    object Checking : VerificationUiState()

    data class Verified(
        val phoneNumber: String,
        val claimingEntity: String,
        val consentId: String
    ) : VerificationUiState()

    data class Unverified(
        val phoneNumber: String,
        val claimingEntity: String?
    ) : VerificationUiState()

    companion object {
        fun from(result: VerificationResult): VerificationUiState = when {
            result.isVerified && result.claimingEntity != null && result.consentId != null ->
                Verified(result.phoneNumber, result.claimingEntity, result.consentId)
            else ->
                Unverified(result.phoneNumber, result.claimingEntity)
        }
    }
}
