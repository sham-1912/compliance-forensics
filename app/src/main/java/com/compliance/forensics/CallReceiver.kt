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
                val repository = ConsentRepository(appContext)
                val result = repository.verifyCaller(incomingNumber)

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

    private fun showHeadsUpNotification(context: Context, result: VerificationResult) {
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

        val emoji = if (result.isVerified) "🟢 Verified" else "🔴 No Consent Found"
        val title = "$emoji: ${result.phoneNumber}"
        val text = if (result.isVerified) {
            "Verified via TRAI Registry: ${result.claimingEntity ?: "Authorized Business"}"
        } else {
            "Warning: No verified consent found for this business"
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
