package com.compliance.forensics.service

import com.compliance.forensics.data.model.CallVerificationResult
import com.compliance.forensics.data.model.MockDLTEntity
import kotlinx.coroutines.delay

/**
 * Legacy verification gateway used by CallListenerService.
 *
 * Updated to use the 4-way TRAI classification pipeline:
 *   1600-series → AUTHORISED_BANK_GOVT (green)
 *   140-series  → PROMOTIONAL          (amber)
 *   Known DLT   → AUTHORISED_BANK_GOVT (green, existing mock entries)
 *   Fallback    → UNVERIFIED           (red)
 *
 * Note: the newer pipeline uses ConsentRegistryRepository + TraiClassifier
 * (from cfe-frontend). This class is kept for the legacy service path.
 */
class ConsentGateway {

    private val mockDatabase = MockDLTEntity.getMockDatabase()

    suspend fun verifyCaller(
        callerId: String,
        headerData: String = ""
    ): CallVerificationResult {
        delay(300)

        val normalised = callerId.filter { it.isDigit() }.let {
            if (it.length == 12 && it.startsWith("91")) it.drop(2) else it
        }

        // Step 1: TRAI 1600-series — AuthorisedBankOrGovt
        if (normalised.startsWith("1600")) {
            return CallVerificationResult(
                callerId = callerId,
                callerName = "TRAI Authorised — Bank/Govt",
                verificationStatus = CallVerificationResult.VerificationStatus.VERIFIED,
                classificationResult = "AUTHORISED_BANK_GOVT",
                consentHash = "TRAI-1600-SERIES",
                lsa = "National",
                operatorName = "UNKNOWN",
                rawHeaderData = headerData
            )
        }

        // Step 2: TRAI 140-series — Promotional
        if (normalised.startsWith("140")) {
            return CallVerificationResult(
                callerId = callerId,
                callerName = "TRAI Registered Telemarketer",
                verificationStatus = CallVerificationResult.VerificationStatus.PROMOTIONAL,
                classificationResult = "PROMOTIONAL",
                consentHash = "TRAI-140-SERIES",
                lsa = "National",
                operatorName = "UNKNOWN",
                rawHeaderData = headerData
            )
        }

        // Step 3: Check mock DLT database for known entities
        val entity = mockDatabase.find { it.callerId == normalised && it.isActive }
        if (entity != null) {
            return CallVerificationResult(
                callerId = callerId,
                callerName = entity.entityName,
                verificationStatus = CallVerificationResult.VerificationStatus.VERIFIED,
                classificationResult = "AUTHORISED_BANK_GOVT",
                consentHash = entity.consentHash,
                lsa = "UNKNOWN",
                operatorName = "UNKNOWN",
                rawHeaderData = headerData
            )
        }

        // Step 4: Fallback — UNVERIFIED (not spam; first-time legitimate callers get this too)
        return CallVerificationResult(
            callerId = callerId,
            callerName = "Unknown Caller",
            verificationStatus = CallVerificationResult.VerificationStatus.UNVERIFIED,
            classificationResult = "UNVERIFIED",
            consentHash = "NO_CONSENT_${System.currentTimeMillis()}",
            lsa = "UNKNOWN",
            operatorName = "UNKNOWN",
            rawHeaderData = headerData
        )
    }
}