package com.compliance.forensics.data.database

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface BlockedNumberDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(blockedNumber: BlockedNumberEntity)

    @Delete
    suspend fun delete(blockedNumber: BlockedNumberEntity)

    @Query("SELECT EXISTS(SELECT 1 FROM blocked_numbers WHERE phoneNumber = :phoneNumber)")
    suspend fun isBlocked(phoneNumber: String): Boolean

    @Query("SELECT * FROM blocked_numbers ORDER BY blockedAt DESC")
    fun getAll(): Flow<List<BlockedNumberEntity>>
}
