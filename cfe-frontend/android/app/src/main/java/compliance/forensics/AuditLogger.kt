package com.compliance.forensics

import android.content.Context
import com.compliance.forensics.data.database.AuditLogEntity
import com.compliance.forensics.data.repository.AuditRepository
import com.compliance.forensics.data.VerificationResult
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.security.MessageDigest

/**
 * Owner: Person 4 (Audit & Integration Developer)
 *
 * Produces a tamper-proof, on-device hash of each verification event
 * so it can serve as evidentiary proof of legitimacy (or lack thereof)
 * for a given call. Persists verification logs to the local
 * Room audit_log database.
 */
object AuditLogger {

    private var repository: AuditRepository? = null

    fun init(context: Context) {
        if (repository == null) {
            repository = AuditRepository.getInstance(context.applicationContext)
        }
    }

    fun logVerification(result: VerificationResult) {
        val timestamp = System.currentTimeMillis()
        val hash = hashRecord(result, timestamp)

        val statusString = when {
            result.isVerified -> "VERIFIED"
            else -> "UNVERIFIED"
        }

        val displayName = result.claimingEntity ?: when (result.classificationResult) {
            "AUTHORISED_BANK_GOVT" -> "Authorised Bank / Govt"
            "PROMOTIONAL" -> "Registered Telemarketer"
            "KNOWN" -> "Known Contact"
            else -> "Unverified Caller"
        }

        val entity = AuditLogEntity(
            timestamp = timestamp,
            callerId = result.phoneNumber,
            callerName = displayName,
            businessName = displayName,
            consentHash = if (!result.consentId.isNullOrBlank() && result.consentId != "N/A") result.consentId else "N/A",
            verificationStatus = statusString,
            classificationResult = result.classificationResult,
            lsa = result.lsa,
            operatorName = result.operatorName,
            auditProofHash = hash
        )

        repository?.let { repo ->
            CoroutineScope(Dispatchers.IO).launch {
                repo.insertLog(entity)
            }
        }
    }


    private fun hashRecord(result: VerificationResult, timestamp: Long): String {
        val payload = "${result.phoneNumber}|${result.consentId}|$timestamp"
        val digest = MessageDigest.getInstance("SHA-256").digest(payload.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }
}
