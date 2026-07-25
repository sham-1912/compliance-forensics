package com.compliance.forensics.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.telephony.TelephonyManager
import androidx.core.app.NotificationCompat
import com.compliance.forensics.data.model.CallVerificationResult
import com.compliance.forensics.data.repository.AuditRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class CallListenerService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var auditRepository: AuditRepository
    private lateinit var consentGateway: ConsentGateway

    companion object {
        private const val CHANNEL_ID = "call_listener_channel"
        private const val NOTIFICATION_ID = 1001
    }

    override fun onCreate() {
        super.onCreate()
        auditRepository = AuditRepository.getInstance(applicationContext)
        consentGateway = ConsentGateway()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.let {
            val state = it.getStringExtra(TelephonyManager.EXTRA_STATE)
            val incomingNumber = it.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

            if (state == TelephonyManager.EXTRA_STATE_RINGING && incomingNumber != null) {
                handleIncomingCall(incomingNumber)
            }
        }
        return START_STICKY
    }

    private fun handleIncomingCall(callerId: String) {
        serviceScope.launch {
            val cleanCallerId = callerId.replace(" ", "").replace("+91", "")
            val result = consentGateway.verifyCaller(cleanCallerId)
            auditRepository.insertLog(result.toAuditLogEntity())
            showVerificationNotification(result)
        }
    }

    private fun showVerificationNotification(result: CallVerificationResult) {
        val statusText = when (result.verificationStatus) {
            CallVerificationResult.VerificationStatus.VERIFIED -> "✅ Verified: ${result.callerName}"
            CallVerificationResult.VerificationStatus.UNVERIFIED -> "⚠️ Unverified Caller"
            CallVerificationResult.VerificationStatus.SPOOF -> "🚨 SPOOF DETECTED!"
            else -> "⏳ Checking..."
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Call Verification")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID + System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Call Listener Service",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Detects incoming calls and verifies them"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Compliance Forensics Engine")
            .setContentText("Monitoring calls for verification")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}