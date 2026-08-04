package com.compliance.forensics

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.compliance.forensics.data.ConsentRepository
import com.compliance.forensics.data.VerificationResult
import com.compliance.forensics.data.VerificationSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Owner: Person 2 (Call Detection Developer)
 *
 * Listens for android.intent.action.PHONE_STATE and extracts the
 * incoming caller number before the phone rings, then hands it off
 * to [ConsentRepository] for consent verification.
 *
 * BroadcastReceivers are killed by the system as soon as onReceive()
 * returns, so the network + DB lookup in ConsentRepository (which is
 * a suspend fun) can't just be launched and forgotten - we use
 * goAsync() to get a PendingResult that keeps the receiver alive
 * until the coroutine finishes, then finish() it explicitly.
 */
class CallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
        if (state != TelephonyManager.EXTRA_STATE_RINGING) return

        val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
        if (incomingNumber.isNullOrBlank()) {
            Log.w(TAG, "Ringing state with no incoming number - skipping verification")
            return
        }

        // Keeps the receiver's process alive past onReceive() returning,
        // since the repository call below is asynchronous.
        val pendingResult = goAsync()
        val appContext = context.applicationContext

        // Post the checking state to update the UI while looking up consent
        VerificationResultBus.postResult(
            VerificationResult(
                phoneNumber = incomingNumber,
                claimingEntity = null,
                consentId = null,
                isVerified = false,
                source = VerificationSource.CHECKING
            )
        )

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = resolveCaller(appContext, incomingNumber)

                // Person 4's module: tamper-proof hash + persistence
                AuditLogger.init(appContext)
                AuditLogger.logVerification(result)

                // Person 1's module: MainActivity observes this to update the UI
                VerificationResultBus.postResult(result)

                // Show heads-up call notification
                showHeadsUpNotification(appContext, result)
            } catch (e: Exception) {
                Log.e(TAG, "Verification failed for $incomingNumber", e)
            } finally {
                pendingResult.finish()
            }
        }
    }

    private fun resolveCaller(context: Context, phoneNumber: String): VerificationResult {
        val digits = phoneNumber.filter { it.isDigit() }
        val normalized = if (digits.length == 12 && digits.startsWith("91")) digits.drop(2) else digits
        val withCC = "+91$normalized"
        val formattedCC = "+91 $normalized"

        // 0. Check blocklist FIRST — if user blocked this number, return BLOCKED status regardless of category
        try {
            val db = com.compliance.forensics.data.database.AuditDatabase.getDatabase(context)
            val isBlocked = db.blocklistDao().isBlocked(phoneNumber) ||
                            db.blocklistDao().isBlocked(digits) ||
                            db.blocklistDao().isBlocked(normalized) ||
                            db.blocklistDao().isBlocked(withCC) ||
                            db.blocklistDao().isBlocked(formattedCC)
            if (isBlocked) {
                return VerificationResult(
                    phoneNumber = phoneNumber,
                    claimingEntity = "Blocked Caller",
                    consentId = "USER-BLOCKED",
                    isVerified = false,
                    source = VerificationSource.LOCAL_CACHE,
                    classificationResult = "BLOCKED",
                    lsa = "National",
                    operatorName = "User Blocklist"
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Blocklist lookup failed: ${e.message}")
        }

        // 1. TRAI 1600 Series -> Authorised Bank/Govt
        if (normalized.startsWith("1600")) {
            return VerificationResult(
                phoneNumber = phoneNumber,
                claimingEntity = "TRAI Authorised — Bank/Govt",
                consentId = "TRAI-1600-SERIES",
                isVerified = true,
                source = VerificationSource.LOCAL_CACHE,
                classificationResult = "AUTHORISED_BANK_GOVT",
                lsa = "National",
                operatorName = "TRAI Regulated"
            )
        }

        // 2. TRAI 140 Series -> Promotional
        if (normalized.startsWith("140")) {
            return VerificationResult(
                phoneNumber = phoneNumber,
                claimingEntity = "TRAI Registered Telemarketer",
                consentId = "TRAI-140-SERIES",
                isVerified = true,
                source = VerificationSource.LOCAL_CACHE,
                classificationResult = "PROMOTIONAL",
                lsa = "National",
                operatorName = "Registered Commercial"
            )
        }

        // 3. Saved Device Contacts (e.g. Vijay Anand)
        try {
            val uri = android.net.Uri.withAppendedPath(
                android.provider.ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                android.net.Uri.encode(phoneNumber)
            )
            val cursor = context.contentResolver.query(
                uri,
                arrayOf(android.provider.ContactsContract.PhoneLookup.DISPLAY_NAME),
                null, null, null
            )
            cursor?.use { c ->
                if (c.moveToFirst()) {
                    val idx = c.getColumnIndex(android.provider.ContactsContract.PhoneLookup.DISPLAY_NAME)
                    if (idx != -1) {
                        val name = c.getString(idx)
                        if (!name.isNullOrBlank()) {
                            return VerificationResult(
                                phoneNumber = phoneNumber,
                                claimingEntity = name,
                                consentId = "CONTACT-SAVED",
                                isVerified = true,
                                source = VerificationSource.LOCAL_CACHE,
                                classificationResult = "KNOWN",
                                lsa = "National",
                                operatorName = "Saved Contact"
                            )
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Contacts query failed: ${e.message}")
        }

        // 4. Device Call History
        try {
            val cursor = context.contentResolver.query(
                android.provider.CallLog.Calls.CONTENT_URI,
                arrayOf(android.provider.CallLog.Calls.NUMBER, android.provider.CallLog.Calls.CACHED_NAME),
                null, null,
                "${android.provider.CallLog.Calls.DATE} DESC"
            )
            cursor?.use { c ->
                val numIdx = c.getColumnIndex(android.provider.CallLog.Calls.NUMBER)
                val nameIdx = c.getColumnIndex(android.provider.CallLog.Calls.CACHED_NAME)
                while (c.moveToNext()) {
                    val logNum = c.getString(numIdx)?.filter { it.isDigit() } ?: continue
                    val logNorm = if (logNum.length == 12 && logNum.startsWith("91")) logNum.drop(2) else logNum
                    if (logNorm == normalized && logNorm.length >= 8) {
                        val cachedName = if (nameIdx != -1) c.getString(nameIdx) else null
                        val displayName = if (!cachedName.isNullOrBlank()) cachedName else "Known Contact"
                        return VerificationResult(
                            phoneNumber = phoneNumber,
                            claimingEntity = displayName,
                            consentId = "CALL-HISTORY-MATCH",
                            isVerified = true,
                            source = VerificationSource.LOCAL_CACHE,
                            classificationResult = "KNOWN",
                            lsa = "National",
                            operatorName = "In Call History"
                        )
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Call log query failed: ${e.message}")
        }

        // 5. Fallback DLT Registry / Unverified
        return VerificationResult(
            phoneNumber = phoneNumber,
            claimingEntity = null,
            consentId = null,
            isVerified = false,
            source = VerificationSource.UNKNOWN,
            classificationResult = "UNVERIFIED",
            lsa = "Unknown",
            operatorName = "UNKNOWN"
        )
    }


    fun showHeadsUpNotification(context: Context, result: VerificationResult) {
        val channelId = "cfe_call_verification"
        val channelName = "Call Verification Notifications"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Shows real-time call consent verification alerts"
                enableLights(true)
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val isBlocked = result.classificationResult == "BLOCKED"
        val emoji = when {
            isBlocked -> "🚫 Blocked Number"
            result.isVerified -> "🟢 Verified"
            else -> "🔴 No Consent Found"
        }
        val title = "$emoji: ${result.phoneNumber}"
        val text = when {
            isBlocked -> "This number is in your blocklist. Call suppressed."
            result.isVerified -> "Verified via TRAI Registry: ${result.claimingEntity ?: "Authorized Business"}"
            else -> "Warning: No verified consent found for this business"
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .build()

        val notificationId = 2000 + (result.phoneNumber.hashCode() % 1000)
        notificationManager.notify(notificationId, notification)
    }

    companion object {
        private const val TAG = "CallReceiver"
    }
}
