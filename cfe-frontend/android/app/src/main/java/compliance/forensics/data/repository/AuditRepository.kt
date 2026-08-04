package com.compliance.forensics.data.repository

import android.content.Context
import com.compliance.forensics.data.database.AuditDatabase
import com.compliance.forensics.data.database.AuditLogEntity
import com.compliance.forensics.utils.HashUtils
import kotlinx.coroutines.flow.Flow

class AuditRepository private constructor(
    private val context: Context
) {
    private val dao = AuditDatabase.getDatabase(context).auditLogDao()

    suspend fun insertLog(log: AuditLogEntity): Long {
        return dao.insertLog(log)
    }

    suspend fun insertLogWithVerification(log: AuditLogEntity): Long {
        val isValidProof = HashUtils.verifyAuditProof(
            callerId = log.callerId,
            consentHash = log.consentHash,
            timestamp = log.timestamp,
            expectedProof = log.auditProofHash
        )
        if (!isValidProof) throw IllegalArgumentException("Invalid audit proof hash")
        return dao.insertLog(log)
    }

    fun getAllLogs(): Flow<List<AuditLogEntity>> = dao.getAllLogs()
    fun getLogsByStatus(status: String): Flow<List<AuditLogEntity>> = dao.getLogsByStatus(status)
    fun getLogsByCaller(callerId: String): Flow<List<AuditLogEntity>> = dao.getLogsByCaller(callerId)
    fun getLogsByClassification(result: String): Flow<List<AuditLogEntity>> = dao.getLogsByClassification(result)
    fun getLogsForLsa(lsa: String): Flow<List<AuditLogEntity>> = dao.getLogsForLsa(lsa)
    fun getLogsForOperator(operator: String): Flow<List<AuditLogEntity>> = dao.getLogsForOperator(operator)

    suspend fun getLogById(logId: Long): AuditLogEntity? = dao.getLogById(logId)

    suspend fun updateLog(log: AuditLogEntity) = dao.updateLog(log)

    suspend fun markAsExported(logId: Long) {
        val log = getLogById(logId) ?: return
        dao.updateLog(log.copy(isExported = true, exportTimestamp = System.currentTimeMillis()))
    }

    suspend fun deleteOldLogs(daysToKeep: Int = 30) {
        val cutoff = System.currentTimeMillis() - (daysToKeep * 24 * 60 * 60 * 1000L)
        dao.deleteOldLogs(cutoff)
    }

    suspend fun getStatistics(): AuditStatistics {
        val total       = dao.getLogCount()
        val authorised  = dao.getAuthorisedCount()
        val promotional = dao.getPromotionalCount()
        val known       = dao.getKnownCount()
        val unverified  = dao.getUnverifiedCount()
        val spoof       = dao.getSpoofCount()
        val blocked     = dao.getBlockedCount()
        return AuditStatistics(
            totalLogs       = total,
            authorisedLogs  = authorised,
            promotionalLogs = promotional,
            knownLogs       = known,
            unverifiedLogs  = unverified,
            spoofLogs       = spoof,
            blockedLogs     = blocked,
            verifiedLogs    = authorised
        )
    }

    data class AuditStatistics(
        val totalLogs: Int,
        val authorisedLogs: Int,
        val promotionalLogs: Int,
        val knownLogs: Int,
        val unverifiedLogs: Int,
        val spoofLogs: Int,
        val blockedLogs: Int = 0,
        val verifiedLogs: Int
    )

    companion object {
        @Volatile private var INSTANCE: AuditRepository? = null

        fun getInstance(context: Context): AuditRepository =
            INSTANCE ?: synchronized(this) {
                AuditRepository(context).also { INSTANCE = it }
            }
    }
}