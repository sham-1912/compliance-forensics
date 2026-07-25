package com.novaris.complianceforensics.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Owner: Person 3 (Database Developer)
 *
 * Local on-device cache of consent lookups so repeat calls from the
 * same number don't re-hit the network every time. Zero call content
 * is ever stored here — only caller metadata, per the "no voice
 * biometrics / on-device processing" privacy commitment on slide
 * "Privacy & Legal Compliance".
 */
class DatabaseHelper(context: Context) :
    SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE $TABLE_CONSENTS (
                $COL_PHONE_NUMBER TEXT PRIMARY KEY,
                $COL_ENTITY_NAME TEXT,
                $COL_CONSENT_ID TEXT,
                $COL_IS_VALID INTEGER NOT NULL,
                $COL_LAST_CHECKED_MS INTEGER NOT NULL
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_CONSENTS")
        onCreate(db)
    }

    fun getCachedConsent(phoneNumber: String): ConsentResponse? {
        val db = readableDatabase
        db.query(
            TABLE_CONSENTS,
            null,
            "$COL_PHONE_NUMBER = ?",
            arrayOf(phoneNumber),
            null, null, null
        ).use { cursor ->
            if (!cursor.moveToFirst()) return null
            if (isStale(cursor.getLong(cursor.getColumnIndexOrThrow(COL_LAST_CHECKED_MS)))) {
                return null
            }
            return ConsentResponse(
                phoneNumber = phoneNumber,
                principalEntityName = cursor.getString(cursor.getColumnIndexOrThrow(COL_ENTITY_NAME)),
                consentId = cursor.getString(cursor.getColumnIndexOrThrow(COL_CONSENT_ID)),
                consentValid = cursor.getInt(cursor.getColumnIndexOrThrow(COL_IS_VALID)) == 1,
                registeredWithDlt = true
            )
        }
    }

    fun cacheConsent(response: ConsentResponse) {
        val values = ContentValues().apply {
            put(COL_PHONE_NUMBER, response.phoneNumber)
            put(COL_ENTITY_NAME, response.principalEntityName)
            put(COL_CONSENT_ID, response.consentId)
            put(COL_IS_VALID, if (response.consentValid) 1 else 0)
            put(COL_LAST_CHECKED_MS, System.currentTimeMillis())
        }
        writableDatabase.insertWithOnConflict(
            TABLE_CONSENTS, null, values, SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    private fun isStale(lastCheckedMs: Long): Boolean =
        System.currentTimeMillis() - lastCheckedMs > CACHE_TTL_MS

    companion object {
        private const val DATABASE_NAME = "consent_cache.db"
        private const val DATABASE_VERSION = 1
        private const val TABLE_CONSENTS = "cached_consents"
        private const val COL_PHONE_NUMBER = "phone_number"
        private const val COL_ENTITY_NAME = "entity_name"
        private const val COL_CONSENT_ID = "consent_id"
        private const val COL_IS_VALID = "is_valid"
        private const val COL_LAST_CHECKED_MS = "last_checked_ms"

        // Re-verify against the live registry every 24h even on cache hit,
        // since consent can be revoked at any time.
        private const val CACHE_TTL_MS = 24 * 60 * 60 * 1000L
    }
}
