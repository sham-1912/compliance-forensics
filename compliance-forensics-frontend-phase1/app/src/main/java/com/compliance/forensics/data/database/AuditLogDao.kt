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
}