package com.cfe.app

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.google.android.material.snackbar.Snackbar
import com.novaris.complianceforensics.CallReceiver

class MainActivity : AppCompatActivity() {

    private lateinit var callReceiver: CallReceiver
    private var receiverRegistered = false

    /** Listener notified when permissions are confirmed granted. */
    private var onPermissionsGrantedCallback: (() -> Unit)? = null

    private val requiredPermissions = arrayOf(
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.READ_CALL_LOG
    )

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.values.all { it }
        if (allGranted) {
            onTelecomPermissionsGranted()
        } else {
            onTelecomPermissionsDenied()
        }
    }

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main) // keep your existing layout call

        ensureTelecomPermissions()
    }

    fun ensureTelecomPermissions(onGranted: (() -> Unit)? = null) {
        onPermissionsGrantedCallback = onGranted
        val missing = requiredPermissions.filter {
            ActivityCompat.checkSelfPermission(this, it) !=
                android.content.pm.PackageManager.PERMISSION_GRANTED
        }

        if (missing.isEmpty()) {
            onTelecomPermissionsGranted()
            return
        }

        val shouldShowRationale = missing.any {
            ActivityCompat.shouldShowRequestPermissionRationale(this, it)
        }

        if (shouldShowRationale) {
            showRationaleDialog { permissionLauncher.launch(missing.toTypedArray()) }
        } else {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    private fun showRationaleDialog(onProceed: () -> Unit) {
        AlertDialog.Builder(this)
            .setTitle("Permissions needed")
            .setMessage(
                "Compliance Forensics Engine checks incoming call numbers " +
                    "against TRAI headers and your recent call history to verify " +
                    "consent. Without these permissions, calls can't be verified."
            )
            .setPositiveButton("Continue") { _, _ -> onProceed() }
            .setNegativeButton("Not now", null)
            .show()
    }

    private fun onTelecomPermissionsGranted() {
        if (!receiverRegistered) {
            callReceiver = CallReceiver()
            val filter = android.content.IntentFilter(
                android.telephony.TelephonyManager.ACTION_PHONE_STATE_CHANGED
            )
            registerReceiver(callReceiver, filter)
            receiverRegistered = true
        }
        onPermissionsGrantedCallback?.invoke()
        onPermissionsGrantedCallback = null
    }

    fun disableTelecomProtection() {
        if (receiverRegistered) {
            unregisterReceiver(callReceiver)
            receiverRegistered = false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        disableTelecomProtection()
    }

    private fun onTelecomPermissionsDenied() {
        val permanentlyDenied = requiredPermissions.any {
            !ActivityCompat.shouldShowRequestPermissionRationale(this, it) &&
                ActivityCompat.checkSelfPermission(this, it) !=
                    android.content.pm.PackageManager.PERMISSION_GRANTED
        }

        val rootView = findViewById<android.view.View>(android.R.id.content)
        if (permanentlyDenied) {
            Snackbar.make(
                rootView,
                "Call verification is off. Enable phone permissions in Settings to turn it back on.",
                Snackbar.LENGTH_LONG
            ).setAction("Settings") {
                startActivity(
                    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                        .setData(Uri.fromParts("package", packageName, null))
                )
            }.show()
        } else {
            Snackbar.make(
                rootView,
                "Call verification needs phone permissions to check consent on incoming calls.",
                Snackbar.LENGTH_LONG
            ).setAction("Grant") { ensureTelecomPermissions() }
                .show()
        }
    }
}
