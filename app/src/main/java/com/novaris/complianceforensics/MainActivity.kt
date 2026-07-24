package com.novaris.complianceforensics

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.novaris.complianceforensics.databinding.ActivityMainBinding

/**
 * Owner: Person 1 (Team Lead / UI Developer)
 *
 * Renders the incoming-call verification card. Observes verification
 * results posted by CallReceiver (Person 2) via [VerificationResultBus]
 * and displays them via [binding].
 *
 * Note: the permission request wiring below (CallPermissionManager) is
 * Person 2's module - included here since CallReceiver can't do
 * anything without it being granted first.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var permissionManager: CallPermissionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        permissionManager = CallPermissionManager(this)
        permissionManager.requestIfNeeded { granted ->
            if (!granted) {
                Toast.makeText(
                    this,
                    "Call verification needs phone-state permission to work",
                    Toast.LENGTH_LONG
                ).show()
            }
        }

        VerificationResultBus.latestResult.observe(this) { result ->
            binding.callerNumberText.text = result.phoneNumber
            binding.claimingEntityText.text = result.claimingEntity
                ?: getString(R.string.status_unverified)
            binding.verificationStatusText.text = if (result.isVerified) {
                getString(R.string.status_verified)
            } else {
                getString(R.string.status_unverified)
            }
        }
    }
}
