package com.compliance.forensics.data.model

import com.compliance.forensics.data.database.AuditLogEntity
import com.compliance.forensics.utils.HashUtils

data class CallVerificationResult(
    val callerId: String,
    val callerName: String = "",
    val verificationStatus: VerificationStatus,
    val consentHash: String,
    val rawHeaderData: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    /** TRAI classification: AUTHORISED_BANK_GOVT | PROMOTIONAL | KNOWN | UNVERIFIED */
    val classificationResult: String = verificationStatus.toClassificationResult(),
    /** TRAI Licensed Service Area (one of 22 circles), or "UNKNOWN". */
    val lsa: String = "UNKNOWN",
    /** Inferred operator: Jio / Airtel / Vi / BSNL / UNKNOWN. */
    val operatorName: String = "UNKNOWN"
) {
    /**
     * Legacy status enum — kept for backwards compat with ConsentGateway.
     * New code should use [classificationResult] directly.
     *
     * AUTHORISED_BANK_GOVT → maps to VERIFIED (legacy)
     * PROMOTIONAL          → PROMOTIONAL
     * KNOWN                → KNOWN
     * UNVERIFIED           → UNVERIFIED
     * SPOOF                → removed; no longer produced by the pipeline
     */
    enum class VerificationStatus {
        VERIFIED,       // legacy alias for AUTHORISED_BANK_GOVT
        UNVERIFIED,
        PROMOTIONAL,
        KNOWN;

        fun toClassificationResult(): String = when (this) {
            VERIFIED     -> "AUTHORISED_BANK_GOVT"
            PROMOTIONAL  -> "PROMOTIONAL"
            KNOWN        -> "KNOWN"
            UNVERIFIED   -> "UNVERIFIED"
        }
    }

    fun toAuditLogEntity(): AuditLogEntity {
        // Hash now covers callerId|classificationResult|timestamp per AuditLogger spec
        val proof = HashUtils.generateAuditProof(
            callerId = callerId,
            consentHash = classificationResult,   // classificationResult in hash payload
            timestamp = timestamp
        )

        return AuditLogEntity(
            id = 0,
            timestamp = timestamp,
            callerId = callerId,
            callerName = callerName,
            businessName = callerName,
            consentHash = consentHash,
            verificationStatus = verificationStatus.name,
            classificationResult = classificationResult,
            lsa = lsa,
            operatorName = operatorName,
            auditProofHash = proof,
            rawHeaderData = rawHeaderData,
            isExported = false,
            exportTimestamp = 0
        )
    }
}