package com.novaris.complianceforensics

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.novaris.complianceforensics.databinding.ActivityMainBinding

/**
 * Owner: Person 1 (Team Lead / UI Developer)
 *
 * Renders the incoming-call verification card in its three states
 * (checking / verified / unverified), matching the "Real-Time
 * Verification" mockup. Observes results posted by CallReceiver
 * (Person 2) via [VerificationResultBus].
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

        renderState(VerificationUiState.Idle)

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
            renderState(VerificationUiState.from(result))
        }

        binding.declineCallButton.setOnClickListener {
            // TODO(Person 1): hang up via TelecomManager / hook into
            // CallReceiver's telephony state, then reset to Idle.
        }
        binding.acceptCallButton.setOnClickListener {
            // TODO(Person 1): answer via TelecomManager, then reset to Idle.
        }
    }

    private fun renderState(state: VerificationUiState) {
        when (state) {
            is VerificationUiState.Idle -> {
                binding.callerNumberText.text = ""
                binding.claimingEntityText.text = ""
                binding.verificationStatusText.text = getString(R.string.status_idle)
                binding.consentIdText.visibility = android.view.View.GONE
                setCardAccent(R.color.text_secondary)
            }

            is VerificationUiState.Checking -> {
                binding.callerNumberText.text = state.phoneNumber
                binding.claimingEntityText.text = ""
                binding.verificationStatusText.text = getString(R.string.status_checking)
                binding.consentIdText.visibility = android.view.View.GONE
                setCardAccent(R.color.accent_amber)
            }

            is VerificationUiState.Verified -> {
                binding.callerNumberText.text = state.phoneNumber
                binding.claimingEntityText.text =
                    getString(R.string.label_claiming, state.claimingEntity)
                binding.verificationStatusText.text = getString(R.string.status_verified)
                binding.consentIdText.text =
                    getString(R.string.label_consent_id, state.consentId)
                binding.consentIdText.visibility = android.view.View.VISIBLE
                setCardAccent(R.color.status_success)
            }

            is VerificationUiState.Unverified -> {
                binding.callerNumberText.text = state.phoneNumber
                binding.claimingEntityText.text = state.claimingEntity
                    ?.let { getString(R.string.label_claiming, it) }
                    ?: ""
                binding.verificationStatusText.text = getString(R.string.status_unverified)
                binding.consentIdText.visibility = android.view.View.GONE
                setCardAccent(R.color.status_danger)
            }
        }
    }

    private fun setCardAccent(colorRes: Int) {
        val color = ContextCompat.getColor(this, colorRes)
        binding.verificationCard.strokeColor = color
        binding.verificationStatusText.setTextColor(color)
    }
}
