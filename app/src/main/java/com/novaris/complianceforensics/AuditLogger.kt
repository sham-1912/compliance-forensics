package com.novaris.complianceforensics

import com.novaris.complianceforensics.data.VerificationResult
import java.security.MessageDigest

/**
 * Owner: Person 4 (Audit & Integration Developer)
 *
 * Produces a tamper-proof, on-device hash of each verification event
 * so it can serve as evidentiary proof of legitimacy (or lack thereof)
 * for a given call. See slide "On-Device Architecture":
 * P_audit = HashID_caller || Consent || t
 */
object AuditLogger {

    fun logVerification(result: VerificationResult) {
        val timestamp = System.currentTimeMillis()
        val hash = hashRecord(result, timestamp)

        // TODO(Person 4): persist (hash, result, timestamp) to a local
        // append-only audit table via DatabaseHelper, and expose a
        // read API for law-enforcement/dispute retrieval (see slide
        // "Ecosystem Benefits" - Law Enforcement).
    }

    private fun hashRecord(result: VerificationResult, timestamp: Long): String {
        val payload = "${result.phoneNumber}|${result.consentId}|$timestamp"
        val digest = MessageDigest.getInstance("SHA-256").digest(payload.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }
}
