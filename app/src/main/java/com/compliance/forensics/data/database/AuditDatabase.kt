package com.compliance.forensics.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [AuditLogEntity::class],
    version = 2,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AuditDatabase : RoomDatabase() {

    abstract fun auditLogDao(): AuditLogDao

    companion object {
        @Volatile
        private var INSTANCE: AuditDatabase? = null

        /**
         * v1 → v2: Add TRAI classification enrichment columns.
         * Uses ALTER TABLE so existing audit records are preserved.
         * New columns default to 'UNVERIFIED' / 'UNKNOWN' so old rows are
         * valid without re-processing.
         */
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL("ALTER TABLE audit_log ADD COLUMN classificationResult TEXT NOT NULL DEFAULT 'UNVERIFIED'")
                database.execSQL("ALTER TABLE audit_log ADD COLUMN lsa TEXT NOT NULL DEFAULT 'UNKNOWN'")
                database.execSQL("ALTER TABLE audit_log ADD COLUMN operatorName TEXT NOT NULL DEFAULT 'UNKNOWN'")
                database.execSQL("ALTER TABLE audit_log ADD COLUMN businessName TEXT NOT NULL DEFAULT ''")
            }
        }

        fun getDatabase(context: Context): AuditDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AuditDatabase::class.java,
                    "audit_database"
                )
                    .addMigrations(MIGRATION_1_2)
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}