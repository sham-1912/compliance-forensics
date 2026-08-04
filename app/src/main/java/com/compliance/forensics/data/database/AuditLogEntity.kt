package com.compliance.forensics.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Room entity for the audit_log table.
 *
 * Updated (v2) to include TRAI classification enrichment fields:
 *   - classificationResult : AUTHORISED_BANK_GOVT | PROMOTIONAL | KNOWN | UNVERIFIED
 *   - lsa                  : TRAI Licensed Service Area (22 circles per india-telecom-data dataset)
 *   - operatorName         : Jio / Airtel / Vi / BSNL / UNKNOWN
 *   - businessName         : Alias for callerName; semantically clearer field name
 *
 * The auditProofHash now covers callerId|classificationResult|timestamp so that
 * any post-hoc alteration of the classification label is cryptographically detectable.
 */
@Entity(tableName = "audit_log")
data class AuditLogEntity(
    @PrimaryKey(autoGenerate = true)
    var id: Long = 0,
    var timestamp: Long = System.currentTimeMillis(),
    var callerId: String = "",
    var callerName: String = "",
    var businessName: String = "",           // alias for callerName; prefer this for new code
    var consentHash: String = "",
    var verificationStatus: String = "",     // legacy: VERIFIED / UNVERIFIED / PROMOTIONAL / KNOWN
    var classificationResult: String = "UNVERIFIED", // AUTHORISED_BANK_GOVT | PROMOTIONAL | KNOWN | UNVERIFIED
    var lsa: String = "UNKNOWN",             // one of 22 TRAI LSA names, or UNKNOWN/National
    var operatorName: String = "UNKNOWN",    // Jio / Airtel / Vi / BSNL / UNKNOWN
    var auditProofHash: String = "",
    var rawHeaderData: String = "",
    var isExported: Boolean = false,
    var exportTimestamp: Long = 0
) {
    fun getFormattedTimestamp(): String {
        return android.text.format.DateFormat.format("dd/MM/yyyy HH:mm:ss", Date(timestamp)).toString()
    }

    /**
     * Returns a display-friendly colour int for the classification result.
     * GREEN  = AuthorisedBankOrGovt (TRAI-regulated, must never be labelled spam)
     * AMBER  = Promotional (TRAI-regulated telemarketer)
     * BLUE   = Known (previously seen in call history)
     * RED    = Unverified (no TRAI prefix, no history)
     */
    fun getStatusColor(): Int = when (classificationResult) {
        "AUTHORISED_BANK_GOVT" -> android.graphics.Color.parseColor("#4CAF50") // green
        "PROMOTIONAL"          -> android.graphics.Color.parseColor("#FF9800") // amber
        "KNOWN"                -> android.graphics.Color.parseColor("#2196F3") // blue
        "VERIFIED"             -> android.graphics.Color.GREEN                  // legacy
        "UNVERIFIED"           -> android.graphics.Color.RED
        "SPOOF"                -> android.graphics.Color.RED
        else                   -> android.graphics.Color.YELLOW
    }
}