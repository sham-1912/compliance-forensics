package com.compliance.forensics

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/**
 * Owner: Person 2 (Call Detection Developer)
 *
 * CallReceiver can't do anything without READ_PHONE_STATE (to observe
 * ringing state) and READ_CALL_LOG (to resolve incoming numbers on
 * some OEM builds). These are dangerous permissions, so they must be
 * requested at runtime - this class centralizes that flow so
 * MainActivity just calls requestIfNeeded().
 */
class CallPermissionManager(private val activity: AppCompatActivity) {

    private val requiredPermissions = arrayOf(
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.READ_CALL_LOG
    )

    private var onResult: ((granted: Boolean) -> Unit)? = null

    private val launcher: ActivityResultLauncher<Array<String>> =
        activity.registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { results ->
            val allGranted = results.values.all { it }
            onResult?.invoke(allGranted)
        }

    fun hasRequiredPermissions(context: Context = activity): Boolean =
        requiredPermissions.all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }

    /**
     * Requests any missing permissions. [onResult] fires with true only
     * if the user grants every permission in [requiredPermissions];
     * callers should treat a false result as "verification unavailable"
     * rather than crashing or silently failing.
     */
    fun requestIfNeeded(onResult: (granted: Boolean) -> Unit) {
        if (hasRequiredPermissions()) {
            onResult(true)
            return
        }
        this.onResult = onResult
        launcher.launch(requiredPermissions)
    }
}
