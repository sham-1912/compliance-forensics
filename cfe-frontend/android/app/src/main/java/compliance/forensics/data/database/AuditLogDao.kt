package com.compliance.forensics.data.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface AuditLogDao {

    @Insert
    suspend fun insertLog(log: AuditLogEntity): Long

    @Query("SELECT * FROM audit_log ORDER BY timestamp DESC")
    fun getAllLogs(): Flow<List<AuditLogEntity>>

    @Query("SELECT * FROM audit_log WHERE id = :logId")
    suspend fun getLogById(logId: Long): AuditLogEntity?

    @Query("SELECT * FROM audit_log WHERE verificationStatus = :status ORDER BY timestamp DESC")
    fun getLogsByStatus(status: String): Flow<List<AuditLogEntity>>

    @Query("SELECT * FROM audit_log WHERE callerId = :callerId ORDER BY timestamp DESC")
    fun getLogsByCaller(callerId: String): Flow<List<AuditLogEntity>>

    @Query("SELECT * FROM audit_log WHERE classificationResult = :result ORDER BY timestamp DESC")
    fun getLogsByClassification(result: String): Flow<List<AuditLogEntity>>

    @Query("SELECT * FROM audit_log WHERE lsa = :lsa ORDER BY timestamp DESC")
    fun getLogsForLsa(lsa: String): Flow<List<AuditLogEntity>>

    @Query("SELECT * FROM audit_log WHERE operatorName = :operator ORDER BY timestamp DESC")
    fun getLogsForOperator(operator: String): Flow<List<AuditLogEntity>>

    @Update
    suspend fun updateLog(log: AuditLogEntity)

    @Query("DELETE FROM audit_log WHERE timestamp < :cutoffTimestamp")
    suspend fun deleteOldLogs(cutoffTimestamp: Long): Int

    @Query("SELECT COUNT(*) FROM audit_log")
    suspend fun getLogCount(): Int

    @Query("SELECT COUNT(*) FROM audit_log WHERE verificationStatus = 'VERIFIED'")
    suspend fun getVerifiedCount(): Int

    @Query("SELECT COUNT(*) FROM audit_log WHERE verificationStatus = 'SPOOF'")
    suspend fun getSpoofCount(): Int

    @Query("SELECT COUNT(*) FROM audit_log WHERE classificationResult = 'UNVERIFIED'")
    suspend fun getUnverifiedCount(): Int

    @Query("SELECT COUNT(*) FROM audit_log WHERE classificationResult = 'PROMOTIONAL'")
    suspend fun getPromotionalCount(): Int

    @Query("SELECT COUNT(*) FROM audit_log WHERE classificationResult = 'AUTHORISED_BANK_GOVT'")
    suspend fun getAuthorisedCount(): Int

    @Query("SELECT COUNT(*) FROM audit_log WHERE classificationResult = 'KNOWN'")
    suspend fun getKnownCount(): Int

    @Query("SELECT COUNT(*) FROM audit_log WHERE classificationResult = 'BLOCKED'")
    suspend fun getBlockedCount(): Int
}