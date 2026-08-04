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

    /** Filter by TRAI classification: AUTHORISED_BANK_GOVT | PROMOTIONAL | KNOWN | UNVERIFIED */
    fun getLogsByClassification(result: String): Flow<List<AuditLogEntity>> {
        return dao.getLogsByClassification(result)
    }

    /** Filter by TRAI LSA (one of 22 telecom circles). */
    fun getLogsForLsa(lsa: String): Flow<List<AuditLogEntity>> {
        return dao.getLogsForLsa(lsa)
    }

    /** Filter by operator name. */
    fun getLogsForOperator(operator: String): Flow<List<AuditLogEntity>> {
        return dao.getLogsForOperator(operator)
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

    /**
     * Returns aggregated statistics across all classification buckets.
     * Used by HomeViewModel to power the dashboard stats cards.
     *
     * TEAMMATE (Person 1 — UI): collectAsState() on HomeViewModel.stats and
     * render callsVerified, consentViolationsBlocked, promotionalCalls, knownCalls.
     */
    suspend fun getStatistics(): AuditStatistics {
        val total        = dao.getLogCount()
        val authorised   = dao.getAuthorisedCount()
        val promotional  = dao.getPromotionalCount()
        val known        = dao.getKnownCount()
        val unverified   = dao.getUnverifiedCount()
        // Legacy spoof count for backwards compat
        val spoof        = dao.getSpoofCount()

        return AuditStatistics(
            totalLogs          = total,
            authorisedLogs     = authorised,
            promotionalLogs    = promotional,
            knownLogs          = known,
            unverifiedLogs     = unverified,
            spoofLogs          = spoof,
            // Legacy aliases
            verifiedLogs       = authorised,
        )
    }

    data class AuditStatistics(
        val totalLogs: Int,
        /** TRAI 1600-series — authorised bank/govt calls. */
        val authorisedLogs: Int,
        /** TRAI 140-series — registered promotional calls. */
        val promotionalLogs: Int,
        /** Numbers seen in call history before. */
        val knownLogs: Int,
        /** No TRAI prefix, no call history. */
        val unverifiedLogs: Int,
        /** Legacy: SPOOF label (pre-classification-engine). */
        val spoofLogs: Int,
        /** Legacy alias for authorisedLogs. */
        val verifiedLogs: Int
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