package com.cfe.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.app.ActivityCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.compliance.forensics.R
import com.compliance.forensics.databinding.FragmentHomeBinding
import com.compliance.forensics.data.database.AuditDatabase
import com.compliance.forensics.data.database.BlockedNumberEntity
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.novaris.complianceforensics.data.VerificationResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * HomeFragment — Quick-Verify, Simulate Call (Demo), + Protection Toggle
 *
 * All actions that touch telecom data are guarded by
 * [hasTelecomPermissions]; if permissions are missing the
 * fragment delegates back to [MainActivity.ensureTelecomPermissions]
 * instead of silently failing.
 */
class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private val callVerificationViewModel: CallVerificationViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // ── Manual Verify Button ──────────────────────────────────
        binding.btnRunManualCheck.setOnClickListener {
            if (!hasTelecomPermissions()) {
                (requireActivity() as MainActivity).ensureTelecomPermissions()
                return@setOnClickListener
            }
            val number = binding.etQuickVerify.text?.toString()?.trim().orEmpty()
            if (number.isNotEmpty()) {
                callVerificationViewModel.verify(number)
            } else {
                Snackbar.make(binding.root, "Enter a number first", Snackbar.LENGTH_SHORT).show()
            }
        }

        // ── Simulate Call Button (Demo) ───────────────────────────
        binding.btnSimulateCall.setOnClickListener {
            if (!hasTelecomPermissions()) {
                (requireActivity() as MainActivity).ensureTelecomPermissions()
                return@setOnClickListener
            }
            callVerificationViewModel.simulateCall()
        }

        // ── Manage Blocklist Button ───────────────────────────────
        binding.btnManageBlocklist.setOnClickListener {
            showBlocklistDialog()
        }

        // ── Protection Toggle ─────────────────────────────────────
        binding.switchProtection.setOnCheckedChangeListener { _, isChecked ->
            val activity = requireActivity() as MainActivity
            if (isChecked) {
                if (!hasTelecomPermissions()) {
                    // Revert toggle — can't enable without permissions
                    binding.switchProtection.isChecked = false
                    activity.ensureTelecomPermissions {
                        // Only flip once permissions are confirmed granted
                        callVerificationViewModel.setProtectionActive(true)
                        binding.switchProtection.isChecked = true
                    }
                    return@setOnCheckedChangeListener
                }
                activity.ensureTelecomPermissions {
                    callVerificationViewModel.setProtectionActive(true)
                }
            } else {
                activity.disableTelecomProtection()
                callVerificationViewModel.setProtectionActive(false)
            }
        }

        // ── Observe protection state → label ─────────────────────
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                callVerificationViewModel.isProtectionActive.collect { active ->
                    binding.tvProtectionLabel.text = if (active)
                        "Call Protection \u2014 Active"
                    else
                        "Call Protection \u2014 Paused"
                }
            }
        }

        // ── Observe manual-verification / demo results ────────────
        callVerificationViewModel.verificationState.observe(viewLifecycleOwner) { model ->
            when (model) {
                is CallVerificationViewModel.VerificationUiModel.Checking -> {
                    binding.cardResult.visibility = View.VISIBLE
                    binding.tvResultStatus.text = getString(R.string.status_checking)
                    binding.tvResultStatus.setTextColor(
                        resources.getColor(R.color.accent_amber, requireContext().theme)
                    )
                    binding.tvResultDetails.text = model.phoneNumber
                }

                is CallVerificationViewModel.VerificationUiModel.Done -> {
                    showResult(model.result)
                }

                is CallVerificationViewModel.VerificationUiModel.Error -> {
                    binding.cardResult.visibility = View.VISIBLE
                    binding.tvResultStatus.text = model.message
                    binding.tvResultStatus.setTextColor(
                        resources.getColor(R.color.status_danger, requireContext().theme)
                    )
                    binding.tvResultDetails.text = model.phoneNumber
                    binding.btnBlockNumber.setOnClickListener {
                        blockNumber(model.phoneNumber)
                    }
                }
            }
        }
    }

    // ── Blocklist logic ───────────────────────────────────────────
    private fun blockNumber(phoneNumber: String) {
        lifecycleScope.launch(Dispatchers.IO) {
            val db = AuditDatabase.getDatabase(requireContext())
            db.blockedNumberDao().insert(BlockedNumberEntity(phoneNumber))
            launch(Dispatchers.Main) {
                Snackbar.make(binding.root, "Number blocked", Snackbar.LENGTH_SHORT).show()
                binding.cardResult.visibility = View.GONE
            }
        }
    }

    private fun showBlocklistDialog() {
        lifecycleScope.launch {
            val auditDb = AuditDatabase.getDatabase(requireContext())
            val blockedNumbers = auditDb.blockedNumberDao().getAll().first()

            if (blockedNumbers.isEmpty()) {
                Snackbar.make(binding.root, "Blocklist is empty", Snackbar.LENGTH_SHORT).show()
                return@launch
            }

            val items = blockedNumbers.map { it.phoneNumber }.toTypedArray()

            MaterialAlertDialogBuilder(requireContext())
                .setTitle("Manage Blocklist")
                .setItems(items) { _, which ->
                    val numberToUnblock = items[which]
                    MaterialAlertDialogBuilder(requireContext())
                        .setTitle("Unblock $numberToUnblock?")
                        .setPositiveButton("Unblock") { _, _ ->
                            lifecycleScope.launch(Dispatchers.IO) {
                                auditDb.blockedNumberDao().delete(BlockedNumberEntity(numberToUnblock))
                                launch(Dispatchers.Main) {
                                    Snackbar.make(binding.root, "$numberToUnblock unblocked", Snackbar.LENGTH_SHORT).show()
                                }
                            }
                        }
                        .setNegativeButton("Cancel", null)
                        .show()
                }
                .setPositiveButton("Close", null)
                .show()
        }
    }

    // ── Permission guard ──────────────────────────────────────────
    private fun hasTelecomPermissions(): Boolean {
        return ActivityCompat.checkSelfPermission(
            requireContext(), Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED &&
        ActivityCompat.checkSelfPermission(
            requireContext(), Manifest.permission.READ_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED
    }

    // ── Result rendering ──────────────────────────────────────────
    private fun showResult(result: VerificationResult) {
        binding.cardResult.visibility = View.VISIBLE

        if (result.isVerified) {
            binding.tvResultStatus.text =
                "✓ Verified — ${result.claimingEntity ?: "Unknown Entity"}"
            binding.tvResultStatus.setTextColor(
                resources.getColor(R.color.status_success, requireContext().theme)
            )
        } else {
            binding.tvResultStatus.text =
                "✗ Unverified — ${result.claimingEntity ?: "No registered entity"}"
            binding.tvResultStatus.setTextColor(
                resources.getColor(R.color.status_danger, requireContext().theme)
            )
        }

        val details = buildString {
            result.consentId?.let { append("Consent ID: $it · ") }
            append("Source: ${result.source}")
        }
        binding.tvResultDetails.text = details

        binding.btnBlockNumber.setOnClickListener {
            blockNumber(result.phoneNumber)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
