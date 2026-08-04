package com.compliance.forensics.data.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface BlocklistDao {
    @Query("SELECT * FROM blocked_numbers")
    fun getAllBlocked(): List<BlockedNumberEntity>

    @Query("SELECT EXISTS(SELECT 1 FROM blocked_numbers WHERE phoneNumber = :number LIMIT 1)")
    fun isBlocked(number: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insert(blocked: BlockedNumberEntity)

    @Query("DELETE FROM blocked_numbers WHERE phoneNumber = :number")
    fun delete(number: String)
}
