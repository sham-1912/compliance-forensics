package com.novaris.complianceforensics

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager

/**
 * Owner: Person 2 (Call Detection Developer)
 *
 * Listens for android.intent.action.PHONE_STATE and extracts the
 * incoming caller number before the phone rings, then hands it off
 * to [DatabaseHelper] for consent verification.
 */
class CallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
        if (state != TelephonyManager.EXTRA_STATE_RINGING) return

        val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
            ?: return

        // TODO(Person 2): pass incomingNumber to DatabaseHelper.verifyCaller()
        // and forward the result to AuditLogger + MainActivity
    }
}
