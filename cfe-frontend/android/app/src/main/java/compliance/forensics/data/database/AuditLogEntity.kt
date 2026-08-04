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
 */
@Entity(tableName = "audit_log")
data class AuditLogEntity(
    @PrimaryKey(autoGenerate = true)
    var id: Long = 0,
    var timestamp: Long = System.currentTimeMillis(),
    var callerId: String = "",
    var callerName: String = "",
    var businessName: String = "",
    var consentHash: String = "",
    var verificationStatus: String = "",
    var classificationResult: String = "UNVERIFIED",
    var lsa: String = "UNKNOWN",
    var operatorName: String = "UNKNOWN",
    var auditProofHash: String = "",
    var rawHeaderData: String = "",
    var isExported: Boolean = false,
    var exportTimestamp: Long = 0
) {
    fun getFormattedTimestamp(): String {
        return android.text.format.DateFormat.format("dd/MM/yyyy HH:mm:ss", Date(timestamp)).toString()
    }

    fun getStatusColor(): Int = when (classificationResult) {
        "AUTHORISED_BANK_GOVT" -> android.graphics.Color.parseColor("#4CAF50")
        "PROMOTIONAL"          -> android.graphics.Color.parseColor("#FF9800")
        "KNOWN"                -> android.graphics.Color.parseColor("#2196F3")
        "VERIFIED"             -> android.graphics.Color.GREEN
        "UNVERIFIED"           -> android.graphics.Color.RED
        "SPOOF"                -> android.graphics.Color.RED
        else                   -> android.graphics.Color.YELLOW
    }
}