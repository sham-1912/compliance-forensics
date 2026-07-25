package com.compliance.forensics.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

@Entity(tableName = "audit_log")
data class AuditLogEntity(
    @PrimaryKey(autoGenerate = true)
    var id: Long = 0,
    var timestamp: Long = System.currentTimeMillis(),
    var callerId: String = "",
    var callerName: String = "",
    var consentHash: String = "",
    var verificationStatus: String = "",
    var auditProofHash: String = "",
    var rawHeaderData: String = "",
    var isExported: Boolean = false,
    var exportTimestamp: Long = 0
) {
    fun getFormattedTimestamp(): String {
        return android.text.format.DateFormat.format("dd/MM/yyyy HH:mm:ss", Date(timestamp)).toString()
    }

    fun getStatusColor(): Int {
        return when (verificationStatus) {
            "VERIFIED" -> android.graphics.Color.GREEN
            "UNVERIFIED" -> android.graphics.Color.RED
            "SPOOF" -> android.graphics.Color.RED
            else -> android.graphics.Color.YELLOW
        }
    }
}