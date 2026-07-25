package com.compliance.forensics.data.model

import com.compliance.forensics.data.database.AuditLogEntity
import com.compliance.forensics.utils.HashUtils

data class CallVerificationResult(
    val callerId: String,
    val callerName: String = "",
    val verificationStatus: VerificationStatus,
    val consentHash: String,
    val rawHeaderData: String = "",
    val timestamp: Long = System.currentTimeMillis()
) {
    enum class VerificationStatus {
        VERIFIED,
        UNVERIFIED,
        SPOOF
    }

    fun toAuditLogEntity(): AuditLogEntity {
        val proof = HashUtils.generateAuditProof(
            callerId = callerId,
            consentHash = consentHash,
            timestamp = timestamp
        )

        return AuditLogEntity(
            id = 0,
            timestamp = timestamp,
            callerId = callerId,
            callerName = callerName,
            consentHash = consentHash,
            verificationStatus = verificationStatus.name,
            auditProofHash = proof,
            rawHeaderData = rawHeaderData,
            isExported = false,
            exportTimestamp = 0
        )
    }
}