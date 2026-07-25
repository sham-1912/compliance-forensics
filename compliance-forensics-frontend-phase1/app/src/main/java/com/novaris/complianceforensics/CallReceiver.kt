package com.novaris.complianceforensics

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log
import com.novaris.complianceforensics.data.ConsentRepository
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

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // 1. Blocklist check
                val auditDb = com.compliance.forensics.data.database.AuditDatabase.getDatabase(appContext)
                val isBlocked = auditDb.blockedNumberDao().isBlocked(incomingNumber)

                if (isBlocked) {
                    Log.i(TAG, "Number $incomingNumber is blocked. Skipping verification.")
                    val entity = com.compliance.forensics.data.database.AuditLogEntity(
                        callerId = incomingNumber,
                        callerName = "Blocked Number",
                        verificationStatus = "BLOCKED",
                        triggerSource = "BLOCKED"
                    )
                    auditDb.auditLogDao().insertLog(entity)
                    return@launch // Skip further processing, goes to finally block
                }

                // 2. Post the checking state to update the UI while looking up consent
                VerificationResultBus.postResult(
                    com.novaris.complianceforensics.data.VerificationResult(
                        phoneNumber = incomingNumber,
                        claimingEntity = null,
                        consentId = null,
                        isVerified = false,
                        source = com.novaris.complianceforensics.data.VerificationSource.CHECKING
                    )
                )

                // 3. Normal verification
                val repository = ConsentRepository(appContext)
                val result = repository.verifyCaller(incomingNumber)

                // Person 4's module: tamper-proof hash + persistence
                AuditLogger.init(appContext)
                AuditLogger.logVerification(result)

                // Person 1's module: MainActivity observes this to update the UI
                VerificationResultBus.postResult(result)
            } catch (e: Exception) {
                Log.e(TAG, "Verification failed for $incomingNumber", e)
            } finally {
                pendingResult.finish()
            }
        }
    }

    companion object {
        private const val TAG = "CallReceiver"
    }
}
