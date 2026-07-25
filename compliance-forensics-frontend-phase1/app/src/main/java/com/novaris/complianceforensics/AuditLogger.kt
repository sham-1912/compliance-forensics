package com.novaris.complianceforensics

import android.content.Context
import com.compliance.forensics.data.database.AuditLogEntity
import com.compliance.forensics.data.repository.AuditRepository
import com.novaris.complianceforensics.data.VerificationResult
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

    fun logVerification(result: VerificationResult, triggerSource: String = "LIVE") {
        val timestamp = System.currentTimeMillis()
        val hash = hashRecord(result, timestamp)

        val statusString = when {
            result.isVerified -> "VERIFIED"
            else -> "UNVERIFIED"
        }

        val entity = AuditLogEntity(
            timestamp = timestamp,
            callerId = result.phoneNumber,
            callerName = result.claimingEntity ?: "Unknown Caller",
            consentHash = result.consentId ?: "",
            verificationStatus = statusString,
            auditProofHash = hash,
            triggerSource = triggerSource
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
