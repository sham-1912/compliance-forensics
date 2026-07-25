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

        if (!isValidProof) {
            throw IllegalArgumentException("Invalid audit proof hash")
        }

        return dao.insertLog(log)
    }

    fun getAllLogs(): Flow<List<AuditLogEntity>> {
        return dao.getAllLogs()
    }

    fun getLogsByStatus(status: String): Flow<List<AuditLogEntity>> {
        return dao.getLogsByStatus(status)
    }

    fun getLogsByCaller(callerId: String): Flow<List<AuditLogEntity>> {
        return dao.getLogsByCaller(callerId)
    }

    suspend fun getLogById(logId: Long): AuditLogEntity? {
        return dao.getLogById(logId)
    }

    suspend fun updateLog(log: AuditLogEntity) {
        dao.updateLog(log)
    }

    suspend fun markAsExported(logId: Long) {
        val log = getLogById(logId) ?: return
        dao.updateLog(
            log.copy(
                isExported = true,
                exportTimestamp = System.currentTimeMillis()
            )
        )
    }

    suspend fun deleteOldLogs(daysToKeep: Int = 30) {
        val cutoff = System.currentTimeMillis() - (daysToKeep * 24 * 60 * 60 * 1000L)
        dao.deleteOldLogs(cutoff)
    }

    suspend fun getStatistics(): AuditStatistics {
        val total = dao.getLogCount()
        val verified = dao.getVerifiedCount()
        val spoof = dao.getSpoofCount()

        return AuditStatistics(
            totalLogs = total,
            verifiedLogs = verified,
            spoofLogs = spoof,
            unverifiedLogs = total - verified - spoof
        )
    }

    data class AuditStatistics(
        val totalLogs: Int,
        val verifiedLogs: Int,
        val unverifiedLogs: Int,
        val spoofLogs: Int
    )

    companion object {
        @Volatile
        private var INSTANCE: AuditRepository? = null

        fun getInstance(context: Context): AuditRepository {
            return INSTANCE ?: synchronized(this) {
                val instance = AuditRepository(context)
                INSTANCE = instance
                instance
            }
        }
    }
}