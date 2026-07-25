package com.compliance.forensics.utils

import java.security.MessageDigest

object HashUtils {

    fun generateAuditProof(
        callerId: String,
        consentHash: String,
        timestamp: Long
    ): String {
        val data = "$callerId||$consentHash||$timestamp"
        return sha256(data)
    }

    fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun verifyAuditProof(
        callerId: String,
        consentHash: String,
        timestamp: Long,
        expectedProof: String
    ): Boolean {
        val calculatedProof = generateAuditProof(callerId, consentHash, timestamp)
        return calculatedProof == expectedProof
    }

    fun getShortHash(hash: String): String {
        return if (hash.length > 12) {
            hash.take(6) + "..." + hash.takeLast(6)
        } else {
            hash
        }
    }
}