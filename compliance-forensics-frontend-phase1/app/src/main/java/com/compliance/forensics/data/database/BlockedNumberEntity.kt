package com.compliance.forensics.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "blocked_numbers")
data class BlockedNumberEntity(
    @PrimaryKey
    val phoneNumber: String,
    val blockedAt: Long = System.currentTimeMillis()
)
